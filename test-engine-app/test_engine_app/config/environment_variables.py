import os
from pathlib import Path
from typing import Tuple

from dotenv import load_dotenv
from test_engine_core.utils.validate_checks import is_empty_string


class EnvironmentVariables:
    """
    EnvironmentVariables class focuses on getting external environment variables that may affect how the program runs.
    """

    _core_modules_folder: str = "../test-engine-core-modules"
    _validation_schemas_folder: str = "./test_engine_app/validation_schemas/"
    _redis_consumer_group: str = "MyGroup"
    _redis_server_hostname: str = "localhost"
    _redis_server_port: int = 6379
    _api_server_port: int = 8080

    def __init__(self):
        try:
            load_dotenv()

            # Save the values obtained from the file, else we use default values
            core_modules_folder = os.getenv(
                "CORE_MODULES_FOLDER",
                str(Path().resolve().parent / "test-engine-core-modules"),
            )
            validation_schemas_folder = os.getenv(
                "VALIDATION_SCHEMAS_FOLDER",
                str(Path().resolve() / "test_engine_app/validation_schemas"),
            )
            consumer_group = os.getenv("REDIS_CONSUMER_GROUP", "MyGroup")
            hostname = os.getenv("REDIS_SERVER_HOSTNAME", "localhost")
            server_port = int(os.getenv("REDIS_SERVER_PORT", 6379))
            api_server_port = int(os.getenv("API_SERVER_PORT", 8080))

            error_count, _ = EnvironmentVariables._validate_data(
                core_modules_folder,
                validation_schemas_folder,
                consumer_group,
                hostname,
                server_port,
                api_server_port,
            )

            if error_count == 0:
                EnvironmentVariables._core_modules_folder = core_modules_folder
                EnvironmentVariables._validation_schemas_folder = (
                    validation_schemas_folder
                )
                EnvironmentVariables._redis_consumer_group = consumer_group
                EnvironmentVariables._redis_server_hostname = hostname
                EnvironmentVariables._redis_server_port = server_port
                EnvironmentVariables._api_server_port = api_server_port
            else:
                # Validation failed. Use defaults.
                pass

        except ValueError:
            # ValueError exception. Use defaults.
            pass

    @staticmethod
    def _validate_data(
        core_modules_folder: str,
        validation_schemas_folder: str,
        consumer_group: str,
        hostname: str,
        server_port: int,
        api_server_port: int,
    ) -> Tuple[int, str]:
        """
        A helper method to perform data validation on the different arguments.

        Args:
            core_modules_folder (str): The core modules folder path
            validation_schemas_folder (str): The validation schema folder path
            consumer_group (str): The redis stream consumer group
            hostname (str): The redis hostname
            server_port (int): The redis server port
            api_server_port (int): The api server port to host on

        Returns:
            Tuple[int, str]: Returns the error count and the error messages.
        """
        error_count: int = 0
        error_message: str = ""

        # Core Modules folder
        if (
            is_empty_string(core_modules_folder)
            or not Path(core_modules_folder).is_dir()
        ):
            error_count += 1
            error_message += "The core modules folder is not a directory;"

        # Validation Schemas folder
        if (
            is_empty_string(validation_schemas_folder)
            or not Path(validation_schemas_folder).is_dir()
        ):
            error_count += 1
            error_message += "The validation schemas folder is not a directory;"

        # ConsumerGroup
        if (
            is_empty_string(consumer_group)
            or consumer_group.__contains__("{}")
            or consumer_group.__contains__("[]")
        ):
            error_count += 1
            error_message += "The consumer group is an empty string;"

        # Hostname
        if (
            is_empty_string(hostname)
            or hostname.__contains__("{}")
            or hostname.__contains__("[]")
        ):
            error_count += 1
            error_message += "The host name is an empty string;"

        # Port number
        if server_port < 1 or server_port > 65535:
            error_count += 1
            error_message += "The server port is outside expected range;"

        # API Port number
        if api_server_port < 1 or api_server_port > 65535:
            error_count += 1
            error_message += "The API server port is outside expected range;"

        return error_count, error_message

    @staticmethod
    def print_environment_variables() -> str:
        """
        A method to return the string of the current environment variables for logging

        Returns:
            str: string formatted for printing the environment variables
        """
        return_str: str = "\nEnvironment Variables:\n"
        return_str += (
            f"CORE_MODULES_FOLDER: {EnvironmentVariables._core_modules_folder}\n"
        )
        return_str += f"VALIDATION_SCHEMAS_FOLDER: {EnvironmentVariables._validation_schemas_folder}\n"
        return_str += (
            f"REDIS_CONSUMER_GROUP: {EnvironmentVariables._redis_consumer_group}\n"
        )
        return_str += (
            f"REDIS_SERVER_HOSTNAME: {EnvironmentVariables._redis_server_hostname}\n"
        )
        return_str += f"REDIS_SERVER_PORT: {EnvironmentVariables._redis_server_port}\n"
        return_str += f"API_SERVER_PORT: {EnvironmentVariables._api_server_port}"

        return return_str

    @staticmethod
    def get_core_modules_folder() -> str:
        """
        A method to return the core modules folder that consists of data, models and serializers

        Returns:
            str: The string containing the core modules folder
        """
        return str(EnvironmentVariables._core_modules_folder)

    @staticmethod
    def get_validation_schemas_folder() -> str:
        """
        A method to return the validation schemas folder that consists of test engine task schema and others

        Returns:
            str: The string containing the validation schemas folder
        """
        return str(EnvironmentVariables._validation_schemas_folder)

    @staticmethod
    def get_redis_consumer_group() -> str:
        """
        A method to return the redis stream consumer group

        Returns:
            str: The string containing the stream consumer group name
        """
        return EnvironmentVariables._redis_consumer_group

    @staticmethod
    def get_redis_server_hostname() -> str:
        """
        A method to return the redis server host name

        Returns:
            str: The string containing the redis server host name
        """
        return EnvironmentVariables._redis_server_hostname

    @staticmethod
    def get_redis_server_port() -> int:
        """
        A method to return the redis server port

        Returns:
            int: redis server port number
        """
        return int(EnvironmentVariables._redis_server_port)

    @staticmethod
    def get_api_server_port() -> int:
        """
        A method to return the api server port

        Returns:
            int: api server port number
        """
        return int(EnvironmentVariables._api_server_port)
