from enum import Enum


class ErrorSeverity(Enum):
    """
    The ErrorSeverity enum class specifies the different Error Severity
    """

    FATAL = 1
    CRITICAL = 2
    WARNING = 3
