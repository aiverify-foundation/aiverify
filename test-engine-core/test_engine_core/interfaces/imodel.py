from abc import abstractmethod
from typing import Any, Tuple

from test_engine_core.interfaces.iplugin import IPlugin
from test_engine_core.plugins.enums.model_plugin_type import ModelPluginType


class IModel(IPlugin):
    """
    The IModel interface specifies methods for different supported model formats
    """

    @staticmethod
    @abstractmethod
    def get_model_plugin_type() -> ModelPluginType:
        pass

    @abstractmethod
    def __init__(self, **kwargs) -> None:
        pass

    @abstractmethod
    def cleanup(self) -> None:
        pass

    @abstractmethod
    def setup(self) -> Tuple[bool, str]:
        pass

    @abstractmethod
    def get_model(self) -> Any:
        pass

    @abstractmethod
    def get_model_algorithm(self) -> str:
        pass

    @abstractmethod
    def is_supported(self) -> bool:
        pass

    @abstractmethod
    def predict(self, data: Any, *args) -> Any:
        pass

    @abstractmethod
    def predict_proba(self, data: Any, *args) -> Any:
        pass

    @abstractmethod
    def score(self, data: Any, y_true: Any) -> Any:
        pass
