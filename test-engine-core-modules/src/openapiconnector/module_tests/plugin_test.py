import sys
from pathlib import Path
from typing import Tuple, Union

from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.model_mode_type import ModelModeType
from test_engine_core.plugins.enums.model_plugin_type import ModelPluginType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager
from test_engine_core.utils.json_utils import load_schema_file
from test_engine_core.utils.time import time_class_method


# =====================================================================================
# NOTE: Do not modify this file unless you know what you are doing.
# =====================================================================================
class PluginTest:
    """
    The PluginTest class specifies methods in supporting testing for the plugin.
    """

    def __init__(self, api_schema_path: str, api_config_path: str, discover_path: Path):
        # Other variables
        self._base_path: Path = discover_path

        # Store the input arguments as private vars
        self._api_schema = load_schema_file(str(self._base_path / api_schema_path))
        self._api_config = load_schema_file(str(self._base_path / api_config_path))

        # Default for instances
        self._model_instance: Union[None, IModel] = None
        self._model_serializer_instance: Union[None, ISerializer] = None

        self._expected_model_algorithm = "OpenAPIConnector"
        self._expected_model_plugin_type = ModelPluginType.API

    @time_class_method
    def run(self) -> None:
        """
        A function to run the plugin test with the provided arguments.
        """
        try:
            error_count = 0
            error_message = ""

            # Load all the core plugins and the model plugin
            PluginManager.discover(str(self._base_path))

            # Get the model instance
            (
                self._model_instance,
                self._model_serializer_instance,
                error_message,
            ) = PluginManager.get_instance(
                PluginType.MODEL,
                **{
                    "mode": ModelModeType.API,
                    "api_schema": self._api_schema,
                    "api_config": self._api_config,
                },
            )

            # Perform model instance setup
            is_success, error_messages = self._model_instance.setup()
            if not is_success:
                raise RuntimeError(
                    f"Failed to perform model instance setup: {error_messages}"
                )

            # Run different tests on the model instance
            test_methods = [
                self._validate_metadata,
                self._validate_plugin_type,
                self._validate_model_supported,
            ]

            for method in test_methods:
                tmp_count, tmp_error_msg = method()
                error_count += tmp_count
                error_message += tmp_error_msg

            # Perform cleanup
            self._model_instance.cleanup()

            if error_count > 0:
                print(f"Errors found while running tests. {error_message}")
                sys.exit(-1)
            else:
                print("No errors found. Test completed successfully.")
                sys.exit(0)

        except Exception as error:
            # Print and exit with error
            print(f"Exception found while running tests. {str(error)}")
            sys.exit(-1)

    def _validate_metadata(self) -> Tuple[int, str]:
        """
        A helper method to validate metadata

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        metadata = self._model_instance.get_metadata()
        if (
            metadata.name == "OpenAPIConnector"
            and metadata.description
            == "OpenAPIConnector supports performing api calls to external model servers"
            and metadata.version == "0.9.0"
        ):
            # Metadata is correct
            pass
        else:
            # Metadata is incorrect
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_plugin_type(self) -> Tuple[int, str]:
        """
        A helper method to validate plugin type

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if self._model_instance.get_plugin_type() is PluginType.MODEL:
            # PluginType is correct
            pass
        else:
            # PluginType is wrong
            error_count += 1
            error_message += "Incorrect plugin type;"

        if (
            self._model_instance.get_model_plugin_type()
            is self._expected_model_plugin_type
        ):
            # Model PluginType is correct
            pass
        else:
            # Model PluginType is incorrect
            error_count += 1
            error_message += "Incorrect model plugin type;"

        if self._model_instance.get_model_algorithm() == self._expected_model_algorithm:
            # Model Algorithm is correct
            pass
        else:
            # Model Algorithm is incorrect
            error_count += 1
            error_message += "Incorrect model algorithm;"

        return error_count, error_message

    def _validate_model_supported(self) -> Tuple[int, str]:
        """
        A helper method to validate model supported

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if self._model_instance.is_supported():
            # Model is supported
            pass
        else:
            # Model is not supported
            error_count += 1
            error_message += "Model not supported;"

        return error_count, error_message
