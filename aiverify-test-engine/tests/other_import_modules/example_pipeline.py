from __future__ import annotations

from typing import Any, List, Tuple

from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.plugins.enums.pipeline_plugin_type import PipelinePluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IPipeline):
    """
    The Plugin(examplepipeline) class specifies methods on
    handling methods in performing identifying, validating, predicting, scoring.
    """

    # Some information on plugin
    _name: str = "examplepipeline"
    _description: str = "examplepipeline"
    _version: str = "0.1.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.PIPELINE
    _pipeline_plugin_type: PipelinePluginType = PipelinePluginType.SKLEARN

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
    def get_pipeline_plugin_type() -> PipelinePluginType:
        """
        A method to return PipelinePluginType

        Returns:
            PipelinePluginType: Pipeline Plugin Type
        """
        return Plugin._pipeline_plugin_type

    def __init__(self, pipeline: Any) -> None:
        self._pipeline: Any = pipeline
        self._pipeline_algorithm: str = ""
        self._supported_algorithms: List = [""]

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

    def get_pipeline(self) -> Any:
        """
        A method to return the pipeline

        Returns:
            Any: Pipeline
        """
        pass

    def get_pipeline_algorithm(self) -> str:
        """
        A method to return the pipeline algorithm.
        Either one of the supported algorithms or ""

        Returns:
            str: pipeline algorithm name if supported or "" if not supported
        """
        pass

    def is_supported(self) -> bool:
        """
        A method to check whether the pipeline is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of pipeline and is supported
        """
        pass

    def predict(self, data: Any, data_labels: Any) -> Any:
        """
        A method to perform prediction using the pipeline

        Args:
            data (Any): data to be predicted by the pipeline
            data_labels (Any): data labels for the data to be predicted by the pipeline

        Returns:
            Any: predicted result
        """
        pass

    def predict_proba(self, data: Any, data_labels: Any) -> Any:
        """
        A method to perform prediction probability using the pipeline

        Args:
            data (Any): data to be predicted by the pipeline
            data_labels (Any): data labels for the data to be predicted by the pipeline

        Returns:
            Any: predicted result
        """
        pass

    def score(self, data: Any, y_true: Any) -> Any:
        """
        A method to perform scoring using the pipeline

        Args:
            data (Any): data to be scored with y_true
            y_true (Any): ground truth

        Returns:
            Any: score result
        """
        pass

    def _identify_pipeline_algorithm(self, pipeline: Any) -> Tuple[bool, str]:
        """
        A helper method to identify the pipeline algorithm whether it is being supported

        Args:
            pipeline (Any): the pipeline to be checked against the supported pipeline list

        Returns:
            Tuple[bool, str]: true if pipeline is supported, str will store the support
            algo name
        """
        pass
