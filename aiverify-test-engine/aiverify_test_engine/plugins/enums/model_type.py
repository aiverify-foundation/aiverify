from enum import Enum


class ModelType(Enum):
    """
    The ModelType enum class specifies the different model types the tool supports
    """

    CLASSIFICATION = 1
    REGRESSION = 2
    UPLIFT = 3
