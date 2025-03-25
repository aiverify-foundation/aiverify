import os
import importlib.util
import inspect
from typing import List, Tuple
from ..lib.logging import logger
from .pipe import Pipe, PipeException
from .schemas import PipelineData, PipeStageEnum


class PipelineException(Exception):
    pass


class Pipeline:
    def __init__(self):
        self.stages: List[Tuple[PipeStageEnum, Pipe]] = self._load_stages()

    @staticmethod
    def _load_pipe_module(stage: PipeStageEnum, module_name: str):
        logger.info(f"Loading module {stage.value}.{module_name}")
        # Dynamically load the module and get the pipe class
        module = importlib.import_module(f"aiverify_test_engine_worker.pipeline.{stage.value}.{module_name}")
        logger.debug(f"module: {module}")
        pipe_class: type[Pipe] | None = None
        for name, obj in inspect.getmembers(module):
            try:
                if name != 'Pipe' and issubclass(obj, Pipe):
                    pipe_class = obj
            except:
                pass
        if pipe_class is None:
            raise PipelineException(f"Pipe subclass {module_name} not defined in module")
        # Instantiate the pipe and call `setup()`
        pipe_instance = pipe_class()
        pipe_instance.setup()
        return pipe_instance

    def _load_stages(self) -> List[Tuple[PipeStageEnum, Pipe]]:
        """Load the pipeline stages dynamically based on environment variables."""
        # Array of tuples representing stage-to-module mapping
        stage_mapping: List[Tuple[PipeStageEnum, str]] = [
            (PipeStageEnum.DOWNLOAD, os.getenv("PIPELINE_DOWNLOAD", "apigw_download")),
            (PipeStageEnum.PIPELINE_BUILD, os.getenv("PIPELINE_BUILD", "virtual_env")),
            (PipeStageEnum.VALIDATE_INPUT, os.getenv("PIPELINE_VALIDATE_INPUT", "validate_input")),
            (PipeStageEnum.PIPELINE_EXECUTE, os.getenv("PIPELINE_EXECUTE", "virtual_env_execute")),
            # (PipeStageEnum.VALIDATE_OUTPUT, os.getenv("PIPELINE_VALIDATE_OUTPUT", "validate_output")),
            (PipeStageEnum.UPLOAD, os.getenv("PIPELINE_UPLOAD", "apigw_upload")),
        ]
        error_pipe_name = os.getenv(PipeStageEnum.PIPELINE_ERROR, os.getenv("PIPELINE_ERROR", "apigw_error_update"))
        error_pipe = None
        if error_pipe_name:
            error_pipe = self.__class__._load_pipe_module(PipeStageEnum.PIPELINE_ERROR, error_pipe_name)
            self.error_pipe = error_pipe

        stages = []
        for stage, module_name in stage_mapping:
            pipe_instance = self.__class__._load_pipe_module(stage, module_name)
            # Store the instance in the stages dictionary
            stages.append((stage, pipe_instance))

        logger.debug(f"stages: {stages}")

        return stages

    def run(self, task_data: PipelineData) -> PipelineData:
        """Run the pipeline stages in sequence."""
        algorithmId = f"{task_data.task.algorithmGID}_{task_data.task.algorithmCID}"
        task_data.algorithm_id = algorithmId
        logger.info(f"Running pipeline: {task_data}")
        for stage, pipe_instance in self.stages:
            if stage == PipeStageEnum.PIPELINE_BUILD and not task_data.to_build:
                continue  # only build when to_build set to True
            try:
                # Execute the pipe instance
                task_data = pipe_instance.execute(task_data)
            except PipeException as e:
                task_data.error_message = str(e)
                logger.error(f"Error in stage {stage.value}: {task_data.error_message}")
                if self.error_pipe:
                    try:
                        self.error_pipe.execute(task_data)
                    except:
                        pass # ignore any errors
                raise e

        logger.info(f"Pipeline run complete")
        return task_data

    def teardown(self):
        """Call `teardown()` for each loaded pipe instance."""
        for _, pipe_instance in self.stages:
            pipe_instance.teardown()
