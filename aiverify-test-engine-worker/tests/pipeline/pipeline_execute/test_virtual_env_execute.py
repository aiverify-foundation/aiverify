import pytest
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.pipeline_execute.virtual_env_execute import VirtualEnvironmentExecute
from aiverify_test_engine_worker.pipeline.pipe import PipeException
import os
import subprocess
import json


# Fixture to create an instance of VirtualEnvironmentExecute
@pytest.fixture
def virtual_env_execute():
    pipe = VirtualEnvironmentExecute()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    @patch.dict(os.environ, {
        "PYTHON": "custom-python",
        "APIGW_URL": "http://custom-url:4000"
    })
    def test_setup_with_custom_values(self, virtual_env_execute):
        virtual_env_execute.setup()
        assert virtual_env_execute.python_bin == "custom-python"
        assert virtual_env_execute.apigw_url == "http://custom-url:4000"

    @patch.dict(os.environ, {})
    def test_setup_with_default_values(self, virtual_env_execute):
        virtual_env_execute.setup()
        assert virtual_env_execute.python_bin == "python3"
        assert virtual_env_execute.apigw_url == "http://127.0.0.1:4000"


# Test for execute method
class TestExecute:
    @patch("pathlib.Path.exists", return_value=True)
    @patch("subprocess.run")
    def test_execute_success(self, mock_run, mock_exists, virtual_env_execute, mock_pipeline_data):
        mock_run.return_value = Mock(returncode=0)
        result = virtual_env_execute.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
        assert result.output_zip == mock_pipeline_data.algorithm_path.joinpath("output.zip")
        venv_path = mock_pipeline_data.algorithm_path.joinpath('.venv')
        venv_bin = venv_path.joinpath("bin")
        python_executable = venv_bin.joinpath("python")

        mock_run.assert_called_once_with(
            [
                str(python_executable.absolute()),
                "-m", "scripts.algo_execute",
                "--test_run_id", mock_pipeline_data.task.id,
                "--algo_path", str(mock_pipeline_data.algorithm_path.absolute()),
                "--data_path", str(mock_pipeline_data.data_path.absolute()),
                "--model_path", str(mock_pipeline_data.model_path.absolute()),
                "--model_type", mock_pipeline_data.task.modelType.lower(),
                "--algorithm_args", json.dumps(mock_pipeline_data.task.algorithmArgs),
                "--apigw_url", "http://127.0.0.1:4000",
                "--ground_truth_path", str(mock_pipeline_data.ground_truth_path.absolute()),
                "--ground_truth", mock_pipeline_data.task.groundTruth
            ],
            cwd=mock_pipeline_data.algorithm_path,
            check=True,
            capture_output=True,
            env={"PYTHONPATH": virtual_env_execute.script_dir.parent.as_posix()}
        )

    @patch("subprocess.run", side_effect=subprocess.CalledProcessError(1, "python", stderr=b"Test error"))
    def test_execute_subprocess_error(self, mock_run, virtual_env_execute, mock_pipeline_data):
        with pytest.raises(PipeException, match="Failed to run algorithm: Test error"):
            virtual_env_execute.execute(mock_pipeline_data)

    @patch("subprocess.run", side_effect=Exception("Unexpected Error"))
    def test_execute_unexpected_error(self, mock_run, virtual_env_execute, mock_pipeline_data):
        with pytest.raises(PipeException, match="Unexpected error during algorithm execute: Unexpected Error"):
            virtual_env_execute.execute(mock_pipeline_data)

    @patch("subprocess.run", return_value=Mock(returncode=0))
    def test_execute_missing_output_zip(self, mock_run, virtual_env_execute, mock_pipeline_data):
        virtual_env_execute.setup()
        with patch("pathlib.Path.exists", return_value=False):
            with pytest.raises(PipeException, match="Output zip not generated"):
                virtual_env_execute.execute(mock_pipeline_data)