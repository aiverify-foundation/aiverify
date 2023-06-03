import copy
import logging
import queue
from multiprocessing import Lock
from typing import Callable, Dict, Tuple, Union

import pathos
from test_engine_core.interfaces.ialgorithm import IAlgorithm
from test_engine_core.interfaces.idata import IData
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.ipipeline import IPipeline
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.utils.json_utils import remove_numpy_formats, validate_json
from test_engine_core.utils.validate_checks import is_empty_string

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.task_status import TaskStatus
from test_engine_app.processing.stream_processing import StreamProcessing
from test_engine_app.processing.task_argument import TaskArgument
from test_engine_app.processing.task_result import TaskResult


class TaskProcessing:
    """
    TaskProcessing class focuses on how to process pending and new tasks.
    """

    lock: Lock = Lock()

    def __init__(
        self, logger: AppLogger, task_update_cb: Callable, task_result: TaskResult
    ):
        self._logger: AppLogger = logger
        self._algorithm_process: Union[pathos.helpers.mp.Process, None] = None
        self._to_stop: bool = False
        self._task_update_callback: Callable = task_update_cb
        self._task_result: TaskResult = task_result

    def _get_algorithm_process(self) -> Union[pathos.helpers.mp.Process, None]:
        """
        A helper method to return the running algorithm process

        Returns:
            Union[pathos.helpers.mp.Process, None]: An algorithm process or None
        """
        with TaskProcessing.lock:
            return self._algorithm_process

    def _set_algorithm_process(
        self, algorithm_process: Union[pathos.helpers.mp.Process, None]
    ) -> None:
        """
        A helper method to set the algorithm process

        Args:
            algorithm_process (Union[pathos.helpers.mp.Process, None]): Algorithm process or None
        """
        with TaskProcessing.lock:
            self._algorithm_process = algorithm_process

    @staticmethod
    def run_algorithm_in_process(
        algorithm_instance: IAlgorithm, results: pathos.helpers.mp.Queue
    ) -> None:
        """
        A method that runs in a process to generate the results from the specific algorithm.
        The results will be placed in the queue and returned.

        Args:
            algorithm_instance (IAlgorithm): The algorithm instance
            results (pathos.helpers.mp.Queue): The multiprocessing queue to store results and return to the caller
        """
        try:
            # Generate the results using plugin and set task results
            # Put the results in the queue
            algorithm_instance.generate()
            results.put((True, algorithm_instance.get_results()))

        except Exception as exception:
            # Catch all error and Update the exception message in the queue
            results.put((False, str(exception)))

    def stop(self) -> None:
        """
        A method to stop all processing
        """
        AppLogger.add_to_log(self._logger, logging.INFO, "Stopping task processing")
        self._to_stop = True

        # Check and terminate the process if running
        running_process = self._get_algorithm_process()
        if running_process:
            # Process is running. Terminate it
            running_process.terminate()
        else:
            # Unable to terminate
            AppLogger.add_to_log(
                self._logger, logging.INFO, "There are no running task"
            )

    def process_new_task(self, task_argument: TaskArgument) -> Tuple[bool, str]:
        """
        A method to process on new tasks
        It will run the task and set the respective task response

        Args:
            task_argument (TaskArgument): Contains the arguments for this task

        Returns:
            Tuple[bool, str]: Returns bool on whether it is successful and indicate the error messages if failure
        """
        is_success: bool = False
        model_instance = None
        error_messages: str = ""

        try:
            # Set current task as Running and send update
            self._task_result.set_status(TaskStatus.RUNNING)
            AppLogger.add_to_log(self._logger, logging.INFO, "Sending task update")
            self._task_update_callback()

            # Load instances
            (
                is_load_success,
                data_serializer_instance,
                model_serializer_instance,
                _,
                algorithm_serializer_instance,
                load_error_messages,
            ) = self._load_instances(task_argument)
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

            # Run the algorithm instance in a Process and will return results when completed.
            # If there is a process termination required, will terminate the process.
            # Create a new queue for the process to place the results
            with pathos.helpers.mp.Manager() as manager:
                results_queue = manager.Queue()

                # Create the Process
                new_process = pathos.helpers.mp.Process(
                    target=TaskProcessing.run_algorithm_in_process,
                    args=(algorithm_instance, results_queue),
                )

                # Set the process before starting
                self._set_algorithm_process(new_process)
                new_process.start()
                new_process.join()

                # Retrieve the result from the queue
                try:
                    results = results_queue.get(timeout=1)
                except queue.Empty:
                    if self._to_stop:
                        raise RuntimeError("The user cancelled the task")
                    else:
                        raise RuntimeError("The algorithm has generated no results")

                # Get the output from the algorithm process
                is_processing_success, process_output = results
                if not is_processing_success:
                    # Exception while processing algorithm
                    raise RuntimeError(process_output)

                # Get the task results and convert to json friendly and validate against the output schema
                AppLogger.add_to_log(
                    self._logger,
                    logging.INFO,
                    f"The raw task results: {process_output}",
                )
                task_results = remove_numpy_formats(process_output)
                (
                    is_validation_success,
                    validation_error_messages,
                ) = self._validate_task_results(
                    task_results,
                    task_argument.algorithm_plugin_information.get_algorithm_output_schema(),
                )
                if is_validation_success:
                    self._task_result.set_results(task_results)
                    is_success = True
                    error_messages = ""
                else:
                    # Validation failed
                    AppLogger.add_to_log(
                        self._logger,
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
                self._task_result.set_success()

            else:
                if is_empty_string(error_messages):
                    error_messages = "The task is forcefully terminated"

                # Set the error and logs messages
                AppLogger.add_to_log(
                    self._logger,
                    logging.WARNING,
                    f"The task terminated: {error_messages}",
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "SYS",
                    "CSYSx00146",
                    f"Task Terminated: {error_messages}",
                    "Warning",
                    "task_processing.py",
                )

                # Set current task as failure / cancelled
                if self._to_stop:
                    self._task_result.set_cancelled()
                else:
                    self._task_result.set_failure()

            # Perform clean up for model instance
            if model_instance:
                model_instance.cleanup()

        return is_success, error_messages

    def process_pending_task(self, task_arguments: TaskArgument) -> Tuple[bool, str]:
        """
        A method to process on pending tasks
        It will write error logs and set the respective task response to set in hset

        Args:
            task_arguments (TaskArgument): Contains the pending task arguments

        Returns:
            Tuple[bool, str]: Returns True and no error messages
        """
        # Set the error and logs messages
        AppLogger.add_to_log(
            self._logger, logging.INFO, f"The task terminated: {task_arguments.id}"
        )
        AppLogger.add_error_to_log(
            self._logger,
            "SYS",
            "CSYSx00146",
            f"Task Terminated: {task_arguments.id}",
            "Warning",
            "task_processing.py",
        )

        # Set current task as failure
        self._task_result.set_failure()
        return True, ""

    def _load_instances(
        self, task_argument: TaskArgument
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
        if StreamProcessing.detect_pipeline(self._logger, task_argument.model):
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                "Found the pipeline model. Loading pipeline instances",
            )
            return self._load_pipeline_instances(task_argument)

        else:
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                "Unable to find pipeline model. Loading non-pipeline instances",
            )
            return self._load_non_pipeline_instances(task_argument)

    def _load_non_pipeline_instances(
        self, task_argument: TaskArgument
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
            ) = StreamProcessing.load_data(self._logger, task_argument.data)
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
                self._logger,
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
                    self._logger, task_argument.ground_truth_dataset
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
                self._logger,
                task_argument.algorithm_id,
                task_argument.algorithm_arguments,
                data_serializer_instance,
                ground_truth_serializer_instance,
                task_argument.ground_truth,
                model_serializer_instance,
                task_argument.model_type,
                self._update_task_progress,
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

    def _load_pipeline_instances(
        self, task_argument: TaskArgument
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
            ) = StreamProcessing.load_data(self._logger, task_argument.data)
            if not is_load_data_success:
                is_success = is_load_data_success
                raise RuntimeError(load_data_error_message)

            # Identify and load model information
            (
                is_load_model_success,
                model_serializer_instance,
                load_model_error_message,
            ) = StreamProcessing.load_pipeline(self._logger, task_argument.model)
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
                    self._logger, task_argument.ground_truth_dataset
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
                self._logger,
                task_argument.algorithm_id,
                task_argument.algorithm_arguments,
                data_serializer_instance,
                ground_truth_serializer_instance,
                task_argument.ground_truth,
                model_serializer_instance,
                task_argument.model_type,
                self._update_task_progress,
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

    def _update_task_progress(self, completion_progress: int) -> None:
        """
        A helper method to update the new task progress and send task update

        Args:
            completion_progress (int): Current progress completion
        """
        # Set the task completion progress
        self._task_result.set_progress(completion_progress)
        self._task_update_callback()

    def _validate_task_results(
        self, task_result: Dict, algorithm_output_schema: Dict
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
