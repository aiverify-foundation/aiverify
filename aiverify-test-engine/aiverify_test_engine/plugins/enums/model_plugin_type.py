from enum import Enum


class ModelPluginType(Enum):
    """
    The ModelPluginType enum class specifies the different model plugin types the tool supports
    """

    SKLEARN = 1
    TENSORFLOW = 2
    XGBOOST = 3
    LIGHTGBM = 4
    API = 5
    PYTORCH = 6
