from ..pipe import Pipe
from ..schemas import PipelineData, PipeStageEum

import os

class ApigwDownload(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEum:
        return PipeStageEum.DOWNLOAD

    @property
    def pipe_name(self) -> str:
        return "apigw_download"
    
    def setup(self):
        self.apigw_url = os.getenv("APIGW_URL", "http://127.0.0.1:4000")

    def execute(self, task: PipelineData) -> PipelineData:
        # Implementation of the download logic
        print(f"Execute Download task {task}")
        task.intermediate_data[self.pipe_stage] = {
            "hello": "world"
        }
        return task
    