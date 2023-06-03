import pytest

from test_engine_app.enums.service_validation_type import ServiceValidationType
from test_engine_app.processing.service_argument import ServiceArgument
from test_engine_app.processing.stream_validation import StreamValidation


class TestCollectionServiceArgument:

    @pytest.mark.parametrize(
        "validation_schema, validation_type, expected_validation_file",
        [
            (
                    'test_engine_app/validation_schemas',
                    ServiceValidationType.VALIDATE_DATASET,
                    'test_engine_app/validation_schemas/test_engine_validate_dataset_schema.json',

            ),
            (
                    'test_engine_app/validation_schemas',
                    ServiceValidationType.VALIDATE_MODEL,
                    'test_engine_app/validation_schemas/test_engine_validate_model_schema.json',
            ),
            (
                    'None',
                    ServiceValidationType.VALIDATE_DATASET,
                    'None/test_engine_validate_dataset_schema.json',
            ),
        ]
    )
    def test_init(self, validation_schema, validation_type, expected_validation_file):
        new_argument = ServiceArgument(validation_schema, validation_type)
        assert new_argument.id is None
        assert new_argument.model_mode is None
        assert new_argument.model_path is None
        assert new_argument.api_schema == {}
        assert new_argument.api_config == {}
        assert new_argument.data_path is None
        assert new_argument._validation_type is validation_type
        assert new_argument._validation_schema is None
        assert new_argument._validation_schema_file == expected_validation_file

    @pytest.mark.parametrize(
        "validation_schema, validation_type, expected_output",
        [
            (
                    None,
                    ServiceValidationType.VALIDATE_DATASET,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    "The inputs do not meet the validation rules"
            ),
            (
                    {},
                    ServiceValidationType.VALIDATE_DATASET,
                    "The inputs do not meet the validation rules"
            ),
            (
                    [],
                    ServiceValidationType.VALIDATE_DATASET,
                    "The inputs do not meet the validation rules"
            ),
            (
                    1234,
                    ServiceValidationType.VALIDATE_DATASET,
                    "The inputs do not meet the validation rules"
            ),
            (
                    'test_engine_app/validation_schemas',
                    None,
                    "The inputs do not meet the validation rules"
            ),
            (
                    'test_engine_app/validation_schemas',
                    "",
                    "The inputs do not meet the validation rules"
            ),
            (
                    'test_engine_app/validation_schemas',
                    {},
                    "The inputs do not meet the validation rules"
            ),
            (
                    'test_engine_app/validation_schemas',
                    [],
                    "The inputs do not meet the validation rules"
            ),
            (
                    'test_engine_app/validation_schemas',
                    1234,
                    "The inputs do not meet the validation rules"
            ),
        ]
    )
    def test_init_invalid_inputs(self, validation_schema, validation_type, expected_output):
        with pytest.raises(RuntimeError) as exc_info:
            new_argument = ServiceArgument(validation_schema, validation_type)
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "mock_error_count, mock_error_message, validation_type, args, expected_output, expected_error_message",
        [
            # Dataset
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training_1.sav"}',
                    True,
                    ""
            ),
            (
                    1,
                    "MockMessage",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training_1.sav"}',
                    False,
                    "MockMessage"
            ),
            # Model/Unknown
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"unknown",'
                    '"filePath":"random_sequential.sav"}',
                    False,
                    "The inputs do not meet the validation schema rules for service:646d77760da1d597e3ca981d"
            ),
            # Model/Upload
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"upload",'
                    '"filePath":"random_sequential.sav"}',
                    True,
                    ""
            ),
            (
                    1,
                    "MockMessage",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"upload",'
                    '"filePath":"random_sequential.sav"}',
                    False,
                    "MockMessage"
            ),
            # Model/Api
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"api",'
                    '"apiSchema":"",'
                    '"apiConfig":'
                    '{"authentication":"","headers":"","parameters":"","requestBody":"","responseBody":""}}',
                    True,
                    ""
            ),
            (
                    1,
                    "MockMessage",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"api",'
                    '"apiSchema":"",'
                    '"apiConfig":'
                    '{"authentication":"","headers":"","parameters":"","requestBody":"","responseBody":""}}',
                    False,
                    "MockMessage"
            ),
            # No / Empty service id
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"filePath":"training_1.sav"}',
                    False,
                    "The inputs do not meet the validation schema rules for None"
            ),
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"serviceId":"",'
                    '"filePath":"training_1.sav"}',
                    True,
                    ""
            ),
            # No / Empty filepath
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"serviceId":"service:646d77460da1d597e3ca980d"}',
                    False,
                    "The inputs do not meet the validation schema rules for service:646d77460da1d597e3ca980d"
            ),
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":""}',
                    True,
                    ""
            ),
            # No / Empty mode
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"filePath":"random_sequential.sav"}',
                    False,
                    "The inputs do not meet the validation schema rules for service:646d77760da1d597e3ca981d"
            ),
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"",'
                    '"filePath":"random_sequential.sav"}',
                    False,
                    "The inputs do not meet the validation schema rules for service:646d77760da1d597e3ca981d"
            ),
            # No / Empty filepath
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"upload"}',
                    False,
                    "The inputs do not meet the validation schema rules for service:646d77760da1d597e3ca981d"
            ),
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"upload",'
                    '"filePath":""}',
                    True,
                    ""
            ),
            # No apiSchema
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"api",'
                    '"apiConfig":'
                    '{"authentication":"","headers":"","parameters":"","requestBody":"","responseBody":""}}',
                    False,
                    "The inputs do not meet the validation schema rules for service:646d77760da1d597e3ca981d"
            ),
            # No apiConfig
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"api",'
                    '"apiSchema":""}',
                    False,
                    "The inputs do not meet the validation schema rules for service:646d77760da1d597e3ca981d"
            ),
        ]
    )
    def test_parse(self, mocker, mock_error_count, mock_error_message, validation_type, args, expected_output, expected_error_message):
        with (
            mocker.patch.object(ServiceArgument, "validate", return_value=(mock_error_count, mock_error_message))
        ):
            new_argument = ServiceArgument('test_engine_app/validation_schemas', validation_type)
            is_success, error_message = new_argument.parse(args)
            assert is_success == expected_output
            assert error_message == expected_error_message

    @pytest.mark.parametrize(
        "validation_type, args, expected_output, expected_error_message",
        [
            # Validate Data
            (
                    ServiceValidationType.VALIDATE_DATASET,
                    None,
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_DATASET,
                    "None",
                    False,
                    "Expecting value: line 1 column 1 (char 0)"
            ),
            (
                    ServiceValidationType.VALIDATE_DATASET,
                    [],
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_DATASET,
                    {},
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_DATASET,
                    "",
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_DATASET,
                    1234,
                    False,
                    "The inputs do not meet the validation rules"
            ),
            # Validate Model
            (
                    ServiceValidationType.VALIDATE_MODEL,
                    None,
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_MODEL,
                    "None",
                    False,
                    "Expecting value: line 1 column 1 (char 0)"
            ),
            (
                    ServiceValidationType.VALIDATE_MODEL,
                    [],
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_MODEL,
                    {},
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_MODEL,
                    "",
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    ServiceValidationType.VALIDATE_MODEL,
                    1234,
                    False,
                    "The inputs do not meet the validation rules"
            ),
        ]
    )
    def test_parse_exception(self, validation_type, args, expected_output, expected_error_message):
        new_argument = ServiceArgument('test_engine_app/validation_schemas', validation_type)
        is_success, error_message = new_argument.parse(args)
        assert is_success == expected_output
        assert error_message == expected_error_message

    @pytest.mark.parametrize(
        "mock_error_count, mock_error_message, validation_type, args, expected_error_count, expected_error_message",
        [
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training_1.sav"}',
                    0,
                    ""
            ),
            (
                    1,
                    "",
                    ServiceValidationType.VALIDATE_DATASET,
                    '{"serviceId":"service:646d77460da1d597e3ca980d",'
                    '"filePath":"training_1.sav"}',
                    1,
                    ""
            ),
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"upload",'
                    '"filePath":""}',
                    0,
                    ""
            ),
            (
                    1,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"upload",'
                    '"filePath":""}',
                    2,
                    ""
            ),
        ]
    )
    def test_validate(self, mocker, mock_error_count, mock_error_message, validation_type, args, expected_error_count, expected_error_message):
        with (
            mocker.patch.object(StreamValidation, "validate_data", return_value=(mock_error_count, mock_error_message)),
            mocker.patch.object(StreamValidation, "validate_model_mode", return_value=(mock_error_count, mock_error_message)),
            mocker.patch.object(StreamValidation, "validate_model_upload",
                                return_value=(mock_error_count, mock_error_message)),
        ):
            new_argument = ServiceArgument('test_engine_app/validation_schemas', validation_type)
            new_argument.parse(args)
            error_count, error_message = new_argument.validate()
            assert error_count == expected_error_count
            assert error_message == expected_error_message

    @pytest.mark.parametrize(
        "mock_error_count, mock_error_message, validation_type, args, expected_error_count, expected_error_message",
        [
            (
                    0,
                    "",
                    ServiceValidationType.VALIDATE_MODEL,
                    '{"serviceId":"service:646d77760da1d597e3ca981d",'
                    '"mode":"api",'
                    '"apiSchema":"",'
                    '"apiConfig":'
                    '{"authentication":"","headers":"","parameters":"","requestBody":"","responseBody":""}}',
                    0,
                    "The service is currently unable to process API model type"
            ),
        ]
    )
    def test_validate_exception(self, mock_error_count, mock_error_message, validation_type, args, expected_error_count, expected_error_message):
        with pytest.raises(RuntimeError) as exc_info:
            new_argument = ServiceArgument('test_engine_app/validation_schemas', validation_type)
            new_argument.parse(args)
            error_count, error_message = new_argument.validate()
        assert str(exc_info.value) == expected_error_message
