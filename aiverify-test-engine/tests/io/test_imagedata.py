import copy
from pathlib import Path
from typing import Tuple

import pytest
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager


@pytest.fixture
def plugin_test_data(request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    data_path = str(test_dir / "user_defined_files/0.png")
    expected_data_plugin_type = DataPluginType.PANDAS
    return data_path, discover_path, expected_data_plugin_type


class PluginTest:
    def test_plugin(self, plugin_test_data):
        data_path, discover_path, expected_data_plugin_type = plugin_test_data
        self._base_path = discover_path
        self._data_path = data_path
        self._expected_data_plugin_type = expected_data_plugin_type

        try:
            error_count = 0
            error_message = ""

            # Load all the core plugins and the data plugin
            PluginManager.discover(str(self._base_path))
            # Get the data instance
            (
                self._data_instance,
                self._serializer_instance,
                error_message,
            ) = PluginManager.get_instance(
                PluginType.DATA, **{"filename": self._data_path}
            )

            # Invalid data serializer instances
            if not self._data_instance or not self._serializer_instance:
                raise RuntimeError(
                    f"Invalid data or serializer instance: {self._data_instance}, {self._serializer_instance}"
                )

            # Make a separate instance to store ground truth data
            self._ground_truth_instance = copy.copy(self._data_instance)

            # Perform data instance setup
            is_success, error_messages = self._data_instance.setup()
            if not is_success:
                raise RuntimeError(
                    f"Failed to perform data instance setup: {error_messages}"
                )

            # Run different tests on the data instance
            test_methods = [
                (self._validate_metadata, [self._data_instance]),
                (self._validate_plugin_type, [self._data_instance]),
                (self._validate_data_supported, [self._data_instance]),
            ]

            for method, method_args in test_methods:
                tmp_count, tmp_error_msg = method(*method_args)
                error_count += tmp_count
                error_message += tmp_error_msg

            assert (
                error_count == 0
            ), f"Errors found while running tests. {error_message}"

        except Exception as error:
            pytest.fail(f"Exception found while running tests. {str(error)}")

    def _validate_metadata(self, data_instance: IData) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        metadata = data_instance.get_metadata()
        if (
            metadata.name == "pandasdata"
            and metadata.description == "pandasdata supports detecting pandas data"
            and metadata.version == "0.9.0"
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_plugin_type(self, data_instance: IData) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        if data_instance.get_plugin_type() is PluginType.DATA:
            pass
        else:
            error_count += 1
            error_message += "Incorrect plugin type;"

        if data_instance.get_data_plugin_type() is self._expected_data_plugin_type:
            pass
        else:
            error_count += 1
            error_message += "Incorrect data plugin type;"

        return error_count, error_message

    def _validate_data_supported(self, data_instance: IData) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        if data_instance.is_supported():
            pass
        else:
            error_count += 1
            error_message += "Data not supported;"

        return error_count, error_message


def test_end_to_end_plugin_test(plugin_test_data):
    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
