from enum import Enum


class DelimiterType(Enum):
    """
    The DelimiterType enum class specifies the different delimiter modes the tool supports
    """

    COMMA = 1
    TAB = 2
    SEMICOLON = 3
    PIPE = 4
    SPACE = 5
    COLON = 6
