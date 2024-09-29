from __future__ import annotations

import csv
from typing import Any

from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.delimiter_type import DelimiterType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.enums.serializer_plugin_type import (
    SerializerPluginType,
)
from aiverify_test_engine.plugins.metadata.delimiter_metadata import DelimiterMetadata
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(ISerializer):
    """
    The Plugin(delimiterserializer) class specifies methods on serialization.
    """

    # Some information on plugin
    _name: str = "delimiterserializer"
    _description: str = (
        "delimiterserializer supports reading data with separated values"
    )
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.SERIALIZER
    _serializer_plugin_type: SerializerPluginType = SerializerPluginType.DELIMITER

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
        # list of supported separated values. list can be expanded in the future
        supported_separated_values_list = [
            (DelimiterType.COMMA, ","),
            (DelimiterType.TAB, "\t"),
            (DelimiterType.SEMICOLON, ";"),
            (DelimiterType.PIPE, "|"),
            (DelimiterType.SPACE, " "),
            (DelimiterType.COLON, ":"),
        ]

        # check if file can be parsed properly and if the delimiter is supported. if not, raise an error
        try:
            with open(data_path, "r") as text_file:
                list_data = list(csv.reader(text_file))
                # check if SV file only has a single column by checking for presence of supported SVs
                if all(
                    supported_separated_value[1] not in list_data[0][0]
                    for supported_separated_value in supported_separated_values_list
                ):
                    delimiter_tuple = (DelimiterType.COMMA, ",")
                    delimiter_instance = DelimiterMetadata(
                        list_data, delimiter_tuple, data_path
                    )
                    return delimiter_instance
                else:
                    text_file.seek(0)
                    dialect = csv.Sniffer().sniff(text_file.read(4096))
                    detected_delimiter_tuple = None
                    for count, item in enumerate(supported_separated_values_list):
                        if (
                            dialect.delimiter
                            == supported_separated_values_list[count][1]
                        ):
                            detected_delimiter_tuple = item
                            break

                    # if delimiter is not found in our list of supported delimiters
                    if not detected_delimiter_tuple:
                        raise ValueError("The delimiter is not supported.")

                    text_file.seek(0)
                    reader = csv.reader(text_file, delimiter=dialect.delimiter)
                    list_data_with_delimiter = list(reader)
                    delimiter_instance = DelimiterMetadata(
                        list_data_with_delimiter, detected_delimiter_tuple, data_path
                    )
                    return delimiter_instance
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
