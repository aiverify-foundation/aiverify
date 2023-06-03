import numpy as np
import pytest
from numpy import float64, int32, int64, float32
from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.plugins.enums.model_plugin_type import ModelPluginType
from test_engine_core.plugins.enums.serializer_plugin_type import SerializerPluginType

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.service_validation_type import ServiceValidationType
from test_engine_app.processing.service_result import ServiceResult
from test_engine_app.processing.stream_formatter import StreamFormatter
from test_engine_app.processing.task_result import TaskResult


class TestCollectionStreamFormatter:
    pytest.logger = AppLogger()
    pytest.logger.generate_logger()

    # Task Results
    pytest.task_result_pending = TaskResult(pytest.logger)
    pytest.task_result_success = TaskResult(pytest.logger)
    pytest.task_result_error = TaskResult(pytest.logger)
    pytest.task_result_cancelled = TaskResult(pytest.logger)
    pytest.task_result_success.set_success()
    pytest.task_result_error.set_failure()
    pytest.task_result_cancelled.set_cancelled()

    # Service Results
    pytest.service_result_pending = ServiceResult(pytest.logger)
    pytest.service_result_success = ServiceResult(pytest.logger)
    pytest.service_result_error = ServiceResult(pytest.logger)
    pytest.service_result_success.set_success()
    pytest.service_result_error.set_failure()

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        pytest.logger.generate_logger()

        # Perform tests
        yield

    @pytest.mark.parametrize(
        "result, log_filepath, expected_output",
        [
            # Task Result Pending
            (
                    pytest.task_result_pending,
                    "pending_logfile",
                    {
                        "type": "TaskResponse",
                        "status": "Pending",
                        "elapsedTime": 0,
                        "startTime": pytest.task_result_pending.start_time.isoformat(),
                        "output": '""',
                        "logFile": "pending_logfile",
                        "taskProgress": 0,
                    },
            ),
            (
                    pytest.task_result_pending,
                    "None",
                    {
                        "type": "TaskResponse",
                        "status": "Pending",
                        "elapsedTime": 0,
                        "startTime": pytest.task_result_pending.start_time.isoformat(),
                        "output": '""',
                        "logFile": "None",
                        "taskProgress": 0,
                    }
            ),
        ]
    )
    def test_format_task_response_pending(self, result, log_filepath, expected_output):
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, log_filepath, expected_output",
        [
            # Task Result Success
            (
                    pytest.task_result_success,
                    "success_logfile",
                    [
                        # value, array, dictionary
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": 1}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": 1.5}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [1, 2, 5, 10]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [1.5, 2.0, 5.0, 10.0]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": {"id_1": [1.5, 2.0, 5.0, 10.0]}}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": {"id_1": 1.5}}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        # np.array
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [1, 2, 5, 10]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [1.5, 2.0, 5.0, 10.0]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        # ndarray (int)
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [[1, 0], [2, 0], [3, 0]]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [[1, 2], [3, 4], [5, 6]]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [[1, 2], [3, 4], [5, 6]]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        # ndarray (float)
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [[0.0, 1.875], [0.0, 2.0], [0.0, 2.125]]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        # ndarray (specials)
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            "output": '{"results": [[1.7976931348623157e+308], [-1.7976931348623157e+308], [0.0]]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            'output': '{"results": [1.7976931348623157e+308, -1.7976931348623157e+308, 0.0]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                        {
                            "type": "TaskResponse",
                            "status": "Success",
                            "elapsedTime": 0,
                            "startTime": pytest.task_result_success.start_time.isoformat(),
                            'output': '{"results": [2.0, 20.0]}',
                            "logFile": "success_logfile",
                            "taskProgress": 100,
                        },
                    ]
            ),
        ]
    )
    def test_format_task_response_success(self, result, log_filepath, expected_output):
        # Test value in dictionary
        result.set_results({"results": 1})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[0]

        result.set_results({"results": 1.5})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[1]

        # Test list in dictionary
        result.set_results({"results": [1, 2, 5, 10]})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[2]

        result.set_results({"results": [1.5, 2.0, 5.0, 10.0]})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[3]

        # Test dictionary in dictionary
        result.set_results({"results": {"id_1": [1.5, 2.0, 5.0, 10.0]}})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[4]

        # Test single value in dictionary
        result.set_results({"results": {"id_1": 1.5}})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[5]

        # Test np.array in dictionary
        result.set_results({"results": np.array([1, 2, 5, 10])})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[6]

        result.set_results({"results": np.array([1.5, 2.0, 5.0, 10.0])})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[7]

        # Test np.ndarray (int)
        result.set_results({"results": np.ndarray((3, 2), buffer=np.array([1, 2, 3, 4, 5, 6]), dtype=int32)})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[8]

        result.set_results({"results": np.ndarray((3, 2), buffer=np.array([1, 2, 3, 4, 5, 6]), dtype=int64)})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[9]

        result.set_results({"results": np.ndarray((3, 2), buffer=np.array([1, 2, 3, 4, 5, 6]), dtype=int)})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[10]

        # Test np.ndarray (float)
        result.set_results(
            {"results": np.ndarray((3, 2), buffer=np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]), dtype=float32)})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[11]

        result.set_results(
            {"results": np.ndarray((3, 2), buffer=np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]), dtype=float64)})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[12]

        result.set_results(
            {"results": np.ndarray((3, 2), buffer=np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]), dtype=float)})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[13]

        # Test np.ndarray (specials)
        result.set_results(
            {"results": np.ndarray((3, 1), buffer=np.array([np.inf, -np.inf, np.nan]))})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[14]

        result.set_results(
            {"results": np.array([np.inf, -np.inf, np.nan])})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[15]

        result.set_results(
            {"results": np.array([np.float64(2.0), np.int64(20)])})
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output[16]

    def test_format_task_response_error(self):
        my_logger = AppLogger()
        my_logger.generate_logger()
        my_task_result = TaskResult(my_logger)
        AppLogger.add_error_to_log(my_logger, "SYS", "FSYS1234", "Description", "Critical",
                                   "task_result.py")
        my_task_result.set_failure()
        output = StreamFormatter.format_task_response(my_task_result, "error_logfile")
        assert output == {
            "type": "TaskResponse",
            "status": "Error",
            "elapsedTime": 0,
            "startTime": my_task_result.start_time.isoformat(),
            "output": '',
            "errorMessages": '[{"category": "SYSTEM_ERROR", "code": "FSYS1234", '
                             '"description": "Description", "severity": "critical", '
                             '"component": "task_result.py"}]',
            "logFile": "error_logfile",
            "taskProgress": 100,
        }

    @pytest.mark.parametrize(
        "result, log_filepath, expected_output",
        [
            # Task Result cancelled
            (
                    pytest.task_result_cancelled,
                    "cancelled_logfile",
                    {
                        "type": "TaskResponse",
                        "status": "Cancelled",
                        "elapsedTime": 0,
                        "startTime": pytest.task_result_cancelled.start_time.isoformat(),
                        "output": '""',
                        "logFile": "cancelled_logfile",
                        "taskProgress": 100,
                    }
            ),
        ]
    )
    def test_format_task_response_cancelled(self, result, log_filepath, expected_output):
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, log_filepath, expected_output",
        [
            (
                    None,
                    "pending_logfile",
                    {}
            ),
            (
                    "None",
                    "pending_logfile",
                    {}
            ),
            (
                    "",
                    "pending_logfile",
                    {}
            ),
            (
                    [],
                    "pending_logfile",
                    {}
            ),
            (
                    {},
                    "pending_logfile",
                    {}
            ),
            (
                    1234,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.task_result_pending,
                    None,
                    {}
            ),
            (
                    pytest.task_result_pending,
                    "",
                    {}
            ),
            (
                    pytest.task_result_pending,
                    [],
                    {}
            ),
            (
                    pytest.task_result_pending,
                    {},
                    {}
            ),
            (
                    pytest.task_result_pending,
                    1234,
                    {}
            ),
        ]
    )
    def test_format_task_response_invalid_input(self, result, log_filepath, expected_output):
        output = StreamFormatter.format_task_response(result, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, validation_type, log_filepath, expected_output",
        [
            # Service Result Pending
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "init",
                        "validationResult": "none",
                        "errorMessages": "",
                        "logFile": "pending_logfile"
                    },
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_DATASET,
                    "None",
                    {
                        "type": "ServiceResponse",
                        "status": "init",
                        "validationResult": "none",
                        "errorMessages": "",
                        "logFile": "None"
                    },
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "init",
                        "validationResult": "none",
                        "errorMessages": "",
                        "logFile": "pending_logfile"
                    },
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_MODEL,
                    "None",
                    {
                        "type": "ServiceResponse",
                        "status": "init",
                        "validationResult": "none",
                        "errorMessages": "",
                        "logFile": "None"
                    },
            ),
        ]
    )
    def test_format_service_response_pending(self, result, validation_type, log_filepath, expected_output):
        output = StreamFormatter.format_service_response(result, validation_type, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, validation_type, serializer_type, data_type, log_filepath, expected_output",
        [
            # DataPluginType
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "pickle",
                        "dataFormat": "delimiter",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.IMAGE,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "pickle",
                        "dataFormat": "image",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.PANDAS,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "pickle",
                        "dataFormat": "pandas",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "pending_logfile"
                    }
            ),
            # SerializerPluginType
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.IMAGE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "image",
                        "dataFormat": "delimiter",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.DELIMITER,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "delimiter",
                        "dataFormat": "delimiter",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.JOBLIB,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "joblib",
                        "dataFormat": "delimiter",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.TENSORFLOW,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "tensorflow",
                        "dataFormat": "delimiter",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "pending_logfile"
                    }
            )
        ]
    )
    def test_format_service_response_success_data(self, result, validation_type, serializer_type, data_type,
                                                  log_filepath, expected_output):
        result.serializer_type = serializer_type
        result.data_format = data_type
        output = StreamFormatter.format_service_response(result, validation_type, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, validation_type, serializer_type, data_type, log_filepath, expected_output",
        [
            # ServiceResult
            (
                    None,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    "None",
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    [],
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    {},
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    1234,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            # ServiceValidationType
            (
                    pytest.service_result_success,
                    None,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    "None",
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    "",
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    [],
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    {},
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    1234,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "pending_logfile",
                    {}
            ),
            # SerializerPluginType
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    None,
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "None",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "tensorflow",
                        "dataFormat": "delimiter",
                        "columns": '""',
                        "numRows": 0,
                        "numCols": 0,
                        "logFile": "None"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    "",
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    [],
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    {},
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_DATASET,
                    SerializerPluginType.PICKLE,
                    DataPluginType.DELIMITER,
                    1234,
                    {}
            ),
        ]
    )
    def test_format_service_response_success_data_invalid_input(self, result, validation_type, serializer_type,
                                                                data_type, log_filepath, expected_output):
        output = StreamFormatter.format_service_response(result, validation_type, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, validation_type, serializer_type, model_type, log_filepath, expected_output",
        [
            # ModelPluginType
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "pickle",
                        "modelFormat": "tensorflow",
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.XGBOOST,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "pickle",
                        "modelFormat": "xgboost",
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.LIGHTGBM,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "pickle",
                        "modelFormat": "lightgbm",
                        "logFile": "pending_logfile"
                    }
            ),
            # SerializerPluginType
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.IMAGE,
                    ModelPluginType.LIGHTGBM,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "image",
                        "modelFormat": "lightgbm",
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.DELIMITER,
                    ModelPluginType.LIGHTGBM,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "delimiter",
                        "modelFormat": "lightgbm",
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.JOBLIB,
                    ModelPluginType.LIGHTGBM,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "joblib",
                        "modelFormat": "lightgbm",
                        "logFile": "pending_logfile"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.TENSORFLOW,
                    ModelPluginType.LIGHTGBM,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "tensorflow",
                        "modelFormat": "lightgbm",
                        "logFile": "pending_logfile"
                    }
            )
        ]
    )
    def test_format_service_response_success_model(self, result, validation_type, serializer_type, model_type,
                                                   log_filepath, expected_output):
        result.serializer_type = serializer_type
        result.model_format = model_type
        output = StreamFormatter.format_service_response(result, validation_type, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, validation_type, serializer_type, model_type, log_filepath, expected_output",
        [
            # ServiceResult
            (
                    None,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    "None",
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    [],
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    {},
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    1234,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            # Validation Type
            (
                    pytest.service_result_success,
                    None,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    "None",
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    "",
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    [],
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    {},
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_success,
                    1234,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "pending_logfile",
                    {}
            ),
            # Log Filepath
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    None,
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "None",
                    {
                        "type": "ServiceResponse",
                        "status": "done",
                        "validationResult": "valid",
                        "serializedBy": "tensorflow",
                        "modelFormat": "lightgbm",
                        "logFile": "None"
                    }
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    "",
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    [],
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    {},
                    {}
            ),
            (
                    pytest.service_result_success,
                    ServiceValidationType.VALIDATE_MODEL,
                    SerializerPluginType.PICKLE,
                    ModelPluginType.TENSORFLOW,
                    1234,
                    {}
            ),
        ]
    )
    def test_format_service_response_success_model_invalid_input(self, result, validation_type, serializer_type,
                                                                 model_type,
                                                                 log_filepath, expected_output):
        output = StreamFormatter.format_service_response(result, validation_type, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, validation_type, log_filepath, expected_output",
        [
            # Service Result error
            (
                    pytest.service_result_error,
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "error",
                        "validationResult": "none",
                        "errorMessages": "[]",
                        "logFile": "pending_logfile"
                    },
            ),
            (
                    pytest.service_result_error,
                    ServiceValidationType.VALIDATE_DATASET,
                    "None",
                    {
                        "type": "ServiceResponse",
                        "status": "error",
                        "validationResult": "none",
                        "errorMessages": "[]",
                        "logFile": "None"
                    },
            ),
            (
                    pytest.service_result_error,
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {
                        "type": "ServiceResponse",
                        "status": "error",
                        "validationResult": "none",
                        "errorMessages": "[]",
                        "logFile": "pending_logfile"
                    },
            ),
            (
                    pytest.service_result_error,
                    ServiceValidationType.VALIDATE_MODEL,
                    "None",
                    {
                        "type": "ServiceResponse",
                        "status": "error",
                        "validationResult": "none",
                        "errorMessages": "[]",
                        "logFile": "None"
                    },
            ),
        ]
    )
    def test_format_service_response_error(self, result, validation_type, log_filepath, expected_output):
        output = StreamFormatter.format_service_response(result, validation_type, log_filepath)
        assert output == expected_output

    @pytest.mark.parametrize(
        "result, validation_type, log_filepath, expected_output",
        [
            (
                    None,
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {}
            ),
            (
                    "None",
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {}
            ),
            (
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {}
            ),
            (
                    [],
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {}
            ),
            (
                    {},
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {}
            ),
            (
                    1234,
                    ServiceValidationType.VALIDATE_DATASET,
                    "pending_logfile",
                    {}
            ),
            (
                    None,
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {}
            ),
            (
                    "None",
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {}
            ),
            (
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {}
            ),
            (
                    [],
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {}
            ),
            (
                    {},
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {}
            ),
            (
                    1234,
                    ServiceValidationType.VALIDATE_MODEL,
                    "pending_logfile",
                    {}
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_DATASET,
                    None,
                    {}
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_DATASET,
                    "",
                    {}
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_DATASET,
                    [],
                    {}
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_DATASET,
                    {},
                    {}
            ),
            (
                    pytest.service_result_pending,
                    ServiceValidationType.VALIDATE_DATASET,
                    1234,
                    {}
            ),
        ]
    )
    def test_format_service_response_invalid_input(self, result, validation_type, log_filepath, expected_output):
        output = StreamFormatter.format_service_response(result, validation_type, log_filepath)
        assert output == expected_output
