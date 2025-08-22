import pytest
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.download.apigw_download import ApigwDownload
from aiverify_test_engine_worker.pipeline.pipe import PipeException
from aiverify_test_engine_worker.lib.filecache import FileCache
from pathlib import Path
import os


# Fixture to create an instance of ApigwDownload
@pytest.fixture
def apigw_download():
    pipe = ApigwDownload()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    def test_setup_sets_apigw_url(self, apigw_download):
        # Mock environment variable
        with patch.dict(os.environ, {"APIGW_URL": "http://mock-url.com"}):
            apigw_download.setup()
            assert apigw_download.apigw_url == "http://mock-url.com"

    def test_setup_sets_default_apigw_url(self, apigw_download):
        # Mock environment variable
        with patch.dict(os.environ, {}):
            apigw_download.setup()
            assert apigw_download.apigw_url == "http://127.0.0.1:4000"


# Test for _download_from_apigw method
class TestDownloadFromApigw:
    @patch("urllib.request.urlopen")
    @patch("tempfile.TemporaryDirectory")
    def test_download_from_apigw_success(self, mock_temp_dir, mock_urlopen, apigw_download):
        # Mock the temporary directory
        mock_temp_dir.return_value.__enter__.return_value = "/tmp"

        # Mock the response
        mock_response = Mock()
        mock_response.read.return_value = b"test_content"
        mock_response.getheader.return_value = 'filename="test_file.zip"'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        # Mock the FileCache store_cache method
        cache = Mock(spec=FileCache)
        cache.store_cache.return_value = Path("/tmp/test_file.zip")
        result = apigw_download._download_from_apigw(
            cache, "http://mock-url.com", "test_file", "hash123")

        assert result == Path("/tmp/test_file.zip")
        mock_urlopen.assert_called_once_with("http://mock-url.com")
        cache.store_cache.assert_called_once()

    @patch("urllib.request.urlopen", side_effect=Exception("Mock Error"))
    def test_download_from_apigw_error(self, mock_urlopen, apigw_download):
        with pytest.raises(PipeException, match="An unexpected error occurred: Mock Error"):
            apigw_download._download_from_apigw(
                Mock(), "http://mock-url.com", "test_file", "hash123")


# Test for _download_algo method
class TestDownloadAlgo:
    @patch.object(FileCache, "get_cached", return_value=None)
    @patch.object(ApigwDownload, "_download_from_apigw", return_value=Path("/tmp/algo"))
    def test_download_algo_new_download(self, mock_download_from_apigw, mock_get_cached, apigw_download, mock_pipeline_data):
        task_data = mock_pipeline_data

        apigw_download._download_algo(task_data)

        assert task_data.algorithm_path == Path("/tmp/algo")
        assert task_data.to_build is True
        mock_download_from_apigw.assert_called_once()

    @patch.object(FileCache, "get_cached", return_value=Path("/cached/algo"))
    def test_download_algo_cached(self, mock_get_cached, apigw_download, mock_pipeline_data):
        task_data = mock_pipeline_data

        apigw_download._download_algo(task_data)

        assert task_data.algorithm_path == Path("/cached/algo")
        assert task_data.to_build is False


# Test for _download_model method
class TestDownloadModel:
    @patch.object(FileCache, "get_cached", return_value=None)
    @patch.object(ApigwDownload, "_download_from_apigw", return_value=Path("/tmp/model"))
    def test_download_model_new_download(self, mock_download_from_apigw, mock_get_cached, apigw_download):
        result = apigw_download._download_model("model_file", "hash123")

        assert result == Path("/tmp/model")
        mock_download_from_apigw.assert_called_once()

    @patch.object(FileCache, "get_cached", return_value=Path("/cached/model"))
    def test_download_model_cached(self, mock_get_cached, apigw_download):
        result = apigw_download._download_model("model_file", "hash123")

        assert result == Path("/cached/model")


# Test for _download_dataset method
class TestDownloadDataset:
    @patch.object(FileCache, "get_cached", return_value=None)
    @patch.object(ApigwDownload, "_download_from_apigw", return_value=Path("/tmp/dataset"))
    def test_download_dataset_new_download(self, mock_download_from_apigw, mock_get_cached, apigw_download):
        result = apigw_download._download_dataset("dataset_file", "hash123")

        assert result == Path("/tmp/dataset")
        mock_download_from_apigw.assert_called_once()

    @patch.object(FileCache, "get_cached", return_value=Path("/cached/dataset"))
    def test_download_dataset_cached(self, mock_get_cached, apigw_download):
        result = apigw_download._download_dataset("dataset_file", "hash123")

        assert result == Path("/cached/dataset")


# Test for execute method
class TestExecute:
    def test_execute_success(self, apigw_download, mock_pipeline_data):
        with patch.object(apigw_download, "_download_algo") as mock_download_algo, \
                patch.object(apigw_download, "_download_model", return_value=mock_pipeline_data.model_path) as mock_download_model, \
                patch.object(apigw_download, "_download_dataset", return_value=mock_pipeline_data.data_path) as mock_download_dataset:
            task_data = mock_pipeline_data
            result = apigw_download.execute(task_data)

            assert result == task_data
            assert task_data.model_path == result.model_path
            assert task_data.data_path == result.data_path
            assert task_data.ground_truth_path == result.ground_truth_path
            mock_download_algo.assert_called_once_with(task_data)
            mock_download_model.assert_called_once_with(
                mock_pipeline_data.task.modelFile, mock_pipeline_data.task.modelFileHash)
            mock_download_dataset.assert_any_call(
                mock_pipeline_data.task.testDataset, mock_pipeline_data.task.testDatasetHash)
            mock_download_dataset.assert_any_call(
                mock_pipeline_data.task.groundTruthDataset, mock_pipeline_data.task.groundTruthDatasetHash)
