import logging
import queue
from multiprocessing import Lock
from typing import Callable, Dict, Tuple, Union

import pathos
from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.process_status import ProcessStatus
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

    lock: Lock = Lock()

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

        # Timeout
        self._mp_queue_timeout = 0.2  # 200 ms
        self._mp_join_timeout = 5.0  # 5 seconds

        # Task
        self._to_stop: bool = False
        self._logger: AppLogger = AppLogger()
        self._task_arguments: TaskArgument = TaskArgument(validation_schemas_folder)
        self._task_results = TaskResult(self._logger)

    def cancel(self) -> None:
        """
        A method to cancel the current operation
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            "The system has received notification to cancel task",
        )

        # Check and terminate the process if running
        running_process = self._get_task_process()
        if running_process:
            # Process is running.
            # Terminate it if unable to join
            AppLogger.add_to_log(
                self._logger, logging.INFO, "Attempting to join running process"
            )
            running_process.join(timeout=self._mp_join_timeout)
            if running_process.is_alive():
                AppLogger.add_to_log(
                    self._logger,
                    logging.INFO,
                    "Attempt to join process failed. Terminating process.",
                )
                running_process.terminate()

            # Set flag to stop
            self._to_stop = True

            # Set the task to cancelled
            self._task_results.set_cancelled()
        else:
            # Unable to terminate
            AppLogger.add_to_log(
                self._logger, logging.INFO, "There are no running task"
            )

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
            self._logger.generate_stream_logger(self._task_arguments.id)

            # Run the task processing instance in a Process and will return results when completed.
            # If there is a process termination required, will terminate the process.
            # Create a new queue for the process to place the results
            with pathos.helpers.mp.Manager() as manager:
                results_queue = manager.Queue()

                # Create the Process
                new_process = pathos.helpers.mp.Process(
                    target=TaskProcessing.run_task_processing_in_process,
                    args=(
                        self._logger,
                        self._task_arguments,
                        self._message_id,
                        self._message_arguments,
                        self._task_type,
                        results_queue,
                    ),
                )

                # Set the process before starting
                self._set_task_process(new_process)
                new_process.start()

                # Get updates while process is running
                while self._to_stop is False:
                    try:
                        process_status, payload = results_queue.get(
                            timeout=self._mp_queue_timeout
                        )
                        if process_status is ProcessStatus.UPDATE:
                            # Handle update task results
                            self._task_results = payload
                            self._send_task_update()
                        else:
                            # Handle process complete
                            is_success, self._task_results, error_messages = payload
                            break

                    except queue.Empty:
                        continue

                # Join the process
                new_process.join()
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

    def _get_task_process(self) -> Union[pathos.helpers.mp.Process, None]:
        """
        A helper method to return the running task process

        Returns:
            Union[pathos.helpers.mp.Process, None]: An task process or None
        """
        with Task.lock:
            return self._task_process

    def _set_task_process(
        self, task_process: Union[pathos.helpers.mp.Process, None]
    ) -> None:
        """
        A helper method to set the task process

        Args:
            task_process (Union[pathos.helpers.mp.Process, None]): task process or None
        """
        with Task.lock:
            self._task_process = task_process

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
