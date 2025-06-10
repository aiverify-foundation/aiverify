import pytest
import json


@pytest.fixture
def mock_check_valid_filename(mocker):
    return mocker.patch("aiverify_apigw.routers.test_dataset_router.check_valid_filename")


@pytest.fixture
def mock_check_file_size(mocker):
    return mocker.patch("aiverify_apigw.routers.test_dataset_router.check_file_size")


@pytest.fixture
def mock_fs_save_test_dataset(mocker):
    return mocker.patch("aiverify_apigw.routers.test_dataset_router.fs_save_test_dataset")


@pytest.fixture
def mock_fs_get_test_dataset(mocker):
    return mocker.patch("aiverify_apigw.routers.test_dataset_router.fs_get_test_dataset")


@pytest.fixture
def mock_fs_delete_test_dataset(mocker):
    return mocker.patch("aiverify_apigw.routers.test_dataset_router.fs_delete_test_dataset")


@pytest.fixture
def mock_test_engine_validator(mocker):
    return mocker.patch("aiverify_apigw.routers.test_dataset_router.TestEngineValidator")


class TestListDatasets:
    def test_list_datasets_success(self, test_client, mock_test_datasets):
        response = test_client.get("/test_datasets/")
        assert response.status_code == 200
        assert len(response.json()) == len(mock_test_datasets)
        assert response.json()[0]["name"] == mock_test_datasets[0].name


class TestUploadDatasetFiles:
    def test_upload_dataset_files_success(self, mock_check_valid_filename, mock_check_file_size, mock_fs_save_test_dataset, mock_test_engine_validator, test_client):
        # Mock the file validation, size check, and saving operations
        mock_check_valid_filename.return_value = True
        mock_check_file_size.return_value = True
        mock_fs_save_test_dataset.return_value = "filehash"
        # (data_format, serializer, num_rows, num_cols, dataColumns) = TestEngineValidator.validate_dataset(dataset_path)
        mock_test_engine_validator.validate_dataset.return_value = ("format", "serializer", 10, 5, [{"name": "test", "datatype": "text", "label": "test"}])

        response = test_client.post("/test_datasets/upload", files=[("files", ("test_file.csv", b"content"))])
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_upload_dataset_files_invalid_filename(self, mock_check_valid_filename, test_client):
        # Mock the file validation to return False
        mock_check_valid_filename.return_value = False

        response = test_client.post("/test_datasets/upload", files=[("files", ("invalid_file.csv", b"content"))])
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid filename invalid_file.csv"


class TestUploadDatasetFolder:
    def test_upload_dataset_folder_success(self, mock_check_valid_filename, mock_check_file_size, mock_fs_save_test_dataset, mock_test_engine_validator, test_client):
        # Mock the folder validation, size check, and saving operations
        mock_check_valid_filename.return_value = True
        mock_check_file_size.return_value = True
        mock_fs_save_test_dataset.return_value = "filehash"
        mock_test_engine_validator.validate_dataset.return_value = ("format", "serializer", 10, 5, [{"name": "test", "datatype": "text", "label": "test"}])

        response = test_client.post(
            "/test_datasets/upload_folder",
            data={"foldername": "test_folder", "subfolders": "./"},
            files=[("files", ("test_file.csv", b"content"))]
        )
        assert response.status_code == 200
        assert response.json()["name"] == "test_folder"

    def test_upload_dataset_folder_invalid_foldername(self, mock_check_valid_filename, test_client):
        # Mock the folder validation to return False
        mock_check_valid_filename.return_value = False

        response = test_client.post(
            "/test_datasets/upload_folder",
            data={"foldername": "invalid_folder", "subfolders": "./"},
            files=[("files", ("test_file.csv", b"content"))]
        )
        assert response.status_code == 400


class TestReadDataset:
    def test_read_dataset_success(self, test_client, mock_test_datasets):
        dataset = mock_test_datasets[0]
        response = test_client.get(f"/test_datasets/{dataset.id}")
        assert response.status_code == 200
        assert response.json()["name"] == dataset.name

    def test_read_dataset_not_found(self, test_client):
        response = test_client.get("/test_datasets/1234")
        assert response.status_code == 404


class TestDownloadDataset:
    def test_download_dataset_success(self, mock_fs_get_test_dataset, test_client, mock_test_datasets):
        dataset = mock_test_datasets[0]
        mock_fs_get_test_dataset.return_value = b"dataset_content"

        response = test_client.get(f"/test_datasets/{dataset.id}/download")
        assert response.status_code == 200
        assert response.content == b"dataset_content"

    def test_download_dataset_not_found(self, test_client):
        response = test_client.get("/test_datasets/1234/download")
        assert response.status_code == 404


class TestUpdateDataset:
    def test_update_dataset_success(self, test_client, mock_test_datasets):
        dataset = mock_test_datasets[0]
        update_data = {
            "name": "Updated Dataset",
            "description": "Updated Description",
        }
        response = test_client.patch(f"/test_datasets/{dataset.id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == update_data["name"]

    def test_update_dataset_not_found(self, test_client):
        update_data = {
            "name": "Updated Dataset"
        }
        response = test_client.patch("/test_datasets/1234", json=update_data)
        assert response.status_code == 404


class TestDeleteDataset:
    def test_delete_dataset_success(self, mock_fs_delete_test_dataset, test_client, mock_test_datasets):
        dataset = mock_test_datasets[0]
        response = test_client.delete(f"/test_datasets/{dataset.id}")
        assert response.status_code == 200

    def test_delete_dataset_not_found(self, test_client):
        response = test_client.delete("/test_datasets/1234")
        assert response.status_code == 404

    def test_delete_dataset_referenced(self, test_client, mock_test_results):
        test_result = mock_test_results[0]
        response = test_client.delete(f"/test_datasets/{test_result.test_dataset.id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test dataset cannot be deleted if there are test results referencing this dataset"