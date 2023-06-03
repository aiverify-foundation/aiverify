from enum import Enum


class ErrorCategory(Enum):
    """
    The ErrorCategory enum class specifies the different Error Category
    """

    SYSTEM_ERROR = 1
    ALGORITHM_ERROR = 2
    INPUT_ERROR = 3
    DATA_OR_MODEL_ERROR = 4
    CONNECTION_ERROR = 5
    PLUGIN_ERROR = 6
