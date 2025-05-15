import os
import importlib
# from aiverify_apigw.lib.logging import logging
from io import StringIO
from unittest.mock import patch
import pytest

def reload_logging_module():
    # Remove the module from sys.modules to force a reload
    import sys
    if "logging" in sys.modules:
        del sys.modules["logging"]
    import logging
    return importlib.import_module("logging")

class TestCustomFormatter:
    def test_format_debug(self):
        logging_module = reload_logging_module()
        formatter = logging_module.CustomFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.DEBUG,
            pathname="test.py",
            lineno=10,
            msg="Test debug message",
            args=None,
            exc_info=None,
        )
        formatted_message = formatter.format(record)
        assert "DEBUG" in formatted_message
        assert "Test debug message" in formatted_message

    def test_format_info(self):
        logging_module = reload_logging_module()
        formatter = logging_module.CustomFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=10,
            msg="Test info message",
            args=None,
            exc_info=None,
        )
        formatted_message = formatter.format(record)
        assert "INFO" in formatted_message
        assert "Test info message" in formatted_message

    def test_format_warning(self):
        logging_module = reload_logging_module()
        formatter = logging_module.CustomFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.WARNING,
            pathname="test.py",
            lineno=10,
            msg="Test warning message",
            args=None,
            exc_info=None,
        )
        formatted_message = formatter.format(record)
        assert "WARNING" in formatted_message
        assert "Test warning message" in formatted_message

    def test_format_error(self):
        logging_module = reload_logging_module()
        formatter = logging_module.CustomFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="test.py",
            lineno=10,
            msg="Test error message",
            args=None,
            exc_info=None,
        )
        formatted_message = formatter.format(record)
        assert "ERROR" in formatted_message
        assert "Test error message" in formatted_message

    def test_format_critical(self):
        logging_module = reload_logging_module()
        formatter = logging_module.CustomFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.CRITICAL,
            pathname="test.py",
            lineno=10,
            msg="Test critical message",
            args=None,
            exc_info=None,
        )
        formatted_message = formatter.format(record)
        assert "CRITICAL" in formatted_message
        assert "Test critical message" in formatted_message

class TestLoggerConfiguration:
    @patch.dict(os.environ, {"APIGW_LOG_LEVEL": "DEBUG"})
    def test_logger_configuration_debug(self):
        logging_module = reload_logging_module()
        logger = logging_module.logger
        # Capture log output
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(logging_module.CustomFormatter())
        logger.addHandler(handler)
        # Log a message
        logger.debug("Test debug message")
        # Check the output
        log_output = log_stream.getvalue()
        assert "DEBUG" in log_output
        assert "Test debug message" in log_output

    @patch.dict(os.environ, {"APIGW_LOG_LEVEL": "INFO"})
    def test_logger_configuration_info(self):
        logging_module = reload_logging_module()
        logger = logging_module.logger
        # Capture log output
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(logging_module.CustomFormatter())
        logger.addHandler(handler)
        # Log a message
        logger.info("Test info message")
        # Check the output
        log_output = log_stream.getvalue()
        assert "INFO" in log_output
        assert "Test info message" in log_output

    @patch.dict(os.environ, {"APIGW_LOG_LEVEL": "WARNING"})
    def test_logger_configuration_warning(self):
        logging_module = reload_logging_module()
        logger = logging_module.logger
        # Capture log output
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(logging_module.CustomFormatter())
        logger.addHandler(handler)
        # Log a message
        logger.warning("Test warning message")
        # Check the output
        log_output = log_stream.getvalue()
        assert "WARNING" in log_output
        assert "Test warning message" in log_output

    @patch.dict(os.environ, {"APIGW_LOG_LEVEL": "ERROR"})
    def test_logger_configuration_error(self):
        logging_module = reload_logging_module()
        logger = logging_module.logger
        # Capture log output
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(logging_module.CustomFormatter())
        logger.addHandler(handler)
        # Log a message
        logger.error("Test error message")
        # Check the output
        log_output = log_stream.getvalue()
        assert "ERROR" in log_output
        assert "Test error message" in log_output

    @patch.dict(os.environ, {"APIGW_LOG_LEVEL": "CRITICAL"})
    def test_logger_configuration_critical(self):
        logging_module = reload_logging_module()
        logger = logging_module.logger
        # Capture log output
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(logging_module.CustomFormatter())
        logger.addHandler(handler)
        # Log a message
        logger.critical("Test critical message")
        # Check the output
        log_output = log_stream.getvalue()
        assert "CRITICAL" in log_output
        assert "Test critical message" in log_output

    @patch.dict(os.environ, {"APIGW_LOG_LEVEL": "INVALID"})
    def test_logger_configuration_invalid_level(self):
        with pytest.raises(ValueError, match="Invalid log level: INVALID"):
            logging_module = reload_logging_module()