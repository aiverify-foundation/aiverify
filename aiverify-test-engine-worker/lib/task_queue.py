import os
from .client import client
from uuid import uuid4

class TaskQueue:
  GROUP_NAME = "aiverify_workers"
  STREAM_NAME = os.getenv("TASKQUEUE_STREAM_NAME", "aiverify:worker:task_queue")

  def __init__(self):
    client.xgroup_create(name=self.STREAM_NAME, groupname=self.GROUP_NAME, mkstream=True)
    self.consumer_name = uuid4().hex

  def read_task(self):
    tasks = client.xreadgroup(groupname=self.GROUP_NAME, consumername=self.consumer_name, streams={self.STREAM_NAME: ">"}, count=1, block=3000)