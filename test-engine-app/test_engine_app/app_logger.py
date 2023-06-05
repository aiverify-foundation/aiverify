from __future__ import annotations

import inspect
import logging
from logging import Logger
from pathlib import Path
from types import FrameType
from typing import Union, cast

from test_engine_core.logging.error_manager import ErrorManager
from test_engine_core.logging.log_manager import LogManager
from test_engine_core.utils.generate_uuid import generate_uuid
from test_engine_core.utils.validate_checks import is_empty_string


class AppLogger:
    """
    AppLogger class create loggers for logging application and error messages
    """

    log_id: str

    # AppLogger
    logger_instance: Union[LogManager, None]
    raw_logger_instance: Union[Logger, None]
    log_filepath: str

    # Error AppLogger
    error_logger_instance: Union[ErrorManager, None]
    error_filepath: str

    def __init__(self):
        self.log_id = None
        self.logger_instance = None
        self.raw_logger_instance = None
        self.log_filepath = ""

        self.error_logger_instance = None
        self.error_filepath = ""

    def generate_logger(self) -> None:
        """
        A method to generate uuid, logger and error logger for application
        """
        self.log_id = generate_uuid()

        # Setup AppLogger
        self.logger_instance = LogManager()
        self.logger_instance.create_logger(self.log_id)
        self.logger_instance.update_log_level("debug")
        self.raw_logger_instance = self.logger_instance.get_logger()
        self.log_filepath = self.logger_instance.get_log_filepath()

        # Setup Error Logger
        self.error_logger_instance = ErrorManager()
        self.error_logger_instance.create_error_manager(self.log_id)
        self.error_filepath = self.error_logger_instance.get_error_filepath()

    def generate_stream_logger(self, task_id: str) -> None:
        """
        A method to generate uuid, logger and error logger for streams

        Args:
            task_id (str): Task ID
        """
        if is_empty_string(task_id):
            self.log_id = generate_uuid()

        else:
            self.log_id = task_id

        # Setup Stream Logger
        self.logger_instance = LogManager()
        self.logger_instance.create_logger(self.log_id)
        self.raw_logger_instance = self.logger_instance.get_logger()
        self.log_filepath = self.logger_instance.get_log_filepath()

        # Setup Error Logger
        self.error_logger_instance = ErrorManager()
        self.error_logger_instance.create_error_manager(self.log_id)
        self.error_filepath = self.error_logger_instance.get_error_filepath()

    @staticmethod
    def add_to_log(app_logger: AppLogger, log_level: int, log_message: str) -> None:
        """
        A method to log messages to store events occurred

        Args:
            app_logger (AppLogger): The app logger instance for the message to be logged to
            log_level (int): The log level of the message
            log_message (str): The log message
        """
        # Get caller
        caller_info = cast(FrameType, cast(FrameType, inspect.currentframe()).f_back)
        caller_info_str = (
            f"{Path(caller_info.f_code.co_filename).name}:{caller_info.f_code.co_name}"
            f"({caller_info.f_lineno})"
        )

        # Log the message
        if (
            app_logger
            and isinstance(app_logger, AppLogger)
            and app_logger.raw_logger_instance
            and isinstance(log_message, str)
        ):
            log_message = log_message.replace("<", "{")
            log_message = log_message.replace(">", "}")

            if log_level is logging.DEBUG:
                app_logger.raw_logger_instance.debug(
                    f"[{caller_info_str}]: {log_message}"
                )

            elif log_level is logging.INFO:
                app_logger.raw_logger_instance.info(
                    f"[{caller_info_str}]: {log_message}"
                )

            elif log_level is logging.WARNING:
                app_logger.raw_logger_instance.warning(
                    f"[{caller_info_str}]: {log_message}"
                )

            elif log_level is logging.ERROR:
                app_logger.raw_logger_instance.error(
                    f"[{caller_info_str}]: {log_message}"
                )

            elif log_level is logging.CRITICAL:
                app_logger.raw_logger_instance.critical(
                    f"[{caller_info_str}]: {log_message}"
                )

            else:
                pass  # Invalid log level
        else:
            print(f"[{caller_info_str}]: {log_message}")

    @staticmethod
    def add_error_to_log(
        app_logger: AppLogger,
        category: str,
        code: str,
        description: str,
        severity: str,
        component: str,
    ) -> None:
        """
        A method to log messages to store error events occurred

        Args:
            app_logger (AppLogger): The app logger instance for the message to be logged to
            category (str): The error category
            code (str): The error code
            description (str): The error description
            severity (str): The error severity
            component (str): The error component
        """
        if (
            app_logger
            and isinstance(app_logger, AppLogger)
            and app_logger.error_logger_instance
        ):
            app_logger.error_logger_instance.add_error_to_list(
                category, code, description, severity, component
            )
        else:
            pass  # No log instance

    @staticmethod
    def get_errors_in_json_str(app_logger: AppLogger) -> str:
        """
        A method to get errors in json string

        Args:
            app_logger (AppLogger): The app logger instance for the message to be logged to
        """
        if (
            app_logger
            and isinstance(app_logger, AppLogger)
            and app_logger.error_logger_instance
        ):
            return app_logger.error_logger_instance.get_errors_as_json_string()
        else:
            return ""

    @staticmethod
    def write_error_to_file(app_logger: AppLogger) -> bool:
        """
        A method to write error messages to file

        Args:
            app_logger (AppLogger): The app logger instance for the message to be logged to
        """
        if (
            app_logger
            and isinstance(app_logger, AppLogger)
            and app_logger.error_logger_instance
        ):
            return app_logger.error_logger_instance.write_error_to_file()
        else:
            return False
