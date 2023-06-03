import pytest

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.service_response import ServiceResponse
from test_engine_app.enums.service_status import ServiceStatus
from test_engine_app.enums.service_validation_type import ServiceValidationType
from test_engine_app.processing.service_result import ServiceResult


class TestCollectionServiceResult:
    pytest.logger = AppLogger()

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        pytest.logger.generate_logger()

        # Perform tests
        yield

    @pytest.mark.parametrize(
        "logger",
        [
            pytest.logger
        ],
    )
    def test_init(self, logger):
        new_service_result = ServiceResult(logger)

        assert new_service_result.status is ServiceStatus.INIT
        assert new_service_result.result is ServiceResponse.NONE
        assert new_service_result.schema == ""
        assert new_service_result.numRows == 0
        assert new_service_result.numCols == 0
        assert new_service_result.error_messages == ""
        assert new_service_result.model_format is None
        assert new_service_result.data_format is None
        assert new_service_result.serializer_type is None
        assert new_service_result.data_type == ""
        assert new_service_result._logger == logger

    @pytest.mark.parametrize(
        "logger, expected_output",
        [
            (
                    None,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "None",
                    "The inputs do not meet the validation rules"
            ),
            (
                    "",
                    "The inputs do not meet the validation rules"
            ),
            (
                    [],
                    "The inputs do not meet the validation rules"
            ),
            (
                    {},
                    "The inputs do not meet the validation rules"
            ),
            (
                    1234,
                    "The inputs do not meet the validation rules"
            ),
        ]
    )
    def test_init_with_exception(self, logger, expected_output):
        with pytest.raises(RuntimeError) as exc_info:
            new_service_result = ServiceResult(logger)

            assert new_service_result.status is ServiceStatus.INIT
            assert new_service_result.result is ServiceResponse.NONE
            assert new_service_result.schema == ""
            assert new_service_result.numRows == 0
            assert new_service_result.numCols == 0
            assert new_service_result.error_messages == ""
            assert new_service_result.model_format is None
            assert new_service_result.data_format is None
            assert new_service_result.serializer_type is None
            assert new_service_result.data_type == ""
            assert new_service_result._logger == logger

        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "results, validation_type, expected_results_list",
        [
            (
                    {
                        "schema": "myschema",
                        "rows": 2,
                        "cols": 10,
                        "serializer_type": "mySerializerType",
                        "data_format": "myDataFormat"
                    },
                    ServiceValidationType.VALIDATE_DATASET,
                    [
                        "myschema",
                        2,
                        10,
                        "mySerializerType",
                        "myDataFormat"
                    ]
            ),
            (
                    {
                        "model_format": "mymodelformat",
                        "serializer_type": "mySerializerType"
                    },
                    ServiceValidationType.VALIDATE_MODEL,
                    [
                        "mymodelformat",
                        "mySerializerType"
                    ]
            )
        ]
    )
    def test_set_results(self, results, validation_type, expected_results_list):
        new_service_result = ServiceResult(pytest.logger)
        new_service_result.set_results(results, validation_type)
        if validation_type is ServiceValidationType.VALIDATE_DATASET:
            assert new_service_result.schema == expected_results_list[0]
            assert new_service_result.numRows == expected_results_list[1]
            assert new_service_result.numCols == expected_results_list[2]
            assert new_service_result.serializer_type == expected_results_list[3]
            assert new_service_result.data_format == expected_results_list[4]
        else:
            assert new_service_result.model_format == expected_results_list[0]
            assert new_service_result.serializer_type == expected_results_list[1]

    @pytest.mark.parametrize(
        "results, validation_type, expected_output",
        [
            (
                    None,
                    ServiceValidationType.VALIDATE_DATASET,
                    "The current service received an invalid input: None (<class 'NoneType'>), "
                    "ServiceValidationType.VALIDATE_DATASET (<enum 'ServiceValidationType'>)"
            ),
            (
                    "None",
                    ServiceValidationType.VALIDATE_DATASET,
                    "The current service received an invalid input: None (<class 'str'>), "
                    "ServiceValidationType.VALIDATE_DATASET (<enum 'ServiceValidationType'>)"
            ),
            (
                    [],
                    ServiceValidationType.VALIDATE_DATASET,
                    "The current service received an invalid input: [] (<class 'list'>), "
                    "ServiceValidationType.VALIDATE_DATASET (<enum 'ServiceValidationType'>)"
            ),
            (
                    1234,
                    ServiceValidationType.VALIDATE_DATASET,
                    "The current service received an invalid input: 1234 (<class 'int'>), "
                    "ServiceValidationType.VALIDATE_DATASET (<enum 'ServiceValidationType'>)"
            ),
        ]
    )
    def test_set_results_invalid_inputs(self, results, validation_type, expected_output):
        with pytest.raises(RuntimeError) as exc_info:
            new_service_result = ServiceResult(pytest.logger)
            new_service_result.set_results(results, validation_type)

        assert str(exc_info.value) == expected_output

    def test_set_success(self):
        new_service_result = ServiceResult(pytest.logger)

        assert new_service_result.error_messages == ""
        assert new_service_result.result is ServiceResponse.NONE
        assert new_service_result.status is ServiceStatus.INIT

        new_service_result.set_success()

        assert new_service_result.error_messages == ""
        assert new_service_result.result == ServiceResponse.VALID
        assert new_service_result.status is ServiceStatus.DONE

    def test_set_failure(self):
        new_service_result = ServiceResult(pytest.logger)

        assert new_service_result.error_messages == ""
        assert new_service_result.result is ServiceResponse.NONE
        assert new_service_result.status is ServiceStatus.INIT

        AppLogger.add_error_to_log(pytest.logger, "SYS", "FSYS1234", "Description", "Critical", "service_result.py")
        new_service_result.set_failure()

        assert new_service_result.error_messages == \
               '[{"category": "SYSTEM_ERROR", "code": "FSYS1234", "description": "Description", ' \
               '"severity": "critical", "component": "service_result.py"}]'
        assert new_service_result.result is ServiceResponse.NONE
        assert new_service_result.status is ServiceStatus.ERROR

    def test_set_invalid(self):
        new_service_result = ServiceResult(pytest.logger)

        assert new_service_result.error_messages == ""
        assert new_service_result.result is ServiceResponse.NONE
        assert new_service_result.status is ServiceStatus.INIT

        # Add an error
        AppLogger.add_error_to_log(pytest.logger, "SYS", "FSYS1234", "Description", "Critical", "service_result.py")
        new_service_result.set_invalid()

        assert new_service_result.error_messages == \
               '[{"category": "SYSTEM_ERROR", "code": "FSYS1234", "description": "Description", ' \
               '"severity": "critical", "component": "service_result.py"}]'
        assert new_service_result.result is ServiceResponse.INVALID
        assert new_service_result.status is ServiceStatus.DONE

    @pytest.mark.parametrize(
        "service_status, expected_service_status",
        [
            (
                    ServiceStatus.INIT,
                    ServiceStatus.INIT
            ),
            (
                    ServiceStatus.DONE,
                    ServiceStatus.DONE
            ),
            (
                    ServiceStatus.ERROR,
                    ServiceStatus.ERROR
            ),
            (
                    ServiceStatus.RUNNING,
                    ServiceStatus.RUNNING
            ),
        ],
    )
    def test_set_status(self, service_status, expected_service_status):
        new_service_result = ServiceResult(pytest.logger)

        assert new_service_result.status == ServiceStatus.INIT
        new_service_result.set_status(service_status)
        assert new_service_result.status == expected_service_status

    @pytest.mark.parametrize(
        "service_status, expected_service_status, expected_error_message",
        [
            (
                    None,
                    ServiceStatus.INIT,
                    "The current service received an invalid input: None (<class 'NoneType'>)"
            ),
            (
                    "None",
                    ServiceStatus.INIT,
                    "The current service received an invalid input: None (<class 'str'>)"
            ),
            (
                    [],
                    ServiceStatus.INIT,
                    "The current service received an invalid input: [] (<class 'list'>)"
            ),
            (
                    {},
                    ServiceStatus.INIT,
                    "The current service received an invalid input: {} (<class 'dict'>)"
            ),
            (
                    "",
                    ServiceStatus.INIT,
                    "The current service received an invalid input:  (<class 'str'>)"
            ),
            (
                    1234,
                    ServiceStatus.INIT,
                    "The current service received an invalid input: 1234 (<class 'int'>)"
            ),
        ],
    )
    def test_set_status_with_exception(self, service_status, expected_service_status, expected_error_message):
        with pytest.raises(RuntimeError) as exc_info:
            new_service_result = ServiceResult(pytest.logger)

            assert new_service_result.status == ServiceStatus.INIT
            new_service_result.set_status(service_status)
            assert new_service_result.status == expected_service_status

        assert str(exc_info.value) == expected_error_message
