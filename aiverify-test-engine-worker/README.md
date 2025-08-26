# AI Verify Test Engine Worker (aiverify-test-engine-worker)

## Overview

The `aiverify-test-engine-worker` is a crucial component of the AI Verify system, designed to function as a worker node. Its primary role is to read and execute tasks from a task queue, which is backed by Valkey Stream. This setup allows for efficient and scalable processing of test tasks, ensuring that AI models are evaluated accurately and promptly. The worker node is responsible for executing various tests as specified in the tasks, and it communicates the results back to the system, facilitating a seamless workflow in AI model verification and validation processes. This architecture supports distributed task execution, making it suitable for handling large volumes of test tasks in a robust manner.


## System Requirements

Before installing and running the `aiverify-test-engine-worker` project, ensure your system meets the following requirements:

- **Python**: Version 3.11 or higher
- **Operating System**: Debian
- **Dependencies**: Listed in the `pyproject.toml` file
- **Valkey**: Required for the message queue.

Ensure you have Python 3.11 or higher installed on your system. You can check your Python version by running:
```
python -V
```

# Hatch Development Setup

For development, using Hatch is the easiest and most efficient method as it provides an isolated environment and ensures compatibility with the project's dependencies.

## Install Hatch
Install [Hatch](https://hatch.pypa.io/latest/) if it's not yet installed on your machine. 
Installation Instructions: https://hatch.pypa.io/latest/install/

## Create Hatch Environment
[Hatch environments](https://hatch.pypa.io/latest/environment/) allow for an isolated workspace for testing and building the project. Hatch ensures that environments are always compatible with the currently defined project dependencies in [pyproject.toml](./pyproject.toml).

To create a new default environent, run
```sh
hatch env create
```

You can spawn a shell within an environment by using the shell command.
```sh
hatch shell
```

## Test Engine Worker Configuration

Before running the application, you can configure the application behaviour using environment variables. This can be done by setting runtime environment or by creating a `.env` file in the root directory of the project.

### Create .env

1. **Create a `.env` file.**
```sh
touch .env
```

2. **Add the following configuration to the `.env` file.**

Example `.env`:
```
TEWORKER_LOG_LEVEL=info
```

### Environment Variables

Update the `.env` file to configure the environment variables. Below is a table of the environment variables and their descriptions:

| Variable Name     | Description     | Default Value     |
|-------------------|-----------------|-------------------|
| `TEWORKER_LOG_LEVEL` | The log level for the Test Engine Worker. | `info` |
| `APIGW_URL` | The URL of the AI Verify API GW. | `http://127.0.0.1:4000` |
| `VALKEY_HOST_ADDRESS` | The Valkey server host address | `127.0.0.1` |
| `VALKEY_PORT`      | The Valkey server port. | `6379` |
| `PYTHON` | Path to python 3 executable | `python3` |
| `PIPELINE_BUILD` | Pipeline build module to load | `virtual_env` |
| `PIPELINE_EXECUTE` | Pipeline execute module to load | `virtual_env_execute` |
| `DOCKER_REGISTRY` | Private Docker Registry (Applicable only for docker build) | None |
| `KUBECTL_REGISTRY` | Private registry for kubectl to pull image from (Applicable only for kubectl run and exec commands) | Same as DOCKER_REGISTRY if not None, else `localhost:5000` |

`TEWORKER_LOG_LEVEL`
* Can be set to `debug`, `info`, `warning`, `error`, `critical` to set the level of logging in the test-engine-worker. 

`APIGW_URL`
* Specifies the URL of the AI Verify API Gateway. This is the endpoint that the Test Engine Worker will communicate with to send and receive data. The default value is `http://127.0.0.1:4000`, which is typically used for local development and testing.

`VALKEY_HOST_ADDRESS`
* Defines the host address for the Valkey server. This is used by the Test Engine Worker to connect to the Valkey service, which is used for the task queue. The default value is `127.0.0.1`.

`VALKEY_PORT`
* Indicates the port number on which the Valkey server is listening. This allows the Test Engine Worker to establish a connection to the Valkey service. The default port is `6379`.

`PYTHON`
* Specifies the path to the Python 3 executable that the Test Engine Worker will use. This allows the application to explicitly define which Python interpreter to use, ensuring compatibility and consistency across different environments. The default value is `python3`, which is typically available on most systems with Python 3 installed.

`PIPELINE_BUILD`
* Specifies the module to be used for building the test algorithm. This determines how the environment for executing tests is set up. The default value is `virtual_env`, which uses a virtual environment for task execution. Other options might include `docker_build` for using Docker containers.

`PIPELINE_EXECUTE`
* Defines the module to be used for executing the tests. This setting controls the method by which tasks are run. The default value is `virtual_env_execute`, which executes tasks within a virtual environment. Alternative options could include `docker_run` for executing tasks within Docker containers, and `kubectl_run` for executing in kubernetes environment.

`DOCKER_REGISTRY`
* Specifies the private Docker Registry to which the built Docker image will be pushed. If this variable is set to a non-None value, the Docker build process will attempt to push the successfully built image to the specified private registry. This is applicable only when using the `docker_build` pipeline build module. The default value is `None`, meaning no image will be pushed unless explicitly configured.

`KUBECTL_REGISTRY`
* Specifies the private registry from which `kubectl` will pull the image. This is applicable only for `kubectl` commands in the `kubectl_run` module. If not set, it defaults to the value of `DOCKER_REGISTRY` if it is not `None`; otherwise, it defaults to `localhost:5000`. This allows for flexibility in specifying different registries for Docker and Kubernetes operations, ensuring that images are pulled from the correct source during execution.


## Run the application
To run the test-engine-worker in development mode, just run
```sh
hatch run dev
```

## Static analysis
Hatch's [static anlysis](https://hatch.pypa.io/1.9/config/static-analysis/) uses [Ruff](https://github.com/astral-sh/ruff). For this project, we select the following linting rules:

```
[tool.ruff.lint]
preview = true
select = ["E20","E21","E22","E23","E3","E401","F8"]
``` 

To run the static analysis:
```sh
hatch fmt
```

Developers should execute `hatch fmt` before raising Merge Request, to ensure that your code conforms to the lint requirements.

## Running Tests

To run the tests for the application, you can use `pytest`. Make sure you have `pytest` and `faker` installed. If not, you can install it using pip:

```
pip install pytest pytest-mock faker aiverify-test-engine
```

To run the tests:
```
pytest tests
```
