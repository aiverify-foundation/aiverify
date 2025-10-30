# AI Verify Toolkit - Docker Compose Guide

This guide provides instructions on how to use Docker Compose to set up and run the various services in the AI Verify Toolkit. Docker Compose simplifies the process of managing multi-container Docker applications, making it easier to deploy and manage the AI Verify services.

The docker compose file in this folder is used to development and testing purpose. The AI Verify services will build the images from the project source and save to local registry. For production, it is recommended to use the docker compose file in the `docker-compose` folder instead as it pull from Github Docker registry and does not need to build locally.

## Prerequisites

- Host OS: Linux and MacOS
- Docker >= 19.03 with buildx and docker compose

## Runing Docker Compose Services
To run the Docker Compose services in detached mode, use the following command:
```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile <profile name> up -d
```

To run multiple profiles, you can specify them in a comma-separated list with the `--profile` option. For example, to run both the `portal` and `automated-tests-venv` profiles, use the following command:
```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile portal --profile automated-tests-venv up -d
```

The valid docker profiles are:
| Docker Profile Name         | Description |
|-----------------------------|-------------|
| automated-tests-venv        | Runs the services using a python virtual environment build and run for automated testing. |
| automated-tests-docker      | Runs the services using Docker build and run for automated testing in DOOD mode. |
| portal                      | Runs the AI Verify Portal service for accessing the web interface. |


### Building the Base Images

The base images serves as the foundational layer for building other Docker images required by the other services. It is essential to build the base images first to ensure that all subsequent images have the necessary dependencies and configurations.

Use the following command to build the base python image before proceeding with the other builds:

```sh
docker buildx build -t aiverify-python-base -f aiverify-test-engine/Dockerfile --no-cache .
```

## Running the API Gateway Only

The API Gateway is core service and always enabled regardless of profile. To only run the API Gateway, just run docker compose without specifying profile:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose -d
```

## Running the Portal

To run the portal service, use the following command:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile portal up -d
```

## Running the Test Engine Workers

### Building the Test Engine Worker Base Image

The base image serves as the foundational layer for building other Docker images required by the Test Engine Workers. It is essential to build this base image first to ensure that all subsequent images have the necessary dependencies and configurations.

Use the following command to build the base image before proceeding with the Test Engine Worker services:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose --profile build-only build
```

### Running Test Engine Workers with Python Venv

To run the Test Engine Workers using the `automated-tests-venv` profile, which utilizes a Python virtual environment for build and execution, use the following command:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile automated-tests-venv up -d
```

To run the Test Engine Workers using the `automated-tests-venv` profile with `portal` profile, which utilizes a Python virtual environment for build and execution, use the following command:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile automated-tests-venv --profile portal up -d
```

### Running Test Engine Workers with Docker in DOOD Mode

To run the Test Engine Workers using the `automated-tests-docker` profile, which utilizes Docker build and run in Docker Out of Docker (DOOD) mode, use the following command:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile automated-tests-docker up -d
```

## Rebuilding the Docker Images
To rebuild the docker images, add --no-cache to the docker-compose build command. For example:
```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile automated-tests-venv --profile portal build --no-cache
```
