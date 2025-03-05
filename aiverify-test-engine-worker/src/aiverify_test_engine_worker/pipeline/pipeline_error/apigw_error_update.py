from ..pipe import Pipe
from ..schemas import PipelineData, PipeStageEum
from ...lib.logging import logger

import os
import requests


class ApigwDownload(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEum:
        return PipeStageEum.PIPELINE_ERROR

    @property
    def pipe_name(self) -> str:
        return "apigw_error_update"

    def setup(self):
        self.apigw_url = os.getenv("APIGW_URL", "http://127.0.0.1:4000")
        # self.algo_cache = FileCache(subdir_name="algorithms")

    def execute(self, task_data: PipelineData) -> PipelineData:
        # Implementation of the download logic
        logger.debug(f"Execute Download task {task_data}")

        # Define the upload URL
        update_url = f"{self.apigw_url}/test_runs/{task_data.task.id}"

        update_obj = {
            "status": "error",
            "errorMessages": task_data.error_message
        }
        requests.post(update_url, json=update_obj)

        return task_data
