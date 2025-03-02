import os
import valkey
import uuid

from .logging import logger
from .contants import TASK_STREAM_NAME, TASK_GROUP_NAME


host = os.getenv("VALKEY_HOST_ADDRESS", "127.0.0.1")
port = int(os.getenv("VALKEY_PORT", 6379))
client = valkey.Valkey(host=host, port=port, db=0)
worker_id = str(uuid.uuid4())


def init_group():
    from valkey.exceptions import ResponseError
    try:
        client.xgroup_create(
            name=TASK_STREAM_NAME,
            groupname=TASK_GROUP_NAME,
            mkstream=True,
        )
        # client.xautoclaim(
        #     name=TASK_STREAM_NAME,
        #     groupname=TASK_GROUP_NAME,
        #     consumername='worker',
        #     count=1
        # )
        logger.info(f"Created STREAM {TASK_STREAM_NAME}")
    except ResponseError:
        pass
