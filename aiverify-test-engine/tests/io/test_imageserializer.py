from pathlib import Path
from typing import Tuple

import pytest
from aiverify_test_engine.plugins.enums.image_type import ImageType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.image_metadata import ImageMetadata
from aiverify_test_engine.plugins.plugins_manager import PluginManager


@pytest.fixture
def plugin_test_data(request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    file_path = str(test_dir / "user_defined_files/1.jpg")
    expected_type = ImageMetadata
    expected_image_type = ImageType.JPG
    return file_path, discover_path, expected_type, expected_image_type


class PluginTest:
    def test_plugin(self, plugin_test_data):
        file_path, discover_path, expected_type, expected_image_type = plugin_test_data
        self._base_path = discover_path
        self._serializer_path = file_path
        self._expected_type = expected_type
        self._expected_image_type = expected_image_type
        self._serializer_instance = None

        # Discover and load the plugin
        PluginManager.discover(str(self._base_path))
        plugin_object = PluginManager._plugins[PluginType.SERIALIZER.name][
            "imageserializer"
        ]
        self._serializer_instance = plugin_object.Plugin()

        # Run test methods
        test_methods = [
            self._validate_plugin_exists,
            self._validate_metadata,
            self._validate_serializer_supported,
        ]

        # Check all test methods
        for method in test_methods:
            error_count, error_message = method()
            assert (
                error_count == 0
            ), f"Errors found while running tests. {error_message}"

    def _validate_plugin_exists(self) -> Tuple[int, str]:
        error_count = 0
        error_message = ""
        if PluginManager.is_plugin_exists(PluginType.SERIALIZER, "imageserializer"):
            pass
        else:
            error_count += 1
            error_message += "Serializer plugin not found;"

        return error_count, error_message

    def _validate_metadata(self) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        metadata = self._serializer_instance.get_metadata()
        if (
            metadata.name == "imageserializer"
            and metadata.description == "imageserializer supports reading images"
            and metadata.version == "0.9.0"
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_serializer_supported(self) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        output = self._serializer_instance.deserialize_data(self._serializer_path)
        if (
            isinstance(output, self._expected_type)
            and output.get_data() is None
            and output.get_type() is self._expected_image_type
            and output.get_path() == self._serializer_path
        ):
            pass
        else:
            error_count += 1
            error_message += "Deserialized data does not match expected data;"

        return error_count, error_message


def test_end_to_end_plugin_test(plugin_test_data):
    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
