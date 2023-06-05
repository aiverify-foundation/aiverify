import json

import pytest
from test_engine_app.enums.task_type import TaskType
from test_engine_app.processing.task import Task
from test_engine_app.processing.task_argument import TaskArgument
from test_engine_app.processing.task_processing import TaskProcessing


def callback_method(task_id, message, logger):
    pytest.callback_message = message


class TestCollectionTask:
    pytest.callback_method = callback_method
    pytest.callback_message = ""

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
            (
                "None",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "None",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
            (
                "12345",
                "None",
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                "None",
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "None",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "None",
                TaskType.PENDING,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                None,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                None,
            ),
        ],
    )
    def test_init(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        assert my_task._message_id == message_id
        assert my_task._message_arguments == message_arguments
        assert my_task._task_type == task_type
        assert my_task._task_update_callback == task_update_cb
        assert my_task._logger is not None

        # Task arguments
        assert my_task._task_arguments is not None
        assert my_task._task_results is not None
        assert my_task._task_processing is not None

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb, expected_output",
        [
            # message id
            (
                "",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                None,
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                {},
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                [],
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                None,
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            # message arguments
            (
                "12345",
                "",
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                [],
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                {},
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                1234,
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            # validation schema folder
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                None,
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                {},
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                [],
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                1234,
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "",
                TaskType.NEW,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            # task type
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                None,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                "None",
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                "",
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                {},
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                [],
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                1234,
                pytest.callback_method,
                "The inputs do not meet the validation rules",
            ),
            # task update callback
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                "None",
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                "",
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                [],
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                {},
                "The inputs do not meet the validation rules",
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                1234,
                "The inputs do not meet the validation rules",
            ),
        ],
    )
    def test_init_with_invalid_inputs(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
        expected_output,
    ):
        with pytest.raises(RuntimeError) as exc_info:
            my_task = Task(
                message_id,
                message_arguments,
                validation_schemas,
                task_type,
                task_update_cb,
            )
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_cancel(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        my_task.process()

        assert my_task._task_processing._to_stop is False
        my_task.cancel()
        assert my_task._task_processing._to_stop is True

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_cancel_no_process(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )

        assert my_task._task_processing._to_stop is False
        my_task.cancel()
        assert my_task._task_processing._to_stop is True

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_cleanup(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        my_task.process()

        assert my_task._logger.logger_instance is not None
        my_task.cleanup()
        assert my_task._logger.logger_instance is None

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_cleanup_no_logger(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )

        assert my_task._logger.logger_instance is None
        my_task.cleanup()
        assert my_task._logger.logger_instance is None

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_get_formatted_results(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        my_task.process()
        assert my_task.get_formatted_results() == {
            "type": "TaskResponse",
            "status": "Error",
            "elapsedTime": 0,
            "startTime": str(my_task._task_results.start_time.isoformat()),
            "output": "",
            "errorMessages": '[{"category": "SYSTEM_ERROR", "code": "FSYSx00138", "description": "There was an '
            "error parsing the provided task arguments: The data file is not found;The model "
            'file is not found;The algorithm ID is not found;", "severity": "warning", '
            '"component": "task.py"}]',
            "logFile": str(my_task._logger.log_filepath),
            "taskProgress": 100,
        }

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_get_formatted_results_no_process(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        # No log file generated will return empty list
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        assert my_task.get_formatted_results() == {}

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_get_id(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        my_task.process()
        assert (
            my_task.get_id() == "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582"
        )

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
            ),
        ],
    )
    def test_get_id_no_process(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
    ):
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        assert my_task.get_id() is None

    @pytest.mark.parametrize(
        "mock_success, mock_error_message, "
        "message_id, message_arguments, validation_schemas, task_type, task_update_cb, "
        "is_success, expected_error_message",
        [
            (
                False,
                "Some Mocking Error",
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                False,
                "Some Mocking Error",
            ),
            (
                False,
                "Some Mocking Error",
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
                False,
                "Some Mocking Error",
            ),
            (
                True,
                "",
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                True,
                "",
            ),
            (
                True,
                "",
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.PENDING,
                pytest.callback_method,
                True,
                "",
            ),
        ],
    )
    def test_process(
        self,
        mocker,
        mock_success,
        mock_error_message,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
        is_success,
        expected_error_message,
    ):
        with (
            mocker.patch.object(
                TaskArgument, "parse", return_value=(mock_success, mock_error_message)
            ),
            mocker.patch.object(
                TaskProcessing,
                "process_pending_task",
                return_value=(mock_success, mock_error_message),
            ),
            mocker.patch.object(
                TaskProcessing,
                "process_new_task",
                return_value=(mock_success, mock_error_message),
            ),
        ):
            my_task = Task(
                message_id,
                message_arguments,
                validation_schemas,
                task_type,
                task_update_cb,
            )
            is_task_success, task_error_message = my_task.process()
            assert is_task_success == is_success
            assert task_error_message == expected_error_message

    @pytest.mark.parametrize(
        "mock_success, mock_error_message, message_id, message_arguments, validation_schemas, "
        "task_type, task_update_cb, has_output",
        [
            (
                True,
                "",
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                True,
            ),
            (
                True,
                "",
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                None,
                False,
            ),
        ],
    )
    def test_send_task_update(
        self,
        mocker,
        mock_success,
        mock_error_message,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
        has_output,
    ):
        with (
            mocker.patch.object(
                TaskArgument, "parse", return_value=(mock_success, mock_error_message)
            ),
            mocker.patch.object(
                TaskProcessing,
                "process_pending_task",
                return_value=(mock_success, mock_error_message),
            ),
            mocker.patch.object(
                TaskProcessing,
                "process_new_task",
                return_value=(mock_success, mock_error_message),
            ),
        ):
            pytest.callback_message = ""
            my_task = Task(
                message_id,
                message_arguments,
                validation_schemas,
                task_type,
                task_update_cb,
            )
            my_task.process()
            my_task._send_task_update()
            if has_output:
                assert pytest.callback_message == {
                    "type": "TaskResponse",
                    "status": "Pending",
                    "elapsedTime": 0,
                    "startTime": str(my_task._task_results.start_time.isoformat()),
                    "output": json.dumps(""),
                    "logFile": my_task._logger.log_filepath,
                    "taskProgress": 0,
                }
            else:
                assert pytest.callback_message == ""

    @pytest.mark.parametrize(
        "message_id, message_arguments, validation_schemas, "
        "task_type, task_update_cb, has_output",
        [
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                pytest.callback_method,
                True,
            ),
            (
                "12345",
                '{"mode":"upload","testDataset":"testing.sav",'
                '"modelFile":"model.sav","modelType":"classification",'
                '"id":"task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582",'
                '"algorithmId":"algo:aiverify.algorithms.partial_dependence_plot:partial_dependence_plot",'
                '"algorithmArgs":{"percentiles":[0.05,0.95],"target_feature_name":"Interest_Rate",'
                '"grid_resolution":100}}',
                "test_engine_app/validation_schemas",
                TaskType.NEW,
                None,
                False,
            ),
        ],
    )
    def test_send_task_update_no_process(
        self,
        message_id,
        message_arguments,
        validation_schemas,
        task_type,
        task_update_cb,
        has_output,
    ):
        pytest.callback_message = ""
        my_task = Task(
            message_id, message_arguments, validation_schemas, task_type, task_update_cb
        )
        my_task._send_task_update()
        if has_output:
            assert pytest.callback_message == {}
        else:
            assert pytest.callback_message == ""
