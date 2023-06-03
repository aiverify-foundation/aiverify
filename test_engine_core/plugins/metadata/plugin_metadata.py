from dataclasses import dataclass


@dataclass
class PluginMetadata:
    """
    The PluginMetadata class comprises information on the plugin such as name, description, and version
    """

    name: str
    description: str
    version: str
