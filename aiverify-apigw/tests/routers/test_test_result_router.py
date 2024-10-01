import zipfile
import pytest
import io
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, ANY
from aiverify_apigw.__main__ import app
from aiverify_apigw.schemas import TestResult
from aiverify_apigw.models import TestResultModel, TestArtifactModel, TestDatasetModel, TestModelModel
import json

client = TestClient(app)


@pytest.fixture
def mock_test_result_data():
    return {
        "gid": "aiverify.stock.fairness_metrics_toolbox_for_classification",
        "version": "0.9.0",
        "cid": "fairness_metrics_toolbox_for_classification",
        "startTime": "2024-07-24T09:20:24.822881",
        "timeTaken": 1,
        "testArguments": {
            "testDataset": "file:///examples/data/sample_bc_credit_data.sav",
            "modelFile": "file:///examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
            "groundTruthDataset": "file:///examples/data/sample_bc_credit_data.sav",
            "groundTruth": "default",
            "algorithmArgs": {
                "arg1": [
                    "gender"
                ]
            },
            "mode": "upload",
            "modelType": "classification"
        },
        "output": {
            "result": 100
        }
    }


@pytest.fixture
def mock_upload_file():
    mock_file = MagicMock()
    mock_file.filename = "test_file.txt"
    mock_file.content_type = "text/plain"
    mock_file.file.read.return_value = b"Hello World"
    yield mock_file


# Mocked valid zip file with a results.json
def create_mock_zip_file(result_filename="results.json", artifacts=None):
    import zipfile
    import io
    # file_list = file_list or [result_filename]
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile("zip_buffer", 'w', zipfile.ZIP_DEFLATED, False) as zip_file:
        zip_file.writestr(result_filename, "{}")
        # for file_name in file_list:
        #     if file_name != result_filename:
        #         zip_file.writestr(file_name, "artifact content")

    # zip_buffer.seek(0)
    return zip_buffer


# Test Class for POST /test_result/upload
class TestUploadTestResult:

    def test_upload_test_result_algorithm_not_found(self, mock_test_result_data, test_client):
        """Test POST /test_result/upload when the algorithm is not found."""
        form_data = {
            "test_result": json.dumps(mock_test_result_data)
        }
        response = test_client.post("/test_result/upload", data=form_data)
        assert response.status_code == 400

    def test_upload_test_result_invalid_output_schema(self, mock_test_result_data, test_client, db_session, mock_plugins):
        """Test the POST /test_result/upload route when test result output schema is invalid."""

        # files = {'artifacts': (None, None)}  # No files uploaded
        plugin = mock_plugins[0]
        algo = plugin.algorithms[0]

        mock_test_result_data["gid"] = plugin.gid
        mock_test_result_data["cid"] = algo.cid
        mock_test_result_data["output"] = {"fake": 100}
        form_data = {
            "test_result": json.dumps(mock_test_result_data)
        }
        print("form data: ", form_data)
        response = test_client.post("/test_result/upload", data=form_data)
        assert response.status_code == 422

        assert db_session.query(TestResultModel).count() == 0
        assert db_session.query(TestModelModel).count() == 0
        assert db_session.query(TestDatasetModel).count() == 0

    def test_upload_test_result_no_files_success(self, mock_test_result_data, test_client, db_session, mock_plugins):
        """Test the POST /test_result/upload route for successful upload with no files uploaded."""

        # files = {'artifacts': (None, None)}  # No files uploaded
        plugin = mock_plugins[0]
        algo = plugin.algorithms[0]

        mock_test_result_data["gid"] = plugin.gid
        mock_test_result_data["cid"] = algo.cid
        form_data = {
            "test_result": json.dumps(mock_test_result_data)
        }
        response = test_client.post("/test_result/upload", data=form_data)
        assert response.status_code == 200

        assert db_session.query(TestResultModel).count() == 1
        assert db_session.query(TestModelModel).count() == 1
        assert db_session.query(TestDatasetModel).count() == 1

    @patch("aiverify_apigw.routers.test_result_router.save_artifact")
    def test_upload_test_result_with_files_success(self, mock_save_artifact, mock_test_result_data, test_client, db_session, mock_plugins, mock_upload_file):
        """Test the POST /test_result/upload route for successful upload with file upload."""

        # files = {'artifacts': (None, None)}  # No files uploaded
        plugin = mock_plugins[0]
        algo = plugin.algorithms[0]

        mock_test_result_data["gid"] = plugin.gid
        mock_test_result_data["cid"] = algo.cid
        # mock_test_result_data["artifacts"] = [mock_upload_file.filename]
        files = {'artifacts': (mock_upload_file.filename, mock_upload_file.file.read(), mock_upload_file.content_type)}
        form_data = {
            "test_result": json.dumps(mock_test_result_data)
        }
        response = test_client.post(
            "/test_result/upload",
            # headers={"Content-Type": "multipart/form-data"},
            data=form_data,
            files=files
        )

        assert response.status_code == 200
        mock_save_artifact.assert_not_called()  # not called because artifact not listed
        assert db_session.query(TestResultModel).count() == 2  # add 1 from previous run
        assert db_session.query(TestArtifactModel).count() == 0
        assert db_session.query(TestModelModel).count() == 1
        assert db_session.query(TestDatasetModel).count() == 1

        # call again with aritifacts set
        mock_test_result_data["artifacts"] = [mock_upload_file.filename]
        form_data = {
            "test_result": json.dumps(mock_test_result_data)
        }
        response = test_client.post(
            "/test_result/upload",
            # headers={"Content-Type": "multipart/form-data"},
            data=form_data,
            files=files
        )

        assert response.status_code == 200
        mock_save_artifact.assert_called_once()
        assert db_session.query(TestResultModel).count() == 3  # add 1 from previous run
        assert db_session.query(TestArtifactModel).count() == 1
        assert db_session.query(TestModelModel).count() == 1
        assert db_session.query(TestDatasetModel).count() == 1

    def test_upload_test_result_new_ground_truth(self, mock_test_result_data, test_client, db_session, mock_plugins):
        """Test the POST /test_result/upload route for new ground truth dataset created."""

        # files = {'artifacts': (None, None)}  # No files uploaded
        plugin = mock_plugins[0]
        algo = plugin.algorithms[0]

        mock_test_result_data["gid"] = plugin.gid
        mock_test_result_data["cid"] = algo.cid
        mock_test_result_data["testArguments"]["groundTruthDataset"] = "file:///examples/data/sample_ground_truth.sav"
        form_data = {
            "test_result": json.dumps(mock_test_result_data)
        }
        response = test_client.post("/test_result/upload", data=form_data)
        assert response.status_code == 200

        assert db_session.query(TestResultModel).count() == 4
        assert db_session.query(TestModelModel).count() == 1
        assert db_session.query(TestDatasetModel).count() == 2


# Test class for POST /test_result/upload_zip
class TestUploadZipFile:
    @pytest.fixture
    def mock_upload_zipfile(self, mock_test_result_data):
        """Fixture to return a mocked UploadFile for a valid zip."""
        # file_list = file_list or [result_filename]
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED, False) as zip_file:
            zip_file.writestr("results.json", json.dumps(mock_test_result_data))
            zip_file.writestr("image.png", b"artifact content")
        return (zip_buffer, mock_test_result_data)

    @pytest.fixture
    def mock_invalid_upload_zipfile(self):
        """Fixture to return a mocked UploadFile for a valid zip."""
        # file_list = file_list or [result_filename]
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED, False) as zip_file:
            zip_file.writestr("image.png", b"artifact content")
        return zip_buffer

    @patch("aiverify_apigw.routers.test_result_router._save_test_result")
    def test_upload_zip_file_success(self, mock_save_test_result, test_client, mock_upload_zipfile):
        """Test successfully uploading a valid zip file."""
        urls = [
            "/test_result/1"
        ]
        # Mock the result of _save_test_result to return URLs
        mock_save_test_result.return_value = urls

        # Perform the POST request with the mocked zip file
        mock_upload_zipfile[0].seek(0)
        files = {'file': ("test.zip", mock_upload_zipfile[0].read(), "application/zip")}
        response = test_client.post("/test_result/upload_zip", files=files)

        # Assertions
        assert response.status_code == 200
        assert response.json() == urls
        mock_test_result_data = mock_upload_zipfile[1]
        result = TestResult(**mock_test_result_data)
        mock_save_test_result.assert_called_once_with(test_result=result, session=ANY, artifact_set=ANY)

    def test_upload_zip_file_invalid_format(self, test_client):
        """Test uploading a file that is not a zip."""

        # Perform the POST request with non-zip file
        files = {'file': ("test.img", b"fake file", "application/zip")}
        response = test_client.post("/test_result/upload_zip", files=files)

        # Assertions
        assert response.status_code == 400
        assert response.json()["detail"] == "Only zip files are allowed"

        # Perform the POST request with invalid zip file
        files = {'file': ("test.zip", b"fake file", "application/zip")}
        response = test_client.post("/test_result/upload_zip", files=files)

        # Assertions
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid zip file"

    def test_upload_zip_file_missing_results_json(self, test_client, mock_invalid_upload_zipfile):
        """Test uploading a zip file without a results.json file."""

        # Perform the POST request with the mocked zip file
        mock_invalid_upload_zipfile.seek(0)
        files = {'file': ("test.zip", mock_invalid_upload_zipfile.read(), "application/zip")}
        response = test_client.post("/test_result/upload_zip", files=files)

        # Assertions
        assert response.status_code == 400
        assert response.json()[
            "detail"] == "results.json not found in the root folder or any first level folder of the zip file"

    # @patch("your_module_name.router._save_test_result", autospec=True)
    @patch("aiverify_apigw.routers.test_result_router._save_test_result")
    def test_upload_zip_file_internal_error(self, mock_save_test_result, test_client, mock_upload_zipfile):
        """Test internal server error when saving the test results."""
        # Simulate an internal error in the _save_test_result function
        mock_save_test_result.side_effect = Exception("Internal server error")

        # Perform the POST request with the mocked zip file
        mock_upload_zipfile[0].seek(0)
        files = {'file': ("test.zip", mock_upload_zipfile[0].read(), "application/zip")}
        response = test_client.post("/test_result/upload_zip", files=files)

        # Assertions
        assert response.status_code != 200

# Test class for GET /{test_result_id}/artifacts/{filename}


class TestGetTestResultArtifact:

    @pytest.fixture
    def mock_artifact(self):
        """Fixture to return a mock TestArtifactModel."""
        artifact = MagicMock(spec=TestArtifactModel)
        artifact.filename = "test_file.txt"
        artifact.mimetype = "text/plain"
        artifact.suffix = ".txt"
        return artifact

    @patch("aiverify_apigw.routers.test_result_router.get_artifact")
    def test_get_test_result_artifact_success(
        self, mock_get_artifact, mock_test_results, test_client
    ):
        """Test successfully retrieving an artifact."""
        test_result = mock_test_results[1]
        test_artifact = test_result.artifacts[0]

        # Mock the get_artifact function to return the mock artifact data
        mock_artifact_data = b"Mock file content"
        mock_get_artifact.return_value = mock_artifact_data

        # Perform the GET request
        test_result_id = test_result.id
        filename = test_artifact.filename
        response = test_client.get(f"/test_result/{test_result_id}/artifacts/{filename}")

        # Assertions
        assert response.status_code == 200
        assert response.content == mock_artifact_data
        assert response.headers["Content-Disposition"] == f"inline; filename=\"{filename}\""

    @patch("aiverify_apigw.routers.test_result_router.get_artifact")
    def test_get_test_result_artifact_not_found(
        self, mock_get_artifact, mock_test_results, test_client
    ):
        """Test retrieving an artifact that does not exist in the database."""

        # Perform the GET request with valid test_result_id and invalid filename
        test_result_id = mock_test_results[0].id
        filename = "non_existent_file.txt"
        response = test_client.get(f"/test_result/{test_result_id}/artifacts/{filename}")

        # Assertions
        assert response.status_code == 400
        assert response.json()["detail"] == f"Test artifact {filename} not found in test result {test_result_id}"

        # Perform the GET request with invalid test_result_id and invalid filename
        test_result_id = "101010"
        response = test_client.get(f"/test_result/{test_result_id}/artifacts/{filename}")

        # Assertions
        assert response.status_code == 400
        assert response.json()["detail"] == f"Test artifact {filename} not found in test result {test_result_id}"

    @patch("aiverify_apigw.routers.test_result_router.get_artifact")
    def test_get_test_result_artifact_read_failure(
        self, mock_get_artifact, mock_test_results, test_client
    ):
        """Test error when retrieving the artifact file from storage."""
        test_result = mock_test_results[1]
        test_artifact = test_result.artifacts[0]

        # Mock the get_artifact function to raise an exception (simulating a file read failure)
        mock_get_artifact.side_effect = Exception("File read error")

        # Perform the GET request
        test_result_id = test_result.id
        filename = test_artifact.filename
        response = test_client.get(f"/test_result/{test_result_id}/artifacts/{filename}")

        # Assertions
        assert response.status_code == 500
        assert response.json()["detail"] == "Unable to retrieve artifact file"


# Test class for GET /test_result/
class TestReadTestResults:

    def test_read_test_results_success(self, mock_test_results, test_client):
        """Test successfully retrieving a list of test results."""

        # Perform the GET request
        response = test_client.get("/test_result/")

        # Assertions
        assert response.status_code == 200
        json_response = response.json()

        # Verify the response contains the correct test results
        assert len(json_response) == len(mock_test_results)
        for i in range(len(json_response)):
            assert json_response[i]["id"] == mock_test_results[i].id
            assert json_response[i]["name"] == mock_test_results[i].name
            assert json_response[i]["gid"] == mock_test_results[i].gid
            assert json_response[i]["cid"] == mock_test_results[i].cid
            assert json_response[i]["version"] == mock_test_results[i].version


# Test class for GET /test_result/{test_result_id}
class TestReadTestResult:

    def test_read_test_result_success(self, mock_test_results, test_client):
        """Test successfully retrieving a test result by ID."""
        test_result = mock_test_results[0]

        # Perform the GET request for test_result_id = 1
        test_result_id = test_result.id
        response = test_client.get(f"/test_result/{test_result_id}")

        # Assertions
        assert response.status_code == 200
        json_response = response.json()

        # Verify the response contains the correct test result data
        assert json_response["id"] == test_result_id
        assert json_response["name"] == test_result.name
        assert json_response["gid"] == test_result.gid
        assert json_response["cid"] == test_result.cid
        assert json_response["version"] == test_result.version
        assert json_response["timeTaken"] == test_result.time_taken

    def test_read_test_result_not_found(self, test_client):
        """Test retrieving a test result that does not exist (404)."""

        # Perform the GET request for a non-existent test_result_id
        test_result_id = 999
        response = test_client.get(f"/test_result/{test_result_id}")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Test result not found"


# Test class for PUT /test_result/{test_result_id}
class TestUpdateTestResult:

    @pytest.fixture
    def update_data(self):
        """Fixture to provide data for updating the test result."""
        return {"name": "Updated Test Result"}

    def test_update_test_result_success(self, mock_test_results, test_client, db_session, update_data):
        """Test successfully updating a test result by ID."""
        test_result = mock_test_results[0]

        # Perform the PUT request
        test_result_id = test_result.id
        response = test_client.put(f"/test_result/{test_result_id}", json=update_data)
        db_session.commit()

        # Assertions
        assert response.status_code == 200
        json_response = response.json()

        # Verify that the result was updated
        assert json_response["id"] == test_result_id
        assert json_response["name"] == update_data["name"]

        # Ensure the update took place
        updated_result = db_session.query(TestResultModel).get(test_result_id)
        assert updated_result.name == update_data["name"]

    def test_update_test_result_not_found(self, test_client, update_data):
        """Test updating a test result that does not exist (404)."""

        # Perform the PUT request for a non-existent test_result_id
        test_result_id = 999
        response = test_client.put(f"/test_result/{test_result_id}", json=update_data)

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Test result not found"


# Test class for DELETE /test_result/{test_result_id}
class TestDeleteTestResult:

    def test_delete_test_result_success(self, mock_test_results, test_client, db_session):
        """Test successfully deleting a test result by ID."""
        test_result = mock_test_results[0]

        # Perform the DELETE request
        test_result_id = test_result.id
        response = test_client.delete(f"/test_result/{test_result_id}")
        db_session.commit()

        # Assertions
        assert response.status_code == 200

        # Ensure the delete and commit took place
        assert db_session.query(TestResultModel).count() == len(mock_test_results) - 1
        updated_result = db_session.query(TestResultModel).get(test_result_id)
        assert updated_result == None

    def test_delete_test_result_not_found(self, test_client):
        """Test deleting a test result that does not exist (404)."""

        # Perform the DELETE request for a non-existent test_result_id
        test_result_id = 999
        response = test_client.delete(f"/test_result/{test_result_id}")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Test result not found"
