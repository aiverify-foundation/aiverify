import os
import shutil
from pathlib import Path

import pytest

from test_engine_app.config.environment_variables import EnvironmentVariables


class TestCollectionEnvironmentVariables:
    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        EnvironmentVariables._core_modules_folder = str(
            Path().resolve().parent / "test-engine-core-modules"
        )
        EnvironmentVariables._validation_schemas_folder = str(
            Path().resolve() / "validation_schemas"
        )
        EnvironmentVariables._redis_consumer_group = "MyGroup"
        EnvironmentVariables._redis_server_hostname = "localhost"
        EnvironmentVariables._redis_server_port = 6379
        EnvironmentVariables._api_server_port = 8080

        # Remove .env file
        try:
            os.makedirs(
                str(Path().resolve().parent / "test-engine-core-modules"), exist_ok=True
            )
            os.remove(".env")
        except FileNotFoundError:
            pass

        # Perform tests
        yield

        # Remove .env file
        try:
            os.remove(".env")
        except FileNotFoundError:
            pass

    @pytest.mark.parametrize(
        "env_location, expected_result, expected_print_output",
        [
            # working environment
            (
                "tests/env_files/working_env",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            # tests core_modules
            (
                "tests/env_files/env_core_modules/path_issues_env",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/env_core_modules/path_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/env_core_modules/path_issues_env_2",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/env_core_modules/path_issues_env_3",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/env_core_modules/path_issues_env_4",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/env_core_modules/path_issues_env_5",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            # Tests validation_schema
            (
                "tests/env_files/validation_schema/path_issues_env",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/validation_schema/path_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/validation_schema/path_issues_env_2",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/validation_schema/path_issues_env_3",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/validation_schema/path_issues_env_4",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/validation_schema/path_issues_env_5",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": str(Path().resolve() / "test_engine_app/validation_schemas"),
                    "consumer_group": "MyGroup123",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "test_engine_app/validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            # Tests consumer_group
            (
                "tests/env_files/consumer_group/path_issues_env",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "/etc/IDontExist/",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: /etc/IDontExist/\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            (
                "tests/env_files/consumer_group/path_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/consumer_group/path_issues_env_2",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "123",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: 123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            (
                "tests/env_files/consumer_group/path_issues_env_3",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/consumer_group/path_issues_env_4",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/consumer_group/path_issues_env_5",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            # Tests redis_hostname
            (
                "tests/env_files/redis_hostname/path_issues_env",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "/etc/IDontExist/",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: /etc/IDontExist/\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            (
                "tests/env_files/redis_hostname/path_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/redis_hostname/path_issues_env_2",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "123",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 123\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            (
                "tests/env_files/redis_hostname/path_issues_env_3",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/redis_hostname/path_issues_env_4",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/redis_hostname/path_issues_env_5",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "localhost",
                    "server_port": 1234,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 4321'
            ),
            # Tests server_port
            (
                "tests/env_files/server_port/path_issues_env",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/server_port/path_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/server_port/path_issues_env_2",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "192.168.1.1",
                    "server_port": 123,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 123\n'
                f'API_SERVER_PORT: 4321'
            ),
            (
                "tests/env_files/server_port/path_issues_env_3",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/server_port/path_issues_env_4",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/server_port/path_issues_env_5",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "192.168.1.1",
                    "server_port": 6379,
                    "api_server_port": 4321
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 4321'
            ),
            (
                "tests/env_files/server_port/value_issues_env",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/server_port/value_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            # Tests api_server_port
            (
                "tests/env_files/api_server_port/path_issues_env",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/api_server_port/path_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/api_server_port/path_issues_env_2",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 123
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 123'
            ),
            (
                "tests/env_files/api_server_port/path_issues_env_3",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/api_server_port/path_issues_env_4",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/api_server_port/path_issues_env_5",
                {
                    "core_modules_folder": "/etc/",
                    "validation_folder": "/etc/",
                    "consumer_group": "MyGroup123",
                    "hostname": "192.168.1.1",
                    "server_port": 1234,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: /etc/\n'
                f'VALIDATION_SCHEMAS_FOLDER: /etc/\n'
                f'REDIS_CONSUMER_GROUP: MyGroup123\n'
                f'REDIS_SERVER_HOSTNAME: 192.168.1.1\n'
                f'REDIS_SERVER_PORT: 1234\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/api_server_port/value_issues_env",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            (
                "tests/env_files/api_server_port/value_issues_env_1",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
            # Tests random
            (
                "tests/env_files/invalid_env",
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            )
        ],
    )
    def test_init(self, env_location, expected_result, expected_print_output):
        # Copy the env file
        shutil.copyfile(env_location, ".env")

        # Run
        EnvironmentVariables()

        # Assert
        assert EnvironmentVariables.get_core_modules_folder() == expected_result["core_modules_folder"]
        assert EnvironmentVariables.get_validation_schemas_folder() == expected_result["validation_folder"]
        assert EnvironmentVariables.get_redis_consumer_group() == expected_result["consumer_group"]
        assert EnvironmentVariables.get_redis_server_hostname() == expected_result["hostname"]
        assert EnvironmentVariables.get_redis_server_port() == expected_result["server_port"]
        assert EnvironmentVariables.get_api_server_port() == expected_result["api_server_port"]
        assert EnvironmentVariables.print_environment_variables() == expected_print_output

    @pytest.mark.parametrize(
        "expected_result, expected_print_output",
        [
            # working environment
            (
                {
                    "core_modules_folder": str(Path().resolve().parent / "test-engine-core-modules"),
                    "validation_folder": str(Path().resolve() / "validation_schemas"),
                    "consumer_group": "MyGroup",
                    "hostname": "localhost",
                    "server_port": 6379,
                    "api_server_port": 8080
                },
                f'\nEnvironment Variables:\nCORE_MODULES_FOLDER: {str(Path().resolve().parent / "test-engine-core-modules")}\n'
                f'VALIDATION_SCHEMAS_FOLDER: {str(Path().resolve() / "validation_schemas")}\n'
                f'REDIS_CONSUMER_GROUP: MyGroup\n'
                f'REDIS_SERVER_HOSTNAME: localhost\n'
                f'REDIS_SERVER_PORT: 6379\n'
                f'API_SERVER_PORT: 8080'
            ),
        ]
    )
    def test_init_file_do_not_exist(self, expected_result, expected_print_output):
        # Run
        EnvironmentVariables()

        # Assert
        assert EnvironmentVariables.get_core_modules_folder() == expected_result["core_modules_folder"]
        assert EnvironmentVariables.get_validation_schemas_folder() == expected_result["validation_folder"]
        assert EnvironmentVariables.get_redis_consumer_group() == expected_result["consumer_group"]
        assert EnvironmentVariables.get_redis_server_hostname() == expected_result["hostname"]
        assert EnvironmentVariables.get_redis_server_port() == expected_result["server_port"]
        assert EnvironmentVariables.get_api_server_port() == expected_result["api_server_port"]
        assert EnvironmentVariables.print_environment_variables() == expected_print_output
