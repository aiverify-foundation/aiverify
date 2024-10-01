import logging

import pytest
from aiverify_test_engine.utils.log_utils import log_message


class TestCollectionLogUtils:
    pytest.logger = logging.getLogger(__name__)

    @pytest.mark.parametrize(
        "input_logger, input_log_level, input_message",
        [
            (pytest.logger, logging.DEBUG, "message"),
            (pytest.logger, logging.INFO, "message"),
            (pytest.logger, logging.WARNING, "message"),
            (pytest.logger, logging.ERROR, "message"),
            (pytest.logger, logging.CRITICAL, "message"),
            (None, logging.INFO, "message"),
            ("None", logging.INFO, "message"),
            ({}, logging.INFO, "message"),
            ([], logging.INFO, "message"),
            (123, logging.INFO, "message"),
            (pytest.logger, None, "message"),
            (pytest.logger, "None", "message"),
            (pytest.logger, {}, "message"),
            (pytest.logger, [], "message"),
            (pytest.logger, 123, "message"),
            (pytest.logger, logging.DEBUG, None),
            (pytest.logger, logging.INFO, "None"),
            (pytest.logger, logging.WARNING, {}),
            (pytest.logger, logging.ERROR, []),
            (pytest.logger, logging.CRITICAL, 123),
        ],
    )
    def test_log_message(self, input_logger, input_log_level, input_message):
        """
        Tests logging message
        """
        try:
            log_message(input_logger, input_log_level, input_message)

        except Exception as error:
            raise RuntimeError(str(error))
