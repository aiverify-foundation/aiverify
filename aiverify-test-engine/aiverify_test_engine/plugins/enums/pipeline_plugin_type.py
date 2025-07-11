from enum import Enum


class PipelinePluginType(Enum):
    """
    The PipelinePluginType enum class specifies the different pipeline plugin types the tool supports
    """

    SKLEARN = 1
    PYTORCH = 2
    CUSTOM = 3
