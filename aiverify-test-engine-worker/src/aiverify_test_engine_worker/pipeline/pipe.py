from abc import ABC, abstractmethod
from .schemas import PipelineData, PipeStageEum


class PipeException(Exception):
    pass


class Pipe(ABC):
    def setup(self):
        """Overwrite to run setup routine"""
        pass

    def teardown(self):
        """Overwrite to run teardown routine"""
        pass

    @property
    @abstractmethod
    def pipe_stage(self) -> PipeStageEum:
        pass

    @property
    @abstractmethod
    def pipe_name(self) -> str:
        pass

    @abstractmethod
    def execute(self, task_data: PipelineData) -> PipelineData:
        pass
