from __future__ import annotations

from typing import Any, Dict, List, Tuple

from aiverify_test_engine.interfaces.iconverter import IConverter
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.utils.validate_checks import is_empty_string
from pandas import DataFrame, read_csv


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IData, IConverter):
    """
    The Plugin(pandasdata) class specifies methods on
    handling data formats.
    """

    # Some information on plugin
    _data: DataFrame = None
    _name: str = "pandasdata"
    _description: str = "pandasdata supports detecting pandas data"
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.DATA
    _data_plugin_type: DataPluginType = DataPluginType.PANDAS

    @staticmethod
    def get_metadata() -> PluginMetadata:
        """
        A method to return the metadata for this plugin

        Returns:
            PluginMetadata: Metadata of this plugin
        """
        return Plugin._metadata

    @staticmethod
    def get_plugin_type() -> PluginType:
        """
        A method to return the type for this plugin

        Returns:
             PluginType: Type of this plugin
        """
        return Plugin._plugin_type

    @staticmethod
    def get_data_plugin_type() -> DataPluginType:
        """
        A method to return data plugin type

        Returns:
            DataPluginType: data plugin type
        """
        return Plugin._data_plugin_type

    def __init__(self, **kwargs) -> None:
        data = kwargs.get("data", None)
        if isinstance(data, DataFrame) and not data.empty:
            self._data = data

    def setup(self) -> Tuple[bool, str]:
        """
        A method to perform setup

        Returns:
            Tuple[bool, str]: Returns bool to indicate success, str will indicate
            the error message if failed.
        """
        is_success = True
        error_messages = ""
        return is_success, error_messages

    def get_data(self) -> Any:
        """
        A method to return data

        Returns:
            Any: data
        """
        if isinstance(self._data, DataFrame) and not self._data.empty:
            return self._data
        else:
            return None

    def set_data(self, data: DataFrame) -> None:
        """
        A method to set the data.

        Args:
            data (DataFrame): The data to replace the current data
        """
        if isinstance(data, DataFrame) and not data.empty:
            self._data = data

    def is_supported(self) -> bool:
        """
        A method to check whether the data is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of data and is supported
        """
        return isinstance(self._data, DataFrame)

    def keep_ground_truth(self, ground_truth: str) -> bool:
        """
        A method to keep only the ground truth in the data

        Args:
            ground_truth (str): The ground truth feature name

        Returns:
            bool: True if the ground truth is found and kept, False if not found
        """
        if (
            isinstance(self._data, DataFrame)
            and not self._data.empty
            and not is_empty_string(ground_truth)
        ):
            if ground_truth in self._data.columns:
                self._data = self._data[[ground_truth]]
                return True

        return False

    def read_labels(self) -> Dict:
        """
        A method to return the data labels

        Returns:
            Dict: Returns a dictionary of key-value pairs for col name - col datatype
        """
        output_dict = dict()
        if isinstance(self._data, DataFrame) and not self._data.empty:
            for key in self._data.keys():
                output_dict[key] = self._data.dtypes[key].name
        return output_dict

    def remove_ground_truth(self, ground_truth: str) -> None:
        """
        A method to remove ground truth from the data

        Args:
            ground_truth (str): The ground truth feature name
        """
        if (
            isinstance(self._data, DataFrame)
            and not self._data.empty
            and not is_empty_string(ground_truth)
        ):
            if ground_truth in self._data.columns:
                self._data = self._data.drop(ground_truth, axis=1)

    def validate(self) -> Tuple[bool, str]:
        """
        A method to perform validation on the data

        Returns:
            Tuple[bool, str]: True if the data is valid, False with error messages
            if data is not valid
        """
        if isinstance(self._data, DataFrame) and not self._data.empty:
            empty_columns = self._data.columns[
                self._data.columns.isnull() | (self._data.columns == "")
            ]
            if empty_columns.empty:
                return True, ""
            else:
                return False, "The data has missing column labels."
        else:
            return False, "The inputs do not meet the validation rules."

    def get_shape(self) -> Tuple[int, int]:
        """
        A method to return the number of rows and columns in the data

        Returns:
            Tuple[int, int]: Returns the number of rows and columns in the data
        """
        if isinstance(self._data, DataFrame) and not self._data.empty:
            return self._data.shape[0], self._data.shape[1]

    def convert_to_dict(self) -> Dict:
        """
        A method to convert the data returned from the data plugin to Dict

        Returns:
            Dict: converted data in Dict
        """
        pass

    def read_csv_as_df(self, data_path: str, delimiter_char: str) -> Any:
        """
        A method to read in CSV, with the detected limiter, and converts the data into Pandas DataFrame

        Args:
            data_path (str): The path of the CSV file
            delimiter_char (str): The delimiter detected prior to calling this method by DelimiterMetadata
        Returns:
            Any: The CSV data in a Pandas DataFrame
        """
        if not is_empty_string(data_path) and not is_empty_string(delimiter_char):
            try:
                df = read_csv(data_path, sep=delimiter_char)
                return df
            except Exception:
                return None
        return None

    def read_image_as_df(self, image_paths: List, column_name: str) -> Any:
        """
        A method to read in image file information, converts the data into Pandas DataFrame.

        Args:
            image_paths (List): The List of image paths
            column_name (str): The column name of the DF

        Returns:
            Any: The image file information in a Pandas DataFrame
        """
        if (
            image_paths is not None
            and isinstance(image_paths, List)
            and not is_empty_string(column_name)
        ):
            df = DataFrame(image_paths, columns=[column_name])
            return df
        return None
