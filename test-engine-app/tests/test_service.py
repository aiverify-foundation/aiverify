import pytest

from test_engine_app.enums.service_type import ServiceType
from test_engine_app.processing.service import Service
from test_engine_app.processing.service_argument import ServiceArgument
from test_engine_app.processing.service_processing import ServiceProcessing


def callback_method(service_id, message, logger):
    pytest.callback_message = message


class TestCollectionService:
    pytest.callback_method = callback_method
    pytest.callback_message = ""

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb, expected_message_arguments",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
            (
                    "12345",
                    {
                        "validateDataset": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                           '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
            (
                    "12345",
                    {
                        "validateDataset": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                           '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    "None",
                    ServiceType.NEW,
                    pytest.callback_method,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    "None",
                    ServiceType.PENDING,
                    pytest.callback_method,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    None,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    None,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training1.sav"}'
            ),
        ]
    )
    def test_init(self, message_id, message_arguments, validation_schemas, service_type, service_update_cb,
                  expected_message_arguments):
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        assert my_service._message_id == message_id
        assert my_service._message_arguments == expected_message_arguments
        assert my_service._service_type == service_type
        assert my_service._service_update_callback == service_update_cb
        assert my_service._logger is not None

        # Service arguments
        assert my_service._service_arguments is not None
        assert my_service._service_results is not None
        assert my_service._service_processing is not None

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb, expected_output",
        [
            # message id
            (
                    "1234",
                    {
                        "validateSpecial": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                           '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The message arguments inputs do not meet the validation rules"
            ),
            (
                    "",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    None,
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    {},
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    [],
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    None,
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            # message arguments
            (
                    "12345",
                    "",
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    [],
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {},
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    1234,
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            # validation schema folder
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    None,
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    {},
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    [],
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    1234,
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    "",
                    ServiceType.NEW,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            # service type
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    None,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    "None",
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    "",
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    {},
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    [],
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    1234,
                    pytest.callback_method,
                    "The inputs do not meet the validation rules"
            ),
            # service update callback
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    "None",
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    "",
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    [],
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    {},
                    "The inputs do not meet the validation rules"
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    1234,
                    "The inputs do not meet the validation rules"
            ),
        ]
    )
    def test_init_with_invalid_inputs(self, message_id, message_arguments, validation_schemas, service_type,
                                      service_update_cb, expected_output):
        with pytest.raises(RuntimeError) as exc_info:
            my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_cancel(self, message_id, message_arguments, validation_schemas, service_type, service_update_cb):
        with pytest.raises(NotImplementedError) as exc_info:
            my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
            my_service.process()
            my_service.cancel()
        assert str(exc_info.value) == ""

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_cancel_no_process(self, message_id, message_arguments, validation_schemas,
                               service_type, service_update_cb):
        with pytest.raises(NotImplementedError) as exc_info:
            my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
            my_service.cancel()
        assert str(exc_info.value) == ""

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_cleanup(self, message_id, message_arguments, validation_schemas, service_type, service_update_cb):
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        my_service.process()

        assert my_service._logger.logger_instance is not None
        my_service.cleanup()
        assert my_service._logger.logger_instance is None

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_cleanup_no_logger(self, message_id, message_arguments, validation_schemas,
                               service_type, service_update_cb):
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)

        assert my_service._logger.logger_instance is None
        my_service.cleanup()
        assert my_service._logger.logger_instance is None

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_get_formatted_results(self, message_id, message_arguments, validation_schemas, service_type,
                                   service_update_cb):
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        my_service.process()
        assert my_service.get_formatted_results() == \
               {
                   'type': 'ServiceResponse',
                   'status': 'error',
                   'validationResult': 'none',
                   'errorMessages': '[{"category": "SYSTEM_ERROR", "code": "FSYSx00138", '
                                    '"description": "There was an error parsing the provided service arguments: '
                                    'The inputs do not meet the validation schema rules for '
                                    'service:646d77460da1d597e3ca980d", "severity": "warning", '
                                    '"component": "service.py"}]',
                   'logFile': str(my_service._logger.log_filepath),
               }

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_get_formatted_results_no_process(self, message_id, message_arguments, validation_schemas, service_type,
                                              service_update_cb):
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        assert my_service.get_formatted_results() == {}

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_get_id(self, message_id, message_arguments, validation_schemas, service_type, service_update_cb):
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        my_service.process()
        assert my_service.get_id() == "service:646d77460da1d597e3ca980d"

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method
            ),
        ]
    )
    def test_get_id_no_process(self, message_id, message_arguments, validation_schemas, service_type,
                               service_update_cb):
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        assert my_service.get_id() is None

    @pytest.mark.parametrize(
        "mock_success, mock_error_message, "
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb, "
        "is_success, expected_error_message",
        [
            (
                    False,
                    "Some Mocking Error",
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    False,
                    "Some Mocking Error"
            ),
            (
                    False,
                    "Some Mocking Error",
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method,
                    False,
                    "Some Mocking Error"
            ),
            (
                    True,
                    "",
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    True,
                    ""
            ),
            (
                    True,
                    "",
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.PENDING,
                    pytest.callback_method,
                    True,
                    ""
            ),
        ]
    )
    def test_process(self, mocker, mock_success, mock_error_message, message_id, message_arguments,
                     validation_schemas, service_type, service_update_cb, is_success, expected_error_message):
        with (
            mocker.patch.object(ServiceArgument, "parse", return_value=(mock_success, mock_error_message)),
            mocker.patch.object(ServiceProcessing, "process_pending_service",
                                return_value=(mock_success, mock_error_message)),
            mocker.patch.object(ServiceProcessing, "process_new_service",
                                return_value=(mock_success, mock_error_message))
        ):
            my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
            is_service_success, service_error_message = my_service.process()
            assert is_service_success == is_success
            assert service_error_message == expected_error_message

    @pytest.mark.parametrize(
        "mock_success, mock_error_message, message_id, message_arguments, validation_schemas, "
        "service_type, service_update_cb, has_output",
        [
            (
                    True,
                    "",
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    True
            ),
            (
                    True,
                    "",
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    None,
                    False
            ),
        ]
    )
    def test_send_service_update(self, mocker, mock_success, mock_error_message, message_id, message_arguments,
                                 validation_schemas, service_type, service_update_cb, has_output):
        with (
            mocker.patch.object(ServiceArgument, "parse", return_value=(mock_success, mock_error_message)),
            mocker.patch.object(ServiceProcessing, "process_pending_service",
                                return_value=(mock_success, mock_error_message)),
            mocker.patch.object(ServiceProcessing, "process_new_service",
                                return_value=(mock_success, mock_error_message))
        ):
            pytest.callback_message = ""
            my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
            my_service.process()
            my_service._send_service_update()
            if has_output:
                assert pytest.callback_message == {
                    'type': 'ServiceResponse',
                    'status': 'init',
                    'validationResult': 'none',
                    'errorMessages': '',
                    'logFile': str(my_service._logger.log_filepath),
                }
            else:
                assert pytest.callback_message == ""

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, service_type, service_update_cb, has_output",
        [
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    pytest.callback_method,
                    True
            ),
            (
                    "12345",
                    {
                        "validateModel": '{"serviceId":"service:646d77460da1d597e3ca980d",'
                                         '"filePath":"training1.sav"}'
                    },
                    'test_engine_app/validation_schemas',
                    ServiceType.NEW,
                    None,
                    False
            ),
        ]
    )
    def test_send_service_update_no_process(self, message_id, message_arguments, validation_schemas, service_type,
                                            service_update_cb, has_output):
        pytest.callback_message = ""
        my_service = Service(message_id, message_arguments, validation_schemas, service_type, service_update_cb)
        my_service._send_service_update()
        if has_output:
            assert pytest.callback_message == {}
        else:
            assert pytest.callback_message == ""
