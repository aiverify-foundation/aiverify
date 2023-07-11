from __future__ import annotations

from typing import Any, Dict, List, Tuple, Union

from openapi_schema_validator import OAS30Validator, validate
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.plugins.enums.model_plugin_type import ModelPluginType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.metadata.plugin_metadata import PluginMetadata

# from requests import Session, session
# from requests.adapters import HTTPAdapter, Retry


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

    def __init__(self, api_schema: Dict, api_config: Dict) -> None:
        # Configuration
        self._is_setup_completed = False
        if api_schema and api_config:
            self._api_schema = api_schema
            self._api_config = api_config
        else:
            self._api_schema: Dict = dict()
            self._api_config: Dict = dict()

        # # API variables
        # self._openapi3_inst = None
        # self._default_api_retries: int = 3
        # self._session: Union[Session, None] = None
        # self._additional_headers: Dict = dict()
        # self._auth_info: Dict = dict()
        # # (0s, 2s, 4s)
        # # Formula: {backoff factor} * (2 ** ({number of total retries} - 1))
        # self._default_api_backoff: float = 1.0
        # self._default_api_timeout: float = 5.0 # seconds
        # self._default_api_status_code: list = [429, 500, 502, 503, 504]
        # self._default_api_allowed_methods: list = ["GET", "POST"]

    def cleanup(self) -> None:
        """
        A method to clean-up objects
        """
        if self._session is not None:
            self._session.close()
        else:
            pass  # pragma: no cover

    def setup(self) -> Tuple[bool, str]:
        """
        A method to perform setup

        Returns:
            Tuple[bool, str]: Returns bool to indicate success, str will indicate the
            error message if failed.
        """
        try:
            print("HelloWorld")
            # # Search for the first api and http method.
            # # Set the prediction operationId
            # path_to_be_updated = self._api_schema["paths"]
            # if len(path_to_be_updated) > 0:
            #     first_api = list(path_to_be_updated.items())[0]
            #     first_api_value = first_api[1]
            #     if len(first_api_value) > 0:
            #         first_api_http = list(first_api_value.items())[0]
            #         first_api_http_value = first_api_http[1]
            #         first_api_http_value.update({"operationId": "predict_api"})

            # # Parse the openapi schema
            # self._openapi3_inst = OpenAPI(self._api_schema, validate=True)
            # self._setup_authentication()

            # # Prepare headers information for sending query
            # # Convert headers object into key-attribute mapping in dict
            # if "headers" in self._api_config.keys():
            #     self._additional_headers = self._api_config["headers"]
            # else:
            #     self._additional_headers = dict()

            # # Setup session retry strategy
            # # It will perform 3 times retries and have default backoff time for status_forcelist error code
            # # It will perform for methods in whitelist
            # retry_strategy = Retry(
            #     total=self._default_api_retries,
            #     backoff_factor=self._default_api_backoff,
            #     status_forcelist=self._default_api_status_code,
            #     allowed_methods=self._default_api_allowed_methods,
            # )
            # adapter = HTTPAdapter(max_retries=retry_strategy)
            # self._session = session()
            # self._session.verify = False
            # self._session.mount("https://", adapter)
            # self._session.mount("http://", adapter)

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
        # try:
        #     return self._model.predict(data)
        # except Exception:
        #     raise

    def predict_proba(self, data: Any, *args) -> Any:
        """
        A method to perform prediction probability using the model

        Args:
            data (Any): data to be predicted by the model

        Returns:
            Any: predicted result
        """
        pass
        # try:
        #     return self._model.predict_proba(data)
        # except Exception:
        #     raise

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

    # def _identify_model_algorithm(self, model: Any) -> Tuple[bool, str]:
    #     """
    #     A helper method to identify the model algorithm whether it is being supported

    #     Args:
    #         model (Any): the model to be checked against the supported model list

    #     Returns:
    #         Tuple[bool, str]: true if model is supported, str will store the support
    #         algo name
    #     """
    #     model_algorithm = ""
    #     is_success = False

    #     module_type_name = f"{type(model).__module__}.{type(model).__name__}"
    #     for supported_algo in self._supported_algorithms:
    #         if supported_algo == module_type_name:
    #             model_algorithm = supported_algo
    #             is_success = True

    #     return is_success, model_algorithm
