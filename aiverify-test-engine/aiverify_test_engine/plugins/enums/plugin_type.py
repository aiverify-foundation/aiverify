from enum import Enum


class PluginType(Enum):
    """
    The PluginType enum class specifies the different plugin types the tool supports
    """

    DATA = 1
    MODEL = 2
    SERIALIZER = 3
    ALGORITHM = 4
    PIPELINE = 5
