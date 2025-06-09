import pytest
import json


@pytest.fixture
def mock_check_valid_filename(mocker):
    return mocker.patch("aiverify_apigw.routers.storage_router.check_valid_filename")


@pytest.fixture
def mock_fs_get_test_model(mocker):
    return mocker.patch("aiverify_apigw.routers.storage_router.fs_get_test_model")


@pytest.fixture
def mock_fs_get_test_dataset(mocker):
    return mocker.patch("aiverify_apigw.routers.storage_router.fs_get_test_dataset")


class TestDownloadTestModel:
    def test_download_test_model_success(self, mock_check_valid_filename, mock_fs_get_test_model, test_client):
        # Mock the file validation and file retrieval
        mock_check_valid_filename.return_value = True
        mock_fs_get_test_model.return_value = b"test_model_content"

        response = test_client.get("/storage/models/test_model")
        assert response.status_code == 200
        assert response.content == b"test_model_content"
        assert response.headers["Content-Disposition"] == 'attachment; filename="test_model"'
        assert response.headers["Content-Type"] == "application/octet-stream"

    def test_download_test_model_invalid_filename(self, mock_check_valid_filename, test_client):
        # Mock the file validation to return False
        mock_check_valid_filename.return_value = False

        response = test_client.get("/storage/models/invalid_filename")
        assert response.status_code == 400

    def test_download_test_model_not_found(self, mock_check_valid_filename, mock_fs_get_test_model, test_client):
        # Mock the file validation and raise FileNotFoundError
        mock_check_valid_filename.return_value = True
        mock_fs_get_test_model.side_effect = FileNotFoundError

        response = test_client.get("/storage/models/nonexistent_model")
        assert response.status_code == 404

    def test_download_test_model_internal_error(self, mock_check_valid_filename, mock_fs_get_test_model, test_client):
        # Mock the file validation and raise an internal error
        mock_check_valid_filename.return_value = True
        mock_fs_get_test_model.side_effect = Exception("Internal error")

        response = test_client.get("/storage/models/test_model")
        assert response.status_code == 500


class TestDownloadTestDataset:
    def test_download_test_dataset_success(self, mock_check_valid_filename, mock_fs_get_test_dataset, test_client):
        # Mock the file validation and file retrieval
        mock_check_valid_filename.return_value = True
        mock_fs_get_test_dataset.return_value = b"test_dataset_content"

        response = test_client.get("/storage/datasets/test_dataset")
        assert response.status_code == 200
        assert response.content == b"test_dataset_content"
        assert response.headers["Content-Disposition"] == 'attachment; filename="test_dataset"'
        assert response.headers["Content-Type"] == "application/octet-stream"

    def test_download_test_dataset_invalid_filename(self, mock_check_valid_filename, test_client):
        # Mock the file validation to return False
        mock_check_valid_filename.return_value = False

        response = test_client.get("/storage/datasets/invalid_filename")
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid filename"

    def test_download_test_dataset_not_found(self, mock_check_valid_filename, mock_fs_get_test_dataset, test_client):
        # Mock the file validation and raise FileNotFoundError
        mock_check_valid_filename.return_value = True
        mock_fs_get_test_dataset.side_effect = FileNotFoundError

        response = test_client.get("/storage/datasets/nonexistent_dataset")
        assert response.status_code == 404
        assert response.json()["detail"] == "Dataset file not found"

    def test_download_test_dataset_internal_error(self, mock_check_valid_filename, mock_fs_get_test_dataset, test_client):
        # Mock the file validation and raise an internal error
        mock_check_valid_filename.return_value = True
        mock_fs_get_test_dataset.side_effect = Exception("Internal error")

        response = test_client.get("/storage/datasets/test_dataset")
        assert response.status_code == 500
        assert response.json()["detail"] == "Internal server error"