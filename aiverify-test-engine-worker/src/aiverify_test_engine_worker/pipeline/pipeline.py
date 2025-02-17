import os
import importlib.util
import inspect
from typing import Dict, Type, List, Tuple
from pathlib import Path
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
            # (PipeStageEum.VALIDATE_INPUT, os.getenv("PIPELINE_VALIDATE_INPUT", "validate_input")),
            # (PipeStageEum.PIPE_BUILD, os.getenv("PIPELINE_BUILD", "virtual_env")),
            # (PipeStageEum.PIPE_EXECUTE, os.getenv("PIPELINE_EXECUTE", "python_execute")),
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
        for stage, pipe_instance in self.stages:
            try:
                # Execute the pipe instance
                task_data = pipe_instance.execute(task_data)
            except PipeException as e:
                print(f"Error in {stage.value}: {e}")
                raise

        logger.debug(f"Run complete: {task_data}")
        return task_data

    def teardown(self):
        """Call `teardown()` for each loaded pipe instance."""
        for _, pipe_instance in self.stages:
            pipe_instance.teardown()