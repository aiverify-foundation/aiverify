# AI Verify API Gateway (aiverify-apigw)

## Overview

The `aiverify-apigw` project serves as the API Gateway for the AI Verify platform. It provides a unified interface for managing and interacting with various AI verification plugins and services.

## System Requirements

Before installing and running the `aiverify-apigw` project, ensure your system meets the following requirements:

- **Python**: Version 3.11 or higher
- **Node**: Node 18 and higher
- **Operating System**: Debian
- **Dependencies**: Listed in the `pyproject.toml` file

Ensure you have Python 3.11 or higher installed on your system. You can check your Python version by running:
```
python -V
```

Ensure you have Node 18.x or higher installed on your system. You can check your Node version by running:
```
node --version
```

## Installation and Running the API Gateway

There are three ways to install and run `aiverify-apigw`.

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

## API Gateway Configuration

Before running the application, you can configure the application behaviour using environment variables. This can be done by setting runtime environment or by creating a `.env` file in the root directory of the project.

### Create .env

1. **Create a `.env` file.**
```sh
touch .env
```

2. **Add the following configuration to the `.env` file.**

Example `.env`:
```
APIGW_LOG_LEVEL=info
```

### Environment Variables

Update the `.env` file to configure the environment variables. Below is a table of the environment variables and their descriptions:

| Variable Name     | Description     | Default Value     |
|-------------------|-----------------|-------------------|
| `APIGW_LOG_LEVEL` | The log level for the API Gateway. | `info` |
| `APIGW_DATA_DIR` | The directory path for storing data. | `./data` |
| `APIGW_DB_URI` | The database URI for the API Gateway. | `sqlite:///{APIGW_DATA_DIR}/database.db` |
| `APIGW_HOST_ADDRESS` | Bind socket to this host. | `127.0.0.1` |
| `APIGW_PORT`      | Bind socket to this port. | `4000` |
| `APIGW_MAX_PART_SIZE_MB`      | The maximum size of the test result form in MB | `20` |

`APIGW_LOG_LEVEL`
* Can be set to `debug`, `info`, `warning`, `error`, `critical` to set the level of logging in the apigw. 

`APIGW_DB_URI`
* Set the DB URI of the apigw database engine. Refer to [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls) for list of databases supported and URI configuration.
* If not set, default to `sqlite:///data/database.db` under the root folder of the project.
**Note**: sqlite does not support concurrent writes and should NOT be used if there is a need to spawn multiple instances of apigw. If the database is large or need to run multiple instances of apigw, then a client/server database like PostgreSQL should be used.

`APIGW_DATA_DIR`:
* Set the data directory where all the data files will be stored.
* If not set, default to `./data` directory under the root folder of the project.
* If set to S3 URI, e.g. `s3://example-bucket/`, the credentials can be set using environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN`. See [boto3 documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html#environment-variables)

`APIGW_HOST_ADDRESS`
* The host address to bind the API Gateway server. This is the address where the server will listen for incoming requests.
* If not set, defaults to `127.0.0.1`, which means the server will only be accessible from the local machine.

`APIGW_PORT`
* The port number to bind the API Gateway server. This is the port where the server will listen for incoming requests.
* If not set, defaults to `4000`. Ensure that this port is open and not used by other applications on your machine.


### Install the NodeJS scripts

The NodeJS scripts are used by the API-GW to validate and parse MDX files. To install the scripts,  

```sh
cd aiverify-apigw-node
npm ci
cd ..
```

## Run the application
To run the apigw in development mode, just run
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

Follow these steps to install the `aiverify-apigw` project on your machine.

1. **Clone the repository.**
```sh
git clone --filter=blob:none --sparse -b v2.x https://github.com/aiverify-foundation/aiverify.git
cd aiverify
git sparse-checkout set aiverify-apigw
git sparse-checkout add common
git sparse-checkout add stock-plugins
cd aiverify-apigw
```
The above commands will perform a sparse-checkout of the `aiverify-apigw` project under the `v2.x` branch from the aiverify GitHub repository

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
python -m aiverify_apigw
```

## Running Tests

To run the tests for the application, you can use `pytest`. Make sure you have `pytest` and `faker` installed. If not, you can install it using pip.
Following the steps in section [Local Machine Setup](#local-machine-setup) to install the application. Then activate the virtual environment to install the dependecies for pytest.

```
source .venv/bin/activate
pip install pytest faker
```

To run the tests:
```
cd aiverify_apigw
pytest tests
```
---

# Docker Setup
To build apigw docker image, go to the `aiverify` root folder and run:
```
cd ..
docker buildx build -t aiverify-apigw -f aiverify-apigw/Dockerfile .
cd aiverify-apigw
```

To run apigw from command line, run the following command with substitutes for the environment values.
```sh
mkdir -p data # create data directory
docker run --rm --name=aiverify-apigw -p 4000:4000/tcp -v "$PWD/data:/data" aiverify-apigw
```

To run as a service:
```sh
docker run -d --name=aiverify-apigw -p 4000:4000/tcp -v "$PWD/data:/data" aiverify-apigw
```


# FastAPI Documentation
The FastAPI interactics docs can be accessed on http://{APIGW_HOST_ADDRESS}:4000/docs/. To access on localhost machine, navigate to http://localhost:4000/docs/.

