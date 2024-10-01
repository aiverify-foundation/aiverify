# AI Verify API Gateway (aiverify-apigw)

## Overview

The `aiverify-apigw` project serves as the API Gateway for the AI Verify platform. It provides a unified interface for managing and interacting with various AI verification plugins and services.

## System Requirements

Before installing and running the `aiverify-apigw` project, ensure your system meets the following requirements:

- **Python**: Version 3.11 or higher
- **Operating System**: Debian
- **Dependencies**: Listed in the `pyproject.toml` file

Ensure you have Python 3.11 or higher installed on your system. You can check your Python version by running:
```
python -V
```

## Installation

Follow these steps to install the `aiverify-apigw` project:

1. **Clone the repository:**
```sh
git clone --filter=blob:none --sparse -b v2.x https://github.com/aiverify-foundation/aiverify.git
cd aiverify
git sparse-checkout set aiverify-apigw
git sparse-checkout add common
git sparse-checkout add stock-plugins
cd aiverify-apigw
```
The above commands will perform a sparse-checkout of the `aiverify-apigw` project under the `v2.x` branch from the aiverify GitHub repository

2. **Create a virtual environment:**
```sh
python -m venv .venv
source .venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. **Install the required dependencies:**
```sh
pip install -e .
```

## Configuration

Before running the application, you can configure the application behaviour using environment variables. This can be done by setting runtime environment or by creating a `.env` file in the root directory of the project.

### Create .env

1. **Create a `.env` file:**
```sh
touch .env
```

2. **Add the following configuration to the `.env` file:**
Example `.env`:
```
APIGW_LOG_LEVEL=info
```

### Environment Variables

| Variable Name     | Description                                      | Default Value          |
|-------------------|--------------------------------------------------|------------------------|
| `APIGW_LOG_LEVEL` | The log level for the API Gateway.               | `debug`                |
| `APIGW_DB_URI`    | The database URI for the API Gateway.            | `sqlite://`            |
| `APIGW_DATA_DIR`  | The directory path for storing data.             | `./data`              |


`APIGW_LOG_LEVEL`
* Can be set to `debug`, `info`, `warning`, `error`, `critical` to set the level of logging in the apigw. 

`APIGW_DB_URI`
* Set the DB URI of the apigw database engine. Refer to [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls) for list of databases supported and URI configuration.
* If not set, default to `sqlite:///data/database.db` under the root folder of the project.
**Note**: sqlite does not support concurrent writes and should NOT be used if there is a need to spawn multiple instances of apigw.If the database is large or need to run multiple instances of apigw, then a client/server database like PostgreSQL should be used.

`APIGW_DATA_DIR`:
* Set the data directory where all the data files will be stored.
* If not set, default to `./data` directory under the root folder of the project.
* If set to S3 URI, e.g. `s3://example-bucket/`, the credentials can be set using environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN`. See [boto3 documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html#environment-variables)


## Running the Application

Once you have installed the dependencies and configured the environment variables, you can run the application using the following command:

```
python -m aiverify_apigw
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
