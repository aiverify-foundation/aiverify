import copy
import logging
from typing import Dict, Tuple, Union

import pathos
from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.process_status import ProcessStatus
from test_engine_app.enums.task_status import TaskStatus
from test_engine_app.enums.task_type import TaskType
from test_engine_app.processing.plugin_controller import PluginController
from test_engine_app.processing.stream_processing import StreamProcessing
from test_engine_app.processing.task_argument import TaskArgument
from test_engine_app.processing.task_result import TaskResult
from test_engine_core.interfaces.ialgorithm import IAlgorithm
from test_engine_core.interfaces.idata import IData
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.ipipeline import IPipeline
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.utils.json_utils import remove_numpy_formats, validate_json
from test_engine_core.utils.validate_checks import is_empty_string


class TaskProcessing:
    _to_stop: bool = False
    _logger: Union[AppLogger, None] = None
    _message_id: str = ""
    _message_arguments: str = ""
    _result_queue: Union[pathos.helpers.mp.Queue, None] = None
    _task_argument: Union[TaskArgument, None] = None
    _task_result: Union[TaskResult, None] = None
    _task_type: Union[TaskType, None] = None

    @staticmethod
    def run_task_processing_in_process(
        logger: AppLogger,
        task_argument: TaskArgument,
        message_id: str,
        message_arguments: str,
        task_type: TaskType,
        result_queue: pathos.helpers.mp.Queue,
    ) -> None:
        """
        A method that runs in a process to generate the results from the task argument
        The updates and results will be placed in the queue and returned.

        Args:
            logger (AppLogger): The reference logger
            task_argument (TaskArgument): The task arguments
            message_id (str): The redis message id
            message_arguments (str): The redis message arguments
            task_type (TaskType): The task type
            result_queue (pathos.helpers.mp.Queue): The multiprocessing queue to store results and return to the caller
        """
        # Store the values
        TaskProcessing._logger = logger
        TaskProcessing._task_argument = task_argument
        TaskProcessing._message_id = message_id
        TaskProcessing._message_arguments = message_arguments
        TaskProcessing._task_type = task_type
        TaskProcessing._task_result = TaskResult(TaskProcessing._logger)
        TaskProcessing._result_queue = result_queue
        TaskProcessing._to_stop = False

        PluginController.set_logger(TaskProcessing._logger)
        AppLogger.add_to_log(
            TaskProcessing._logger,
            logging.INFO,
            f"The task validation is successful: {TaskProcessing._task_argument.id}",
        )
        AppLogger.add_to_log(
            TaskProcessing._logger,
            logging.INFO,
            f"Working on task: "
            f"message_id {TaskProcessing._message_id}, "
            f"message_args {TaskProcessing._message_arguments}, "
            f"task_type: {TaskProcessing._task_type}",
        )

        # Process the incoming task
        if TaskProcessing._task_type is TaskType.PENDING:
            is_success, error_messages = TaskProcessing.process_pending_task()
        else:
            is_success, error_messages = TaskProcessing.process_new_task()

        # Attach the result in the result queue
        TaskProcessing._result_queue.put(
            (
                ProcessStatus.COMPLETE,
                (is_success, TaskProcessing._task_result, error_messages),
            )
        )

    @staticmethod
    def process_new_task() -> Tuple[bool, str]:
        """
        A method to process on new tasks
        It will run the task and set the respective task response

        Returns:
            Tuple[bool, str]: Returns bool on whether it is successful and indicate the error messages if failure
        """
        is_success: bool = False
        model_instance = None
        error_messages: str = ""

        try:
            # Set current task as Running and send update
            TaskProcessing._task_result.set_status(TaskStatus.RUNNING)
            AppLogger.add_to_log(
                TaskProcessing._logger, logging.INFO, "Sending task update"
            )
            TaskProcessing._result_queue.put(
                (ProcessStatus.UPDATE, TaskProcessing._task_result)
            )

            # Load instances
            (
                is_load_success,
                data_serializer_instance,
                model_serializer_instance,
                _,
                algorithm_serializer_instance,
                load_error_messages,
            ) = TaskProcessing._load_instances(TaskProcessing._task_argument)
            if not (
                is_load_success
                and data_serializer_instance[0]
                and model_serializer_instance[0]
                and algorithm_serializer_instance[0]
            ):
                # Load instances failed
                raise RuntimeError(load_error_messages)
            else:
                model_instance = model_serializer_instance[0]
                algorithm_instance = algorithm_serializer_instance[0]

            # Generate and get the output from the algorithm process
            algorithm_instance.generate()

            process_output = algorithm_instance.get_results()
            if not process_output:
                # Exception while processing algorithm
                raise RuntimeError(process_output)

            # Get the task results and convert to json friendly and validate against the output schema
            AppLogger.add_to_log(
                TaskProcessing._logger,
                logging.INFO,
                f"The raw task results: {process_output}",
            )
            task_results = remove_numpy_formats(process_output)
            (
                is_validation_success,
                validation_error_messages,
            ) = TaskProcessing._validate_task_results(
                task_results,
                TaskProcessing._task_argument.algorithm_plugin_information.get_algorithm_output_schema(),
            )

            if is_validation_success:
                TaskProcessing._task_result.set_results(task_results)
                is_success = True
                error_messages = ""
            else:
                # Validation failed
                AppLogger.add_to_log(
                    TaskProcessing._logger,
                    logging.ERROR,
                    f"Failed output schema validation: "
                    f"Task Results: {task_results}",
                )
                raise RuntimeError(validation_error_messages)

        except Exception as exception:
            is_success = False
            error_messages = str(exception)

        finally:
            if is_success:
                # Set current task as success
                TaskProcessing._task_result.set_success()

            else:
                if is_empty_string(error_messages):
                    error_messages = "The task is forcefully terminated"

                # Set the error and logs messages
                AppLogger.add_to_log(
                    TaskProcessing._logger,
                    logging.WARNING,
                    f"The task terminated: {error_messages}",
                )
                AppLogger.add_error_to_log(
                    TaskProcessing._logger,
                    "SYS",
                    "CSYSx00146",
                    f"Task Terminated: {error_messages}",
                    "Warning",
                    "task_processing.py",
                )

                # Set current task as failed
                TaskProcessing._task_result.set_failure()

            # Perform clean up for model instance
            if model_instance:
                model_instance.cleanup()

        return is_success, error_messages

    @staticmethod
    def process_pending_task() -> Tuple[bool, str]:
        """
        A method to process on pending tasks
        It will write error logs and set the respective task response to set in hset

        Returns:
            Tuple[bool, str]: Returns True and no error messages
        """
        # Set the error and logs messages
        AppLogger.add_to_log(
            TaskProcessing._logger,
            logging.INFO,
            f"The task terminated: {TaskProcessing._task_argument.id}",
        )
        AppLogger.add_error_to_log(
            TaskProcessing._logger,
            "SYS",
            "CSYSx00146",
            f"Task Terminated: {TaskProcessing._task_argument.id}",
            "Warning",
            "task_processing.py",
        )
        # Set current task as failure
        TaskProcessing._task_result.set_failure()
        return True, ""

    @staticmethod
    def _load_instances(
        task_argument: TaskArgument,
    ) -> Tuple[
        bool,
        Tuple[Union[IData, None], Union[ISerializer, None]],
        Tuple[Union[IModel, None], Union[ISerializer, None]],
        Tuple[Union[IData, None], Union[ISerializer, None]],
        Tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
        str,
    ]:
        """
        A helper method to load data, model, ground truth, algorithms instances whether it is pipeline or non-pipeline

        Args:
            task_argument (TaskArgument): Contains task arguments provided through redis

        Returns:
            Tuple[ bool, Tuple[Union[IData, None], Union[ISerializer, None]],
            Tuple[Union[IModel, None], Union[ISerializer, None]],
            Tuple[Union[IData, None], Union[ISerializer, None]],
            Tuple[Union[IAlgorithm, None], Union[ISerializer, None]], str, ]:
            If it is successful, it will return the data instance and serializer, model instance and serializer,
            Groundtruth instance and serializer, algorithm instance and serializer, with no error messages
            If it is not successful, it will return the error messages.
        """
        # Identify if the model is a pipeline
        if StreamProcessing.detect_pipeline(
            TaskProcessing._logger, task_argument.model
        ):
            AppLogger.add_to_log(
                TaskProcessing._logger,
                logging.INFO,
                "Found the pipeline model. Loading pipeline instances",
            )
            return TaskProcessing._load_pipeline_instances(task_argument)

        else:
            AppLogger.add_to_log(
                TaskProcessing._logger,
                logging.INFO,
                "Unable to find pipeline model. Loading non-pipeline instances",
            )
            return TaskProcessing._load_non_pipeline_instances(task_argument)

    @staticmethod
    def _load_non_pipeline_instances(
        task_argument: TaskArgument,
    ) -> Tuple[
        bool,
        Tuple[Union[IData, None], Union[ISerializer, None]],
        Tuple[Union[IModel, None], Union[ISerializer, None]],
        Tuple[Union[IData, None], Union[ISerializer, None]],
        Tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
        str,
    ]:
        """
        A helper method to load non pipeline instances

        Args:
            task_argument (TaskArgument): The task argument to retrieve the instances

        Raises:
            RuntimeError: Raises exception when there are issues loading data
            RuntimeError: Raises exception when data is of IMAGE type
            RuntimeError: Raises exception when there are issues loading model
            RuntimeError: Raises exception when there are issues loading ground truth
            RuntimeError: Raises exception when there are issues with ground truth feature
            RuntimeError: Raises exception when there are issues loading algorithm

        Returns:
            Tuple[ bool,
            Tuple[Union[IData, None], Union[ISerializer, None]],
            Tuple[Union[IModel, None], Union[ISerializer, None]],
            Tuple[Union[IData, None], Union[ISerializer, None]],
            Tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
            str, ]:
            If it is successful, it will return the data instance and serializer, model instance and serializer,
            Groundtruth instance and serializer, algorithm instance and serializer, with no error messages
            If it is not successful, it will return the error messages.
        """
        is_success = True
        data_serializer_instance = (None, None)
        model_serializer_instance = (None, None)
        ground_truth_serializer_instance = (None, None)
        algorithm_serializer_instance = (None, None)
        error_message = ""

        try:
            # Identify and load data information
            (
                is_load_data_success,
                data_serializer_instance,
                load_data_error_message,
            ) = StreamProcessing.load_data(TaskProcessing._logger, task_argument.data)
            if not is_load_data_success:
                is_success = is_load_data_success
                raise RuntimeError(load_data_error_message)

            # Check that data instance type is not IMAGE.
            if (
                data_serializer_instance[0].get_data_plugin_type()
                is DataPluginType.IMAGE
            ):
                is_success = False
                raise RuntimeError(
                    "The image data is not supported in non-pipeline model"
                )

            # Identify and load model information
            (
                is_load_model_success,
                model_serializer_instance,
                load_model_error_message,
            ) = StreamProcessing.load_model(
                TaskProcessing._logger,
                task_argument.mode,
                task_argument.model,
                task_argument.api_schema,
                task_argument.api_config,
            )
            if not is_load_model_success:
                is_success = is_load_model_success
                raise RuntimeError(load_model_error_message)

            # Check if ground_truth is optional
            # Identify and load ground truth information
            if (
                task_argument.algorithm_plugin_information.get_algorithm_require_ground_truth()
            ):
                (
                    is_load_ground_truth_success,
                    ground_truth_serializer_instance,
                    load_ground_truth_error_message,
                ) = StreamProcessing.load_ground_truth(
                    TaskProcessing._logger, task_argument.ground_truth_dataset
                )
                if not is_load_ground_truth_success:
                    is_success = is_load_ground_truth_success
                    raise RuntimeError(load_ground_truth_error_message)

                # Leave only the ground truth feature in ground_truth_instance and
                # Remove ground truth feature from the data instance
                is_ground_truth_instance_success = ground_truth_serializer_instance[
                    0
                ].keep_ground_truth(task_argument.ground_truth)
                data_serializer_instance[0].remove_ground_truth(
                    task_argument.ground_truth
                )
                if not is_ground_truth_instance_success:
                    is_success = is_ground_truth_instance_success
                    raise RuntimeError("Unable to get ground truth data")
            else:
                # Do not require Ground Truth
                ground_truth_serializer_instance = (None, None)

            # Identify and load algorithm information
            (
                is_load_algorithm_success,
                algorithm_serializer_instance,
                load_algorithm_error_message,
            ) = StreamProcessing.load_algorithm(
                TaskProcessing._logger,
                task_argument.algorithm_id,
                task_argument.algorithm_arguments,
                data_serializer_instance,
                ground_truth_serializer_instance,
                task_argument.ground_truth,
                model_serializer_instance,
                task_argument.model_type,
                TaskProcessing._update_task_progress,
            )
            if not is_load_algorithm_success:
                is_success = is_load_algorithm_success
                raise RuntimeError(load_algorithm_error_message)

        except RuntimeError as error:
            error_message = str(error)

        finally:
            return (
                is_success,
                data_serializer_instance,
                model_serializer_instance,
                ground_truth_serializer_instance,
                algorithm_serializer_instance,
                error_message,
            )

    @staticmethod
    def _load_pipeline_instances(
        task_argument: TaskArgument,
    ) -> Tuple[
        bool,
        Tuple[Union[IData, None], Union[ISerializer, None]],
        Tuple[Union[IPipeline, None], Union[ISerializer, None]],
        Tuple[Union[IData, None], Union[ISerializer, None]],
        Tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
        str,
    ]:
        """
        A helper method to load pipeline instances

        Args:
            task_argument (TaskArgument): The task argument to retrieve the instances

        Raises:
            RuntimeError: Raises exception when there are issues loading data
            RuntimeError: Raises exception when there are issues loading pipeline
            RuntimeError: Raises exception when there are issues loading ground truth
            RuntimeError: Raises exception when there are issues with ground truth feature
            RuntimeError: Raises exception when there are issues loading algorithm

        Returns:
            Tuple[ bool,
            Tuple[Union[IData, None], Union[ISerializer, None]],
            Tuple[Union[IPipeline, None], Union[ISerializer, None]],
            Tuple[Union[IData, None], Union[ISerializer, None]],
            Tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
            str, ]:
            If it is successful, it will return the data instance and serializer, model instance and serializer,
            Groundtruth instance and serializer, algorithm instance and serializer, with no error messages
            If it is not successful, it will return the error messages.
        """
        is_success = True
        data_serializer_instance = (None, None)
        model_serializer_instance = (None, None)
        ground_truth_serializer_instance = (None, None)
        algorithm_serializer_instance = (None, None)
        error_message = ""

        try:
            # Identify and load data information
            (
                is_load_data_success,
                data_serializer_instance,
                load_data_error_message,
            ) = StreamProcessing.load_data(TaskProcessing._logger, task_argument.data)
            if not is_load_data_success:
                is_success = is_load_data_success
                raise RuntimeError(load_data_error_message)

            # Identify and load model information
            (
                is_load_model_success,
                model_serializer_instance,
                load_model_error_message,
            ) = StreamProcessing.load_pipeline(
                TaskProcessing._logger, task_argument.model
            )
            if not is_load_model_success:
                is_success = is_load_model_success
                raise RuntimeError(load_model_error_message)

            # Perform a copy of the initial data and model information
            initial_data_serializer_instance = copy.deepcopy(data_serializer_instance)
            initial_model_serializer_instance = copy.deepcopy(model_serializer_instance)

            # Perform data transformation
            current_dataset = data_serializer_instance[0].get_data()
            current_pipeline = model_serializer_instance[0].get_pipeline()
            data_transformation_stages = current_pipeline[:-1]
            transformed_dataset = data_transformation_stages.transform(current_dataset)
            transformed_pipeline = current_pipeline[-1]
            # Set new transformed pipeline and dataset
            data_serializer_instance[0].set_data(transformed_dataset)
            model_serializer_instance[0].set_pipeline(transformed_pipeline)

            # Check if ground_truth is optional
            # Identify and load ground truth information
            if (
                task_argument.algorithm_plugin_information.get_algorithm_require_ground_truth()
            ):
                (
                    is_load_ground_truth_success,
                    ground_truth_serializer_instance,
                    load_ground_truth_error_message,
                ) = StreamProcessing.load_ground_truth(
                    TaskProcessing._logger, task_argument.ground_truth_dataset
                )
                if not is_load_ground_truth_success:
                    is_success = is_load_ground_truth_success
                    raise RuntimeError(load_ground_truth_error_message)

                # Leave only the ground truth feature in ground_truth_instance and
                # Remove ground truth feature from the data instance
                is_ground_truth_instance_success = ground_truth_serializer_instance[
                    0
                ].keep_ground_truth(task_argument.ground_truth)
                data_serializer_instance[0].remove_ground_truth(
                    task_argument.ground_truth
                )
                if not is_ground_truth_instance_success:
                    is_success = is_ground_truth_instance_success
                    raise RuntimeError("Unable to get ground truth data")
            else:
                # Do not require Ground Truth
                ground_truth_serializer_instance = (None, None)

            # Identify and load algorithm information
            (
                is_load_algorithm_success,
                algorithm_serializer_instance,
                load_algorithm_error_message,
            ) = StreamProcessing.load_algorithm(
                TaskProcessing._logger,
                task_argument.algorithm_id,
                task_argument.algorithm_arguments,
                data_serializer_instance,
                ground_truth_serializer_instance,
                task_argument.ground_truth,
                model_serializer_instance,
                task_argument.model_type,
                TaskProcessing._update_task_progress,
                initial_data_serializer_instance[0],
                initial_model_serializer_instance[0],
            )
            if not is_load_algorithm_success:
                is_success = is_load_algorithm_success
                raise RuntimeError(load_algorithm_error_message)

        except RuntimeError as error:
            error_message = str(error)

        finally:
            return (
                is_success,
                data_serializer_instance,
                model_serializer_instance,
                ground_truth_serializer_instance,
                algorithm_serializer_instance,
                error_message,
            )

    @staticmethod
    def _update_task_progress(completion_progress: int) -> None:
        """
        A helper method to update the new task progress and send task update

        Args:
            completion_progress (int): Current progress completion
        """
        # Set the task completion progress
        TaskProcessing._task_result.set_progress(completion_progress)
        TaskProcessing._result_queue.put(
            (ProcessStatus.UPDATE, TaskProcessing._task_result)
        )

    @staticmethod
    def _validate_task_results(
        task_result: Dict, algorithm_output_schema: Dict
    ) -> Tuple[bool, str]:
        """
        A helper method to validate task results according to output schema

        Args:
            task_result (Dict): A dictionary of results generated by the algorithm
            algorithm_output_schema (Dict): The algorithm output schema to be validated against

        Returns:
            Tuple[bool, str]: True if validated, False if validation failed and included the error message
        """
        is_success = True
        error_message = ""

        # Check that results type is dict
        if type(task_result) is not dict:
            # Raise error - wrong type
            is_success = False
            error_message = (
                f"The results contained an invalid type: {type(task_result).__name__}"
            )

        else:
            # Validate the json result with the relevant schema.
            # Check that it meets the required format before sending out to the UI for display
            if not validate_json(task_result, algorithm_output_schema):
                is_success = False
                error_message = "The algorithm output schema validation failed"

        return is_success, error_message
