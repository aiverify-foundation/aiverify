from pathlib import Path
from typing import Tuple, Union

import pytest
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.model_mode_type import ModelModeType
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from aiverify_test_engine.utils.json_utils import load_schema_file

pytest.skip(allow_module_level=True)


@pytest.fixture
def plugin_test_data(request):
    discover_path = Path.cwd().parent
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_api_schema.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_api_config.json"
    # )

    # Test Schema 1
    api_schema_path = str(
        test_dir / "user_defined_files/api_config_files/test_schema1.json"
    )
    api_config_path = str(
        test_dir / "user_defined_files/api_config_files/test_config1.json"
    )
    # # Test Schema 2
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema2.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config2.json"
    # )
    # # Test Schema 3
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema3.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config3.json"
    # )
    # # Test Schema 4
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema4.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config4.json"
    # )
    # # Test Schema 5
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema5.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config5.json"
    # )
    # # Test Schema 6
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema6.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config6.json"
    # )
    # # Test Schema 7
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema7.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config7.json"
    # )
    # # Test Schema 8
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema8.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config8.json"
    # )
    # # Test Schema 9
    # api_schema_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_schema9.json"
    # )
    # api_config_path = str(
    #     discover_path / "user_defined_files/api_config_files/test_config9.json"
    # )

    expected_model_algorithm = "OpenAPIConnector"
    expected_model_plugin_type = ModelPluginType.API

    return (
        api_schema_path,
        api_config_path,
        discover_path,
        expected_model_algorithm,
        expected_model_plugin_type,
    )


class PluginTest:
    def test_plugin(self, plugin_test_data):
        (
            api_schema_path,
            api_config_path,
            discover_path,
            expected_model_algorithm,
            expected_model_plugin_type,
        ) = plugin_test_data
        self._base_path = discover_path

        # Load schema and config files
        self._api_schema = load_schema_file(api_schema_path)
        self._api_config = load_schema_file(api_config_path)

        # Initialize instance variables
        self._model_instance: Union[None, IModel] = None
        self._model_serializer_instance: Union[None, ISerializer] = None
        self._expected_model_algorithm = expected_model_algorithm
        self._expected_model_plugin_type = expected_model_plugin_type

        # Run the plugin test
        self.run()

    def run(self):
        """
        Main method to run the plugin test.
        """
        error_count = 0
        error_message = ""

        try:
            # Discover and load the plugin
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

            # Assert no errors were found
            assert error_count == 0, f"Errors found during tests: {error_message}"

        except Exception as error:
            pytest.fail(f"Exception found while running tests: {str(error)}")

    def _validate_metadata(self) -> Tuple[int, str]:
        """
        A helper method to validate metadata.
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
            pass  # Metadata is correct
        else:
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_plugin_type(self) -> Tuple[int, str]:
        """
        A helper method to validate plugin type.
        """
        error_count = 0
        error_message = ""

        if self._model_instance.get_plugin_type() is PluginType.MODEL:
            pass  # PluginType is correct
        else:
            error_count += 1
            error_message += "Incorrect plugin type;"

        if (
            self._model_instance.get_model_plugin_type()
            == self._expected_model_plugin_type
        ):
            pass  # Model PluginType is correct
        else:
            error_count += 1
            error_message += "Incorrect model plugin type;"

        if self._model_instance.get_model_algorithm() == self._expected_model_algorithm:
            pass  # Model Algorithm is correct
        else:
            error_count += 1
            error_message += "Incorrect model algorithm;"

        return error_count, error_message

    def _validate_model_supported(self) -> Tuple[int, str]:
        """
        A helper method to validate if the model is supported.
        """
        error_count = 0
        error_message = ""

        if self._model_instance.is_supported():
            pass  # Model is supported
        else:
            error_count += 1
            error_message += "Model not supported;"

        return error_count, error_message


def test_end_to_end_plugin_test(plugin_test_data):
    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
