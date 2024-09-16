import os
import logging

LOG_FORMAT = "[%(asctime)s] | [%(levelname)s]: %(message)s"

logger = logging.getLogger("aiverify_apigw")
if "APIGW_LOG_LEVEL" in os.environ:
    ch = logging.StreamHandler()
    loglevel = os.environ["APIGW_LOG_LEVEL"]
    print(f"Setting log level to {loglevel}", flush=True)
    numeric_level = getattr(logging, loglevel.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError('Invalid log level: %s' % loglevel)
    # logging.basicConfig(level=numeric_level)
    logger.setLevel(level=numeric_level)
    # set formatter
    formatter = logging.Formatter(LOG_FORMAT)
    ch.setFormatter(formatter)
    logger.addHandler(ch)
