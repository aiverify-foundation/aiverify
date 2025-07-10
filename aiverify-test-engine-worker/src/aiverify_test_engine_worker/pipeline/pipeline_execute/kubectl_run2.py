from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.logging import logger

import os
import json
import subprocess
from pathlib import Path
import uuid
import textwrap


class KubectlRun2(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.PIPELINE_EXECUTE

    @property
    def pipe_name(self) -> str:
        return "kubectl_run2"

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
        logger.info(f"Executing algorithm using kubectl run 2 under {task_data.algorithm_path}")
        tag = f"{task_data.task.algorithmCID}:{task_data.task.algorithmHash[:128] if task_data.task.algorithmHash else 'latest'}"
        job_name = uuid.uuid4().hex
        logger.debug(f"tag: {tag}, job_name: {job_name}")
        
        pod_data_path = f"/app/data/datasets/{task_data.data_path.name}"
        pod_model_path = f"/app/data/models/{task_data.model_path.name}"

        json_args_dict = task_data.task.algorithmArgs  # This is a Python dict, not yet stringified

        # Modify paths in the dict
        for key, value in json_args_dict.items():
            if isinstance(value, str) and os.path.isabs(value) and os.path.exists(value):
                if value.startswith("/app/aiverify-test-engine-worker/data/datasets"):
                    # Map to /app/data/datasets
                    relative_path = os.path.relpath(value, "/app/aiverify-test-engine-worker/data/datasets")
                    new_path = os.path.join("/app/data/datasets", relative_path)
                    json_args_dict[key] = new_path
                elif value.startswith("/app/aiverify-test-engine-worker/data/models"):
                    # Map to /app/data/models
                    relative_path = os.path.relpath(value, "/app/aiverify-test-engine-worker/data/models")
                    new_path = os.path.join("/app/data/models", relative_path)
                    json_args_dict[key] = new_path
                else:
                    raise ValueError(f"Unsupported path: {value}")

        # Convert to JSON with properly escaped quotes
        json_args = json.dumps(json_args_dict).replace('"', '\\"')
        
        # Build command-line arguments
        args = [
            "--test_run_id", task_data.task.id,
            "--algo_path", "/app/algo",
            "--data_path", pod_data_path,  
            "--model_path", pod_model_path, 
            "--model_type", task_data.task.modelType.lower(),
            "--algorithm_args", json_args,
            "--apigw_url", self.apigw_url,
            "--upload_output_to_apigw",
        ]

        if task_data.ground_truth_path and task_data.task.groundTruth:
            args += [
                "--ground_truth_path", f"/app/data/datasets/{task_data.ground_truth_path.name}",
                "--ground_truth", task_data.task.groundTruth
            ]
            
        args_yaml = "\n".join([f"                          - \"{arg}\"" for arg in args])
        
        # Define the Job YAML
        job_yaml = textwrap.dedent(f"""
        apiVersion: batch/v1
        kind: Job
        metadata:
            name: {job_name}
            namespace: aiverify
            labels:
                job-name: {job_name}
        spec:
            ttlSecondsAfterFinished: 120
            backoffLimit: 2
            template:
                metadata:
                    labels:
                      job-name: {job_name}
                spec:
                    restartPolicy: Never
                    containers:
                      - name: algo
                        image: {self.registry + '/' if self.registry else ''}{tag}
                        command:
                          - python
                          - -m
                          - scripts.algo_execute
                        args:
{args_yaml}
                        resources:
                          requests:
                            cpu: "500m"
                            memory: "512Mi"
                        volumeMounts:
                          - mountPath: /app/data
                            name: shared-data
                    volumes:
                      - name: shared-data
                        persistentVolumeClaim:
                          claimName: tew-pvc
        """)

        # Submit the job via kubectl
        logger.debug(job_yaml)
        try:
            subprocess.run(
                ["kubectl", "apply", "-f", "-"],
                input=job_yaml.encode("utf-8"),
                check=True
            )
            logger.info(f"[+] Submitted job {job_name} with label job-name={job_name}")
        except subprocess.CalledProcessError as e:
            raise PipeException(f"Failed to submit job: {str(e)}")
        except Exception as e:
            raise PipeException(f"Unexpected error during algorithm execute: {str(e)}")
