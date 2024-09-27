from __future__ import annotations

from typing import Any, List, Tuple

from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IModel):
    """
    The Plugin(examplemodel) class specifies methods on
    handling methods in performing identifying, validating, predicting, scoring.
    """

    # Some information on plugin
    _name: str = "examplemodel"
    _description: str = "examplemodel"
    _version: str = "0.1.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.MODEL
    _model_plugin_type: ModelPluginType = ModelPluginType.LIGHTGBM

    @staticmethod
    def get_metadata() -> PluginMetadata:
        """
        A method to return the metadata for this plugin

        Returns:
            PluginMetadata: Metadata of this plugin
        """
        return Plugin._metadata

    @staticmethod
    def get_plugin_type() -> PluginType:
        """
        A method to return the type for this plugin

        Returns:
             PluginType: Type of this plugin
        """
        return Plugin._plugin_type

    @staticmethod
    def get_model_plugin_type() -> ModelPluginType:
        """
        A method to return ModelPluginType

        Returns:
            ModelPluginType: Model Plugin Type
        """
        return Plugin._model_plugin_type

    def __init__(self, model: Any) -> None:
        self._model: Any = model
        self._model_algorithm: str = ""
        self._supported_algorithms: List = ["lightgbm.sklearn.LGBMClassifier"]

    def cleanup(self) -> None:
        """
        A method to clean-up objects
        """
        pass  # pragma: no cover

    def setup(self) -> Tuple[bool, str]:
        """
        A method to perform setup

        Returns:
            Tuple[bool, str]: Returns bool to indicate success, str will indicate the
            error message if failed.
        """
        pass

    def get_model(self) -> Any:
        """
        A method to return the model

        Returns:
            Any: Model
        """
        pass

    def get_model_algorithm(self) -> str:
        """
        A method to return the model algorithm.
        Either one of the supported algorithms or ""

        Returns:
            str: model algorithm name if supported or "" if not supported
        """
        pass

    def is_supported(self) -> bool:
        """
        A method to check whether the model is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of model and is supported
        """
        pass

    def predict(self, data: Any, data_labels: Any) -> Any:
        """
        A method to perform prediction using the model

        Args:
            data (Any): data to be predicted by the model
            data_labels (Any): data labels for the data to be predicted by the model

        Returns:
            Any: predicted result
        """
        pass

    def predict_proba(self, data: Any, data_labels: Any) -> Any:
        """
        A method to perform prediction probability using the model

        Args:
            data (Any): data to be predicted by the model
            data_labels (Any): data labels for the data to be predicted by the model

        Returns:
            Any: predicted result
        """
        pass

    def score(self, data: Any, y_true: Any) -> Any:
        """
        A method to perform scoring using the model

        Args:
            data (Any): data to be scored with y_true
            y_true (Any): ground truth

        Returns:
            Any: score result
        """
        pass

    def _identify_model_algorithm(self, model: Any) -> Tuple[bool, str]:
        """
        A helper method to identify the model algorithm whether it is being supported

        Args:
            model (Any): the model to be checked against the supported model list

        Returns:
            Tuple[bool, str]: true if model is supported, str will store the support
            algo name
        """
        pass
