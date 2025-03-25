from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.filecache import algo_cache
from ...lib.logging import logger

import os
import subprocess


class VirtualEnvironmentBuild(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.PIPELINE_BUILD

    @property
    def pipe_name(self) -> str:
        return "virtual_environment_build"

    def setup(self):
        self.python_bin = os.getenv("PYTHON", "python3")

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.info(f"Building algorithm using venv under {task_data.algorithm_path}")
        try:
            # Get algorithm path from pipeline data
            algorithm_path = task_data.algorithm_path

            # Create virtual environment
            venv_path = algorithm_path.joinpath('.venv')
            if not venv_path.exists():
                subprocess.run([self.python_bin, '-m', 'venv', "--system-site-packages", str(venv_path)], check=True)

            # Get the appropriate pip executable for the virtual environment
            venv_bin = venv_path.joinpath("bin")
            pip_executable = venv_bin.joinpath("pip")

            # Install the algorithm package in editable mode
            subprocess.run([pip_executable, 'install', '-e', '.'],
                           cwd=algorithm_path,
                           check=True)

            return task_data

        except subprocess.CalledProcessError as e:
            algo_cache.delete_cache(task_data.algorithm_id)
            raise PipeException(f"Failed to build virtual environment: {str(e)}")
        except Exception as e:
            algo_cache.delete_cache(task_data.algorithm_id)
            raise PipeException(f"Unexpected error during virtual environment build: {str(e)}")
