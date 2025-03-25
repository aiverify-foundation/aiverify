from ..pipe import Pipe
from ..schemas import PipelineData, PipeStageEnum
from ...lib.logging import logger

import os
import requests


class ApigwErrorUpdate(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.PIPELINE_ERROR

    @property
    def pipe_name(self) -> str:
        return "apigw_error_update"

    def setup(self):
        self.apigw_url = os.getenv("APIGW_URL", "http://127.0.0.1:4000")
        # self.algo_cache = FileCache(subdir_name="algorithms")

    def execute(self, task_data: PipelineData) -> PipelineData:
        # Implementation of the download logic
        logger.debug(f"Update Pipeline error to API GW")

        # Define the upload URL
        update_url = f"{self.apigw_url}/test_runs/{task_data.task.id}"

        update_obj = {
            "status": "error",
            "errorMessages": task_data.error_message
        }
        logger.debug(f"Post error to {update_url}: {update_obj}")
        requests.patch(update_url, json=update_obj)

        return task_data
