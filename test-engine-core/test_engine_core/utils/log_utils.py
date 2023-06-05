import inspect
import logging
from pathlib import Path
from types import FrameType
from typing import cast


def log_message(logger: logging.Logger, log_level: int, message: str) -> None:
    """
    A helper function to log messages to store events occurred

    Args:
        logger (Logger): The app logger instance for the message to be logged to
        log_level (int): The log level of the message
        message (str): The log message
    """
    if logger and isinstance(logger, logging.Logger) and isinstance(message, str):
        # Get caller
        caller_info = cast(FrameType, cast(FrameType, inspect.currentframe()).f_back)
        caller_info_str = (
            f"{Path(caller_info.f_code.co_filename).name}:{caller_info.f_code.co_name}"
            f"({caller_info.f_lineno})"
        )
        message = message.replace("<", "{")
        message = message.replace(">", "}")

        if log_level is logging.DEBUG:
            logger.debug(f"[{caller_info_str}]: {message}")

        elif log_level is logging.INFO:
            logger.info(f"[{caller_info_str}]: {message}")

        elif log_level is logging.WARNING:
            logger.warning(f"[{caller_info_str}]: {message}")

        elif log_level is logging.ERROR:
            logger.error(f"[{caller_info_str}]: {message}")

        elif log_level is logging.CRITICAL:
            logger.critical(f"[{caller_info_str}]: {message}")

        else:
            pass  # Invalid log level
    else:
        pass  # No log instance
