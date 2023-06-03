from enum import Enum


class DataPluginType(Enum):
    """
    The DataPluginType enum class specifies the different data plugins the tool supports
    """

    PANDAS = 1
    DELIMITER = 2
    IMAGE = 3
