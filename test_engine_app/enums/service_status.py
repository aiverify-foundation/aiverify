from enum import Enum


class ServiceStatus(Enum):
    """
    The ServiceStatus enum class specifies the different service status
    """

    INIT = 1
    RUNNING = 2
    DONE = 3
    ERROR = 4
