from enum import Enum


class TaskStatus(Enum):
    """
    The TaskStatus enum class specifies the different task status
    """

    PENDING = 1
    RUNNING = 2
    CANCELLED = 3
    SUCCESS = 4
    ERROR = 5
