import logging
import os
import shutil
from pathlib import Path

import pytest
from aiverify_test_engine.logging.log_manager import LogManager


class TestCollectionLogManager:
    pytest.running_dir = str(Path.cwd()) + "/"

    @pytest.fixture(autouse=True)
    def init(self):
        # Setup:
        # Remove folder
        try:
            shutil.rmtree("logs")
        except FileNotFoundError:
            pass

        yield  # this is where the testing happens

        # Teardown:
        # Remove folder
        try:
            shutil.rmtree("logs")
        except FileNotFoundError:
            pass

    def test_init_log_manager(self):
        """
        Tests log manager initialization
        """
        log_manager = LogManager()
        # Check variables
        assert log_manager._instance is None
        assert log_manager._name == "LogManager"
        assert log_manager._log_level == logging.INFO
        assert log_manager._filepath == ""
        assert log_manager._handlers is not None
        assert type(log_manager._handlers) == list
        assert len(log_manager._handlers) == 0
        assert log_manager._default_folder == "logs"
        assert (
            log_manager._default_format
            == "%(asctime)s [%(levelname)s][%(filename)s::%(funcName)s(%(lineno)d)] %(message)s"
        )

    @pytest.mark.parametrize(
        "expected_num_of_handlers",
        [0],
    )
    def test_stop_log_manager_no_instance(self, expected_num_of_handlers):
        """
        Tests log manager stop function with no instance
        """
        log_manager = LogManager()

        # Perform stop
        log_manager.stop()
        assert log_manager._instance is None
        assert log_manager._handlers is not None
        assert type(log_manager._handlers) == list
        assert len(log_manager._handlers) == expected_num_of_handlers

    @pytest.mark.parametrize(
        "num_of_handlers, expected_num_of_handlers",
        [(2, 0)],
    )
    def test_stop_log_manager(self, num_of_handlers, expected_num_of_handlers):
        """
        Tests log manager stop function
        """
        log_manager = LogManager()
        log_manager.create_logger()
        assert log_manager._instance is not None
        assert log_manager._handlers is not None
        assert type(log_manager._handlers) == list
        assert len(log_manager._handlers) == num_of_handlers

        # Perform stop
        log_manager.stop()
        assert log_manager._instance is not None
        assert log_manager._handlers is not None
        assert type(log_manager._handlers) == list
        assert len(log_manager._handlers) == expected_num_of_handlers

    def test_get_logger_no_instance(self):
        """
        Tests getting logger without creating a logger instance
        """
        log_manager = LogManager()

        # Get logger
        assert log_manager.get_logger() is None

    def test_get_logger(self):
        """
        Tests getting logger
        """
        log_manager = LogManager()
        log_manager.create_logger()

        # Get logger
        assert log_manager.get_logger() is not None
        assert log_manager.get_logger() == log_manager._instance
        assert type(log_manager.get_logger()) is logging.Logger

    def test_create_logger_default_parameters(self):
        """
        Tests creating logger with default parameters
        """
        log_manager = LogManager()
        response = log_manager.create_logger()

        assert response is True
        assert log_manager._instance is not None
        assert type(log_manager._instance) is logging.Logger
        assert log_manager._name == "LogManager"
        assert log_manager._log_level is logging.INFO
        assert log_manager._filepath == f"{pytest.running_dir}" + "logs/LogManager.log"
        assert len(log_manager._handlers) == 2

    def test_create_logger_with_existing_folder(self):
        """
        Tests creating logger with existing folder
        """
        # Remove the folder and create with new permissions
        os.mkdir(f"{pytest.running_dir}" + "logs", 0o777)

        log_manager = LogManager()
        response = log_manager.create_logger()
        assert response is True
        assert log_manager._instance is not None
        assert type(log_manager._instance) is logging.Logger
        assert log_manager._name == "LogManager"
        assert log_manager._log_level is logging.INFO
        assert log_manager._filepath == f"{pytest.running_dir}" + "logs/LogManager.log"
        assert len(log_manager._handlers) == 2

    def test_create_logger_no_permissions(self):
        """
        Tests creating logger with no permissions
        """
        # Remove the folder and create with new permissions
        os.mkdir(f"{pytest.running_dir}" + "logs", 0o000)

        log_manager = LogManager()
        response = log_manager.create_logger()
        assert response is False

        # Remove the folder and create with new permissions
        os.chmod(f"{pytest.running_dir}" + "logs", 0o777)

    @pytest.mark.parametrize(
        "log_name, expected_log_name, log_level, expected_log_level",
        [
            ("my_log_file", "my_log_file", "debug", logging.DEBUG),
            ("my_log_file", "my_log_file", "info", logging.INFO),
            ("my_log_file", "my_log_file", "error", logging.ERROR),
            ("my_log_file", "my_log_file", "warning", logging.INFO),
            ("my_log_file", "my_log_file", "critical", logging.INFO),
            ("my_log_file", "my_log_file", "12345", logging.INFO),
            ("", "LogManager", "debug", logging.DEBUG),
            ("1234", "1234", "debug", logging.DEBUG),
            (1234, "1234", "debug", logging.DEBUG),
            ("&&!22", "&&!22", "debug", logging.DEBUG),
            (" my_logging_name ", "my_logging_name", "debug", logging.DEBUG),
            ('"&@#^(!#@jj1', '"&@#^(!#@jj1', "debug", logging.DEBUG),
            (None, "LogManager", "debug", logging.DEBUG),
            (None, "LogManager", None, logging.INFO),
            ("None", "None", "debug", logging.DEBUG),
            ("None", "None", "None", logging.INFO),
            ("None", "None", "", logging.INFO),
        ],
    )
    def test_create_logger(
        self, log_name, expected_log_name, log_level, expected_log_level
    ):
        """
        Tests creating logger with different parameters
        """
        log_manager = LogManager()
        response = log_manager.create_logger(log_name, log_level)

        assert response is True
        assert log_manager._instance is not None
        assert type(log_manager._instance) is logging.Logger
        assert log_manager._name == expected_log_name
        assert log_manager._log_level is expected_log_level
        assert (
            log_manager._filepath
            == f"{pytest.running_dir}" + f"logs/{expected_log_name}.log"
        )
        assert len(log_manager._handlers) == 2

    def test_create_logger_twice(self):
        """
        Tests creating logger twice
        """
        # Create first instance
        log_manager = LogManager()
        response = log_manager.create_logger("my_log_file", "debug")
        assert response is True
        log_manager_instance = log_manager._instance

        # Create second instance
        response = log_manager.create_logger("my_log_file", "debug")
        assert response is True
        log_manager_instance_1 = log_manager._instance

        assert log_manager_instance == log_manager_instance_1

    def test_get_log_filename_no_instance(self):
        """
        Tests getting log filename with no instance
        """
        log_manager = LogManager()
        filepath = log_manager.get_log_filepath()
        assert filepath == ""

    @pytest.mark.parametrize(
        "log_name, expected_log_name, log_level",
        [
            ("my_log_file", "my_log_file", "debug"),
            ("my_log_file", "my_log_file", "info"),
            ("my_log_file", "my_log_file", "error"),
            ("my_log_file", "my_log_file", "warning"),
            ("my_log_file", "my_log_file", "critical"),
            ("my_log_file", "my_log_file", "12345"),
            ("", "LogManager", "debug"),
            ("1234", "1234", "debug"),
            (1234, "1234", "debug"),
            ("&&!22", "&&!22", "debug"),
            (" my_logging_name ", "my_logging_name", "debug"),
            ('"&@#^(!#@jj1', '"&@#^(!#@jj1', "debug"),
            (None, "LogManager", "debug"),
            (None, "LogManager", None),
            ("None", "None", "debug"),
            ("None", "None", "None"),
        ],
    )
    def test_get_log_filename(self, log_name, expected_log_name, log_level):
        """
        Tests getting log filename
        """
        log_manager = LogManager()
        response = log_manager.create_logger(log_name, log_level)
        assert response is True
        assert (
            log_manager.get_log_filepath()
            == f"{pytest.running_dir}" + f"logs/{expected_log_name}.log"
        )

    @pytest.mark.parametrize(
        "log_level, expected_log_level",
        [
            ("debug", logging.DEBUG),
            ("info", logging.INFO),
            ("error", logging.ERROR),
            ("warning", logging.INFO),
            ("critical", logging.INFO),
            ("12345", logging.INFO),
            (None, logging.INFO),
            ("None", logging.INFO),
            ("", logging.INFO),
        ],
    )
    def test_update_log_level_no_instance(self, log_level, expected_log_level):
        """
        Tests updating log level no instance
        """
        log_manager = LogManager()
        assert log_manager._instance is None

        log_manager.update_log_level(log_level)
        assert log_manager._instance is not None
        assert log_manager._log_level is expected_log_level

    @pytest.mark.parametrize(
        "log_level, expected_log_level",
        [
            ("debug", logging.DEBUG),
            ("info", logging.INFO),
            ("error", logging.ERROR),
            ("warning", logging.INFO),
            ("critical", logging.INFO),
            ("12345", logging.INFO),
            (None, logging.INFO),
            ("None", logging.INFO),
            ("", logging.INFO),
        ],
    )
    def test_update_log_level(self, log_level, expected_log_level):
        """
        Tests updating log level
        """
        log_manager = LogManager()
        log_manager.create_logger()
        assert log_manager._instance is not None
        assert log_manager._log_level is logging.INFO

        log_manager.update_log_level(log_level)
        assert log_manager._instance is not None
        assert log_manager._log_level is expected_log_level
