from __future__ import annotations

from typing import Any, List, Tuple

from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.plugins.enums.pipeline_plugin_type import PipelinePluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IPipeline):
    """
    The Plugin(sklearnpipeline) class specifies methods on
    handling methods in performing identifying, validating, predicting, scoring.
    """

    # Some information on plugin
    _pipeline: Any = None
    _pipeline_algorithm: str = ""
    _supported_algorithms: List = ["sklearn.pipeline.Pipeline"]
    _name: str = "sklearnpipeline"
    _description: str = "sklearnpipeline supports detecting sklearn pipeline"
    _version: str = "0.9.0"
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

    def __init__(self, **kwargs) -> None:
        pipeline = kwargs.get("pipeline", None)
        if pipeline:
            self._pipeline = pipeline

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
        is_success = True
        error_messages = ""
        return is_success, error_messages

    def get_pipeline(self) -> Any:
        """
        A method to return the pipeline

        Returns:
            Any: Pipeline
        """
        if self._pipeline:
            return self._pipeline
        else:
            return None

    def get_pipeline_algorithm(self) -> str:
        """
        A method to return the pipeline algorithm.
        Either one of the supported algorithms or ""

        Returns:
            str: pipeline algorithm name if supported or "" if not supported
        """
        return self._pipeline_algorithm

    def set_pipeline(self, pipeline: Any) -> None:
        """
        A method to set the pipeline.

        Args:
            pipeline (Any): The pipeline to replace the current data
        """
        self._pipeline = pipeline

    def is_supported(self) -> bool:
        """
        A method to check whether the pipeline is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of pipeline and is supported
        """
        is_pipeline_supported, pipeline_algorithm = self._identify_pipeline_algorithm(
            self._pipeline
        )
        if is_pipeline_supported:
            self._pipeline_algorithm = pipeline_algorithm
        else:
            # Not supported
            pass

        return is_pipeline_supported

    def predict(self, data: Any, *args) -> Any:
        """
        A method to perform prediction using the pipeline

        Args:
            data (Any): data to be predicted by the pipeline

        Returns:
            Any: predicted result
        """
        # The data structure of `data` and return value should be defined by the plugin and clearly explained in the plugin README.
        #
        # For example, it could be a:
        # - list[str] (a list of image paths)
        # - list[tuple[str, tuple[int, int, int, int]]] (a list of tuples containing image path and bounding box coordinates)
        # - list[dict] (a list of dictionaries containing image data and other metadata)
        #
        # The user should implement the necessary data preprocessing steps in the predict method.
        try:
            return self._pipeline.predict(data)
        except Exception:
            raise

    def predict_proba(self, data: Any, *args) -> Any:
        """
        A method to perform prediction probability using the pipeline

        Args:
            data (Any): data to be predicted by the pipeline

        Returns:
            Any: predicted result
        """
        try:
            return self._pipeline.predict_proba(data)
        except Exception:
            raise

    def score(self, data: Any, y_true: Any) -> Any:
        """
        A method to perform scoring using the pipeline

        Args:
            data (Any): data to be scored with y_true
            y_true (Any): ground truth

        Returns:
            Any: score result
        """
        try:
            return self._pipeline.score(data, y_true)
        except Exception:
            raise

    def _identify_pipeline_algorithm(self, pipeline: Any) -> Tuple[bool, str]:
        """
        A helper method to identify the pipeline algorithm whether it is being supported

        Args:
            pipeline (Any): the pipeline to be checked against the supported pipeline list

        Returns:
            Tuple[bool, str] True if pipeline is supported, str will store the supported
            pipeline name
        """
        pipeline_algorithm = ""
        is_success = False
        module_type_name = f"{type(pipeline).__module__}.{type(pipeline).__name__}"
        for supported_algo in self._supported_algorithms:
            if supported_algo == module_type_name:
                pipeline_algorithm = supported_algo
                is_success = True

        return is_success, pipeline_algorithm
