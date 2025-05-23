from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.filecache import algo_cache
from ...lib.logging import logger

import os
import subprocess
from pathlib import Path
import shutil


class DockerBuild(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.PIPELINE_BUILD

    @property
    def pipe_name(self) -> str:
        return "docker_build"

    def setup(self):
        self.base_image = os.getenv("WORKER_BASE_IMAGE", "aiverify-test-engine-worker-base")
        self.docker_bin = os.getenv("DOCKER", "docker")
        self.docker_registry = os.getenv("DOCKER_REGISTRY", None)
        if self.docker_registry and len(self.docker_registry) == 0:
            self.docker_registry = None
        self._check_and_build_base_image()

    def _check_and_build_base_image(self):
        # check if base image exists
        cmds = [
            self.docker_bin,
            "image", "inspect",
            self.base_image
        ]
        logger.debug(f"docker image inspect cmds: {cmds}")
        p = subprocess.run(cmds, check=False)
        if p.returncode == 0:  # image exists
            logger.debug(f"Image {self.base_image} exists, no need to build again")
            return

        # if not exists, build
        logger.info(f"Building base image {self.base_image}..")
        root_dir = Path(__file__).parent.parent.parent.parent.parent.parent
        logger.debug(f"root_dir {root_dir.as_posix()}")
        if not root_dir.joinpath("aiverify-test-engine-worker").joinpath("Dockerfile").exists():
            raise PipeException("Dockerfile does not exist, unable to build")
        cmds = [
            self.docker_bin,
            "buildx", "build",
            "-t", self.base_image,
            "-f", "aiverify-test-engine-worker/Dockerfile",
            "--rm",
            "--target", "base",
            "."
        ]
        logger.debug(f"docker image inspect cmds: {cmds}")
        p = subprocess.run(cmds, check=False, cwd=root_dir)
        if p.returncode != 0:  # build error
            raise PipeException(f"Unable to build base image {self.base_image}: {str(p.stderr)}")

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.info(f"Building algorithm using docker under {task_data.algorithm_path}")
        try:
            # Get algorithm path from pipeline data
            algorithm_path = task_data.algorithm_path
            tag = f"{task_data.task.algorithmCID}:{task_data.task.algorithmHash[:128] if task_data.task.algorithmHash else 'latest'}"

            # check whether image already exists in private registry
            if self.docker_registry:
                remote_tag = f"{self.docker_registry}/{tag}"
                cmds = [
                    self.docker_bin,
                    "image", "inspect",
                    remote_tag
                ]
                logger.debug(f"docker image inspect cmds: {cmds}")
                p = subprocess.run(cmds, check=False)
                if p.returncode == 0:  # image exists
                    logger.debug(f"Image {remote_tag} exists, no need to build again")
                    return task_data

            # TODO: build base image if doesn't exists

            # Create virtual environment
            dockerfile_path = algorithm_path.joinpath('Dockerfile.worker')
            dockerignore_path = algorithm_path.joinpath('.dockerignore')
            source_algo_exec = Path(__file__).parent.parent.joinpath("scripts")
            target_algo_exec = algorithm_path.joinpath("scripts")
            shutil.copytree(source_algo_exec, target_algo_exec, dirs_exist_ok=True)
            algorithm_path.joinpath("__init__.py").touch()

            if not dockerfile_path.exists():
                custom_docker_ignore = Path(__file__).parent.joinpath("dockerignore")
                shutil.copy(custom_docker_ignore, dockerignore_path)

            with open(dockerfile_path, "w") as fp:
                fp.write(f"""
FROM {self.base_image}

WORKDIR /app

# Copy algorithm folder
COPY . algo/

WORKDIR /app/algo

# Install algorithm requirements
RUN pip install --no-cache-dir .
RUN mkdir -p /app/output
RUN mkdir -p /app/data

ENV PYTHONPATH=/app/algo

ENTRYPOINT ["python", "-m", "scripts.algo_execute"]
""")

            cmds = [
                self.docker_bin,
                "buildx", "build",
                "-t", tag,
                "-f", dockerfile_path.name,
                "."
            ]
            logger.debug(f"docker build cmds: {cmds}")
            subprocess.run(cmds, check=True, cwd=algorithm_path)

            # if has private registry, push to private registry
            if self.docker_registry:
                # remote_tag = f"{self.docker_registry}/{tag}"
                # docker tag
                cmds = [
                    self.docker_bin,
                    "tag",
                    tag,
                    remote_tag
                ]
                logger.debug(f"docker tag cmds: {cmds}")
                subprocess.run(cmds, check=True)

                # docker push
                cmds = [
                    self.docker_bin,
                    "push",
                    remote_tag
                ]
                logger.debug(f"docker push cmds: {cmds}")
                subprocess.run(cmds, check=True)

            return task_data

        except subprocess.CalledProcessError as e:
            algo_cache.delete_cache(task_data.algorithm_id)
            raise PipeException(f"Failed to build docker environment: {str(e)}")
        except Exception as e:
            algo_cache.delete_cache(task_data.algorithm_id)
            raise PipeException(f"Unexpected error during docker environment build: {str(e)}")
