import pytest
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.pipeline_error.apigw_error_update import ApigwErrorUpdate
import os
import requests


# Fixture to create an instance of ApigwErrorUpdate
@pytest.fixture
def apigw_error_update():
    pipe = ApigwErrorUpdate()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    @patch.dict(os.environ, {"APIGW_URL": "http://custom-url:4000"})
    def test_setup_with_custom_value(self):
        apigw_error_update = ApigwErrorUpdate()
        apigw_error_update.setup()
        assert apigw_error_update.apigw_url == "http://custom-url:4000"

    @patch.dict(os.environ, {})
    def test_setup_with_default_value(self):
        apigw_error_update = ApigwErrorUpdate()
        apigw_error_update.setup()
        assert apigw_error_update.apigw_url == "http://127.0.0.1:4000"


# Test for execute method
class TestExecute:
    @patch("requests.patch")
    def test_execute_success(self, mock_patch, apigw_error_update, mock_pipeline_data):
        mock_patch.return_value = Mock(status_code=200)
        mock_pipeline_data.error_message = "Test error message"
        result = apigw_error_update.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
        mock_patch.assert_called_once_with(
            f"http://127.0.0.1:4000/test_runs/{mock_pipeline_data.task.id}",
            json={"status": "error", "errorMessages": "Test error message"}
        )

    @patch("requests.patch", side_effect=requests.RequestException("Connection error"))
    def test_execute_request_error(self, mock_patch, apigw_error_update, mock_pipeline_data):
        with pytest.raises(requests.RequestException, match="Connection error"):
            apigw_error_update.execute(mock_pipeline_data)
