from typing import Any, Tuple

from aiverify_test_engine.interfaces.ipipeline import IPipeline  # Adjust the import path if needed
from aiverify_test_engine.plugins.enums.pipeline_plugin_type import PipelinePluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata

class CustomInferencePipeline(IPipeline):
    
    # Some information on plugin
    _pipeline: Any = None
    _pipeline_algorithm: str = ""
    _name: str = "custompipeline"
    _description: str = "custompipeline supports calling custom pipeline"
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.PIPELINE
    _pipeline_plugin_type: PipelinePluginType = PipelinePluginType.CUSTOM
    
    def __init__(self, **kwargs):
        """
        Initialize the pipeline.
        Users can override this constructor to accept custom parameters.
        """
        pass

    def predict(self, *args, **kwargs) -> Any:
        """
        Abstract method for prediction.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement predict()")

    @staticmethod
    def get_metadata() -> PluginMetadata:
        return CustomInferencePipeline._metadata
    
    @staticmethod
    def get_plugin_type() -> PluginType:
        return CustomInferencePipeline._plugin_type
    
    @staticmethod
    def get_pipeline_plugin_type() -> PipelinePluginType:
        return CustomInferencePipeline._pipeline_plugin_type
    
    def cleanup(self) -> None:
        """
        Optional cleanup logic.
        """
        pass
    
    def setup(self) -> Tuple[bool, str]:
        """
        Optional setup logic.
        Returns (success: bool, error_message: str).
        """
        return True, ""
    
    def get_pipeline(self) -> Any:
        """
        Returns the internal pipeline object.
        """
        return self._pipeline
    
    def get_pipeline_algorithm(self) -> str:
        """
        Returns the algorithm name or description.
        """
        return self._pipeline_algorithm

    def set_pipeline(self, pipeline: Any) -> None:
        """
        Sets the internal pipeline object.
        """
        self._pipeline = pipeline

    def is_supported(self) -> bool:
        """
        Returns True if the pipeline is supported in the current environment.
        """
        return True

    def predict_proba(self, data: Any, *args) -> Any:
        """
        Optional method to predict probabilities.
        """
        pass

    def score(self, data: Any, y_true: Any) -> Any:
        """
        Optional method to score the model.
        """
        pass
    
    
    
    