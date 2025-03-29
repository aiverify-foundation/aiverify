import os

TASK_STREAM_NAME = "aiverify:worker:task_queue"
TASK_GROUP_NAME = "aiverify_workers"

APIGW_URL = os.getenv("APIGW_URL", "http://127.0.0.1:4000").rstrip("/")
