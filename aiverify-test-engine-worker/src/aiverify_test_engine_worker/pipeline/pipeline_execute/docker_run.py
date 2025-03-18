from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEum
from ...lib.logging import logger
from ...lib.filecache import base_data_dir

import os
import json
import subprocess
from pathlib import Path
import shutil
import tempfile


class VirtualEnvironmentExecute(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEum:
        return PipeStageEum.PIPELINE_EXECUTE

    @property
    def pipe_name(self) -> str:
        return "docker_run"

    def setup(self):
        self.docker_bin = os.getenv("DOCKER", "docker")
        self.algo_execute = Path(__file__).parent.joinpath("algo_execute.py")
        self.apigw_url = os.getenv("DOCKER_APIGW_URL", "http://host.docker.internal:4000")

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.info(f"Executing algorithm using docker run under {task_data.algorithm_path}")
        try:
            # output_folder = task_data.algorithm_path.joinpath("output")
            # if output_folder.exists():
            #     shutil.rmtree(output_folder)
            tag = f"{task_data.task.algorithmCID}:{task_data.task.algorithmHash[:128] if task_data.task.algorithmHash else 'latest'}"

            with tempfile.TemporaryDirectory() as tmpdirname:
                output_folder = Path(tmpdirname)
                # output_folder.chmod(0o777)
                cmds = [
                    self.docker_bin,
                    "run",
                    "--rm",
                    # "-e", f"PYTHONPATH=/app/algo",
                    f"--name={task_data.task.algorithmCID}",
                    "-v", f"{output_folder.absolute().as_posix()}:/app/output",
                    "-v", f"{base_data_dir.absolute().as_posix()}:/app/data",
                    tag,
                    "--test_run_id", task_data.task.id,
                    "--algo_path", f"/app/data/{task_data.algorithm_path.parent.name}/{task_data.algorithm_path.name}",
                    "--data_path", f"/app/data/{task_data.data_path.parent.name}/{task_data.data_path.name}",
                    "--model_path", f"/app/data/{task_data.model_path.parent.name}/{task_data.model_path.name}",
                    "--model_type", task_data.task.modelType.lower(),
                    "--algorithm_args", json.dumps(task_data.task.algorithmArgs),
                    "--apigw_url", self.apigw_url,
                    "--output_zip", "/app/output/output.zip"
                ]
                if task_data.ground_truth_path and task_data.task.groundTruth:
                    cmds.extend([
                        "--ground_truth_path", f"/app/data/{task_data.ground_truth_path.parent.name}/{task_data.ground_truth_path.name}",
                        "--ground_truth", task_data.task.groundTruth
                    ])
                logger.debug(f"cmds: {cmds}")

                # Run the algorithm
                p = subprocess.run(cmds,
                                   #    cwd=task_data.algorithm_path,
                                   check=True, capture_output=True,
                                   )
                if p.returncode != 0:
                    raise PipeException(f"Error executing algorithm: {p.stderr}")
                # logger.debug(p.stdout)  # log the stdout as debug

                output_zip = output_folder.joinpath("output.zip")
                if not task_data.output_zip.exists():
                    raise PipeException(f"Output zip not generated")
                target_output_zip = task_data.algorithm_path.joinpath("output.zip")

                shutil.copy2(output_zip, target_output_zip)
                task_data.output_zip = target_output_zip

                return task_data

        except subprocess.CalledProcessError as e:
            raise PipeException(f"Failed to run algorithm: {str(e)}")
        except Exception as e:
            raise PipeException(f"Unexpected error during algorithm execute: {str(e)}")
