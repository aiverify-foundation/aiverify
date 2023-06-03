from abc import ABC, abstractmethod

from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.metadata.plugin_metadata import PluginMetadata


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
