# AI Verify Test Engine Worker (aiverify-test-engine-worker)

## Overview

The `aiverify-test-engine-worker` is a crucial component of the AI Verify system, designed to function as a worker node. Its primary role is to read and execute tasks from a task queue, which is backed by Valkey Stream. This setup allows for efficient and scalable processing of test tasks, ensuring that AI models are evaluated accurately and promptly. The worker node is responsible for executing various tests as specified in the tasks, and it communicates the results back to the system, facilitating a seamless workflow in AI model verification and validation processes. This architecture supports distributed task execution, making it suitable for handling large volumes of test tasks in a robust manner.


## System Requirements

Before installing and running the `aiverify-test-engine-worker` project, ensure your system meets the following requirements:

- **Python**: Version 3.11 or higher
- **Operating System**: Debian
- **Dependencies**: Listed in the `pyproject.toml` file

Ensure you have Python 3.11 or higher installed on your system. You can check your Python version by running:
```
python -V
```

## Installation and Running the Test Engine Worker

There are three ways to install and run `aiverify-test-engine-worker`.

1. [**Using Hatch**](#hatch-development-setup)
2. [**Local Machine Installation**](#local-machine-setup)

For development, using Hatch is the easiest and most efficient method as it provides an isolated environment and ensures compatibility with the project's dependencies.

# Hatch Development Setup

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

`TEWORKER_LOG_LEVEL`
* Can be set to `debug`, `info`, `warning`, `error`, `critical` to set the level of logging in the test-engine-worker. 

`APIGW_URL`
* Specifies the URL of the AI Verify API Gateway. This is the endpoint that the Test Engine Worker will communicate with to send and receive data. The default value is `http://127.0.0.1:4000`, which is typically used for local development and testing.

`VALKEY_HOST_ADDRESS`
* Defines the host address for the Valkey server. This is used by the Test Engine Worker to connect to the Valkey service, which is used for the task queue. The default value is `127.0.0.1`.

`VALKEY_PORT`
* Indicates the port number on which the Valkey server is listening. This allows the Test Engine Worker to establish a connection to the Valkey service. The default port is `6379`.


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

# Local Machine Setup

Follow these steps to install the `aiverify-test-engine-worker` project on your machine.

1. **Clone the repository.**
```sh
git clone --filter=blob:none --sparse -b v2.x https://github.com/aiverify-foundation/aiverify.git
cd aiverify
git sparse-checkout set aiverify-test-engine-worker
git sparse-checkout add common
cd aiverify-test-engine-worker
```
The above commands will perform a sparse-checkout of the `aiverify-test-engine-worker` project under the `v2.x` branch from the aiverify GitHub repository

2. **Create a virtual environment.**
```sh
python -m venv .venv
source .venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. **Run the installation script**
There are two installation scripts [`install-amd64.sh`](./install-amd64.sh) and [install-arm64.sh](./install-arm64.sh) which you can excute depending on your machine architecture.

For example, to install on your macbook:
```
sh ./install-arm64.sh
```

## Configuration

Before running the application, you can configure the application behaviour using environment variables. This can be done by setting runtime environment or by creating a `.env` file in the root directory of the project.

### Create .env

See [Section](#api-gateway-configuration)

## Running the Application

Once you have installed the dependencies and configured the environment variables, you can run the application using the following command:

```
python -m aiverify_test_engine_worker
```

## Running Tests

To run the tests for the application, you can use `pytest`. Make sure you have `pytest` and `faker` installed. If not, you can install it using pip:

```
pip install pytest faker
```

To run the tests:
```
pytest tests
```

# Docker Setup
To build test-engine-worker docker image, go to the `aiverify` root folder and run:
```
cd ..
docker buildx build -t aiverify-test-engine-worker-base -f aiverify-test-engine-worker/Dockerfile --rm --target aiverify-test-engine-worker-base .
docker buildx build -t aiverify-test-engine-worker -f aiverify-test-engine-worker/Dockerfile --target venv-build .
cd aiverify-test-engine-worker
```

To run test-engine-worker from command line, run the following command with substitutes for the environment values.
```sh
docker run --rm --name=aiverify-test-engine-worker aiverify-test-engine-worker
```

To run as a service:
```sh
docker run -d --name=aiverify-test-engine-worker aiverify-test-engine-worker
```
