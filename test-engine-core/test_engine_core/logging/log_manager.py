import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import List, Tuple, Union


class LogManager:
    """
    The LogManager class comprises methods to create new log managers and store observations
    and outputs while in operation
    """

    def __init__(self):
        """
        Initialisation of LogManager
        """
        self._instance: Union[logging.Logger, None] = None
        self._name: str = "LogManager"
        self._log_level: int = logging.INFO
        self._filepath: str = ""
        self._handlers: List = list()
        self._default_max_bytes: int = 1048576  # 1MB
        self._default_backup_count: int = 3
        self._default_folder: str = "logs"
        self._default_format: str = "%(asctime)s [%(levelname)s][%(filename)s::%(funcName)s(%(lineno)d)] %(message)s"

    def stop(self) -> None:
        """
        A method to stop all filehandlers
        """
        if self._instance is not None:
            for handler in self._handlers:
                self._instance.removeHandler(handler)
            self._handlers.clear()

    def get_logger(self) -> logging.Logger:
        """
        A method to return the underlying logger instance

        Returns:
            logging.Logger: log instance
        """
        return self._instance

    def create_logger(self, log_name: str = "", log_level: str = "info") -> bool:
        """
        A method to be called by other modules to initialize logger in their own module

        Args:
            log_name (str, optional): log name to be used to create log file . Defaults to "".
            log_level (str, optional): log level to store logs. Defaults to "info".

        Returns:
            bool: True with log instance if successful
        """
        if self._instance is None:
            # There is no logger instance
            # Check whether the logger_name is None, and remove empty spaces before creating.
            # If the name is "", when created it will be a root logger.
            if log_name is None:
                is_success, self._instance = self._create_logger_helper(
                    self._name, log_level
                )
            else:
                logger_name_stripped = str(log_name).strip()
                if logger_name_stripped == "":
                    is_success, self._instance = self._create_logger_helper(
                        self._name, log_level
                    )
                else:
                    is_success, self._instance = self._create_logger_helper(
                        logger_name_stripped, log_level
                    )

            return is_success
        else:
            return True

    def get_log_filepath(self) -> str:
        """
        A method to be called by other modules to get the current log path

        Returns:
            str: log filepath
        """
        return self._filepath

    def update_log_level(self, log_level: str = "info") -> None:
        """
        A method to be called by other modules to update the log level of logger in their own module

        Args:
            log_level (str, optional): log level to store logs. Defaults to "info".
        """
        if self._instance is None:
            self.create_logger(self._name, log_level)
        else:
            self._instance.setLevel(self._get_logging_level(log_level))
            self._log_level = self._get_logging_level(log_level)
            for handler in self._instance.handlers:
                # Determine and Set the new log level for the handler
                handler.setLevel(self._get_logging_level(log_level))

    def _create_logger_helper(
        self, log_name: str, log_level: str
    ) -> Tuple[bool, Union[logging.Logger, None]]:
        """
        A helper method to interact with the python logging module

        Args:
            log_name (str): log name to be used for log file name
            log_level (str): log level to be used

        Returns:
            Tuple[bool, Union[logging.Logger, None]]: True with the log instance if successful
        """
        try:
            # Verify that the logging path is created
            if not Path(self._default_folder).exists():
                Path(self._default_folder).mkdir()

            # Initialize the class variable with logger object
            self._name = log_name
            self._log_level = self._get_logging_level(log_level)

            self._instance = logging.getLogger(self._name)
            self._instance.setLevel(self._log_level)

            # Get the logger filename
            file_name_with_log_name = self._name + ".log"
            self._filepath = (
                (Path(self._default_folder) / Path(file_name_with_log_name))
                .absolute()
                .as_posix()
            )

            # Add the rotating file and stream handler to the instance, so it will write to file and output to stdout
            self._handlers.append(
                self._get_rotating_file_handler(self._filepath, "w", self._log_level)
            )
            self._handlers.append(self._get_stream_handler(self._log_level))
            for handler in self._handlers:
                self._instance.addHandler(handler)

            return True, self._instance

        except PermissionError as error:
            print(
                f"There was a permission error while creating logging path: {str(error)}"
            )
            return False, None

    def _get_logging_level(self, level: str) -> int:
        """
        A helper method to get appropriate logging level from the string input

        Args:
            level (str): log level

        Returns:
            int: enum value for the given log level
        """
        if level == "info":
            logging_level = logging.INFO
        elif level == "error":
            logging_level = logging.ERROR
        elif level == "debug":
            logging_level = logging.DEBUG
        else:
            logging_level = self._log_level

        return logging_level

    def _get_rotating_file_handler(
        self, log_filepath: str, file_mode: str, level: int
    ) -> RotatingFileHandler:
        """
        A helper method to interact with the python rotating file handler module

        Args:
            log_filepath (str): log filepath
            file_mode (str): log file mode
            level (int): log level

        Returns:
            RotatingFileHandler: log filehandler instance
        """
        file_handler = RotatingFileHandler(
            log_filepath,
            maxBytes=self._default_max_bytes,
            backupCount=self._default_backup_count,
            mode=file_mode,
            encoding=None,
            delay=False,
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(logging.Formatter(self._default_format))
        return file_handler

    def _get_stream_handler(self, level: int) -> logging.StreamHandler:
        """
        A helper method to interact with the python stream handler module

        Args:
            level (int): log level

        Returns:
            logging.StreamHandler: log streamhandler instance
        """
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(level)
        stream_handler.setFormatter(logging.Formatter(self._default_format))
        return stream_handler
