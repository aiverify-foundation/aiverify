from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.logging import logger

import os
import json
import subprocess
from pathlib import Path
import uuid


class KubectlRun(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.PIPELINE_EXECUTE

    @property
    def pipe_name(self) -> str:
        return "kubectl_run"

    def setup(self):
        self.kubectl_bin = os.getenv("KUBECTL", "kubectl")
        self.algo_execute = Path(__file__).parent.joinpath("algo_execute.py")
        self.apigw_url = os.getenv("KUBECTL_APIGW_URL", "http://apigw.aiverify.svc.cluster.local:4000")
        self.extra_args = os.getenv("KUBECTL_RUN_EXTRA_ARGS", "--namespace=aiverify")
        registry = os.getenv("KUBECTL_REGISTRY", None)
        if registry is None:
            registry = os.getenv("DOCKER_REGISTRY", "")
        self.registry = registry

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.info(f"Executing algorithm using kubectl run under {task_data.algorithm_path}")
        tag = f"{task_data.task.algorithmCID}:{task_data.task.algorithmHash[:128] if task_data.task.algorithmHash else 'latest'}"
        pod_name = uuid.uuid4().hex
        logger.debug(f"tag: {tag}, pod_name: {pod_name}")
        try:
            # copy the data files into the pod
            cmds = [
                self.kubectl_bin,
                "run",
                pod_name,
                "--restart=Never",
                self.extra_args,
                f"--image={self.registry + '/' if self.registry else ''}{tag}", 
                "--command",
                "--",
                "/bin/sh", "-c", "trap : TERM INT; sleep infinity & wait"
            ]
            logger.debug(f"kubectl run infinite: {cmds}")
            subprocess.run(cmds, check=True)
            cmds = [
                self.kubectl_bin,
                "wait",
                self.extra_args,
                "--for=condition=Ready",
                f"pod/{pod_name}",
            ]
            logger.debug(f"kubectl run infinite: {cmds}")
            subprocess.run(cmds, check=True)

            # copy the data files into the pod
            pod_data_path = f"/app/data/{task_data.data_path.name}"
            pod_model_path = f"/app/data/{task_data.model_path.name}"
            cmds = [
                self.kubectl_bin,
                "cp",
                self.extra_args,
                task_data.data_path.absolute().as_posix(),
                f"{pod_name}:{pod_data_path}"
            ]
            logger.debug(f"kubectl cp data path: {cmds}")
            subprocess.run(cmds, check=True)
            cmds = [
                self.kubectl_bin,
                "cp",
                self.extra_args,
                task_data.model_path.absolute().as_posix(),
                f"{pod_name}:{pod_model_path}"
            ]
            logger.debug(f"kubectl cp model path: {cmds}")
            subprocess.run(cmds, check=True)
            
            if task_data.ground_truth_path and task_data.task.groundTruth:
                if task_data.ground_truth_path.samefile(task_data.data_path):
                    pod_ground_truth_path = pod_data_path
                else:
                    pod_ground_truth_path = f"/app/data/{task_data.ground_truth_path.name}"
                    cmds = [
                        self.kubectl_bin,
                        "cp",
                        self.extra_args,
                        task_data.ground_truth_path.absolute().as_posix(),
                        f"{pod_name}:{pod_ground_truth_path}"
                    ]
                    logger.debug(f"kubectl cp ground truth path: {cmds}")
                    subprocess.run(cmds, check=True)

            json_args_dict = task_data.task.algorithmArgs  # This is a Python dict, not yet stringified

            # Modify paths in the dict
            for key, value in json_args_dict.items():
                if isinstance(value, str) and os.path.isabs(value) and os.path.exists(value):
                    filename = os.path.basename(value)
                    # Replace with new path inside pod
                    new_path = f"/app/data/{filename}"
                    json_args_dict[key] = new_path

            # Convert to JSON
            json_args = json.dumps(json_args_dict)
            
            # kubectl exec
            cmds = [
                self.kubectl_bin,
                "exec",
                pod_name,
                self.extra_args,
                "--",
                "python", "-m", "scripts.algo_execute",
                "--test_run_id", task_data.task.id,
                # "--algo_path", f"/app/data/{task_data.algorithm_path.parent.name}/{task_data.algorithm_path.name}",
                "--algo_path", f"/app/algo",
                "--data_path", pod_data_path,
                "--model_path", pod_model_path,
                "--model_type", task_data.task.modelType.lower(),
                "--algorithm_args", json_args,
                "--apigw_url", self.apigw_url,
            ]
            if task_data.ground_truth_path and task_data.task.groundTruth:
                cmds.extend([
                    "--ground_truth_path", pod_ground_truth_path,
                    "--ground_truth", task_data.task.groundTruth
                ])
            logger.debug(f"kubectl exec cmds: {cmds}")
            # print(" ".join(cmds))

            # Run the algorithm
            p = subprocess.run(cmds,
                               #    cwd=task_data.algorithm_path,
                               check=False, capture_output=True,
                               )
            if p.returncode != 0:
                raise PipeException(f"Error executing algorithm: {p.stdout} {p.stderr}")
            # logger.debug(p.stdout)  # log the stdout as debug

            # copy from pod
            output_zip = task_data.algorithm_path.joinpath("output.zip")
            cmds = [
                self.kubectl_bin,
                "cp",
                self.extra_args,
                f"{pod_name}:/app/algo/output.zip",
                output_zip.absolute().as_posix(),
            ]
            logger.debug(f"kubectl cp output cmds: {cmds}")
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
                self.kubectl_bin,
                "delete", "pod",
                pod_name
            ]
            subprocess.run(cmds)  # don't care about exception
