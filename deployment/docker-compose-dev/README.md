# AI Verify Toolkit - Docker Compose Guide

This guide provides instructions on how to use Docker Compose to set up and run the various services in the AI Verify Toolkit. Docker Compose simplifies the process of managing multi-container Docker applications, making it easier to deploy and manage the AI Verify services.

## Prerequisites

Ensure you have Docker and Docker Compose installed on your system. You can download them from the official Docker website.

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

## Running the Portal
The AI Verify Portal is a web-based interface that allows users to interact with the AI Verify Toolkit. It provides a user-friendly platform for managing AI verification processes, accessing various tools and services, and visualizing results. By running the portal, users can access the full suite of features offered by the AI Verify Toolkit through a convenient and intuitive web interface.

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile portal up -d
```

## Running the Test Engine Workers

The Test Engine Workers are designed to automate the execution of tests initiated from the AI Verify frontend. These workers handle the automatic processing and execution of test cases, allowing for efficient and scalable testing workflows. 

### Building the Test Engine Worker Base Image

The base image serves as the foundational layer for building other Docker images required by the Test Engine Workers. It is essential to build this base image first to ensure that all subsequent images have the necessary dependencies and configurations.

Use the following command to build the base image before proceeding with the Test Engine Worker services:

```sh
docker compose --profile build-only build
```

### Running Test Engine Workers with Python Venv

To run the Test Engine Workers using the `automated-tests-venv` profile, which utilizes a Python virtual environment for build and execution, use the following command:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile automated-tests-venv up -d
```

### Running Test Engine Workers with Docker in DOOD Mode

To run the Test Engine Workers using the `automated-tests-docker` profile, which utilizes Docker build and run in Docker Out of Docker (DOOD) mode, use the following command:

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --profile automated-tests-docker up -d
```
