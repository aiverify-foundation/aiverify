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
    file_path = str(
        test_dir
        / "user_defined_files/pickle_pandas_mock_binary_classification_credit_risk_testing.sav"
    )
    ground_truth_value = "default"
    expected_data_labels = {
        "age": "int64",
        "gender": "int64",
        "income": "int64",
        "race": "int64",
        "home_ownership": "int64",
        "prior_count": "int64",
        "loan_amount": "int64",
        "loan_interests": "float64",
        "default": "int64",
    }
    expected_data_plugin_type = DataPluginType.PANDAS

    return (
        file_path,
        discover_path,
        ground_truth_value,
        expected_data_labels,
        expected_data_plugin_type,
    )


class PluginTest:
    def test_plugin(self, plugin_test_data):
        (
            file_path,
            discover_path,
            ground_truth_value,
            expected_data_labels,
            expected_data_plugin_type,
        ) = plugin_test_data

        self._base_path = discover_path
        self._data_path = file_path
        self._ground_truth_value = ground_truth_value
        self._expected_data_labels = expected_data_labels
        self._expected_data_plugin_type = expected_data_plugin_type

        # Discover and load the data plugin
        PluginManager.discover(str(self._base_path))

        # Get the data instance
        data_instance, serializer_instance, error_message = PluginManager.get_instance(
            PluginType.DATA, **{"filename": self._data_path}
        )

        # Validate the data and serializer instances
        assert data_instance is not None, f"Invalid data instance: {data_instance}"
        assert (
            serializer_instance is not None
        ), f"Invalid serializer instance: {serializer_instance}"

        # Store ground truth instance
        ground_truth_instance = copy.copy(data_instance)

        # Perform data instance setup
        is_success, error_messages = data_instance.setup()
        assert is_success, f"Failed to perform data instance setup: {error_messages}"

        # Run validation methods
        test_methods = [
            (self._validate_metadata, [data_instance]),
            (self._validate_plugin_type, [data_instance]),
            (self._validate_labels, [data_instance]),
            (self._validate_data_supported, [data_instance]),
            (
                self._validate_keep_ground_truth,
                [ground_truth_instance, self._ground_truth_value],
            ),
            (
                self._validate_remove_ground_truth,
                [data_instance, self._ground_truth_value],
            ),
        ]

        # Execute the test methods
        for method, args in test_methods:
            error_count, error_message = method(*args)
            assert (
                error_count == 0
            ), f"Errors found while running tests: {error_message}"

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
            and len(ground_truth_instance.get_data().columns)
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

        initial_length = len(data_instance.get_data().columns)
        data_instance.remove_ground_truth(ground_truth_value)
        if (
            len(data_instance.get_data().columns) == initial_length - 1
            and ground_truth_value not in data_instance.get_data()
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect removal of ground truth;"

        return error_count, error_message


def test_end_to_end_data_plugin(plugin_test_data):
    data_plugin_test = PluginTest()
    data_plugin_test.test_plugin(plugin_test_data)
