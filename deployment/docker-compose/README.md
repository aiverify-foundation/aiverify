## Running the Docker Compose Services - AI Verify Test Engine Worker

To run the Docker services for AI Verify Test Engine Worker, build the base image first with the following commands.
```sh
docker compose --profile build-only build
```

To run the Docker Compose services in detached mode, use the following command:
```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile <profile name> up -d
```

The valid docker profiles are:
| Docker Profile Name         | Description |
|-----------------------------|-------------|
| automated-tests-venv        | Runs the services using a python virtual environment build and run for automated testing. |
| automated-tests-docker      | Runs the services using Docker build and run for automated testing in DOOD mode. |
