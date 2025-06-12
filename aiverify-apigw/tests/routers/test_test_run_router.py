import pytest
from aiverify_apigw.lib.constants import TestRunStatus


@pytest.fixture
def mock_valkey_client(mocker):
    return mocker.patch("aiverify_apigw.routers.test_run_router.client")


@pytest.fixture
def mock_validate_json_schema(mocker):
    return mocker.patch("aiverify_apigw.routers.test_run_router.validate_json_schema")


class TestServerActive:
    def test_server_active_success(self, mock_valkey_client, test_client):
        # Mock Valkey client to return True
        mock_valkey_client.ping.return_value = True

        response = test_client.post("/test_runs/server_active")
        assert response.status_code == 200
        assert response.json() is True

    def test_server_active_not_active(self, mock_valkey_client, test_client):
        # Mock Valkey client to raise an exception
        mock_valkey_client.ping.side_effect = Exception("Connection error")

        response = test_client.post("/test_runs/server_active")
        assert response.status_code == 200
        assert response.json() is False


class TestListTestRuns:
    def test_list_test_runs_success(self, test_client, mock_test_runs):
        response = test_client.get("/test_runs/")
        assert response.status_code == 200
        assert len(response.json()) == len(mock_test_runs)
        assert response.json()[0]["status"] == mock_test_runs[0].status


class TestRunTest:
    def test_run_test_success(self, mock_valkey_client, mock_validate_json_schema, test_client, mock_test_runs):
        test_run = mock_test_runs[0]

        # Mock Valkey client to simulate active server
        mock_valkey_client.ping.return_value = True
        mock_valkey_client.xadd.return_value = b"job_id"

        # Mock JSON schema validation
        mock_validate_json_schema.return_value = True

        input_data = {
            "mode": "upload",
            "algorithmGID": test_run.algorithm.gid,
            "algorithmCID": test_run.algorithm.cid,
            "algorithmArgs": {"key": "value"},
            "modelFilename": test_run.model.filename,
            "testDatasetFilename": test_run.test_dataset.filename,
            "groundTruthDatasetFilename": test_run.ground_truth_dataset.filename if test_run.ground_truth_dataset else None,
            "groundTruth": test_run.ground_truth,
        }
        response = test_client.post("/test_runs/run_test", json=input_data)
        assert response.status_code == 200
        assert response.json()["status"] == "pending"

    def test_run_test_algorithm_not_found(self, mock_valkey_client, test_client):
        # Mock Valkey client to simulate active server
        mock_valkey_client.ping.return_value = True

        input_data = {
            "mode": "upload",
            "algorithmGID": "gid1",
            "algorithmCID": "cid1",
            "algorithmArgs": {"key": "value"},
            "modelFilename": "model.pkl",
            "testDatasetFilename": "dataset.csv"
        }
        response = test_client.post("/test_runs/run_test", json=input_data)
        assert response.status_code == 404
        assert response.json()["detail"] == "Algorithm not found with the provided GID and CID"

    def test_run_test_server_not_active(self, test_client):

        input_data = {
            "mode": "upload",
            "algorithmGID": "gid1",
            "algorithmCID": "cid1",
            "algorithmArgs": {"param": "value"},
            "modelFilename": "model.pkl",
            "testDatasetFilename": "dataset.csv"
        }
        response = test_client.post("/test_runs/run_test", json=input_data)
        assert response.status_code == 500
        assert response.json()["detail"] == "Task queue not active"


class TestGetTestRun:
    def test_get_test_run_success(self, test_client, mock_test_runs):
        test_run = mock_test_runs[0]

        response = test_client.get(f"/test_runs/{test_run.id}")
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_get_test_run_not_found(self, test_client):
        response = test_client.get("/test_runs/123e4567-e89b-12d3-a456-426614174000")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test run not found"


class TestUpdateTestRunStatus:

    def test_update_test_run_status_success(self, test_client, mock_test_runs):
        test_run = next(tr for tr in mock_test_runs if tr.status == TestRunStatus.Pending)
        update_data = {"status": "success", "progress": 100}
        response = test_client.patch(f"/test_runs/{test_run.id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_update_test_run_status_not_found(self, test_client):
        update_data = {"status": "success", "progress": 100}
        response = test_client.patch("/test_runs/123e4567-e89b-12d3-a456-426614174000", json=update_data)
        assert response.status_code == 404
        assert response.json()["detail"] == "Test run not found"

    def test_update_test_run_status_not_pending(self, test_client, mock_test_runs):
        test_run = next(tr for tr in mock_test_runs if tr.status != TestRunStatus.Pending)
        update_data = {"status": "success", "progress": 100}
        response = test_client.patch(f"/test_runs/{test_run.id}", json=update_data)
        assert response.status_code == 400
        assert response.json()["detail"] == "Test run status is not pending"


class TestCancelTestRun:
    def test_cancel_test_run_success(self, mock_valkey_client, test_client, mock_test_runs):
        test_run = next(tr for tr in mock_test_runs if tr.status == TestRunStatus.Pending)

        # Mock Valkey client to delete the job
        mock_valkey_client.xdel.return_value = 1

        response = test_client.post(f"/test_runs/{test_run.id}/cancel")
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

    def test_cancel_test_run_not_found(self, test_client):
        response = test_client.post("/test_runs/123e4567-e89b-12d3-a456-426614174000/cancel")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test run not found"

    def test_cancel_test_run_not_pending(self, test_client, mock_test_runs):
        test_run = next(tr for tr in mock_test_runs if tr.status != TestRunStatus.Pending)
        response = test_client.post(f"/test_runs/{test_run.id}/cancel")
        assert response.status_code == 400
        assert response.json()["detail"] == "Only pending test runs can be cancelled"


class TestDeleteTestRun:
    def test_delete_test_run_success(self, test_client, mock_test_runs):
        test_run = next(tr for tr in mock_test_runs if tr.status != TestRunStatus.Pending)
        response = test_client.delete(f"/test_runs/{test_run.id}")
        assert response.status_code == 204

    def test_delete_test_run_not_found(self, test_client):
        response = test_client.delete("/test_runs/123e4567-e89b-12d3-a456-426614174000")
        assert response.status_code == 404
        assert response.json()["detail"] == "Test run not found"

    def test_delete_test_run_pending(self, test_client, mock_test_runs):
        test_run = next(tr for tr in mock_test_runs if tr.status == TestRunStatus.Pending)
        response = test_client.delete(f"/test_runs/{test_run.id}")
        assert response.status_code == 400
        assert response.json()["detail"] == "Pending test runs cannot be deleted. Cancel the test run instead"