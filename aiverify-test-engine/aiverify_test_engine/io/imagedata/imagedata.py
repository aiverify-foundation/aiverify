from __future__ import annotations

from typing import Any, Dict, Tuple, Union

from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.image_type import ImageType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.image_metadata import ImageMetadata
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IData):
    """
    The Plugin(imagedata) class specifies methods on
    handling data formats.
    """

    # Some information on plugin
    _data: ImageMetadata = None
    _name: str = "imagedata"
    _description: str = "imagedata supports data that are images"
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.DATA
    _data_plugin_type: DataPluginType = DataPluginType.IMAGE

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
        if isinstance(data, ImageMetadata) and data:
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
        if isinstance(self._data, ImageMetadata) and self._data:
            return self._data
        else:
            return None

    def get_image_type(self) -> Union[ImageType, None]:
        """
        A method to return image type

        Returns:
            Union[ImageType, None]: the image extension of the image
        """
        if isinstance(self._data, ImageMetadata) and self._data:
            return self._data.get_type()
        else:
            return None

    def set_data(self, data: ImageMetadata) -> None:
        """
        A method to set the data.

        Args:
            data (ImageMetadata): The data to replace the current data
        """
        if isinstance(data, ImageMetadata) and data:
            self._data = data

    def is_supported(self) -> bool:
        """
        A method to check whether the data is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of data and is supported
        """
        return isinstance(self._data, ImageMetadata)

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
        A method to pass necessary information to create an instance of Pandas Dataframe.
        This is necessary so that we can pass pandas dataframe to the algorithm

        Returns:
            Dict: dictionary containing the necessary information
        """
        pass
