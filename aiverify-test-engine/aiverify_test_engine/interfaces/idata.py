from abc import abstractmethod
from typing import Any, Dict, Tuple

from aiverify_test_engine.interfaces.iplugin import IPlugin
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType


class IData(IPlugin):
    """
    The IData interface specifies methods for different supported data formats
    """

    @staticmethod
    @abstractmethod
    def get_data_plugin_type() -> DataPluginType:
        pass

    @abstractmethod
    def __init__(self, **kwargs) -> None:
        pass

    @abstractmethod
    def setup(self) -> Tuple[bool, str]:
        pass

    @abstractmethod
    def get_data(self) -> Any:
        pass

    @abstractmethod
    def set_data(self, data: Any) -> None:
        pass

    @abstractmethod
    def is_supported(self) -> bool:
        pass

    @abstractmethod
    def keep_ground_truth(self, ground_truth: str) -> bool:
        pass

    @abstractmethod
    def read_labels(self) -> Dict:
        pass

    @abstractmethod
    def remove_ground_truth(self, ground_truth: str) -> None:
        pass

    @abstractmethod
    def validate(self) -> Tuple[bool, str]:
        pass

    @abstractmethod
    def get_shape(self) -> Tuple[int, int]:
        pass

    @abstractmethod
    def convert_to_dict(self) -> Dict:
        pass
