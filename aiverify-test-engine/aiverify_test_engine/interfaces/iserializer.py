from abc import abstractmethod
from typing import Any

from aiverify_test_engine.interfaces.iplugin import IPlugin
from aiverify_test_engine.plugins.enums.serializer_plugin_type import (
    SerializerPluginType,
)


class ISerializer(IPlugin):
    """
    The ISerializer interface specifies methods for different supported serializers
    """

    @staticmethod
    @abstractmethod
    def deserialize_data(data_path: str) -> Any:
        pass

    @staticmethod
    @abstractmethod
    def get_serializer_plugin_type() -> SerializerPluginType:
        pass
