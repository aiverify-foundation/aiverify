from enum import Enum


class ServiceResponse(Enum):
    """
    The ServiceResponse enum class specifies the different service response
    """

    VALID = 1
    INVALID = 2
    NONE = 3
