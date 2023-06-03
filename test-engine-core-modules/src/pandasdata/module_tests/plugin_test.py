import copy
import sys
from pathlib import Path
from typing import Tuple

from test_engine_core.interfaces.idata import IData
from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager
from test_engine_core.utils.time import time_class_method


# =====================================================================================
# NOTE: Do not modify this file unless you know what you are doing.
# =====================================================================================
class PluginTest:
    """
    The PluginTest class specifies methods in supporting testing for the plugin.
    """

    def __init__(self, data_path: str, discover_path: Path):
        # Other variables
        self._base_path: Path = discover_path

        # Store the input arguments as private vars
        self._data_path: str = str(self._base_path / data_path)

        self._ground_truth_value = "default"
        self._expected_data_labels = {
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
        self._expected_data_plugin_type = DataPluginType.PANDAS

    @time_class_method
    def run(self) -> None:
        """
        A function to run the plugin test with the provided arguments.
        """
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

            for method, method_args in test_methods:
                tmp_count, tmp_error_msg = method(*method_args)
                error_count += tmp_count
                error_message += tmp_error_msg

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

    def _validate_metadata(self, data_instance: IData) -> Tuple[int, str]:
        """
        A helper method to validate metadata

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        metadata = data_instance.get_metadata()
        if (
            metadata.name == "pandasdata"
            and metadata.description == "pandasdata supports detecting pandas data"
            and metadata.version == "0.9.0"
        ):
            # Metadata is correct
            pass
        else:
            # Metadata is incorrect
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_plugin_type(self, data_instance: IData) -> Tuple[int, str]:
        """
        A helper method to validate plugin type

        Args:
            data_instance (IData): The data instance to be validated

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""
        if data_instance.get_plugin_type() is PluginType.DATA:
            # PluginType is correct
            pass
        else:
            # PluginType is wrong
            error_count += 1
            error_message += "Incorrect plugin type;"

        if data_instance.get_data_plugin_type() is self._expected_data_plugin_type:
            # Data PluginType is correct
            pass
        else:
            # Data PluginType is incorrect
            error_count += 1
            error_message += "Incorrect data plugin type;"

        return error_count, error_message

    def _validate_labels(self, data_instance: IData) -> Tuple[int, str]:
        """
        A helper method to validate labels supported

        Args:
            data_instance (IData): The data instance to be validated

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        labels = data_instance.read_labels()

        # compare labels with expected
        if labels == self._expected_data_labels:
            # Labels are correct
            pass
        else:
            # Labels are incorrect
            error_count += 1
            error_message += "Incorrect labels;"

        return error_count, error_message

    def _validate_data_supported(self, data_instance: IData) -> Tuple[int, str]:
        """
        A helper method to validate data supported

        Args:
            data_instance (IData): The data instance to be validated

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if data_instance.is_supported():
            # Data is supported
            pass
        else:
            # Data is not supported
            error_count += 1
            error_message += "Data not supported;"

        return error_count, error_message

    def _validate_keep_ground_truth(
        self, ground_truth_instance: IData, ground_truth_value: str
    ) -> Tuple[int, str]:
        """
        A helper method to validate data only contains ground truth

        Args:
            ground_truth_instance (IData): The ground truth instance to be validated
            ground_truth_value (str): The ground truth feature name

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        is_success = ground_truth_instance.keep_ground_truth(ground_truth_value)

        if (
            is_success
            and len(ground_truth_instance.get_data().columns)
            and ground_truth_instance.get_data().columns[0] == ground_truth_value
        ):
            # Keep ground truth value success
            pass
        else:
            # Keep ground truth value failed
            error_count += 1
            error_message += "Incorrect ground truth outcome;"

        return error_count, error_message

    def _validate_remove_ground_truth(
        self, data_instance: IData, ground_truth_value: str
    ) -> Tuple[int, str]:
        """
        A helper method to validate data exclude ground truth

        Args:
            data_instance (IData): The data instance to be validated
            ground_truth_value (str): The ground truth feature name

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        self._init_length = len(data_instance.get_data().columns)
        data_instance.remove_ground_truth(ground_truth_value)
        if (
            len(data_instance.get_data().columns) == self._init_length - 1
            and ground_truth_value not in data_instance.get_data()
        ):
            # Remove ground truth success
            pass
        else:
            # Remove ground truth failed
            error_count += 1
            error_message += "Incorrect removal of ground truth;"

        return error_count, error_message
