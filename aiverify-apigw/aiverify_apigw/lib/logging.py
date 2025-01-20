import os
import logging

# LOG_FORMAT = "[%(asctime)s] | [%(levelname)s]: %(message)s"
LOG_FORMAT = "%(asctime)s,%(msecs)03d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s"


class CustomFormatter(logging.Formatter):
    """Custom formatter to add colors to warning, error, and critical messages."""

    # Define color codes
    grey = "\x1b[38;5;67m"
    orange = "\x1b[38;5;214m"
    red = "\x1b[31;21m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"

    FORMATS = {
        logging.DEBUG: LOG_FORMAT,
        logging.INFO: grey + LOG_FORMAT + reset,
        logging.WARNING: orange + LOG_FORMAT + reset,
        logging.ERROR: red + LOG_FORMAT + reset,
        logging.CRITICAL: bold_red + LOG_FORMAT + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)


logger = logging.getLogger("aiverify_apigw")
if "APIGW_LOG_LEVEL" in os.environ:
    ch = logging.StreamHandler()
    loglevel = os.environ["APIGW_LOG_LEVEL"]
    print(f"Setting log level to {loglevel}", flush=True)
    numeric_level = getattr(logging, loglevel.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError("Invalid log level: %s" % loglevel)
    # logging.basicConfig(level=numeric_level)
    logger.setLevel(level=numeric_level)
    # set formatter
    # formatter = logging.Formatter(LOG_FORMAT)
    ch.setFormatter(CustomFormatter())
    logger.addHandler(ch)
