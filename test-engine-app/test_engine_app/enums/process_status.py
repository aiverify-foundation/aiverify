from enum import Enum, auto


class ProcessStatus(Enum):
    """
    The ProcessStatus enum class specifies the different process status
    """

    UPDATE = auto()
    COMPLETE = auto()
