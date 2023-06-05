import logging
from typing import Callable, Dict, Tuple, Union

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.task_type import TaskType
from test_engine_app.interfaces.iworkerfunction import IWorkerFunction
from test_engine_app.processing.plugin_controller import PluginController
from test_engine_app.processing.stream_formatter import StreamFormatter
from test_engine_app.processing.task_argument import TaskArgument
from test_engine_app.processing.task_processing import TaskProcessing
from test_engine_app.processing.task_result import TaskResult
from test_engine_core.utils.validate_checks import is_empty_string


class Task(IWorkerFunction):
    """
    Task class focuses on storing information and allows data processing and printing results
    regardless of the principle and configuration
    """

    def __init__(
        self,
        message_id: str,
        message_arguments: str,
        validation_schemas_folder: str,
        task_type: TaskType,
        task_update_cb: Union[Callable, None] = None,
    ):
        if (
            is_empty_string(message_id)
            or is_empty_string(message_arguments)
            or is_empty_string(validation_schemas_folder)
            or task_type is None
            or not isinstance(task_type, TaskType)
            or not (task_update_cb is None or isinstance(task_update_cb, Callable))
        ):
            raise RuntimeError("The inputs do not meet the validation rules")

        self._message_id = message_id
        self._message_arguments = message_arguments
        self._task_type: TaskType = task_type

        # Callback method
        self._task_update_callback: Union[Callable, None] = task_update_cb

        # Task
        self._logger: AppLogger = AppLogger()
        self._task_arguments: TaskArgument = TaskArgument(validation_schemas_folder)
        self._task_results = TaskResult(self._logger)
        self._task_processing = TaskProcessing(
            self._logger, self._send_task_update, self._task_results
        )

    def cancel(self) -> None:
        """
        A method to cancel the current operation
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            "The system has received notification to cancel task",
        )
        self._task_processing.stop()

    def cleanup(self) -> None:
        """
        A method to perform task clean up
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            "The system has received notification to clean up task",
        )
        if self._logger.logger_instance:
            self._logger.logger_instance.stop()
            self._logger.logger_instance = None

    def get_formatted_results(self) -> Dict:
        """
        A method to return the result for HSET.

        Returns:
            Dict: task result
        """
        return StreamFormatter.format_task_response(
            self._task_results, self._logger.log_filepath
        )

    def get_id(self) -> str:
        """
        A method to return the task id

        Returns:
            str: task id
        """
        return self._task_arguments.id

    def get_logger(self) -> AppLogger:
        """
        A method to return the task logger

        Returns:
            AppLogger: task logger
        """
        return self._logger

    def process(self) -> Tuple[bool, str]:
        """
        A method to run the task to generate the results with the respective algorithm and data inputs
        Print the results to log file
        Write results to the respective output modules

        Returns:
            Tuple[bool, str]: Returns True if processing complete and indicate the error messages if failure
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            f"Task has received notification to process: {self._message_arguments}",
        )

        # Validate the task arguments
        is_success, error_messages = self._task_arguments.parse(self._message_arguments)
        if is_success:
            # Setup stream logger and route the logs to task logger
            self._logger.generate_stream_logger(self._task_arguments.id)
            PluginController.set_logger(self._logger)
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"The task validation is successful: {self._task_arguments.id}",
            )
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"Working on task: "
                f"message_id {self._message_id}, "
                f"message_args {self._message_arguments}, "
                f"task_type: {self._task_type}",
            )

            # Process the incoming task
            if self._task_type is TaskType.PENDING:
                is_success, error_messages = self._task_processing.process_pending_task(
                    self._task_arguments
                )
            else:
                is_success, error_messages = self._task_processing.process_new_task(
                    self._task_arguments
                )
        else:
            # Check if id is not None, we can set HSET with error messages
            if not is_empty_string(self._task_arguments.id):
                self._logger.generate_stream_logger(self._task_arguments.id)
                PluginController.set_logger(self._logger)
                error_message = (
                    "There was an error parsing the provided task arguments: "
                    + error_messages
                )
                AppLogger.add_to_log(
                    self._logger,
                    logging.ERROR,
                    error_message,
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "SYS",
                    "FSYSx00138",
                    error_message,
                    "Warning",
                    "task.py",
                )
            else:
                # Cannot get id value from the message.
                error_message = (
                    "There was an error parsing the provided task arguments "
                    "(Unable to get id): " + error_messages
                )
                AppLogger.add_to_log(
                    self._logger,
                    logging.ERROR,
                    error_message,
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "SYS",
                    "FSYSx00138",
                    error_message,
                    "Warning",
                    "task.py",
                )

            # Failed validation and Set task failure
            self._task_results.set_failure()

        return is_success, error_messages

    def _send_task_update(self) -> None:
        """
        A helper method to trigger task update for current task
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            "Task has received notification to send task update",
        )
        if self._task_update_callback:
            self._task_update_callback(
                self._task_arguments.id, self.get_formatted_results(), self._logger
            )
