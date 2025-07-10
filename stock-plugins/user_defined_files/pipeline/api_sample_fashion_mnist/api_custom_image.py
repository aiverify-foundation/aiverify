import requests
from typing import List, Any, Tuple, Iterable
import numpy as np
import logging

from aiverify_test_engine.interfaces.ipipeline import IPipeline  # Adjust the import path if needed
from aiverify_test_engine.plugins.enums.pipeline_plugin_type import PipelinePluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata

# Set up logging
logger = logging.getLogger(__name__)

class ApiInferencePipeline(IPipeline):
    
    # Some information on plugin
    _pipeline: Any = None
    _pipeline_algorithm: str = ""
    _name: str = "apipipeline"
    _description: str = "apipipeline supports calling api/custom pipeline"
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.PIPELINE
    _pipeline_plugin_type: PipelinePluginType = PipelinePluginType.API
    
    def __init__(self):
        self._api_url = "" #insert your URL here, eg. http://xxx:8000/predict

    def predict(self, img_paths: Iterable[str]) -> np.ndarray:
        """
        Sends image files to the API and returns predictions.

        Args:
            img_paths (Iterable[str]): Paths to image files.

        Returns:
            np.ndarray: Predicted class indices.
        """

        try:
            files = [("files", (img, open(img, "rb"), "image/jpeg")) for img in img_paths] #(fieldname, (filename, fileobj, content_type))
            response = requests.post(self._api_url, files=files)

            if response.status_code == 200:
                predictions = response.json().get("predictions", [])
                return np.array(predictions)
            else:
                logger.error(f"API error: {response.status_code}, {response.text}")
                return np.array([])
            
        except Exception as e:
            logger.exception(f"Exception during API request: {e}")
            return np.array([])

    @staticmethod
    def get_metadata() -> PluginMetadata:
        """
        A method to return the metadata for this plugin

        Returns:
            PluginMetadata: Metadata of this plugin
        """
        return ApiInferencePipeline._metadata
    
    @staticmethod
    def get_plugin_type() -> PluginType:
        """
        A method to return the type for this plugin

        Returns:
             PluginType: Type of this plugin
        """
        return ApiInferencePipeline._plugin_type
    
    @staticmethod
    def get_pipeline_plugin_type() -> PipelinePluginType:
        """
        A method to return PipelinePluginType

        Returns:
            PipelinePluginType: Pipeline Plugin Type
        """
        return ApiInferencePipeline._pipeline_plugin_type
    
    def cleanup(self) -> None:
        """
        A method to clean-up objects
        """
        pass
    
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
        pass
    
    def get_pipeline_algorithm(self) -> str:
        """
        A method to return the pipeline algorithm.
        Either one of the supported algorithms or ""

        Returns:
            str: pipeline algorithm name if supported or "" if not supported
        """
        pass

    def set_pipeline(self, pipeline: Any) -> None:
        """
        A method to set the pipeline.

        Args:
            pipeline (Any): The pipeline to replace the current data
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

    def predict_proba(self, data: Any, *args) -> Any:
        """
        A method to perform prediction probability using the pipeline

        Args:
            data (Any): data to be predicted by the pipeline

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
    
    
    
    