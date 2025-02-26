from enum import Enum


class SerializerPluginType(Enum):
    """
    The SerializerPluginType enum class specifies the different serializer plugin types the tool supports
    """

    PICKLE = 1
    JOBLIB = 2
    TENSORFLOW = 3
    DELIMITER = 4
    IMAGE = 5
    PYTORCH = 6
