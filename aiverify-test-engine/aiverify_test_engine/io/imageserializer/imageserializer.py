from __future__ import annotations

from pathlib import Path
from typing import Any

from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.image_type import ImageType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.enums.serializer_plugin_type import (
    SerializerPluginType,
)
from aiverify_test_engine.plugins.metadata.image_metadata import ImageMetadata
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(ISerializer):
    """
    The Plugin(imageserializer) class specifies methods on serialization.
    """

    # Some information on plugin
    _name: str = "imageserializer"
    _description: str = "imageserializer supports reading images"
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.SERIALIZER
    _serializer_plugin_type: SerializerPluginType = SerializerPluginType.IMAGE

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
    def deserialize_data(data_path: str) -> Any:
        """
        A method to read the data path and attempt to deserialize it

        Args:
            data_path (str): data path that is serialized

        Returns:
            Any: deserialized data
        """
        # list of supported image types. list can be expanded in the future.
        supported_image_type_list = [
            (ImageType.PNG, ".png"),
            (ImageType.JPG, ".jpg"),
            (ImageType.JPEG, ".jpeg"),
        ]

        try:
            # Check the file is of what extension
            detected_image_type = None
            image_file = Path(data_path)
            for count, item in enumerate(supported_image_type_list):
                if image_file.suffix == supported_image_type_list[count][1]:
                    detected_image_type = supported_image_type_list[count][0]
                    break

            # If image type is not supported
            if not detected_image_type:
                raise ValueError("The image type is not supported.")

            # Get the image instance
            image_instance = ImageMetadata(None, detected_image_type, data_path)
            return image_instance
        except Exception:
            raise

    @staticmethod
    def get_serializer_plugin_type() -> SerializerPluginType:
        """
        A method to return SerializerPluginType

        Returns:
            SerializerPluginType: Serializer Plugin Type
        """
        return Plugin._serializer_plugin_type
