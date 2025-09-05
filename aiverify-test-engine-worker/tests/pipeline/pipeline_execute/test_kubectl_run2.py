import pytest
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.pipeline_execute.kubectl_run2 import KubectlRun2
from aiverify_test_engine_worker.pipeline.pipe import PipeException
import os
import subprocess


# Fixture to create an instance of KubectlRun2
@pytest.fixture
def kubectl_run2():
    pipe = KubectlRun2()
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
    def test_setup_with_custom_values(self):
        kubectl_run2 = KubectlRun2()
        kubectl_run2.setup()
        assert kubectl_run2.kubectl_bin == "custom-kubectl"
        assert kubectl_run2.apigw_url == "http://custom-url:4000"
        assert kubectl_run2.extra_args == "--namespace=custom-namespace"
        assert kubectl_run2.registry == "registry.example.com"

    @patch.dict(os.environ, {})
    def test_setup_with_default_values(self, kubectl_run2):
        kubectl_run2 = KubectlRun2()
        kubectl_run2.setup()
        assert kubectl_run2.kubectl_bin == "kubectl"
        assert kubectl_run2.apigw_url == "http://apigw.aiverify.svc.cluster.local:4000"
        assert kubectl_run2.registry == ""


# Test for execute method
class TestExecute:
    @patch("subprocess.run")
    @patch("uuid.uuid4", return_value=Mock(hex="test_job_name"))
    def test_execute_success(self, mock_uuid, mock_run, kubectl_run2, mock_pipeline_data):
        mock_run.return_value = Mock(returncode=0)
        kubectl_run2.execute(mock_pipeline_data)
        mock_run.assert_called_once()

    @patch("subprocess.run", side_effect=subprocess.CalledProcessError(1, "kubectl"))
    def test_execute_kubectl_error(self, mock_run, kubectl_run2, mock_pipeline_data):
        kubectl_run2.setup()
        with pytest.raises(PipeException, match="Failed to submit job"):
            kubectl_run2.execute(mock_pipeline_data)

    @patch("subprocess.run", side_effect=Exception("Unexpected Error"))
    def test_execute_unexpected_error(self, mock_run, kubectl_run2, mock_pipeline_data):
        kubectl_run2.setup()
        with pytest.raises(PipeException, match="Unexpected error during algorithm execute"):
            kubectl_run2.execute(mock_pipeline_data)
