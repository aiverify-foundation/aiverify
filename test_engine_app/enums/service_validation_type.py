from enum import Enum


class ServiceValidationType(Enum):
    """
    The ServiceValidationType enum class specifies the different service validation types
    """

    VALIDATE_MODEL = 1
    VALIDATE_DATASET = 2
