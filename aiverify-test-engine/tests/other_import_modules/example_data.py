from __future__ import annotations

from typing import Any, Dict, Tuple

from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.delimiter_type import DelimiterType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IData):
    """
    The Plugin(exampledata) class specifies methods on
    handling data formats.
    """

    # Some information on plugin
    _name: str = "exampledata"
    _description: str = "exampledata"
    _version: str = "0.1.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.DATA
    _data_plugin_type: DataPluginType = DataPluginType.DELIMITER

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
            DataType: data plugin type
        """
        return Plugin._data_plugin_type

    def __init__(self, data: Any) -> None:
        self._data: Any = data

    def setup(self) -> Tuple[bool, str]:
        """
        A method to perform setup

        Returns:
            Tuple[bool, str]: Returns bool to indicate success, str will indicate
            the error message if failed.
        """
        pass

    def get_data(self) -> Any:
        """
        A method to return data

        Returns:
            Any: data
        """
        pass

    def get_delimiter_type(self) -> DelimiterType:
        """
        A method to return delimiter type

        Returns:
            DelimiterType: the delimiter type that the data is being delimited
        """
        pass

    def is_supported(self) -> bool:
        """
        A method to check whether the data is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of data and is supported

        """
        pass

    def keep_ground_truth(self, ground_truth: str) -> bool:
        """
        A method to keep only the ground truth in the data

        Args:
            ground_truth (str): The ground truth feature name

        Returns:
            bool: True if the ground truth is found and kept, False if not found
        """
        pass

    def read_labels(self) -> Dict:
        """
        A method to return the data labels

        Returns:
            Dict: Returns a dictionary of key-value pairs for col name - col datatype
        """
        pass

    def remove_ground_truth(self, ground_truth: str) -> None:
        """
        A method to remove ground truth from the data

        Args:
            ground_truth (str): The ground truth feature name
        """
        pass

    def validate(self) -> Tuple[bool, str]:
        """
        A method to perform validation on the data

        Returns:
            Tuple[bool, str]: True if the data is valid, False with error messages
            if data is not valid
        """
        pass

    def get_shape(self) -> Tuple[int, int]:
        """
        A method to return the number of rows and columns in the data

        Returns:
            Tuple[int, int]: Returns the number of rows and columns in the data
        """
        pass

    def convert_to_dict(self) -> Dict:
        """
        A method to add the data path of the CSV file and delimiter type into a dictionary.

        Returns:
            Dict: dictionary with the data path and delimiter type
        """
        pass
