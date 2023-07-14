from __future__ import annotations

from typing import Any, Dict, List, Tuple

import httpx
from openapi_schema_validator import OAS30Validator, validate
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.plugins.enums.model_plugin_type import ModelPluginType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IModel):
    """
    The Plugin(apiconnector) class specifies methods on
    handling methods in performing identifying, validating, predicting, scoring.
    """

    # Some information on plugin
    _model: Any = None
    _model_algorithm: str = ""
    _supported_algorithms: List = [""]
    _name: str = "apiconnector"
    _description: str = (
        "apiconnector supports performing api calls to external model servers"
    )
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.MODEL
    _model_plugin_type: ModelPluginType = ModelPluginType.API

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

    @staticmethod
    def session_factory(*args, **kwargs) -> httpx.AsyncClient:
        """
        A factory that generates async client

        Returns:
            httpx.AsyncClient: Returns an httpx AsyncClient with additional settings
        """
        kwargs["verify"] = False
        kwargs["timeout"] = 5.0  # seconds
        return httpx.AsyncClient(*args, **kwargs)

    def __init__(self, **kwargs) -> None:
        # Configuration
        self._is_setup_completed = False
        api_schema = kwargs.get("api_schema", None)
        api_config = kwargs.get("api_config", None)

        if api_schema and api_config:
            self._api_schema = api_schema
            self._api_config = api_config
        else:
            self._api_schema: Dict = dict()
            self._api_config: Dict = dict()

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
        try:
            # Perform OpenAPI3 schema validation
            # An exception will be thrown if validation has errors
            validate(self._api_config, self._api_schema, cls=OAS30Validator)

            # Search for the first api and http method.
            # Set the prediction operationId
            path_to_be_updated = self._api_schema["paths"]
            if len(path_to_be_updated) > 0:
                first_api = list(path_to_be_updated.items())[0]
                first_api_value = first_api[1]
                if len(first_api_value) > 0:
                    first_api_http = list(first_api_value.items())[0]
                    first_api_http_value = first_api_http[1]
                    first_api_http_value.update({"operationId": "predict_api"})

            # TODO: Create the api instance

            # TODO: Setup API Authentication

            # Setup completed
            self._is_setup_completed = True
            return True, ""

        except Exception as error:
            # Error setting up api connection
            return False, str(error)

    def get_model(self) -> Any:
        """
        A method to return the model

        Returns:
            Any: Model
        """
        if self._model:
            return self._model
        else:
            return None

    def get_model_algorithm(self) -> str:
        """
        A method to return the model algorithm.
        Either one of the supported algorithms or ""

        Returns:
            str: model algorithm name if supported or "" if not supported
        """
        return self._model_algorithm

    def is_supported(self) -> bool:
        """
        A method to check whether the model is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of model and is supported
        """
        try:
            validate(self._api_config, self._api_schema, cls=OAS30Validator)
            return True
        except Exception as error:
            return False, str(error)

    def predict(self, data: Any, *args) -> Any:
        """
        A method to perform prediction using the model

        Args:
            data (Any): data to be predicted by the model

        Returns:
            Any: predicted result
        """
        pass

    def predict_proba(self, data: Any, *args) -> Any:
        """
        A method to perform prediction probability using the model

        Args:
            data (Any): data to be predicted by the model

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
        raise RuntimeError("ApiConnector does not support score method")
