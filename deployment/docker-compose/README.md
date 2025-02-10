## Running the Docker Compose Services

To run the Docker Compose services in detached mode, use the following command:
```
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose up -d
```

## Building the Docker Compose Services

To force rebuild of the Docker Compose services, add the flag `--no-cache`:
```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose build --no-cache
```
