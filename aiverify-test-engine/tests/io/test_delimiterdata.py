import copy
from pathlib import Path
from typing import Tuple

import pytest
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager


class PluginTest:
    def test_plugin(self, plugin_test_data):
        (
            self._data_path,
            self._base_path,
            self._ground_truth_value,
            self._expected_data_labels,
            self._expected_data_plugin_type,
        ) = plugin_test_data

        # Discover and load the plugin
        PluginManager.discover(str(self._base_path))

        # Get the data and serializer instances
        self._data_instance, self._serializer_instance, _ = PluginManager.get_instance(
            PluginType.DATA, **{"filename": self._data_path}
        )

        # Ensure valid instances
        if not self._data_instance or not self._serializer_instance:
            raise RuntimeError("Invalid data or serializer instance")

        # Create a separate instance for ground truth data
        self._ground_truth_instance = copy.copy(self._data_instance)

        # Perform data instance setup
        is_success, error_messages = self._data_instance.setup()
        if not is_success:
            raise RuntimeError(
                f"Failed to perform data instance setup: {error_messages}"
            )

        test_methods = [
            (self._validate_metadata, [self._data_instance]),
            (self._validate_plugin_type, [self._data_instance]),
            (self._validate_labels, [self._data_instance]),
            (self._validate_data_supported, [self._data_instance]),
            (
                self._validate_keep_ground_truth,
                [self._ground_truth_instance, self._ground_truth_value],
            ),
            (
                self._validate_remove_ground_truth,
                [self._data_instance, self._ground_truth_value],
            ),
        ]

        # Execute each test method
        for method, method_args in test_methods:
            error_count, error_message = method(*method_args)
            assert error_count == 0, f"Errors found: {error_message}"

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

    def _validate_labels(self, data_instance: IData) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        labels = data_instance.read_labels()
        if labels == self._expected_data_labels:
            pass
        else:
            error_count += 1
            error_message += "Incorrect labels;"

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

    def _validate_keep_ground_truth(
        self, ground_truth_instance: IData, ground_truth_value: str
    ) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        is_success = ground_truth_instance.keep_ground_truth(ground_truth_value)
        if (
            is_success
            and len(ground_truth_instance.get_data().columns) == 1
            and ground_truth_instance.get_data().columns[0] == ground_truth_value
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect ground truth outcome;"

        return error_count, error_message

    def _validate_remove_ground_truth(
        self, data_instance: IData, ground_truth_value: str
    ) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        init_length = len(data_instance.get_data().columns)
        data_instance.remove_ground_truth(ground_truth_value)
        if (
            len(data_instance.get_data().columns) == init_length - 1
            and ground_truth_value not in data_instance.get_data()
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect removal of ground truth;"

        return error_count, error_message


@pytest.mark.parametrize(
    "data_path",
    [
        str(Path(__file__).parent / "user_defined_files/sv_comma.txt"),
        "https://raw.githubusercontent.com/aiverify-foundation/aiverify/refs/heads/v2.x/aiverify-test-engine/tests/io/user_defined_files/sv_comma.txt",  # noqa: E501
    ],
)
def test_end_to_end_data_plugin_test(data_path, request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    ground_truth_value = "Gender"
    expected_data_labels = {
        "Name": "object",
        "Age": "int64",
        "Gender": "object",
    }
    expected_data_plugin_type = DataPluginType.PANDAS

    plugin_test_data = (
        data_path,
        discover_path,
        ground_truth_value,
        expected_data_labels,
        expected_data_plugin_type,
    )

    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
