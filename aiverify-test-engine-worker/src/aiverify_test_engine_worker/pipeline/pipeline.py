import os
import importlib.util
import inspect
from typing import List, Tuple
from ..lib.logging import logger
from .pipe import Pipe, PipeException
from .schemas import PipelineData, PipeStageEum

class PipelineException(Exception):
    pass

class Pipeline:
    def __init__(self):
        self.stages: List[Tuple[PipeStageEum, Pipe]] = self._load_stages()

    def _load_stages(self) -> List[Tuple[PipeStageEum, Pipe]]:
        """Load the pipeline stages dynamically based on environment variables."""
        # Array of tuples representing stage-to-module mapping
        stage_mapping: List[Tuple[PipeStageEum, str]] = [
            (PipeStageEum.DOWNLOAD, os.getenv("PIPELINE_DOWNLOAD", "apigw_download")),
            (PipeStageEum.PIPELINE_BUILD, os.getenv("PIPELINE_BUILD", "virtual_env")),
            (PipeStageEum.VALIDATE_INPUT, os.getenv("PIPELINE_VALIDATE_INPUT", "validate_input")),
            (PipeStageEum.PIPELINE_EXECUTE, os.getenv("PIPELINE_EXECUTE", "virtual_env_execute")),
            # (PipeStageEum.VALIDATE_OUTPUT, os.getenv("PIPELINE_VALIDATE_OUTPUT", "validate_output")),
            # (PipeStageEum.UPLOAD, os.getenv("PIPELINE_UPLOAD", "apigw_upload")),
        ]

        stages = []
        for stage, module_name in stage_mapping:
            # Dynamically load the module and get the pipe class
            logger.info(f"Loading module {stage.value}.{module_name}")
            module = importlib.import_module(f"aiverify_test_engine_worker.pipeline.{stage.value}.{module_name}")
            logger.debug(f"module: {module}")
            pipe_class: type[Pipe]|None = None
            for name, obj in inspect.getmembers(module):
                try:
                    if name != 'Pipe' and issubclass(obj, Pipe):
                        pipe_class = obj
                except:
                    pass
            if pipe_class is None:
                raise PipelineException(f"Pipe subclass not defined in module")
            # Instantiate the pipe and call `setup()`
            pipe_instance = pipe_class()
            pipe_instance.setup()
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
            if stage == PipeStageEum.PIPELINE_BUILD and not task_data.to_build:
                continue # only build when to_build set to True
            try:
                # Execute the pipe instance
                task_data = pipe_instance.execute(task_data)
            except PipeException as e:
                logger.error(f"Error in stage {stage.value}: {str(e)}")
                raise e

        logger.info(f"Pipeline run complete")
        return task_data

    def teardown(self):
        """Call `teardown()` for each loaded pipe instance."""
        for _, pipe_instance in self.stages:
            pipe_instance.teardown()