import pytest
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.pipeline_build.virtual_env import VirtualEnvironmentBuild
from aiverify_test_engine_worker.pipeline.pipe import PipeException
from aiverify_test_engine_worker.lib.filecache import FileCache
from pathlib import Path
import subprocess
import os


# Fixture to create an instance of VirtualEnvironmentBuild
@pytest.fixture
def virtual_env_build():
    pipe = VirtualEnvironmentBuild()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    def test_setup_sets_python_bin(self, virtual_env_build):
        # Mock environment variable
        with patch.dict(os.environ, {"PYTHON": "python3.11"}):
            virtual_env_build.setup()
            assert virtual_env_build.python_bin == "python3.11"

    def test_setup_sets_default_python_bin(self, virtual_env_build):
        with patch.dict(os.environ, {}):
            virtual_env_build.setup()
            assert virtual_env_build.python_bin == "python3"


# Test for execute method
class TestExecute:
    @patch("subprocess.run")
    def test_execute_success(self, mock_subprocess_run, virtual_env_build, mock_pipeline_data):
        # Mock subprocess.run to simulate successful command execution
        mock_subprocess_run.return_value = Mock(returncode=0)

        # Call the execute method
        venv_path = mock_pipeline_data.algorithm_path.joinpath('.venv')
        result = virtual_env_build.execute(mock_pipeline_data)
        venv_bin = venv_path.joinpath("bin")
        pip_executable = venv_bin.joinpath("pip")

        # Assertions
        assert result == mock_pipeline_data
        mock_subprocess_run.assert_any_call(
            [virtual_env_build.python_bin, '-m', 'venv',
                "--system-site-packages", str(venv_path)],
            check=True
        )
        mock_subprocess_run.assert_any_call(
            [pip_executable, 'install', '-e', '.'],
            cwd=Path(mock_pipeline_data.algorithm_path),
            check=True
        )

    @patch("subprocess.run", side_effect=subprocess.CalledProcessError(1, "venv"))
    @patch.object(FileCache, "delete_cache")
    def test_execute_called_process_error(self, mock_delete_cache, mock_subprocess_run, virtual_env_build, mock_pipeline_data):
        # Assert exception
        with pytest.raises(PipeException, match="Failed to build virtual environment:"):
            virtual_env_build.execute(mock_pipeline_data)

        # Assertions
        mock_delete_cache.assert_called_once_with(
            mock_pipeline_data.algorithm_id)

    @patch("subprocess.run", side_effect=Exception("Unexpected Error"))
    @patch.object(FileCache, "delete_cache")
    def test_execute_unexpected_error(self, mock_delete_cache, mock_subprocess_run, virtual_env_build, mock_pipeline_data):
        # Assert exception
        with pytest.raises(PipeException, match="Unexpected error during virtual environment build:"):
            virtual_env_build.execute(mock_pipeline_data)

        # Assertions
        mock_delete_cache.assert_called_once_with(
            mock_pipeline_data.algorithm_id)
