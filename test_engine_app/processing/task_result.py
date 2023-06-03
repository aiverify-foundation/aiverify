import logging
from datetime import datetime
from typing import Dict, Union

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.task_status import TaskStatus


class TaskResult:
    """
    TaskResult class focuses on compiling the current task results
    """

    elapsed_time: int
    start_time: datetime
    end_time: datetime
    percentage: int
    status: TaskStatus
    results: Union[Dict, str]
    error_messages: str

    def __init__(self, logger: AppLogger):
        if not isinstance(logger, AppLogger):
            raise RuntimeError("The inputs do not meet the validation rules")

        self.elapsed_time = 0
        self.start_time = datetime.now()
        self.end_time = datetime.now()
        self.percentage = 0
        self.status = TaskStatus.PENDING
        self.results = ""
        self.error_messages = ""
        self._logger = logger

    def set_elapsed_time(self) -> None:
        """
        A method to set the current elapsed time
        """
        # Set task end time and calculate elapsed time
        self.end_time = datetime.now()
        self.elapsed_time = int((self.end_time - self.start_time).total_seconds())

    def set_success(self) -> None:
        """
        A method to set the task has succeeded.
        """
        self.error_messages = ""
        self.set_progress(100)
        self.set_status(TaskStatus.SUCCESS)

    def set_failure(self) -> None:
        """
        A method to set the task has failed.
        """
        # Write error to file
        AppLogger.write_error_to_file(self._logger)

        self.error_messages = AppLogger.get_errors_in_json_str(self._logger)
        self.results = ""
        self.set_progress(100)
        self.set_status(TaskStatus.ERROR)

    def set_cancelled(self) -> None:
        """
        A method to set the task has cancelled.
        """
        # Write error to file
        AppLogger.write_error_to_file(self._logger)

        self.error_messages = AppLogger.get_errors_in_json_str(self._logger)
        self.results = ""
        self.set_progress(100)
        self.set_status(TaskStatus.CANCELLED)

    def set_results(self, results: Dict) -> None:
        """
        A method to update the new task results

        Args:
            results (Dict): The results to be updated
        """
        if isinstance(results, dict):
            # Set the task results
            self.results = results
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"The current task has received the following results: {self.results}",
            )
        else:
            error_message = f"The current task received an invalid input: {results} ({type(results)})"
            AppLogger.add_to_log(self._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                self._logger,
                "INP",
                "CINPx00140",
                error_message,
                "Critical",
                "task_result.py",
            )
            raise RuntimeError(error_message)

    def set_progress(self, completion_progress: int) -> None:
        """
        A method to set the new task progress and send task update

        Args:
            completion_progress (int): Current progress completion
        """
        if isinstance(completion_progress, int):
            # Set the task completion progress
            self.set_elapsed_time()
            self.percentage = completion_progress
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"The current task completion progress is {self.percentage}",
            )
        else:
            error_message = (
                f"The current task received an invalid input: "
                f"{completion_progress} ({type(completion_progress)})"
            )
            AppLogger.add_to_log(self._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                self._logger,
                "INP",
                "CINPx00140",
                error_message,
                "Critical",
                "task_result.py",
            )
            raise RuntimeError(error_message)

    def set_status(self, task_status: TaskStatus) -> None:
        """
        A method to set the new task status

        Args:
            task_status (TaskStatus): new task status
        """
        if isinstance(task_status, TaskStatus):
            # Set the task status
            self.set_elapsed_time()
            self.status = task_status
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"The current task has changed status to {self.status}",
            )
        else:
            error_message = (
                f"The current task received an invalid input: "
                f"{task_status} ({type(task_status)})"
            )
            AppLogger.add_to_log(self._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                self._logger,
                "INP",
                "CINPx00140",
                error_message,
                "Critical",
                "task_result.py",
            )
            raise RuntimeError(error_message)
