import pytest
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.pipeline_execute.kubectl_run import KubectlRun
from aiverify_test_engine_worker.pipeline.pipe import PipeException
import os
import subprocess


# Fixture to create an instance of KubectlRun
@pytest.fixture
def kubectl_run():
    pipe = KubectlRun()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    @patch.dict(os.environ, {
        "KUBECTL": "custom-kubectl",
        "KUBECTL_APIGW_URL": "http://custom-url:4000",
        "KUBECTL_RUN_EXTRA_ARGS": "--namespace=custom-namespace",
        "KUBECTL_REGISTRY": "registry.example.com"
    })
    def test_setup_with_custom_values(self, kubectl_run):
        kubectl_run.setup()
        assert kubectl_run.kubectl_bin == "custom-kubectl"
        assert kubectl_run.apigw_url == "http://custom-url:4000"
        assert kubectl_run.extra_args == "--namespace=custom-namespace"
        assert kubectl_run.registry == "registry.example.com"

    @patch.dict(os.environ, {})
    def test_setup_with_default_values(self, kubectl_run):
        kubectl_run.setup()
        assert kubectl_run.kubectl_bin == "kubectl"
        assert kubectl_run.apigw_url == "http://apigw.aiverify.svc.cluster.local:4000"
        assert kubectl_run.extra_args == "--namespace=aiverify"
        assert kubectl_run.registry == ""


# Test for execute method
class TestExecute:
    @patch("pathlib.Path.exists", return_value=True)
    @patch("pathlib.Path.samefile", return_value=True)
    @patch("subprocess.run")
    @patch("uuid.uuid4", return_value=Mock(hex="test_pod_name"))
    def test_execute_success(self, mock_uuid, mock_run, mock_samefile, mock_exists, kubectl_run, mock_pipeline_data):
        mock_run.return_value = Mock(returncode=0)
        result = kubectl_run.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
        assert result.output_zip == mock_pipeline_data.algorithm_path.joinpath(
            "output.zip")
        tag = f"{mock_pipeline_data.task.algorithmCID}:{mock_pipeline_data.task.algorithmHash[:128]}"
        pod_data_path = f"/app/data/{mock_pipeline_data.data_path.name}"
        pod_model_path = f"/app/data/{mock_pipeline_data.model_path.name}"
        mock_run.assert_any_call(
            ["kubectl", "run", "test_pod_name", "--restart=Never", "--namespace=aiverify",
                f"--image={tag}", "--command", "--", "/bin/sh", "-c", "trap : TERM INT; sleep infinity & wait"],
            check=True
        )
        mock_run.assert_any_call(
            ["kubectl", "cp", "--namespace=aiverify",
                mock_pipeline_data.data_path.absolute().as_posix(), f"test_pod_name:{pod_data_path}"],
            check=True
        )
        mock_run.assert_any_call(
            ["kubectl", "cp", "--namespace=aiverify", mock_pipeline_data.model_path.absolute().as_posix(),
             f"test_pod_name:{pod_model_path}"],
            check=True
        )

    @patch("subprocess.run", side_effect=[subprocess.CalledProcessError(1, "kubectl"), None])
    def test_execute_kubectl_error(self, mock_run, kubectl_run, mock_pipeline_data):
        kubectl_run.setup()
        with pytest.raises(PipeException, match="Failed to run algorithm"):
            kubectl_run.execute(mock_pipeline_data)

    @patch("subprocess.run", side_effect=[Exception("Unexpected Error"), None])
    def test_execute_unexpected_error(self, mock_run, kubectl_run, mock_pipeline_data):
        kubectl_run.setup()
        with pytest.raises(PipeException, match="Unexpected error during algorithm execute"):
            kubectl_run.execute(mock_pipeline_data)
