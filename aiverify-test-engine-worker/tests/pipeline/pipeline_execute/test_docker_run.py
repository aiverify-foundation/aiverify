import pytest
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.pipeline_execute.docker_run import DockerRun
from aiverify_test_engine_worker.pipeline.pipe import PipeException
import os
import subprocess


# Fixture to create an instance of DockerRun
@pytest.fixture
def docker_run():
    pipe = DockerRun()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    @patch.dict(os.environ, {
        "DOCKER": "custom-docker",
        "DOCKER_APIGW_URL": "http://custom-url:4000",
        "DOCKER_REGISTRY": "registry.example.com"
    })
    def test_setup_with_custom_values(self):
        docker_run = DockerRun()
        docker_run.setup()
        assert docker_run.docker_bin == "custom-docker"
        assert docker_run.apigw_url == "http://custom-url:4000"
        assert docker_run.docker_registry == "registry.example.com"

    @patch.dict(os.environ, {})
    def test_setup_with_default_values(self):
        docker_run = DockerRun()
        docker_run.setup()
        assert docker_run.docker_bin == "docker"
        assert docker_run.apigw_url == "http://host.docker.internal:4000"
        assert docker_run.docker_registry is None


# Test for execute method
class TestExecute:
    @patch("pathlib.Path.exists", return_value=True)
    @patch("pathlib.Path.samefile", return_value=True)
    @patch("subprocess.run")
    @patch("uuid.uuid4", return_value=Mock(hex="test_container_name"))
    def test_execute_success(self, mock_uuid, mock_run, mock_samefile, mock_exists, docker_run, mock_pipeline_data):
        mock_run.return_value = Mock(returncode=0)
        result = docker_run.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
        assert result.output_zip == mock_pipeline_data.algorithm_path.joinpath(
            "output.zip")
        tag = f"{mock_pipeline_data.task.algorithmCID}:{mock_pipeline_data.task.algorithmHash[:128]}"
        container_data_path = f"/app/data/{mock_pipeline_data.data_path.name}"
        container_model_path = f"/app/data/{mock_pipeline_data.model_path.name}"
        mock_run.assert_any_call(
            ["docker", "run", "--name", "test_container_name", "--rm", "-d", "--entrypoint",
                "/bin/sh", tag, "-c", "trap : TERM INT; sleep infinity & wait", tag],
            check=True
        )
        mock_run.assert_any_call(
            ["docker", "cp", mock_pipeline_data.data_path.absolute(
            ).as_posix(), f"test_container_name:{container_data_path}"],
            check=True
        )
        mock_run.assert_any_call(
            ["docker", "cp", mock_pipeline_data.model_path.absolute(
            ).as_posix(), f"test_container_name:{container_model_path}"],
            check=True
        )

    @patch("subprocess.run", side_effect=[subprocess.CalledProcessError(1, "docker"), None])
    def test_execute_docker_error(self, mock_run, docker_run, mock_pipeline_data):
        with pytest.raises(PipeException, match="Failed to run algorithm"):
            docker_run.execute(mock_pipeline_data)

    @patch("subprocess.run", side_effect=[Exception("Unexpected Error"), None])
    def test_execute_unexpected_error(self, mock_run, docker_run, mock_pipeline_data):
        with pytest.raises(PipeException, match="Unexpected error during algorithm execute"):
            docker_run.execute(mock_pipeline_data)
