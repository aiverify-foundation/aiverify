import pytest
from unittest.mock import Mock, patch, MagicMock
from aiverify_test_engine_worker.pipeline.pipeline_build.docker_build import DockerBuild
from aiverify_test_engine_worker.pipeline.pipe import PipeException
from aiverify_test_engine_worker.lib.filecache import FileCache
import os
import subprocess


# Fixture to create an instance of DockerBuild
@pytest.fixture
def docker_build():
    pipe = DockerBuild()
    with patch.object(pipe, "_check_and_build_base_image", return_value=None):
        pipe.setup()
        yield pipe


# Test for setup method
class TestSetup:
    @patch.dict(os.environ, {
        "WORKER_BASE_IMAGE": "custom-base-image",
        "DOCKER": "custom-docker",
        "DOCKER_REGISTRY": "registry.example.com"
    })
    def test_setup_with_custom_values(self):
        docker_build = DockerBuild()
        with patch.object(docker_build, "_check_and_build_base_image", return_value=None) as mock_check_and_build_base_image:
            docker_build.setup()
            mock_check_and_build_base_image.assert_called()
            assert docker_build.base_image == "custom-base-image"
            assert docker_build.docker_bin == "custom-docker"
            assert docker_build.docker_registry == "registry.example.com"

    @patch.dict(os.environ, {})
    def test_setup_with_default_values(self):
        docker_build = DockerBuild()
        with patch.object(docker_build, "_check_and_build_base_image", return_value=None) as mock_check_and_build_base_image:
            docker_build.setup()
            mock_check_and_build_base_image.assert_called()
            assert docker_build.base_image == "aiverify-test-engine-worker-base"
            assert docker_build.docker_bin == "docker"
            assert docker_build.docker_registry is None


# Test for _check_and_build_base_image method
class TestCheckAndBuildBaseImage:
    @patch("subprocess.run")
    def test_base_image_exists(self, mock_run):
        mock_run.return_value.returncode = 0
        docker_build = DockerBuild()
        docker_build.setup()  # this will call _check_and_build_base_image
        # docker_build._check_and_build_base_image()
        mock_run.assert_called_once_with(
            [docker_build.docker_bin, "image", "inspect", docker_build.base_image],
            check=False
        )

    @patch("subprocess.run")
    @patch("pathlib.Path.exists", return_value=True)
    def test_base_image_build_success(self, mock_exists, mock_run):
        mock_run.side_effect = [
            Mock(returncode=1),  # First call (image doesn't exist)
            Mock(returncode=0)   # Second call (build succeeds)
        ]
        docker_build = DockerBuild()
        docker_build.setup()
        # docker_build._check_and_build_base_image()
        assert mock_run.call_count == 2

    @patch("subprocess.run")
    @patch("pathlib.Path.exists", return_value=False)
    def test_dockerfile_not_found(self, mock_exists, mock_run):
        docker_build = DockerBuild()
        with pytest.raises(PipeException, match="Dockerfile does not exist"):
            docker_build.setup()
            # docker_build._check_and_build_base_image()


# Test for execute method
class TestExecute:
    @patch("subprocess.run")
    @patch("pathlib.Path.exists", return_value=False)
    @patch("pathlib.Path.touch", return_value=None)
    @patch("builtins.open")
    @patch("shutil.copytree")
    @patch("shutil.copy")
    @patch.object(FileCache, "delete_cache")
    def test_execute_success(self, mock_delete_cache, mock_copy, mock_copytree, mock_open, mock_touch, mock_exists, mock_run, docker_build, mock_pipeline_data):
        mock_run.return_value.returncode = 0
        result = docker_build.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
        tag = f"{mock_pipeline_data.task.algorithmCID}:{mock_pipeline_data.task.algorithmHash[:128]}"
        mock_copytree.assert_called_once()
        mock_copy.assert_called_once()
        mock_run.assert_any_call(
            ["docker", "buildx", "build", "-t", tag,
                "-f", "Dockerfile.worker", "."],
            cwd=mock_pipeline_data.algorithm_path,
            check=True
        )

    @patch("subprocess.run")
    @patch("pathlib.Path.exists", return_value=False)
    @patch("pathlib.Path.touch", return_value=None)
    @patch("builtins.open")
    @patch("shutil.copytree")
    @patch("shutil.copy")
    @patch.object(FileCache, "delete_cache")
    def test_execute_with_registry(self, mock_delete_cache, mock_copy, mock_copytree, mock_open, mock_touch, mock_exists, mock_run, docker_build, mock_pipeline_data):
        docker_build.docker_registry = "registry.example.com"
        mock_run.side_effect = [
            MagicMock(returncode=1),  # Image doesn't exist in registry
            MagicMock(returncode=0),  # Build succeeds
            MagicMock(returncode=0),  # Tag succeeds
            MagicMock(returncode=0)   # Push succeeds
        ]
        result = docker_build.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
        assert mock_run.call_count == 4

    @patch("subprocess.run", side_effect=subprocess.CalledProcessError(1, "docker"))
    @patch.object(FileCache, "delete_cache")
    def test_execute_build_error(self, mock_delete_cache, mock_run, docker_build, mock_pipeline_data):
        docker_build.docker_registry = "registry.example.com"
        with pytest.raises(PipeException, match="Failed to build docker environment"):
            docker_build.execute(mock_pipeline_data)
        mock_delete_cache.assert_called_once_with(
            mock_pipeline_data.algorithm_id)

    @patch("subprocess.run", side_effect=Exception("Unexpected error"))
    @patch.object(FileCache, "delete_cache")
    def test_execute_unexpected_error(self, mock_delete_cache, mock_run, docker_build, mock_pipeline_data):
        docker_build.docker_registry = "registry.example.com"
        with pytest.raises(PipeException, match="Unexpected error during docker environment build"):
            docker_build.execute(mock_pipeline_data)
        mock_delete_cache.assert_called_once_with(
            mock_pipeline_data.algorithm_id)
