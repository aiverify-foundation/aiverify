from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.logging import logger

import os
import json
import subprocess
from pathlib import Path
import uuid


class DockerRun(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.PIPELINE_EXECUTE

    @property
    def pipe_name(self) -> str:
        return "docker_run"

    def setup(self):
        self.docker_bin = os.getenv("DOCKER", "docker")
        self.algo_execute = Path(__file__).parent.joinpath("algo_execute.py")
        self.apigw_url = os.getenv("DOCKER_APIGW_URL", "http://host.docker.internal:4000")
        self.docker_registry = os.getenv("DOCKER_REGISTRY", None)
        if self.docker_registry and len(self.docker_registry) == 0:
            self.docker_registry = None

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.info(f"Executing algorithm using docker run under {task_data.algorithm_path}")
        try:
            # output_folder = task_data.algorithm_path.joinpath("output")
            # if output_folder.exists():
            #     shutil.rmtree(output_folder)
            tag = f"{task_data.task.algorithmCID}:{task_data.task.algorithmHash[:128] if task_data.task.algorithmHash else 'latest'}"
            if self.docker_registry:
                tag = f"{self.docker_registry}/{tag}"
            container_name = uuid.uuid4().hex
            logger.debug(f"tag: {tag}, container_name: {container_name}")

            # docker run infinite
            cmds = [
                self.docker_bin,
                "run",
                "--name", container_name,
                "--rm",
                "-d",
                "--entrypoint",
                "/bin/sh",
                tag,
                "-c", "trap : TERM INT; sleep infinity & wait",
                tag,
            ]
            logger.debug(f"docker run infinite: {cmds}")
            subprocess.run(cmds, check=True)

            # copy the data files into the container
            container_data_path = f"/app/data/{task_data.data_path.name}"
            container_model_path = f"/app/data/{task_data.model_path.name}"
            cmds = [
                self.docker_bin,
                "cp",
                task_data.data_path.absolute().as_posix(),
                f"{container_name}:{container_data_path}"
            ]
            logger.debug(f"docker cp data path: {cmds}")
            subprocess.run(cmds, check=True)
            cmds = [
                self.docker_bin,
                "cp",
                task_data.model_path.absolute().as_posix(),
                f"{container_name}:{container_model_path}"
            ]
            logger.debug(f"docker cp model path: {cmds}")
            subprocess.run(cmds, check=True)
            
            if task_data.ground_truth_path and task_data.task.groundTruth:
                if task_data.ground_truth_path.samefile(task_data.data_path):
                    container_ground_truth_path = container_data_path
                else:
                    container_ground_truth_path = f"/app/data/{task_data.ground_truth_path.name}"
                    cmds = [
                        self.docker_bin,
                        "cp",
                        task_data.ground_truth_path.absolute().as_posix(),
                        f"{container_name}:{container_ground_truth_path}"
                    ]
                    logger.debug(f"docker cp ground truth path: {cmds}")
                    subprocess.run(cmds, check=True)
            
            json_args_dict = task_data.task.algorithmArgs
            
            # Modify paths in the dict
            for key, value in json_args_dict.items():
                if isinstance(value, str) and os.path.isabs(value) and os.path.exists(value):
                    filename = os.path.basename(value)
                    # Replace with new path inside container
                    new_path = f"/app/data/{filename}"
                    json_args_dict[key] = new_path
                    
            # Convert to JSON
            json_args = json.dumps(json_args_dict)
            
            # docker exec
            # output_folder.chmod(0o777)
            cmds = [
                self.docker_bin,
                "exec",
                container_name,
                "python", "-m", "scripts.algo_execute",
                "--test_run_id", task_data.task.id,
                # "--algo_path", f"/app/data/{task_data.algorithm_path.parent.name}/{task_data.algorithm_path.name}",
                "--algo_path", f"/app/algo",
                "--data_path", container_data_path,
                "--model_path", container_model_path,
                "--model_type", task_data.task.modelType.lower(),
                "--algorithm_args", json_args,
                "--apigw_url", self.apigw_url,
            ]
            if task_data.ground_truth_path and task_data.task.groundTruth:
                cmds.extend([
                    "--ground_truth_path", container_ground_truth_path,
                    "--ground_truth", task_data.task.groundTruth
                ])
            logger.debug(f"cmds: {cmds}")
            print(" ".join(cmds))

            # Run the algorithm
            p = subprocess.run(cmds,
                               #    cwd=task_data.algorithm_path,
                               check=True, capture_output=True,
                               )
            if p.returncode != 0:
                raise PipeException(f"Error executing algorithm: {p.stderr}")
            # logger.debug(p.stdout)  # log the stdout as debug

            # copy from pod
            output_zip = task_data.algorithm_path.joinpath("output.zip")
            cmds = [
                self.docker_bin,
                "cp",
                f"{container_name}:/app/algo/output.zip",
                output_zip.absolute().as_posix(),
            ]
            logger.debug(f"docker cp output cmds: {cmds}")
            # print(" ".join(cmds))

            p = subprocess.run(cmds, check=True, capture_output=True,)
            if p.returncode != 0:
                raise PipeException(f"Error executing algorithm: {p.stderr}")

            if not output_zip.exists():
                raise PipeException(f"Output zip not generated")

            task_data.output_zip = output_zip
            return task_data

        except subprocess.CalledProcessError as e:
            raise PipeException(f"Failed to run algorithm: {str(e)}")
        except Exception as e:
            raise PipeException(f"Unexpected error during algorithm execute: {str(e)}")
        finally:
            cmds = [
                self.docker_bin,
                "stop",
                container_name,
            ]
            subprocess.run(cmds)  # don't care about exception
