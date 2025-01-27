import logging
from typing import Any, Dict, Tuple, Union

from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.utils.log_utils import log_message
from aiverify_test_engine.utils.url_utils import download_from_url, is_url


class ModelManager:
    """
    The ModelManager comprises methods that focuses on reading model files
    As input files are usually serialized before written to a file, this class will perform
    de-serialisation with supported packages, and identify if the model is one of the supported formats
    """

    _logger: logging.Logger = None

    @staticmethod
    def set_logger(logger: logging.Logger) -> None:
        """
        A method to set up the logger instance for logging

        Args:
            logger (Logger): The logger instance
        """
        if isinstance(logger, logging.Logger):
            ModelManager._logger = logger

    @staticmethod
    def read_api(
        api_schema: Dict,
        api_config: Dict,
        model_plugins: Dict,
    ) -> Tuple[bool, Union[IModel, None], None, str]:
        """
        A method to read the api configuration and schema and return the model instance and None (serializer instance)

        Args:
            api_schema (Dict): OpenAPI schema
            api_config (Dict): OpenAPI configuration
            model_plugins (Dict): A dictionary of supported model plugins

        Returns:
            Tuple[bool, Union[IModel, None], None, str]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IModel, and None (object of ISerializer)
            and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        return_model_instance = None
        return_model_serializer_instance = None
        log_message(
            ModelManager._logger,
            logging.INFO,
            f"Attempting to read api: api_schema: {api_schema}, api_config: {api_config}",
        )

        # Validate the inputs
        if (
            api_schema is None
            or not isinstance(api_schema, dict)
            or api_config is None
            or not isinstance(api_config, dict)
            or model_plugins is None
            or not isinstance(model_plugins, dict)
        ):
            error_message = f"There was an error validating the input parameters: {api_schema}, {api_config}, \
            {model_plugins}"
            log_message(ModelManager._logger, logging.ERROR, error_message)
            return (
                False,
                return_model_instance,
                return_model_serializer_instance,
                error_message,
            )
        else:
            log_message(
                ModelManager._logger, logging.INFO, "Model validation successful"
            )

        # Attempt to identify the model format with the supported list.
        # If model is not in the supported list, it will return False
        log_message(
            ModelManager._logger,
            logging.INFO,
            "Attempting to identify model format with api schema",
        )
        is_success, return_model_instance = ModelManager._try_to_identify_model_format(
            model_plugins, **{"api_schema": api_schema, "api_config": api_config}
        )
        if is_success:
            error_message = ""
            log_message(
                ModelManager._logger,
                logging.INFO,
                f"Supported model format for api schema: "
                f"{return_model_instance.get_model_plugin_type()}[{return_model_instance.get_model_algorithm()}]",
            )
        else:
            # Failed to get model format
            return_model_instance = None
            error_message = (
                "There was an error getting model format with api schema (unsupported)"
            )
            log_message(ModelManager._logger, logging.ERROR, error_message)

        return (
            is_success,
            return_model_instance,
            return_model_serializer_instance,
            error_message,
        )

    @staticmethod
    def read_model_file(
        model_file: str, model_plugins: Dict, serializer_plugins: Dict
    ) -> Tuple[bool, Union[IModel, None], Union[ISerializer, None], str]:
        """
        A method to read the model file path or URL and return the model instance and serializer instance
        It is usually serialize by some program such as (pickle, joblib)

        Args:
            model_file (str): The model file path or URL
            model_plugins (Dict): A dictionary of supported model plugins
            serializer_plugins (Dict): A dictionary of supported serializer plugins

        Returns:
            Tuple[bool, Union[IModel, None], Union[ISerializer, None], str]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IModel, and an object of ISerializer
            and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        return_model_instance = None
        return_model_serializer_instance = None
        log_message(
            ModelManager._logger,
            logging.INFO,
            f"Attempting to read model: {model_file}",
        )
       
        # Validate the inputs
        if (
            model_file is None
            or not isinstance(model_file, str)
            or model_plugins is None
            or not isinstance(model_plugins, dict)
            or serializer_plugins is None
            or not isinstance(serializer_plugins, dict)
        ):
            error_message = (
                f"There was an error validating the input parameters: {model_file}, "
                f"{model_plugins}, {serializer_plugins}"
            )
            log_message(ModelManager._logger, logging.ERROR, error_message)
            return (
                False,
                return_model_instance,
                return_model_serializer_instance,
                error_message,
            )
        else:
            log_message(
                ModelManager._logger, logging.INFO, "Model validation successful"
            )

        if is_url(model_file):
            log_message(
                ModelManager._logger,
                logging.INFO,
                f"Downloading model from URL: {model_file}",
            )
            try:
                model_file = download_from_url(model_file)
            except Exception as e:
                error_message = f"Failed to download the model file from URL: {model_file}. Error: {str(e)}"
                log_message(ModelManager._logger, logging.ERROR, error_message)
                return (
                    False,
                    return_model_instance,
                    return_model_serializer_instance,
                    error_message,
                )

        # Attempt to deserialize the model with the supported serializer.
        # If model is not able to deserialized by any of the supported tool, it will return False
        log_message(
            ModelManager._logger,
            logging.INFO,
            f"Attempting to deserialize model: {model_file}",
        )
        (
            is_success,
            model,
            return_model_serializer_instance,
        ) = ModelManager._try_to_deserialize_model(model_file, serializer_plugins)
        if not is_success:
            # Failed to deserialize model file
            error_message = f"There was an error deserializing the model: {model_file}"
            log_message(ModelManager._logger, logging.ERROR, error_message)
            return (
                is_success,
                return_model_instance,
                return_model_serializer_instance,
                error_message,
            )

        # Attempt to identify the model format with the supported list.
        # If model is not in the supported list, it will return False
        log_message(
            ModelManager._logger,
            logging.INFO,
            f"Attempting to identify model format: {type(model)}",
        )
        is_success, return_model_instance = ModelManager._try_to_identify_model_format(
            model_plugins, **{"model": model}
        )
        if is_success:
            error_message = ""
            log_message(
                ModelManager._logger,
                logging.INFO,
                f"Supported model format: {type(model)}, "
                f"{return_model_instance.get_model_plugin_type()}[{return_model_instance.get_model_algorithm()}]",
            )
        else:
            # Failed to get model format
            return_model_instance = None
            error_message = (
                f"There was an error getting model format (unsupported): {type(model)}"
            )
            log_message(ModelManager._logger, logging.ERROR, error_message)

        return (
            is_success,
            return_model_instance,
            return_model_serializer_instance,
            error_message,
        )

    @staticmethod
    def _try_to_deserialize_model(
        model_file: str, serializer_plugins: Dict
    ) -> Tuple[bool, Any, Any]:
        """
        A helper method to deserialize the model file path and return the de-serialized model and serializer instance

        Args:
            model_file (str): The model file path
            serializer_plugins (Dict): A dictionary of supported serializer plugins

        Returns:
            Tuple[bool, Any, Any]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of Any, and an object of Any and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        is_success = False
        model = None
        serializer = None

        # Scan through all the supported serializer
        # Check that this model is one of the supported model formats and can be deserialized
        for (
            _,
            serializer_plugin,
        ) in serializer_plugins.items():
            try:
                temp_serializer = serializer_plugin.Plugin
                model = temp_serializer.deserialize_data(model_file)
                if model is not None:
                    is_success = True
                    serializer = temp_serializer
                    break
            except Exception:
                continue

        return is_success, model, serializer

    @staticmethod
    def _try_to_identify_model_format(
        model_plugins: Dict, **kwargs
    ) -> Tuple[bool, IModel]:
        """
        A helper method to read the model and return the respective model format instance

        Args:
            model_plugins (Dict): The dictionary of detected model plugins

        Returns:
            Tuple[bool, IModel]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IModel
            If it fails to deserialize/identify, it will contain None object
        """
        is_success = False
        model_instance = None

        # Scan through all the supported model formats
        # Check that this model is one of the supported model formats
        try:
            for _, model_plugin in model_plugins.items():
                model_instance = model_plugin.Plugin(**kwargs)
                if model_instance.is_supported():
                    is_success = True
                    break

        except Exception:
            is_success = False
            model_instance = None

        return is_success, model_instance
