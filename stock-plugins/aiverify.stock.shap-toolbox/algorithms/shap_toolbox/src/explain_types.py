from enum import Enum


class ExplainType(Enum):
    """
    The ExplainType enum class specifies the different explain types the algorithm supports
    """

    GLOBAL = 1
    LOCAL = 2
