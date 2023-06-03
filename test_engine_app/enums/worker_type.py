from enum import Enum


class WorkerType(Enum):
    """
    The WorkerType enum class specifies the different processes worker types
    """

    PROCESS = 1
    SERVICE = 2
    API_SERVER = 3
