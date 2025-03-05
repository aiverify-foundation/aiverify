from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEum
from ...lib.logging import logger

import os
import json
import subprocess
from pathlib import Path


class VirtualEnvironmentExecute(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEum:
        return PipeStageEum.PIPELINE_EXECUTE

    @property
    def pipe_name(self) -> str:
        return "virtual_environment_execute"

    def setup(self):
        self.python_bin = os.getenv("PYTHON", "python3")
        self.algo_execute = Path(__file__).parent.joinpath("algo_execute.py")

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.info(f"Executing algorithm using venv under {task_data.algorithm_path}")
        try:
            # Create virtual environment
            venv_path = task_data.algorithm_path.joinpath('.venv')
            venv_bin = venv_path.joinpath("bin")
            python_executable = venv_bin.joinpath("python")

            cmds = [
                str(python_executable.absolute()),
                self.algo_execute,
                "--test_run_id", task_data.task.id,
                "--algo_path", str(task_data.algorithm_path.absolute()),
                "--data_path", str(task_data.data_path.absolute()),
                "--model_path", str(task_data.model_path.absolute()),
                "--model_type", task_data.task.modelType.lower(),
                "--algorithm_args", json.dumps(task_data.task.algorithmArgs),
            ]
            if task_data.ground_truth_path:
                cmds.extend([
                    "--ground_truth_path", str(task_data.ground_truth_path.absolute()),
                    "--ground_truth", task_data.task.groundTruth
                ])
            logger.debug(f"cmds: {cmds}")

            # Install the algorithm package in editable mode
            p = subprocess.run(cmds,
                               cwd=task_data.algorithm_path,
                               check=True, stdin=True, stdout=True,
                               env={"PYTHONPATH": str(Path(__file__).parent.parent.parent.parent)}
                               )
            if p.returncode != 0:
                raise PipeException(f"Error executing algorithm: {p.stderr}")
            logger.debug(p.stdout)  # log the stdout as debug

            task_data.output_zip = task_data.algorithm_path.joinpath("output.zip")
            if not task_data.output_zip.exists():
                raise PipeException(f"Output zip not generated")

            return task_data

        except subprocess.CalledProcessError as e:
            raise PipeException(f"Failed to run algorithm: {str(e)}")
        except Exception as e:
            raise PipeException(f"Unexpected error during algorithm execute: {str(e)}")
