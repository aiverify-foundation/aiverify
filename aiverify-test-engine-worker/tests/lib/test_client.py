import pytest
from aiverify_test_engine_worker.lib.client import init_group
from aiverify_test_engine_worker.lib.contants import TASK_STREAM_NAME, TASK_GROUP_NAME
import valkey.exceptions
import os

# Mock the Valkey client and environment variables


@pytest.fixture
def mock_valkey_client(mocker):
    mock_client = mocker.patch('aiverify_test_engine_worker.lib.client.client')
    return mock_client


@pytest.fixture
def mock_env_vars(mocker):
    mocker.patch.dict(
        os.environ, {'VALKEY_HOST_ADDRESS': 'localhost', 'VALKEY_PORT': '6379'})


# Test class for init_group function
class TestInitGroup:
    def test_init_group_creates_group_successfully(self, mock_valkey_client, mock_env_vars):
        # Setup mock to not raise an exception
        mock_valkey_client.xgroup_create.return_value = None

        # Call the function
        init_group()

        # Assertions
        mock_valkey_client.xgroup_create.assert_called_once_with(
            name=TASK_STREAM_NAME,
            groupname=TASK_GROUP_NAME,
            mkstream=True
        )

    def test_init_group_handles_response_error(self, mock_valkey_client, mock_env_vars):
        # Setup mock to raise ResponseError
        mock_valkey_client.xgroup_create.side_effect = valkey.exceptions.ResponseError(
            "Group already exists")

        # Call the function
        init_group()

        # Assertions
        mock_valkey_client.xgroup_create.assert_called_once_with(
            name=TASK_STREAM_NAME,
            groupname=TASK_GROUP_NAME,
            mkstream=True
        )
