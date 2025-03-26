from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.logging import logger

import os
import requests


class ApigwDownload(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.UPLOAD

    @property
    def pipe_name(self) -> str:
        return "apigw_upload"

    def setup(self):
        self.apigw_url = os.getenv("APIGW_URL", "http://127.0.0.1:4000")
        # self.algo_cache = FileCache(subdir_name="algorithms")

    def execute(self, task_data: PipelineData) -> PipelineData:
        # Implementation of the download logic
        logger.debug(f"Execute Upload task {task_data}")

        # Define the upload URL
        upload_url = f"{self.apigw_url}/test_results/upload_zip"

        # Open the zip file in binary mode
        with open(task_data.output_zip, 'rb') as zip_file:
            # Prepare the files dictionary for the POST request
            files = {'file': zip_file}

            # Send the POST request to upload the zip file
            response = requests.post(upload_url, files=files)

            # Check if the upload was successful
            if response.status_code == 200:
                logger.debug(f"Successfully uploaded zip file to {upload_url}")
            else:
                logger.error(
                    f"Failed to upload zip file. Status code: {response.status_code}, Response: {response.text}")
                raise PipeException(f"Upload failed with status code {response.status_code}")

        return task_data
