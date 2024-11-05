from abc import abstractmethod
from typing import Dict, Tuple, Union

from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iplugin import IPlugin
from aiverify_test_engine.interfaces.iserializer import ISerializer


class IAlgorithm(IPlugin):
    """
    The IAlgorithm interface specifies methods for different supported algorithms
    """

    @abstractmethod
    def __init__(
        self,
        data_serializer: Tuple[IData, ISerializer],
        model_serializer: Tuple[IModel, ISerializer],
        ground_truth_serializer: Tuple[IData, ISerializer],
        initial_data_instance: Union[IData, None] = None,
        initial_model_instance: Union[IModel, IPipeline, None] = None,
        **kwargs,
    ) -> None:
        pass

    @abstractmethod
    def setup(self) -> None:
        pass

    @abstractmethod
    def get_progress(self) -> int:
        pass

    @abstractmethod
    def get_results(self) -> Dict:
        pass

    @abstractmethod
    def generate(self) -> None:
        pass
