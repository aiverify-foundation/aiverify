import pytest
from unittest.mock import Mock, patch, mock_open, ANY
from aiverify_test_engine_worker.pipeline.upload.apigw_upload import ApigwDownload
from aiverify_test_engine_worker.pipeline.pipe import PipeException
import os


# Fixture to create an instance of ApigwDownload
@pytest.fixture
def apigw_upload():
    pipe = ApigwDownload()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    @patch.dict(os.environ, {"APIGW_URL": "http://custom-url:4000"})
    def test_setup_with_custom_values(self):
        apigw_upload = ApigwDownload()
        apigw_upload.setup()
        assert apigw_upload.apigw_url == "http://custom-url:4000"

    @patch.dict(os.environ, {})
    def test_setup_with_default_values(self):
        apigw_upload = ApigwDownload()
        apigw_upload.setup()
        assert apigw_upload.apigw_url == "http://127.0.0.1:4000"


# Test for execute method
class TestExecute:
    @patch("requests.post")
    def test_execute_success(self, mock_post, apigw_upload, mock_pipeline_data):
        mock_response = Mock(status_code=200)
        mock_post.return_value = mock_response
        with patch("builtins.open", mock_open(read_data='mocked file content')):
            result = apigw_upload.execute(mock_pipeline_data)
            assert result == mock_pipeline_data
            mock_post.assert_called_once_with(
                f"http://127.0.0.1:4000/test_results/upload_zip",
                files={'file': ANY}
            )

    @patch("requests.post", return_value=Mock(status_code=400, text="Bad request"))
    def test_execute_upload_failure(self, mock_post, apigw_upload, mock_pipeline_data):
        with patch("builtins.open", mock_open(read_data='mocked file content')):
            with pytest.raises(PipeException, match="Upload failed with status code 400"):
                apigw_upload.execute(mock_pipeline_data)

    @patch("requests.post", return_value=Mock(status_code=200))
    @patch("builtins.open", side_effect=IOError("File not found"))
    def test_execute_file_not_found(self, mock_open, mock_post, apigw_upload, mock_pipeline_data):
        with pytest.raises(OSError, match="File not found"):
            apigw_upload.execute(mock_pipeline_data)
