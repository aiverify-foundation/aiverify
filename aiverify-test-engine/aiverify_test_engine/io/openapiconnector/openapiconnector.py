# NOTE: commeting the module out for now - to re-assess if it is meaningful to provide a full OpenAPI spec connector
# import asyncio
# import functools
# import http
# import json
# import pathlib
# import time
# from enum import Enum, auto
# from typing import Any, Callable, Dict, List, Tuple, Union

# import aiometer
# import httpx as httpx
# import numpy as np
# import pandas as pd
# from aiopenapi3 import FileSystemLoader, OpenAPI
# from aiverify_test_engine.interfaces.imodel import IModel
# from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
# from aiverify_test_engine.plugins.enums.plugin_type import PluginType
# from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
# from httpx import Response
# from openapi_schema_validator import OAS30Validator, validate


# class BatchStrategy(Enum):
#     """
#     The BatchStrategy enum class specifies the different batching strategies
#     """

#     NONE = auto()
#     APPLICATION_JSON = auto()


# # NOTE: Do not change the class name, else the plugin cannot be read by the system
# class Plugin(IModel):
#     """
#     The Plugin(OpenAPIConnector) class specifies methods on
#     handling methods in performing identifying, validating, predicting, scoring.
#     """

#     # Some information on plugin
#     _name: str = "OpenAPIConnector"
#     _description: str = (
#         "OpenAPIConnector supports performing api calls to external model servers"
#     )
#     _version: str = "0.9.0"
#     _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
#     _plugin_type: PluginType = PluginType.MODEL
#     _model_plugin_type: ModelPluginType = ModelPluginType.API
#     _api_instance: Any = None
#     _api_instance_schema: Any = None
#     _api_validator: Any = OAS30Validator
#     _api_schema: Dict = None
#     _api_config: Dict = None
#     # OpenAPI custom transport variables
#     # Default request options values
#     _api_ssl_verify_default: bool = False
#     _api_ssl_cert_default: None = None
#     _api_connection_timeout_default: float = 3.0
#     _api_rate_limit_default: int = 50
#     _api_rate_limit_timeout_default: int = 3.0
#     _api_batch_strategy_default: BatchStrategy = BatchStrategy.NONE
#     _api_batch_limit_default: int = 500
#     _api_max_connections_default: int = 20
#     _api_connection_retries_default: int = 3
#     # Set request options values
#     _api_ssl_verify: bool = _api_ssl_verify_default
#     _api_ssl_cert: Union[str, None] = _api_ssl_cert_default
#     _api_connection_timeout: float = _api_connection_timeout_default
#     _api_rate_limit: int = _api_rate_limit_default
#     _api_rate_limit_timeout: float = _api_rate_limit_timeout_default
#     _api_batch_strategy: BatchStrategy = _api_batch_strategy_default
#     _api_batch_limit: int = _api_batch_limit_default
#     _api_max_connections: int = _api_max_connections_default
#     _api_connection_retries: int = _api_connection_retries_default
#     # OpenAPI request error
#     _lock = asyncio.Lock()
#     _response_error_message: str = ""

#     @staticmethod
#     def get_metadata() -> PluginMetadata:
#         """
#         A method to return the metadata for this plugin

#         Returns:
#             PluginMetadata: Metadata of this plugin
#         """
#         return Plugin._metadata

#     @staticmethod
#     def get_plugin_type() -> PluginType:
#         """
#         A method to return the type for this plugin

#         Returns:
#              PluginType: Type of this plugin
#         """
#         return Plugin._plugin_type

#     @staticmethod
#     def get_model_plugin_type() -> ModelPluginType:
#         """
#         A method to return ModelPluginType

#         Returns:
#             ModelPluginType: Model Plugin Type
#         """
#         return Plugin._model_plugin_type

#     @staticmethod
#     def custom_session_factory(*args, **kwargs) -> httpx.AsyncClient:
#         """
#         A session factory that generates async client with custom transport module

#         Returns:
#             httpx.AsyncClient: Returns a httpx AsyncClient
#         """
#         if Plugin._api_connection_timeout == -1:
#             httpx_timeout = httpx.Timeout(
#                 Plugin._api_connection_timeout_default,
#                 connect=Plugin._api_connection_timeout_default,
#             )
#         else:
#             httpx_timeout = httpx.Timeout(
#                 Plugin._api_connection_timeout, connect=Plugin._api_connection_timeout
#             )
#         kwargs["timeout"] = httpx_timeout
#         kwargs["transport"] = OpenAPICustomTransport(
#             verify=Plugin._api_ssl_verify,
#             cert=Plugin._api_ssl_cert,
#             rate_limit=Plugin._api_rate_limit,
#             rate_limit_timeout=Plugin._api_rate_limit_timeout,
#             batch_strategy=Plugin._api_batch_strategy,
#             batch_limit=Plugin._api_batch_limit,
#             max_connections=Plugin._api_max_connections,
#             connection_retries=Plugin._api_connection_retries,
#             response_error_callback=Plugin._notify_response_error,
#         )

#         return httpx.AsyncClient(*args, **kwargs)

#     def __init__(self, **kwargs) -> None:
#         # Configuration
#         self._is_setup_completed = False
#         self._api_instance = None
#         api_schema = kwargs.get("api_schema", None)
#         api_config = kwargs.get("api_config", None)

#         if api_schema and api_config:
#             self._api_schema = api_schema
#             self._api_config = api_config
#         else:
#             self._api_schema: Dict = dict()
#             self._api_config: Dict = dict()

#     def cleanup(self) -> None:
#         """
#         A method to clean-up objects
#         """
#         pass

#     def setup(self) -> Tuple[bool, str]:
#         """
#         A method to perform setup

#         Returns:
#             Tuple[bool, str]: Returns bool to indicate success, str will indicate the
#             error message if failed.
#         """
#         try:
#             # Perform OpenAPI3 schema validation
#             # An exception will be thrown if validation has errors
#             is_success, error_message = self._perform_validation()
#             if not is_success:
#                 raise RuntimeError(error_message)

#             # Search for the first api and http method.
#             # Set the prediction operationId
#             path_to_be_updated = self._api_schema["paths"]
#             if len(path_to_be_updated) > 0:
#                 first_api = list(path_to_be_updated.items())[0]
#                 first_api_value = first_api[1]
#                 if len(first_api_value) > 0:
#                     first_api_http = list(first_api_value.items())[0]
#                     first_api_http_value = first_api_http[1]
#                     first_api_http_value.update({"operationId": "predict_api"})

#             # Update session variables if necessary
#             Plugin._api_ssl_verify = self._api_config.get("requestConfig", {}).get(
#                 "sslVerify", Plugin._api_ssl_verify_default
#             )
#             Plugin._api_ssl_cert = self._api_config.get("requestConfig", {}).get(
#                 "sslCert", Plugin._api_ssl_cert_default
#             )
#             Plugin._api_connection_timeout = self._api_config.get(
#                 "requestConfig", {}
#             ).get("connectionTimeout", Plugin._api_connection_timeout_default)
#             Plugin._api_rate_limit = self._api_config.get("requestConfig", {}).get(
#                 "rateLimit", Plugin._api_rate_limit_default
#             )
#             Plugin._api_rate_limit_timeout = self._api_config.get(
#                 "requestConfig", {}
#             ).get("rateLimitTimeout", Plugin._api_rate_limit_timeout_default)

#             temp_strategy = self._api_config.get("requestConfig", {}).get(
#                 "batchStrategy", Plugin._api_batch_strategy_default.name.lower()
#             )
#             if temp_strategy == "none":
#                 Plugin._api_batch_strategy = BatchStrategy.NONE
#             else:
#                 Plugin._api_batch_strategy = BatchStrategy.APPLICATION_JSON
#             Plugin._api_batch_limit = self._api_config.get("requestConfig", {}).get(
#                 "batchLimit", Plugin._api_batch_limit_default
#             )

#             Plugin._api_max_connections = self._api_config.get("requestConfig", {}).get(
#                 "maxConnections", Plugin._api_max_connections_default
#             )
#             Plugin._api_connection_retries = self._api_config.get(
#                 "requestConfig", {}
#             ).get("connectionRetries", Plugin._api_connection_retries_default)

#             # Perform input validation
#             self._validate_input()

#             # Create the api instance based on the provided api schema
#             self._api_instance = OpenAPI.loads(
#                 url="",
#                 data=json.dumps(self._api_schema),
#                 session_factory=Plugin.custom_session_factory,
#                 loader=FileSystemLoader(pathlib.Path("")),
#                 use_operation_tags=True,
#             )

#             # Setup API Authentication
#             self._setup_api_authentication()

#             # Setup completed
#             self._is_setup_completed = True
#             return True, ""

#         except Exception as exception:
#             return False, str(exception)

#     def get_model(self) -> Any:
#         """
#         A method to return the model

#         Returns:
#             Any: Model
#         """
#         return None

#     def get_model_algorithm(self) -> str:
#         """
#         A method to retrieve the connector name

#         Returns:
#             str: connector name
#         """
#         return self._name

#     def is_supported(self) -> bool:
#         """
#         A method to check whether the model is being identified correctly
#         and is supported

#         Returns:
#             bool: True if is an instance of model and is supported
#         """
#         is_success, _ = self._perform_validation()
#         return is_success

#     def predict(self, data: Any, *args) -> Any:
#         """
#         A method to perform prediction using the model

#         Args:
#             data (Any): data to be predicted by the model

#         Returns:
#             Any: predicted result
#         """
#         # Call the function to make multiple requests
#         try:
#             return asyncio.run(self.make_request(data, *args))
#         except:
#             raise RuntimeError(
#                 "Unable to send request to API Server. Please ensure that the URL is correct."
#             )

#     def predict_proba(self, data: Any, *args) -> Any:
#         """
#         A method to perform prediction probability using the model

#         Args:
#             data (Any): data to be predicted by the model

#         Returns:
#             Any: predicted result
#         """
#         # Call the function to make multiple requests
#         try:
#             return asyncio.run(self.make_request(data, *args))
#         except:
#             raise RuntimeError(
#                 "Unable to send request to API Server. Please ensure that the URL is correct."
#             )

#     def score(self, data: Any, y_true: Any) -> Any:
#         """
#         A method to perform scoring using the model

#         Args:
#             data (Any): data to be scored with y_true
#             y_true (Any): ground truth

#         Returns:
#             Any: score result
#         """
#         raise RuntimeError("OpenAPIConnector does not support score method")

#     @staticmethod
#     async def _get_response_error() -> str:
#         """
#         An async method to return the error message detected during response

#         Returns:
#             str: Contains the error message
#         """
#         async with Plugin._lock:
#             return Plugin._response_error_message

#     @staticmethod
#     async def _notify_response_error(error_message: str):
#         """
#         An async method to set the error message detected during response

#         Args:
#             error_message (str): Contains the error message
#         """
#         async with Plugin._lock:
#             Plugin._response_error_message = error_message

#     async def get_schema_content(self) -> Any:
#         """
#         An async method that returns the schema content for the api instance

#         Raises:
#             NotImplementedError: Exception if the requestBody content is not supported such as
#             "application/json", "multipart/form-data", "application/x-www-form-urlencoded"

#         Returns:
#             Any: API schema content
#         """
#         if (
#             "application/json"
#             in self._api_instance._.predict_api.operation.requestBody.content
#         ):
#             return self._api_instance._.predict_api.operation.requestBody.content[
#                 "application/json"
#             ].schema_
#         elif (
#             ct := "multipart/form-data"
#         ) in self._api_instance._.predict_api.operation.requestBody.content:
#             return self._api_instance._.predict_api.operation.requestBody.content[
#                 ct
#             ].schema_
#         elif (
#             ct := "application/x-www-form-urlencoded"
#         ) in self._api_instance._.predict_api.operation.requestBody.content:
#             return self._api_instance._.predict_api.operation.requestBody.content[
#                 ct
#             ].schema_
#         else:
#             raise NotImplementedError(
#                 self._api_instance._.predict_api.operation.requestBody.content
#             )

#     async def get_data_payload(
#         self, data_row: Union[List, pd.Series], data_labels: Tuple[Any, ...]
#     ) -> Dict:
#         """
#         An async method that formats the data row with the data labels.

#         Args:
#             data_row (Union[List, pd.Series]): The data row to be formatted. It can be either a list or a pandas Series.
#             data_labels (Tuple[Any, ...]): A tuple containing key-value pairs representing the data labels.
#             Each key represents the target field name in the final data payload, and each value represents
#             the corresponding field name in the input data_row.

#         Returns:
#             Dict: A dictionary containing the formatted data payload with field names as keys and their respective
#             values extracted from the data_row.

#         Notes:
#             - The input data_row should contain values corresponding to the data_labels. If the data_row is a
#             pandas Series, the column names of the Series should match the data_labels.
#             - The method retrieves the requestBody data mapping dictionary from the requestBody and
#             updates it with the values from the data_row based on the data_labels.
#         """

#         # Make sure that the data row comes in as a list, so we can reference the index and pull the value
#         if isinstance(data_row, pd.Series):
#             data_row_list = data_row.tolist()
#         else:
#             data_row_list = data_row

#         # parameters field is not empty
#         if len(self._api_config.get("parameters", [])):
#             data_mapping = self._api_config.get("parameters", dict())
#         # no parameters. mapping should be in requestBody
#         else:
#             data_mapping = self._api_config.get("requestBody", dict())

#         # Update the data mapping dictionary with the row value
#         return_list = dict()
#         for key, value in data_mapping.items():
#             index = next(
#                 (
#                     index
#                     for index, (key1, value1) in enumerate(data_labels)
#                     if key1 == value
#                 ),
#                 None,
#             )

#             # if type is numpy float32, convert to numpy float64 as numpy float32 is non-JSON serializable
#             if isinstance(data_row_list[index], np.floating):
#                 return_list[key] = float(data_row_list[index])
#             elif isinstance(data_row_list[index], np.integer):
#                 return_list[key] = int(data_row_list[index])
#             else:
#                 return_list[key] = data_row_list[index]

#         return return_list

#     async def send_request(self, row, *args) -> Response:
#         """
#         An async method to send an API request based on the provided row data.

#         Args:
#             row_data_to_send (Dict): A dictionary containing the data to be sent in the API request. The keys represent
#             the parameter names, and the values represent their corresponding values.

#         Returns:
#             Response: The response object representing the API response.

#         Notes:
#             - This method is used to send API requests based on the provided row data. It supports both POST
#             and GET methods.
#             - If the API method is "POST," the method constructs the request payload using the provided row_data_to_send
#               dictionary and sends it in the request body. The method also populates the request headers with required
#               header parameters specified in the API schema.
#             - If the API method is "GET," the method sends the row_data_to_send dictionary as parameters in the
#             API request URL without a request body.
#             - The method retrieves the API schema by calling the get_schema_content method, and it uses the API
#             instance's predict_api attribute to access the API details.
#             - The method returns the API response object containing the results of the API request.
#         """
#         row_data_to_send = await self.get_data_payload(row, *args)
#         if self._api_instance._.predict_api.method.lower() == "post":
#             # POST method. Get API Instance schema
#             self._api_instance_schema = await self.get_schema_content()
#             # Populate headers
#             headers = dict()
#             for parameter in self._api_instance._.predict_api.parameters:
#                 if str(parameter.in_.name).lower() == "header" and parameter.required:
#                     if len(parameter.schema_.enum) > 0:
#                         headers.update({parameter.name: parameter.schema_.enum[0]})

#             # Populate body with payload values
#             body = self._api_instance_schema.get_type().construct(**row_data_to_send)
#             headers, _, result = await self._api_instance._.predict_api.request(
#                 parameters=headers, data=body
#             )
#         else:
#             # GET method. Populate body with payload values
#             body = None
#             # Perform api request
#             headers, _, result = await self._api_instance._.predict_api.request(
#                 parameters=row_data_to_send, data=body
#             )
#         return result

#     async def send_batched_request(self, list_of_rows, *args) -> Response:
#         """
#         An async method to send an API request based on the provided row data.

#         Args:
#             list_of_rows (List): A list containing the rows of data to be sent in the API request.The number
#             of data in the list is dependent on the self._api_batch_limit (based on the user's input).

#         Returns:
#             Response: The response object representing the API response.

#         Notes:
#             - This method is used to send API requests based on the provided row data. It supports both POST
#             and GET methods.
#             - If the API method is "POST," the method constructs the request payload using the provided row_data_to_send
#               dictionary and sends it in the request body. The method also populates the request headers with required
#               header parameters specified in the API schema.
#             - If the API method is "GET," the method sends the row_data_to_send dictionary as parameters in the
#             API request URL without a request body.
#             - The method retrieves the API schema by calling the get_schema_content method, and it uses the API
#             instance's predict_api attribute to access the API details.
#             - The method returns the API response object containing the results of the API request.
#         """
#         list_of_processed_rows = []
#         for row in list_of_rows:
#             row_data_to_send = await self.get_data_payload(row, *args)
#             list_of_processed_rows.append(row_data_to_send)

#         if self._api_instance._.predict_api.method.lower() == "post":
#             # POST method. Get API Instance schema
#             self._api_instance_schema = await self.get_schema_content()
#             # Populate headers
#             headers = dict()
#             for parameter in self._api_instance._.predict_api.parameters:
#                 if str(parameter.in_.name).lower() == "header" and parameter.required:
#                     if len(parameter.schema_.enum) > 0:
#                         headers.update({parameter.name: parameter.schema_.enum[0]})
#             # Populate body with payload values
#             headers, _, result = await self._api_instance._.predict_api.request(
#                 parameters=headers, data=list_of_processed_rows
#             )
#         else:
#             # GET method. Populate body with payload values
#             body = None
#             # Perform api request
#             headers, _, result = await self._api_instance._.predict_api.request(
#                 parameters=row_data_to_send, data=body
#             )
#         return result

#     async def make_request(self, data: Any, *args) -> Any:
#         """
#         An async method to make multiple API requests using the provided data.

#         Args:
#             data (Any): The data to be predicted. It can be a pandas DataFrame or a numpy ndarray, or a list containing
#             multiple data objects of these types.
#             *args (Tuple): Variable-length argument list. The argument list contains any additional arguments required
#             by the `get_data_payload` function.

#         Returns:
#             Any: The response data obtained from the API requests. It is returned as a list containing the response
#             text from each API request.

#         Notes:
#             - This method allows making multiple API requests using the provided data. The data can be a pandas
#             DataFrame or a numpy ndarray, or a list containing multiple data objects of these types.
#             - For each data object in the input data list, the method iterates over the rows of the DataFrame
#             or ndarray.
#             - It prepares the row information for the payload or headers using the `get_data_payload` method, which
#             takes the row and any additional arguments (*args) as input.
#             - The row information is then passed to the `send_request` method to make the API request and
#             obtain the response.
#             - The response text from each API request is appended to the `response_data` list.
#             - Finally, the method returns the `response_data` list containing the response text from
#             all the API requests.
#         """

#         start_time = time.time()
#         response_data = list()
#         new_list_of_data = []

#         # batching using application/json
#         if self._api_batch_strategy == BatchStrategy.APPLICATION_JSON:
#             batched_data = []
#             # Loop through the data list. It can be a list of mixed data to be predicted such as DF or numpy.
#             for data_to_predict in data:
#                 # PANDAS DF
#                 if type(data_to_predict) is pd.DataFrame:
#                     for _, row in data_to_predict.iterrows():
#                         batched_data.append(row)
#                     for i in range(0, len(batched_data), self._api_batch_limit):
#                         new_list_of_data.append(
#                             batched_data[i : i + self._api_batch_limit]
#                         )
#                 # NDARRAY
#                 else:
#                     for row in data_to_predict:
#                         # Pass this information to the send request function to request
#                         batched_data.append(row)
#                     for i in range(0, len(batched_data), self._api_batch_limit):
#                         new_list_of_data.append(
#                             batched_data[i : i + self._api_batch_limit]
#                         )
#             jobs = [
#                 functools.partial(self.send_batched_request, row_data, *args)
#                 for row_data in new_list_of_data
#             ]
#         # no batching
#         else:
#             # loop through the data list. it can be a list of mixed data to be predicted such as DF or numpy
#             for data_to_predict in data:
#                 # PANDAS DF
#                 if type(data_to_predict) is pd.DataFrame:
#                     for _, row in data_to_predict.iterrows():
#                         # Pass this information to the send request function to request
#                         new_list_of_data.append(row)
#                 # NDARRAY
#                 else:
#                     for row in data_to_predict:
#                         # Pass this information to the send request function to request
#                         new_list_of_data.append(row)
#             jobs = [
#                 functools.partial(self.send_request, row_data, *args)
#                 for row_data in new_list_of_data
#             ]

#         if self._api_max_connections == -1 and self._api_rate_limit == -1:
#             response_list = await aiometer.run_all(jobs)
#         elif self._api_max_connections == -1:
#             response_list = await aiometer.run_all(
#                 jobs, max_per_second=self._api_rate_limit
#             )
#         elif self._api_rate_limit == -1:
#             response_list = await aiometer.run_all(
#                 jobs, max_at_once=self._api_max_connections
#             )
#         else:
#             response_list = await aiometer.run_all(
#                 jobs,
#                 max_at_once=self._api_max_connections,
#                 max_per_second=self._api_rate_limit,
#             )
#         # # get the response data_type: array/object/string/number/integer/boolean

#         response_data_type = (
#             self._api_config.get("responseBody").get("schema").get("type")
#         )

#         # process list data type
#         if response_data_type.lower() == "array":
#             response_array_type = (
#                 self._api_config.get("responseBody")
#                 .get("schema")
#                 .get("items")
#                 .get("type")
#             )

#             # if list data consists of objects like response_body: [{data:123},{data:234}]
#             if response_array_type.lower() == "object":
#                 response_keyname = next(
#                     iter(
#                         self._api_config.get("responseBody")
#                         .get("schema")
#                         .get("items")
#                         .get("properties")
#                         .keys()
#                     )
#                 )
#                 response_object_type = (
#                     self._api_config.get("responseBody")
#                     .get("schema")
#                     .get("items")
#                     .get("properties")
#                     .get(response_keyname)
#                     .get("type")
#                 )
#                 for response in response_list:
#                     response_body = json.loads(response.text)
#                     for response_body_item in response_body:
#                         data = response_body_item.get(response_keyname)
#                         response_data.append(
#                             self._validate_data_type(data, response_object_type)
#                         )
#             elif response_array_type.lower() == "array":
#                 response_nested_array_type = (
#                     self._api_config.get("responseBody")
#                     .get("schema")
#                     .get("items")
#                     .get("items")
#                     .get("type")
#                 )
#                 for response in response_list:
#                     response_body = json.loads(response.text)
#                     for nested_array in response_body:
#                         for data in nested_array:
#                             response_data.append(
#                                 self._validate_data_type(
#                                     data, response_nested_array_type
#                                 )
#                             )
#             # if list data consists of primitive data type like response_body: [1, 2, 3]
#             else:
#                 for response in response_list:
#                     response_body = json.loads(response.text)
#                     for data in response_body:
#                         response_data.append(
#                             self._validate_data_type(data, response_array_type)
#                         )

#         # process dictionary data type
#         elif response_data_type.lower() == "object":
#             response_keyname = next(
#                 iter(
#                     self._api_config.get("responseBody")
#                     .get("schema")
#                     .get("properties")
#                     .keys()
#                 )
#             )
#             response_object_type = (
#                 self._api_config.get("responseBody")
#                 .get("schema")
#                 .get("properties")
#                 .get(response_keyname)
#                 .get("type")
#             )

#             # if dictionary data consists of list {data: [1,2,3]}
#             if response_object_type.lower() == "array":
#                 response_array_type = (
#                     self._api_config.get("responseBody")
#                     .get("schema")
#                     .get("properties")
#                     .get(response_keyname)
#                     .get("items")
#                     .get("type")
#                 )
#                 for response in response_list:
#                     response_body = json.loads(response.text)
#                     response_body_value = response_body.get(response_keyname)
#                     for data in response_body_value:
#                         response_data.append(
#                             self._validate_data_type(data, response_array_type)
#                         )

#             # if dictionary data consists of primitive data type: {data: 100}
#             else:
#                 for response in response_list:
#                     response_body = json.loads(response.text)
#                     data = response_body.get(response_keyname)
#                     response_data.append(
#                         self._validate_data_type(data, response_object_type)
#                     )

#         # process primitive data types
#         else:
#             for response in response_list:
#                 data = response.text
#                 response_data.append(self._validate_data_type(data, response_data_type))

#         end_time = time.time()
#         elapsed_time = end_time - start_time
#         print("time taken: ", elapsed_time)
#         return response_data

#     def _validate_data_type(self, data: Any, data_type: str) -> None:
#         """
#         A method to make perform validation on the response's data type. The data type should match the data
#         type the user has set before running the algorithm

#         Args:
#             data (Any): The data to be validated
#             data_type (str): The name of the data type that the data is supposed to be
#         """
#         if data_type.lower() == "string":
#             type_to_cast = str
#         elif data_type.lower() == "number":
#             type_to_cast = float
#         elif data_type.lower() == "integer":
#             type_to_cast = int
#         elif data_type.lower() == "boolean":
#             type_to_cast = bool
#         else:
#             raise RuntimeError("Unknown data type.")

#         try:
#             return type_to_cast(data)
#         except (ValueError, TypeError):
#             raise

#     def _setup_api_authentication(self) -> None:
#         """
#         A method to perform setup for api authentication
#         """
#         # Identify the securitySchemes key
#         api_key_list = list(self._api_instance.components.securitySchemes.keys())
#         for api_key in api_key_list:
#             # Get the api security type and scheme
#             scheme_type = self._api_instance.components.securitySchemes[
#                 api_key
#             ].type.lower()
#             if scheme_type == "http":
#                 http_scheme = self._api_instance.components.securitySchemes[
#                     api_key
#                 ].scheme_.lower()
#                 if http_scheme == "bearer":
#                     api_token = self._api_config.get("authentication", {}).get(
#                         "token", ""
#                     )
#                     self._api_instance.authenticate(**{api_key: str(api_token)})
#                 elif http_scheme == "basic":
#                     api_username = self._api_config.get("authentication", {}).get(
#                         "username", ""
#                     )
#                     api_password = self._api_config.get("authentication", {}).get(
#                         "password", ""
#                     )
#                     self._api_instance.authenticate(
#                         **{api_key: (api_username, api_password)}
#                     )
#             else:
#                 pass

#     def _perform_validation(self) -> Tuple[bool, str]:
#         """
#         A method to perform validation on openapi schema and configuration

#         Returns:
#             Tuple[bool, str]: Returns bool to indicate success, str will indicate the
#             error message if failed.
#         """
#         try:
#             validate(self._api_config, self._api_schema, cls=self._api_validator)
#             return True, ""
#         except Exception as error:
#             return False, str(error)

#     def _validate_input(self) -> None:
#         """
#         A method to perform validation on the user's API configuration
#         """
#         error_message = ""

#         if not isinstance(self._api_ssl_verify, bool):
#             error_message += "Bool expected for SSL Verification;"

#         # if (self._api_ssl_cert!=valid_cert):
#         # error_message += "Invalid SSL Cert;"

#         if (
#             not isinstance(self._api_connection_timeout, int)
#             and not isinstance(self._api_connection_timeout, float)
#         ) or (self._api_connection_timeout < 0 and self._api_connection_timeout != -1):
#             error_message += "Please provide a positive whole/decimal number in seconds for Connection Timeout;"

#         if not isinstance(self._api_rate_limit, int) or (
#             self._api_rate_limit < 0 and self._api_rate_limit != -1
#         ):
#             error_message += "Please provide a positive whole number for Rate Limit;"

#         if (
#             not isinstance(self._api_rate_limit_timeout, int)
#             and not isinstance(self._api_rate_limit_timeout, float)
#         ) or (self._api_rate_limit_timeout < 0 and self._api_rate_limit_timeout != -1):
#             error_message += "Please provide a positive whole/decimal number in seconds for Rate Limit Timeout;"

#         if self._api_batch_strategy not in BatchStrategy:
#             error_message += "Invalid Batch Strategy;"

#         if not isinstance(self._api_batch_limit, int) and (
#             self._api_batch_limit < 0 and self._api_batch_limit != -1
#         ):
#             error_message += "Please provide a positive whole number for Batch Limit;"

#         if not isinstance(self._api_max_connections, int) and (
#             self._api_max_connections < 0 and self._api_max_connections != -1
#         ):
#             error_message += (
#                 "Please provide a positive whole number for Max Connections;"
#             )

#         if not isinstance(self._api_connection_retries, int) and (
#             self._api_connection_retries < 0 and self._api_connection_retries != -1
#         ):
#             error_message += (
#                 "Please provide a positive whole number for Connection Retries;"
#             )

#         if error_message != "":
#             raise RuntimeError(f"Validation failed for API Connector: {error_message}")


# class OpenAPICustomTransport(httpx.AsyncHTTPTransport):
#     """
#     A custom transport module that allows error code retries and backoff timing
#     """

#     # (1s, 2s, 4s)  Formula: {backoff factor} * (2 ** ({number of total retries} - 1))
#     _api_backoff_factor: float = 2.0
#     _api_status_code: list = [429, 500, 502, 503, 504]

#     def __init__(
#         self,
#         verify: bool,
#         cert: Any,
#         rate_limit: int,
#         rate_limit_timeout: float,
#         batch_strategy: BatchStrategy,
#         batch_limit: int,
#         max_connections: int,
#         connection_retries: int,
#         response_error_callback: Callable,
#     ):
#         # Save the variables
#         self._ssl_verify = verify
#         self._ssl_cert = cert
#         self._rate_limit = rate_limit
#         self._rate_limit_timeout = rate_limit_timeout
#         self._batch_strategy = batch_strategy
#         self._batch_limit = batch_limit
#         self._max_connection = max_connections
#         self._connection_retries = connection_retries
#         self._response_error_callback = response_error_callback
#         self._limit_class = OpenAPICustomLimits(no_of_max_connections=1)

#         # Initialize super class
#         super().__init__(
#             verify=self._ssl_verify,
#             cert=self._ssl_cert,
#             retries=self._connection_retries,
#             limits=self._limit_class,
#         )

#     async def handle_attempt_retries(
#         self, attempt: int, status_code: Union[None, int]
#     ) -> None:
#         """
#         An async method to handle the number of retries attempts and handle the backoff strategy
#         when having issues with connecting to server. When faced with 429 status code,
#         it will use the rate limit timeout instead of backoff strategy factor timeout.

#         Args:
#             attempt (int): current number of retry attempt
#             status_code (Union[None, int]): response status code
#         """
#         if attempt == self._connection_retries:
#             return

#         # Have not reached the number of retries.
#         # Proceed to check backoff time and perform sleep
#         if status_code and status_code == 429:
#             # if the status code is 429 (too many requests)
#             backoff_timing = self._rate_limit_timeout
#         else:
#             backoff_timing = int(self._api_backoff_factor * (2 ** (attempt - 1)))
#         await asyncio.sleep(backoff_timing)

#     async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
#         """
#         An async method to handle incoming async requests before passing to query the server.
#         This custom handling adds additional support for retry attempts for not able to connect or
#         response codes that appear in the error code list.

#         Args:
#             request (httpx.Request): Incoming httpx async request for handling

#         Raises:
#             RuntimeError: Exception if the maximum retries is exceeded.
#             The error message will be stored in the response error callback for display.

#         Returns:
#             httpx.Response: The response that is not within the error code list
#         """
#         # Send the async request to the server

#         error_message = ""
#         start_time = time.time()

#         for attempt in range(self._connection_retries + 1):
#             try:
#                 response = await super().handle_async_request(request)
#             except httpx.ConnectTimeout as connection_exception:
#                 error_message = f"{str(connection_exception)}, connection_exception"
#                 await self.handle_attempt_retries(attempt, None)
#             except httpx.ReadTimeout as read_exception:
#                 error_message = f"{str(read_exception)}, read_exception"
#                 await self.handle_attempt_retries(attempt, None)
#             except httpx.NetworkError as network_exception:
#                 error_message = f"{str(network_exception)}, network_exception"
#                 await self.handle_attempt_retries(attempt, None)
#             else:
#                 if response.status_code not in self._api_status_code:
#                     # Assume that the response is okay, not in the list of error status codes
#                     return response
#                 else:
#                     # The response status code in list of retries status code. Proceed to attempt retries
#                     error_message = (
#                         f"Response status code: {response.status_code} "
#                         f"({http.HTTPStatus(response.status_code).name})"
#                     )
#                     await self.handle_attempt_retries(attempt, response.status_code)
#             finally:
#                 # Exceeded the number of attempts
#                 end_time = time.time()
#                 connection_elapsed_time = round((end_time - start_time), 1)
#                 if attempt == self._connection_retries:
#                     custom_error_message = f"Maximum retries exceeded ({self._connection_retries}) \
#                         after {connection_elapsed_time}s."
#                     await self._response_error_callback(
#                         f"{custom_error_message} {error_message}"
#                     )
#                     raise RuntimeError(f"{custom_error_message} {error_message}")


# class OpenAPICustomLimits(httpx.Limits):
#     """
#     A custom Limits module that helps us manage connection configurations
#     """

#     def __init__(
#         self,
#         no_of_max_connections: int,
#     ):
#         # Save the variables
#         self._max_connections = no_of_max_connections
#         self._max_keepalive_connections = None
#         self._keepalive_expiry = None

#         # Initialize super class
#         super().__init__(
#             max_connections=self._max_connections,
#             max_keepalive_connections=self._max_keepalive_connections,
#             keepalive_expiry=self._keepalive_expiry,
#         )
