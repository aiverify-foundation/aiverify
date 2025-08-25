from ..pipe import Pipe
from ..schemas import PipelineData, PipeStageEnum
from ...lib.logging import logger


class KubeUpload(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.UPLOAD

    @property
    def pipe_name(self) -> str:
        return "kube_upload"

    def setup(self):
        logger.debug("KubeUpload dummy setup called.")

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.debug(
            "KubeUpload is a no-op pipe; returning task data unchanged.")

        return task_data
