import pytest

from test_engine_app.processing.plugin_controller import PluginController
from test_engine_app.processing.stream_validation import StreamValidation
from test_engine_app.processing.task_argument import TaskArgument


class TestCollectionTaskArgument:

    @pytest.mark.parametrize(
        "validation_schema, expected_validation_file",
        [
            (
                    'test_engine_app/validation_schemas',
                    'test_engine_app/validation_schemas/test_engine_task_schema.json'
            ),
            (
                    'None',
                    'None/test_engine_task_schema.json'
            ),
        ]
    )
    def test_init(self, validation_schema, expected_validation_file):
        new_argument = TaskArgument(validation_schema)
        assert new_argument.id is None
        assert new_argument.data is None
        assert new_argument.ground_truth_dataset is None
        assert new_argument.ground_truth is None
        assert new_argument.api_schema is None
        assert new_argument.api_config is None
        assert new_argument.mode is None
        assert new_argument.model is None
        assert new_argument.model_type is None
        assert new_argument.algorithm_id is None
        assert new_argument.algorithm_arguments is None
        assert new_argument.algorithm_plugin_information is None
        assert new_argument._validation_schema_file == expected_validation_file
        assert new_argument._validation_schema is None

    @pytest.mark.parametrize(
        "validation_schema, expected_output",
        [
            (
                    None,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "",
                    "The inputs do not meet the validation rules"
            ),
            (
                    {},
                    "The inputs do not meet the validation rules"
            ),
            (
                    [],
                    "The inputs do not meet the validation rules"
            ),
            (
                    1234,
                    "The inputs do not meet the validation rules"
            ),
        ]
    )
    def test_init_invalid_inputs(self, validation_schema, expected_output):
        with pytest.raises(RuntimeError) as exc_info:
            new_argument = TaskArgument(validation_schema)
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "mock_error_count, mock_error_message, args, expected_output, expected_error_message",
        [
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"regression",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),
            (
                    0,
                    "",
                    '{"mode":"api","apiSchema":"",'
                    '"apiConfig":'
                    '{"authentication":"","headers":"","parameters":"","requestBody":"","responseBody":""},'
                    '"testDataset":"testing.sav",'
                    '"modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),
            (
                    1,
                    "MockError",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "MockError"
            ),
            # No / empty mode
            (
                    0,
                    "",
                    '{"testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "The inputs do not meet the validation schema rules for "
                    "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
            ),
            (
                    0,
                    "",
                    '{"mode":"","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "The inputs do not meet the validation schema rules for "
                    "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
            ),
            # No / empty testdataset
            (
                    0,
                    "",
                    '{"mode":"upload",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "The inputs do not meet the validation schema rules for "
                    "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
            ),
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),

            # No / empty model file
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "The inputs do not meet the validation schema rules for "
                    "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
            ),
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),
            # No / empty model type
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "The inputs do not meet the validation schema rules for "
                    "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
            ),
            # No / empty id
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "The inputs do not meet the validation schema rules for None"
            ),
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),
            # No / empty algorithm id
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    False,
                    "The inputs do not meet the validation schema rules for "
                    "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
            ),
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    True,
                    ""
            ),
            # No / empty algorithm args
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot"}',
                    False,
                    "The inputs do not meet the validation schema rules for task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
            ),
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":""}',
                    True,
                    ""
            ),
        ]
    )
    def test_parse(self, mocker, mock_error_count, mock_error_message, args, expected_output, expected_error_message):
        with (
            mocker.patch.object(TaskArgument, "validate", return_value=(mock_error_count, mock_error_message)),
            mocker.patch.object(PluginController, "get_plugin_information", return_value=None)
        ):
            new_argument = TaskArgument('test_engine_app/validation_schemas')
            is_success, error_message = new_argument.parse(args)
            assert is_success == expected_output
            assert error_message == expected_error_message

    @pytest.mark.parametrize(
        "args, expected_output, expected_error_message",
        [
            (
                    None,
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "None",
                    False,
                    "Expecting value: line 1 column 1 (char 0)"
            ),
            (
                    [],
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    {},
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "",
                    False,
                    "The inputs do not meet the validation rules"
            ),
            (
                    1234,
                    False,
                    "The inputs do not meet the validation rules"
            ),
        ]
    )
    def test_parse_exception(self, args, expected_output, expected_error_message):
        new_argument = TaskArgument('test_engine_app/validation_schemas')
        is_success, error_message = new_argument.parse(args)
        assert is_success == expected_output
        assert error_message == expected_error_message

    @pytest.mark.parametrize(
        "mock_error_count, mock_error_message, args, expected_error_count, expected_error_message",
        [
            (
                    0,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    0,
                    ""
            ),
            (
                    1,
                    "",
                    '{"mode":"upload","testDataset":"testing.sav",'
                    '"modelFile":"model.sav","modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    3,
                    ""
            ),
        ]
    )
    def test_validate(self, mocker, mock_error_count, mock_error_message, args, expected_error_count, expected_error_message):
        with (
            mocker.patch.object(StreamValidation, "validate_data", return_value=(mock_error_count, mock_error_message)),
            mocker.patch.object(StreamValidation, "validate_model_upload", return_value=(mock_error_count, mock_error_message)),
            mocker.patch.object(StreamValidation, "validate_algorithm",
                                return_value=(mock_error_count, mock_error_message)),
        ):
            new_argument = TaskArgument('test_engine_app/validation_schemas')
            new_argument.parse(args)
            error_count, error_message = new_argument.validate()
            assert error_count == expected_error_count
            assert error_message == expected_error_message

    @pytest.mark.parametrize(
        "mock_error_count, mock_error_message, args, expected_error_count, expected_error_message",
        [
            (
                    0,
                    "",
                    '{"mode":"api","apiSchema":"",'
                    '"apiConfig":'
                    '{"authentication":"","headers":"","parameters":"","requestBody":"","responseBody":""},'
                    '"testDataset":"testing.sav",'
                    '"modelType":"classification",'
                    '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                    '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                    '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                    '"grid_resolution":100}}',
                    0,
                    "The task is currently unable to process API model type"
            ),
        ]
    )
    def test_validate_exception(self, mock_error_count, mock_error_message, args, expected_error_count, expected_error_message):
        with pytest.raises(RuntimeError) as exc_info:
            new_argument = TaskArgument('test_engine_app/validation_schemas')
            new_argument.parse(args)
            error_count, error_message = new_argument.validate()
        assert str(exc_info.value) == expected_error_message
