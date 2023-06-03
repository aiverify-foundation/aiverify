import logging

import pytest
from test_engine_core.logging.error_manager import ErrorManager
from test_engine_core.logging.log_manager import LogManager

from test_engine_app.app_logger import AppLogger


class TestCollectionAppLogger:
    pytest.my_logger = AppLogger()
    pytest.my_logger.generate_logger()

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        AppLogger.log_id = None
        AppLogger.logger_instance = None
        AppLogger.raw_logger_instance = None
        AppLogger.log_filepath = None
        AppLogger.error_logger_instance = None
        AppLogger.error_filepath = None

        # Perform tests
        yield

        # Reset
        AppLogger.log_id = None
        AppLogger.logger_instance = None
        AppLogger.raw_logger_instance = None
        AppLogger.log_filepath = None
        AppLogger.error_logger_instance = None
        AppLogger.error_filepath = None

    def test_init(self):
        """
        Tests init
        """
        new_applogger = AppLogger()

        assert new_applogger.log_id is None
        assert new_applogger.logger_instance is None
        assert new_applogger.raw_logger_instance is None
        assert new_applogger.log_filepath == ""
        assert new_applogger.error_logger_instance is None
        assert new_applogger.error_filepath == ""

    def test_generate_logger(self):
        """
        Tests generating logger
        """
        new_applogger = AppLogger()

        assert new_applogger.log_id is None
        assert new_applogger.logger_instance is None
        assert new_applogger.raw_logger_instance is None
        assert new_applogger.log_filepath == ""
        assert new_applogger.error_logger_instance is None
        assert new_applogger.error_filepath == ""

        new_applogger.generate_logger()

        assert new_applogger.log_id is not None

        assert new_applogger.logger_instance is not None
        assert isinstance(new_applogger.logger_instance, LogManager)
        assert new_applogger.raw_logger_instance == new_applogger.logger_instance.get_logger()
        assert new_applogger.raw_logger_instance.getEffectiveLevel() == logging.DEBUG
        assert new_applogger.log_filepath == new_applogger.logger_instance.get_log_filepath()

        assert new_applogger.error_logger_instance is not None
        assert isinstance(new_applogger.error_logger_instance, ErrorManager)
        assert new_applogger.error_filepath == new_applogger.error_logger_instance.get_error_filepath()

    @pytest.mark.parametrize(
        "task_id, expected_task_id",
        [
            (
                "my_task_id",
                "my_task_id"
            ),
            (
                None,
                "generate_uuid"
            ),
            (
                "None",
                "generate_uuid"
            ),
            (
                {},
                "generate_uuid"
            ),
            (
                [],
                "generate_uuid"
            ),
            (
                1234,
                "generate_uuid"
            )
        ]
    )
    def test_generate_stream_logger(self, task_id, expected_task_id):
        """
        Tests generating stream logger
        """
        new_applogger = AppLogger()

        assert new_applogger.log_id is None
        assert new_applogger.logger_instance is None
        assert new_applogger.raw_logger_instance is None
        assert new_applogger.log_filepath == ""
        assert new_applogger.error_logger_instance is None
        assert new_applogger.error_filepath == ""

        if expected_task_id == "generate_uuid":
            new_applogger.generate_stream_logger(task_id)
            assert isinstance(new_applogger.log_id, str)
        else:
            new_applogger.generate_stream_logger(task_id)
            assert new_applogger.log_id == task_id

        assert new_applogger.logger_instance is not None
        assert isinstance(new_applogger.logger_instance, LogManager)
        assert new_applogger.raw_logger_instance.getEffectiveLevel() == logging.INFO
        assert new_applogger.raw_logger_instance == new_applogger.logger_instance.get_logger()
        assert new_applogger.log_filepath == new_applogger.logger_instance.get_log_filepath()

        assert new_applogger.error_logger_instance is not None
        assert isinstance(new_applogger.error_logger_instance, ErrorManager)
        assert new_applogger.error_filepath == new_applogger.error_logger_instance.get_error_filepath()

    @pytest.mark.parametrize(
        "app_logger, log_level, log_message",
        [
            (
                pytest.my_logger, logging.NOTSET, "mylogmessage",
            ),
            (
                pytest.my_logger, logging.DEBUG, "mylogmessage",
            ),
            (
                pytest.my_logger, logging.INFO, "mylogmessage",
            ),
            (
                pytest.my_logger, logging.WARNING, "mylogmessage",
            ),
            (
                pytest.my_logger, logging.ERROR, "mylogmessage",
            ),
            (
                pytest.my_logger, logging.CRITICAL, "mylogmessage",
            ),
            (
                None, logging.CRITICAL, "mylogmessage",
            ),
            (
                "None", logging.CRITICAL, "mylogmessage",
            ),
            (
                {}, logging.CRITICAL, "mylogmessage",
            ),
            (
                [], logging.CRITICAL, "mylogmessage",
            ),
            (
                1234, logging.CRITICAL, "mylogmessage",
            ),
            (
                pytest.my_logger, None, "mylogmessage",
            ),
            (
                pytest.my_logger, "None", "mylogmessage",
            ),
            (
                pytest.my_logger, [], "mylogmessage",
            ),
            (
                pytest.my_logger, {}, "mylogmessage",
            ),
            (
                pytest.my_logger, 1234, "mylogmessage",
            ),
            (
                pytest.my_logger, logging.CRITICAL, None,
            ),
            (
                pytest.my_logger, logging.CRITICAL, "None",
            ),
            (
                pytest.my_logger, logging.CRITICAL, [],
            ),
            (
                pytest.my_logger, logging.CRITICAL, {},
            ),
            (
                pytest.my_logger, logging.CRITICAL, 1234,
            ),
        ]
    )
    def test_add_to_log(self, app_logger, log_level, log_message):
        """
        Tests adding message to log
        """
        AppLogger.add_to_log(app_logger, log_level, log_message)

    @pytest.mark.parametrize(
        "app_logger, category, code, description, severity, component",
        [
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                None, "mycategory", "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                "None", "mycategory", "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                {}, "mycategory", "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                [], "mycategory", "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                1234, "mycategory", "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, None, "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "None", "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, {}, "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, [], "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, 1234, "mycode", "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", None, "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "None", "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", {}, "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", [], "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", 1234, "mydescription", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", None, "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "None", "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", {}, "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", [], "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", 1234, "myseverity", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", None, "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", "None", "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", {}, "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", [], "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", 1234, "mycomponent"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", "myseverity", None
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", "myseverity", "None"
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", "myseverity", {}
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", "myseverity", []
            ),
            (
                pytest.my_logger, "mycategory", "mycode", "mydescription", "myseverity", 1234
            ),
        ]
    )
    def test_add_error_to_log(self, app_logger, category, code, description, severity, component):
        """
        Tests adding error message to log
        """
        AppLogger.add_error_to_log(app_logger, category, code, description, severity, component)

    @pytest.mark.parametrize(
        "app_logger, expected_output",
        [
            (
                pytest.my_logger,
                "HelloWorld"
            ),
            (
                None,
                ""
            ),
            (
                "None",
                ""
            ),
            (
                {},
                ""
            ),
            (
                [],
                ""
            ),
            (
                1234,
                ""
            ),
        ]
    )
    def test_get_errors_in_json_str(self, mocker, app_logger, expected_output):
        """
        Tests getting errors in json_str
        """
        with mocker.patch.object(ErrorManager, "get_errors_as_json_string", return_value="HelloWorld"):
            output = AppLogger.get_errors_in_json_str(app_logger)
            assert output == expected_output

    @pytest.mark.parametrize(
        "app_logger, return_value, expected_output",
        [
            (
                pytest.my_logger,
                True,
                True
            ),
            (
                None,
                True,
                False
            ),
            (
                "None",
                True,
                False
            ),
            (
                {},
                True,
                False
            ),
            (
                [],
                True,
                False
            ),
            (
                1234,
                True,
                False
            ),
            (
                pytest.my_logger,
                False,
                False
            ),
            (
                None,
                False,
                False
            ),
            (
                "None",
                False,
                False
            ),
            (
                {},
                False,
                False
            ),
            (
                [],
                False,
                False
            ),
            (
                1234,
                False,
                False
            ),
        ]
    )
    def test_write_error_to_file(self, mocker, app_logger, return_value, expected_output):
        """
        Tests writing error to file
        """
        with mocker.patch.object(ErrorManager, "write_error_to_file", return_value=return_value):
            output = AppLogger.write_error_to_file(app_logger)
            assert output == expected_output
