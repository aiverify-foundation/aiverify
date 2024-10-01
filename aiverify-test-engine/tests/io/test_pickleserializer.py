from pathlib import Path
from typing import Tuple

import pytest
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from aiverify_test_engine.utils.time import time_class_method


@pytest.fixture
def plugin_test_data(request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    file_path = str(test_dir / "user_defined_files/teststring.sav")
    expected_string = "HELLOWORLD"
    return file_path, discover_path, expected_string


class PluginTest:
    def test_plugin(self, plugin_test_data):
        file_path, discover_path, expected_string = plugin_test_data
        self._base_path = discover_path
        self._serializer_path = file_path
        self._expected_string = expected_string
        self._serializer_instance = None

        self.run_test()

    @time_class_method
    def run_test(self):
        """
        A function to run the plugin test with the provided arguments.
        """
        error_count = 0
        error_message = ""

        # Discover and load the plugin
        PluginManager.discover(str(self._base_path))
        plugin_object = PluginManager._plugins[PluginType.SERIALIZER.name][
            "pickleserializer"
        ]
        self._serializer_instance = plugin_object.Plugin()

        # Run different tests on the serializer instance
        test_methods = [
            self._validate_plugin_exists,
            self._validate_metadata,
            self._validate_serializer_supported,
        ]

        # Run all tests and accumulate errors
        for method in test_methods:
            tmp_count, tmp_error_msg = method()
            error_count += tmp_count
            error_message += tmp_error_msg

        assert error_count == 0, f"Errors found while running tests: {error_message}"

    def _validate_plugin_exists(self) -> Tuple[int, str]:
        """
        A helper method to validate whether the plugin exists

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""
        if PluginManager.is_plugin_exists(PluginType.SERIALIZER, "pickleserializer"):
            pass
        else:
            error_count += 1
            error_message += "Serializer plugin not found;"

        return error_count, error_message

    def _validate_metadata(self) -> Tuple[int, str]:
        """
        A helper method to validate metadata

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        metadata = self._serializer_instance.get_metadata()
        if (
            metadata.name == "pickleserializer"
            and metadata.description
            == "pickleserializer supports deserializing pickle data"
            and metadata.version == "0.9.0"
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_serializer_supported(self) -> Tuple[int, str]:
        """
        A helper method to validate serializer support

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        deserialized_data = self._serializer_instance.deserialize_data(
            self._serializer_path
        )
        if deserialized_data == self._expected_string:
            pass
        else:
            error_count += 1
            error_message += "Deserialized data does not match expected data;"

        return error_count, error_message


def test_end_to_end_plugin_test(plugin_test_data):
    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
