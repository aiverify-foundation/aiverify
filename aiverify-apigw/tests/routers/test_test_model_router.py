import pytest


@pytest.fixture
def mock_check_valid_filename(mocker):
    return mocker.patch("aiverify_apigw.routers.test_model_router.check_valid_filename")


@pytest.fixture
def mock_check_file_size(mocker):
    return mocker.patch("aiverify_apigw.routers.test_model_router.check_file_size")


@pytest.fixture
def mock_fs_save_test_model(mocker):
    return mocker.patch("aiverify_apigw.routers.test_model_router.fs_save_test_model")


@pytest.fixture
def mock_fs_get_test_model(mocker):
    return mocker.patch("aiverify_apigw.routers.test_model_router.fs_get_test_model")


@pytest.fixture
def mock_fs_delete_test_model(mocker):
    return mocker.patch("aiverify_apigw.routers.test_model_router.fs_delete_test_model")


@pytest.fixture
def mock_test_engine_validator(mocker):
    return mocker.patch("aiverify_apigw.routers.test_model_router.TestEngineValidator")


class TestListTestModels:
    def test_list_test_models_success(self, test_client, mock_test_models):
        response = test_client.get("/test_models/")
        assert response.status_code == 200
        assert len(response.json()) == len(mock_test_models)
        assert response.json()[0]["name"] == mock_test_models[0].name


class TestUploadModelFiles:
    def test_upload_model_files_success(self, mock_check_valid_filename, mock_check_file_size, mock_fs_save_test_model, mock_test_engine_validator, test_client):
        # Mock the file validation, size check, and saving operations
        mock_check_valid_filename.return_value = True
        mock_check_file_size.return_value = True
        mock_fs_save_test_model.return_value = "filehash"
        mock_test_engine_validator.validate_model.return_value = ("format", "serializer")

        response = test_client.post("/test_models/upload", files=[("files", ("test_model.pkl", b"content"))], data={"model_types": ["classification"]})
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_upload_model_files_invalid_filename(self, mock_check_valid_filename, test_client):
        # Mock the file validation to return False
        mock_check_valid_filename.return_value = False

        response = test_client.post("/test_models/upload", files=[("files", ("invalid_model.pkl", b"content"))], data={"model_types": ["classification"]})
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid filename invalid_model.pkl"


class TestUploadFolder:
    def test_upload_folder_success(self, mock_check_valid_filename, mock_check_file_size, mock_fs_save_test_model, mock_test_engine_validator, test_client):
        # Mock the folder validation, size check, and saving operations
        mock_check_valid_filename.return_value = True
        mock_check_file_size.return_value = True
        mock_fs_save_test_model.return_value = "filehash"
        mock_test_engine_validator.validate_model.return_value = ("format", "serializer")

        response = test_client.post(
            "/test_models/upload_folder",
            data={"model_type": "classification", "file_type": "folder", "foldername": "test_folder", "subfolders": "./"},
            files=[("files", ("test_model.pkl", b"content"))]
        )
        assert response.status_code == 200
        assert response.json()["name"] == "test_folder"

    def test_upload_folder_invalid_foldername(self, mock_check_valid_filename, test_client):
        # Mock the folder validation to return False
        mock_check_valid_filename.return_value = False

        response = test_client.post(
            "/test_models/upload_folder",
            data={"model_type": "classification", "file_type": "folder", "foldername": "invalid_folder", "subfolders": "./"},
            files=[("files", ("test_model.pkl", b"content"))]
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid foldername: invalid_folder"


class TestReadTestModel:
    def test_read_test_model_success(self, test_client, mock_test_models):
        model = mock_test_models[0]
        response = test_client.get(f"/test_models/{model.id}")
        assert response.status_code == 200
        assert response.json()["name"] == model.name

    def test_read_test_model_not_found(self, test_client):
        response = test_client.get("/test_models/1234")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test model not found"


class TestDownloadTestModel:
    def test_download_test_model_success(self, mock_fs_get_test_model, test_client, mock_test_models):
        model = mock_test_models[0]
        mock_fs_get_test_model.return_value = b"model_content"

        response = test_client.get(f"/test_models/download/{model.id}")
        assert response.status_code == 200
        assert response.content == b"model_content"

    def test_download_test_model_not_found(self, test_client):
        response = test_client.get("/test_models/download/1234")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test model not found"


class TestUpdateTestModel:
    def test_update_test_model_success(self, test_client, mock_test_models):
        model = mock_test_models[0]
        update_data = {
            "name": "Updated Model",
            "description": "Updated Description",
            "modelType": "classification",
            # "modelAPI": {"requestConfig": {"url": "http://example.com"}},
            # "parameterMappings": {"requestBody": {"key": "value"}}
        }
        response = test_client.patch(f"/test_models/{model.id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == update_data["name"]

    def test_update_test_model_not_found(self, test_client):
        update_data = {
            "name": "Updated Model"
        }
        response = test_client.patch("/test_models/1234", json=update_data)
        assert response.status_code == 404
        assert response.json()["detail"] == "Test model not found"


class TestDeleteTestModel:
    def test_delete_test_model_success(self, mock_fs_delete_test_model, test_client, mock_test_models):
        model = mock_test_models[0]

        response = test_client.delete(f"/test_models/{model.id}")
        assert response.status_code == 200
        assert response.json()["detail"] == "Test model deleted successfully"

    def test_delete_test_model_not_found(self, test_client):
        response = test_client.delete("/test_models/1234")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test model not found"

    def test_delete_test_model_referenced(self, test_client, mock_test_results):
        test_result = mock_test_results[0]
        response = test_client.delete(f"/test_models/{test_result.model.id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test model cannot be deleted if there are test results referencing this model"