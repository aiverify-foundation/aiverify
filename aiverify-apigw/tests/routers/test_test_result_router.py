import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from aiverify_apigw.__main__ import app
from aiverify_apigw.models import TestResultModel, TestArtifactModel
import json

client = TestClient(app)

# Test Class for POST /test_result/upload


class TestUploadTestResult:

    @pytest.fixture
    def mock_test_result_data(self):
        return {
            "gid": "aiverify.stock.fairness_metrics_toolbox_for_classification",
            "version": "0.9.0",
            "cid": "fairness_metrics_toolbox_for_classification",
            "start_time": "2024-07-24T09:20:24.822881",
            "time_taken": 0,
            "test_arguments": {
                "testDataset": "file:///examples/data/sample_bc_credit_data.sav",
                "modelFile": "file:///examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
                "groundTruthDataset": "file:///examples/data/sample_bc_credit_data.sav",
                "groundTruth": "default",
                "algorithmArgs": {
                    "sensitive_feature": [
                        "gender"
                    ],
                    "annotated_labels_path": "file:///examples/data/sample_bc_credit_data.sav",
                    "file_name_label": "NA"
                },
                "mode": "upload",
                "modelType": "classification"
            },
            "output": {
                "result": "success"
            }
        }

    @pytest.fixture
    def mock_upload_file(self):
        mock_file = MagicMock()
        mock_file.filename = "test_file.txt"
        mock_file.content_type = "text/plain"
        mock_file.file.read.return_value = b"Hello World"
        yield mock_file

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

        count = db_session.query(TestResultModel).count()
        assert count == 1

    @patch("aiverify_apigw.routers.test_result_router.save_artifact")
    def test_upload_test_result_with_files_success(self, mock_save_artifact, mock_test_result_data, test_client, db_session, mock_plugins, mock_upload_file):
        """Test the POST /test_result/upload route for successful upload with file upload."""

        # files = {'artifacts': (None, None)}  # No files uploaded
        plugin = mock_plugins[0]
        algo = plugin.algorithms[0]

        mock_test_result_data["gid"] = plugin.gid
        mock_test_result_data["cid"] = algo.cid
        mock_test_result_data["artifacts"] = [mock_upload_file.filename]
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
        mock_save_artifact.assert_called_once()
        count = db_session.query(TestResultModel).count()
        assert count == 2  # add 1 from previous run
        count = db_session.query(TestArtifactModel).count()
        assert count == 1

    def test_upload_test_result_algorithm_not_found(self, mock_test_result_data, test_client):
        """Test POST /test_result/upload when the algorithm is not found."""
        form_data = {
            "test_result": json.dumps(mock_test_result_data)
        }
        response = test_client.post("/test_result/upload", data=form_data)
        assert response.status_code == 400
