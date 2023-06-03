import signal
import subprocess
import threading
from time import sleep

import pytest
from test_engine_core.utils.validate_checks import is_empty_string

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.task_type import TaskType
from test_engine_app.enums.worker_type import WorkerType
from test_engine_app.network.redis import Redis
from test_engine_app.processing.task import Task
from test_engine_app.worker import Worker


class TestCollectionWorker:
    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        Worker._running_item = None
        Worker._logger = AppLogger()
        Worker._to_stop = False
        Worker._worker_name = ""
        Worker._worker_type = None

        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "stop"])

        # Perform tests
        yield

    def stop_processing_5s(self):
        sleep(5)
        Worker.sigint_handler(signal.SIGINT, 1)

    def throw_exeception(self):
        raise AttributeError("Raise Mockexception")

    def test_run_initializer(self):
        Worker.run_initializer()

    @pytest.mark.parametrize(
        "worker_name, worker_type, connect_pubsub_success, expected_output, expected_message",
        [
            (
                    "MyName",
                    WorkerType.SERVICE,
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    WorkerType.PROCESS,
                    True,
                    True,
                    ""
            ),
            # Invalid inputs
            (
                    None,
                    WorkerType.SERVICE,
                    True,
                    False,
                    "The system worker encountered an error while setting up: "
                    "The middleware stream connection failed to set up properly: "
                    "The inputs do not meet the validation rules"
            ),
            (
                    "None",
                    WorkerType.SERVICE,
                    True,
                    True,
                    ""
            ),
            (
                    "",
                    WorkerType.SERVICE,
                    True,
                    False,
                    "The system worker encountered an error while setting up: "
                    "The middleware stream connection failed to set up properly: "
                    "The inputs do not meet the validation rules"
            ),
            (
                    [],
                    WorkerType.SERVICE,
                    True,
                    False,
                    "The system worker encountered an error while setting up: "
                    "The middleware stream connection failed to set up properly: "
                    "The inputs do not meet the validation rules"
            ),
            (
                    {},
                    WorkerType.SERVICE,
                    True,
                    False,
                    "The system worker encountered an error while setting up: "
                    "The middleware stream connection failed to set up properly: "
                    "The inputs do not meet the validation rules"
            ),
            (
                    1234,
                    WorkerType.SERVICE,
                    True,
                    False,
                    "The system worker encountered an error while setting up: "
                    "The middleware stream connection failed to set up properly: "
                    "The inputs do not meet the validation rules"
            ),
            # Invalid WorkerType
            (
                    "MyName",
                    None,
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    "None",
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    "",
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    [],
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    {},
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    1234,
                    True,
                    True,
                    ""
            ),
        ]
    )
    def test_setup_worker_name_type(self, mocker, worker_name, worker_type,
                                    connect_pubsub_success, expected_output, expected_message):
        with mocker.patch.object(Redis, "connect_to_pubsub", return_value=connect_pubsub_success):
            assert Worker._logger.logger_instance is None
            assert Worker._logger.raw_logger_instance is None
            assert Worker._logger.log_filepath == ""
            assert Worker._logger.error_logger_instance is None
            assert Worker._logger.error_filepath == ""

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            Worker._to_stop = True
            Worker._worker_name = worker_name
            Worker._worker_type = worker_type
            is_success, error_message = Worker.setup()

            # Check response
            assert is_success is expected_output
            assert error_message == expected_message

    @pytest.mark.parametrize(
        "worker_name, worker_type, expected_output, expected_message",
        [
            (
                    "MyName",
                    WorkerType.SERVICE,
                    False,
                    ("The system worker encountered an error while setting up: The middleware stream "
                     "connection failed to set up properly: The middleware is unreachable. There was a connection "
                     "error to the redis server: Error 111 connecting to localhost:6379. Connection refused.")
            ),
            (
                    "MyName",
                    WorkerType.PROCESS,
                    False,
                    ("The system worker encountered an error while setting up: The middleware stream "
                     "connection failed to set up properly: The middleware is unreachable. There was a connection "
                     "error to the redis server: Error 111 connecting to localhost:6379. Connection refused.")
            ),
        ]
    )
    def test_setup_redis_no_server(self, worker_name, worker_type,
                                   expected_output, expected_message):
        # Set worker information
        Worker._worker_name = worker_name
        Worker._worker_type = worker_type
        Worker._to_stop = True
        is_success, error_message = Worker.setup()

        assert is_success is expected_output
        assert error_message == expected_message

    @pytest.mark.parametrize(
        "worker_name, worker_type, connect_pubsub_success, expected_output, expected_message",
        [
            (
                    "MyName",
                    WorkerType.SERVICE,
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    WorkerType.PROCESS,
                    True,
                    True,
                    ""
            ),
            (
                    "MyName",
                    WorkerType.SERVICE,
                    False,
                    True,
                    ""
            ),
            (
                    "MyName",
                    WorkerType.PROCESS,
                    False,
                    False,
                    "The system worker encountered an error while setting up: "
                    "The middleware pub/sub channels failed to set up properly"
            ),
        ]
    )
    def test_setup_redis(self, mocker, worker_name, worker_type,
                         connect_pubsub_success, expected_output, expected_message):
        with mocker.patch.object(Redis, "connect_to_pubsub", return_value=connect_pubsub_success):
            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])

            # Set worker information
            Worker._to_stop = True
            Worker._worker_name = worker_name
            Worker._worker_type = worker_type
            is_success, error_message = Worker.setup()

            assert is_success is expected_output
            assert error_message == expected_message

    def test_run_logging(self, mocker):
        with pytest.raises(SystemExit) as exit_error:
            with mocker.patch.object(signal, "pause", return_value=""):
                assert Worker._logger.log_id is None
                assert Worker._logger.logger_instance is None
                assert Worker._logger.raw_logger_instance is None
                assert Worker._logger.error_logger_instance is None
                assert Worker._logger.log_filepath == ""
                assert Worker._logger.error_filepath == ""

                # Set worker information
                Worker._to_stop = True
                Worker.run(WorkerType.SERVICE, 1)

                # Check logging
                assert is_empty_string(Worker._logger.log_id) is False
                assert Worker._logger.logger_instance is not None
                assert Worker._logger.raw_logger_instance is not None
                assert Worker._logger.error_logger_instance is not None
                assert Worker._logger.log_filepath == \
                       f"/home/ubuntu/Documents/test-engine-app/logs/{Worker._logger.log_id}.log"
                assert Worker._logger.error_filepath == \
                       f"/home/ubuntu/Documents/test-engine-app/errors/{Worker._logger.log_id}.json"

        assert exit_error.type == SystemExit
        assert exit_error.value.code == 0

    def test_run_with_exceptions(self, mocker):
        with (
            pytest.raises(SystemExit) as exit_error,
            mocker.patch.object(Redis, "get_pending_items", return_value=None),
            mocker.patch.object(signal, "pause", return_value="")
        ):
            Worker._to_stop = False
            thread = threading.Thread(target=self.stop_processing_5s, args=())
            thread.start()
            subprocess.call(["sudo", "service", "redis-server", "start"])
            Worker.run(WorkerType.SERVICE, 1)
            thread.join()

        assert exit_error.type == SystemExit
        assert exit_error.value.code == 0

    @pytest.mark.parametrize(
        "worker_type, worker_id, connect_pubsub_success",
        [
            (
                    WorkerType.SERVICE,
                    1,
                    True
            ),
            (
                    WorkerType.PROCESS,
                    2,
                    True
            ),
            (
                    WorkerType.SERVICE,
                    1,
                    False
            ),
            (
                    WorkerType.PROCESS,
                    2,
                    False
            ),
            (
                    None,
                    1,
                    True
            ),
            (
                    "None",
                    1,
                    True
            ),
            (
                    {},
                    1,
                    True
            ),
            (
                    [],
                    1,
                    True
            ),
            (
                    1234,
                    1,
                    True
            ),
            (
                    WorkerType.SERVICE,
                    None,
                    True
            ),
            (
                    WorkerType.SERVICE,
                    "None",
                    True
            ),
            (
                    WorkerType.SERVICE,
                    {},
                    True
            ),
            (
                    WorkerType.SERVICE,
                    [],
                    True
            ),
            (
                    WorkerType.SERVICE,
                    1234,
                    True
            ),
        ]
    )
    def test_run_with_no_pending_no_new_items(self, mocker, worker_type, worker_id, connect_pubsub_success):
        with (
            pytest.raises(SystemExit) as exit_error,
            mocker.patch.object(Redis, "connect_to_pubsub", return_value=connect_pubsub_success),
            mocker.patch.object(Redis, "get_new_items", return_value=[]),
            mocker.patch.object(Redis, "get_pending_items", return_value=[]),
            mocker.patch.object(signal, "pause", return_value="")
        ):
            Worker._to_stop = False
            # Perform stop processing
            thread = threading.Thread(target=self.stop_processing_5s, args=())
            thread.start()
            subprocess.call(["sudo", "service", "redis-server", "start"])
            Worker.run(worker_type, worker_id)
            thread.join()

        assert exit_error.type == SystemExit
        assert exit_error.value.code == 0

    @pytest.mark.parametrize(
        "message, expected_output",
        [
            (
                    {"data": "123456"},
                    True
            ),
            (
                    {"": "123456"},
                    False
            ),
            (
                    None,
                    False
            ),
            (
                    "None",
                    False
            ),
            (
                    {},
                    False
            ),
            (
                    [],
                    False
            ),
            (
                    "",
                    False
            ),
            (
                    1234,
                    False
            ),
        ]
    )
    def test_process_task_stop_callback_no_running_item(self, message, expected_output):
        # Perform setup for Service
        Worker._worker_name = "1234"
        Worker._worker_type = WorkerType.SERVICE
        Worker.setup()

        # Send update
        is_sent = Worker._process_task_stop_callback(message)
        assert is_sent == expected_output

        # Perform setup for Process
        Worker._worker_name = "1234"
        Worker._worker_type = WorkerType.PROCESS
        Worker.setup()

        # Send update
        is_sent = Worker._process_task_stop_callback(message)
        assert is_sent == expected_output

    @pytest.mark.parametrize(
        "message, task_id, expected_output",
        [
            (
                    {"data": "123456"},
                    "123456",
                    True
            ),
            (
                    {"data": "126"},
                    "126",
                    True
            ),
        ]
    )
    def test_process_task_stop_callback_with_running_item(self, message, task_id, expected_output):
        new_task = Task("123456", "my_argument", "folder_path", TaskType.NEW, None)
        new_task._task_arguments.id = "123456"

        subprocess.call(["sudo", "service", "redis-server", "start"])

        # Perform setup for Service
        Worker._worker_name = "1234"
        Worker._worker_type = WorkerType.SERVICE
        is_success, error_message = Worker.setup()
        assert is_success is True
        assert error_message == ""

        Worker._set_running_item(new_task)
        assert Worker._running_item == new_task
        is_sent = Worker._process_task_stop_callback(message)
        assert is_sent == expected_output

    @pytest.mark.parametrize(
        "update_id, formatted_response, send_update_return_value, expected_output",
        [
            (
                    "1234",
                    {
                        "1234": "my_response"
                    },
                    True,
                    True
            ),
            (
                    "1234",
                    {
                        "1234": "my_response"
                    },
                    False,
                    False
            ),
            # Invalid update id
            (
                    "",
                    {"response", "my_response"},
                    True,
                    False
            ),
            (
                    {},
                    {"response", "my_response"},
                    True,
                    False
            ),
            (
                    [],
                    {"response", "my_response"},
                    True,
                    False
            ),
            (
                    None,
                    {"response", "my_response"},
                    True,
                    False
            ),
            (
                    "None",
                    {"response", "my_response"},
                    True,
                    False
            ),
            # Invalid formatted response
            (
                    "1234",
                    "",
                    True,
                    False
            ),
            (
                    "1234",
                    {},
                    True,
                    False
            ),
            (
                    "1234",
                    [],
                    True,
                    False
            ),
            (
                    "1234",
                    None,
                    True,
                    False
            ),
            (
                    "1234",
                    "None",
                    True,
                    False
            ),
        ]
    )
    def test_send_update(self, mocker, update_id, formatted_response, send_update_return_value, expected_output):
        with mocker.patch.object(Redis, "send_update", return_value=send_update_return_value):
            # Start redis-server
            subprocess.call(["sudo", "service", "redis-server", "start"])

            # Perform service setup
            Worker._worker_name = "1234"
            Worker._worker_type = WorkerType.SERVICE
            Worker.setup()

            # Send update
            is_sent = Worker._send_update(update_id, formatted_response)
            assert is_sent == expected_output

            # Perform process setup
            Worker._worker_name = "1234"
            Worker._worker_type = WorkerType.PROCESS
            Worker.setup()

            # Send update
            is_sent = Worker._send_update(update_id, formatted_response)
            assert is_sent == expected_output

    @pytest.mark.parametrize(
        "message_id, send_ack_return_value, expected_output",
        [
            (
                    "1234",
                    True,
                    True
            ),
            (
                    "1234",
                    False,
                    False
            ),
            # Invalid update id
            (
                    "",
                    True,
                    False
            ),
            (
                    {},
                    True,
                    False
            ),
            (
                    [],
                    True,
                    False
            ),
            (
                    None,
                    True,
                    False
            ),
            (
                    "None",
                    True,
                    True
            ),
        ]
    )
    def test_send_acknowledgement(self, mocker, message_id, send_ack_return_value, expected_output):
        with mocker.patch.object(Redis, "send_acknowledgement", return_value=send_ack_return_value):
            # Start redis-server
            subprocess.call(["sudo", "service", "redis-server", "start"])

            # Perform setup
            Worker._worker_name = "1234"
            Worker._worker_type = WorkerType.SERVICE
            Worker.setup()

            # Send update
            is_sent = Worker._send_acknowledgement(message_id)
            assert is_sent == expected_output
