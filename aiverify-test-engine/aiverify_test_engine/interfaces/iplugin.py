from abc import ABC, abstractmethod

from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


class IPlugin(ABC):
    """
    The IPlugin interface specifies plugins base methods
    """

    @staticmethod
    @abstractmethod
    def get_metadata() -> PluginMetadata:
        pass

    @staticmethod
    @abstractmethod
    def get_plugin_type() -> PluginType:
        pass
