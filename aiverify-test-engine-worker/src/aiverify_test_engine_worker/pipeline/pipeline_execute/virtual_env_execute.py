from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEum
from ...lib.filecache import algo_cache
from ...lib.logging import logger

import os
import sys
from pathlib import Path
import subprocess


class VirtualEnvironmentExecute(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEum:
        return PipeStageEum.PIPELINE_EXECUTE

    @property
    def pipe_name(self) -> str:
        return "virtual_environment_execute"

    def setup(self):
        self.python_bin = os.getenv("PYTHON", "python3")

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.info(f"Executing algorithm using venv under {task_data.algorithm_path}")
        try:
            # Get algorithm path from pipeline data
            algorithm_script_path = task_data.algorithm_script_path

            # Create virtual environment
            venv_path = task_data.algorithm_path.joinpath('.venv')
            venv_bin = venv_path.joinpath("bin")
            python_executable = venv_bin.joinpath("python")

            # Install the algorithm package in editable mode
            subprocess.run([python_executable, 'install', '-e', '.'],
                           cwd=algorithm_path,
                           check=True)

            task_data.intermediate_data[self.pipe_name] = {
                "hello": "world"
            }
            return task_data

        except subprocess.CalledProcessError as e:
            algo_cache.delete_cache(task_data.algorithm_id)
            raise PipeException(f"Failed to build virtual environment: {str(e)}")
        except Exception as e:
            algo_cache.delete_cache(task_data.algorithm_id)
            raise PipeException(f"Unexpected error during virtual environment build: {str(e)}")
