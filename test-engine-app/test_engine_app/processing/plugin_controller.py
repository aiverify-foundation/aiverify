import logging
from typing import Dict, Tuple, Union

from test_engine_app.app_logger import AppLogger
from test_engine_app.network.redis import Redis
from test_engine_app.processing.algorithm_info import AlgorithmInfo
from test_engine_core.interfaces.ialgorithm import IAlgorithm
from test_engine_core.interfaces.idata import IData
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager
from test_engine_core.utils.validate_checks import is_empty_string


class PluginController:
    """
    PluginController class will establish the connection to AlgoRegistry, listen to algo channels,
    and be a middleman in updating and getting response from PluginManager.
    """

    _logger: Union[AppLogger, None] = None

    @staticmethod
    def set_logger(logger: AppLogger) -> None:
        """
        A method to set up the logger instance for logging

        Args:
            logger (AppLogger): The logger instance
        """
        PluginController._logger = logger
        PluginManager.set_logger(logger.raw_logger_instance)

    @staticmethod
    def setup(core_plugins_folder: str) -> None:
        """
        Perform setup on plugin controller

        Args:
            core_plugins_folder (str): The core plugins folder location
        """
        # Load core plugins
        AppLogger.add_to_log(
            PluginController._logger,
            logging.INFO,
            "The system is discovering core plugins",
        )
        PluginManager.discover(core_plugins_folder)
        AppLogger.add_to_log(
            PluginController._logger,
            logging.INFO,
            PluginManager.get_printable_plugins(),
        )

    @staticmethod
    def get_plugin_information(
        plugin_type: PluginType, **kwargs
    ) -> Union[AlgorithmInfo, None]:
        """
        A method to retrieve the plugin information that is identified

        Args:
            plugin_type (PluginType): The plugin type to be identified

        Returns:
            Union[AlgorithmInfo, None]: Returns an instance of AlgorithmInfo or None if not found.
        """
        if plugin_type is PluginType.ALGORITHM:
            # We need to query the Redis AlgorithmRegistry for it.
            algorithm_id = kwargs.get("algorithm_id")

            # Search Algo Registry for the plugin
            algorithm_info = PluginController._get_from_algorithm_registry(algorithm_id)

        else:
            algorithm_info = None

        return algorithm_info

    @staticmethod
    def get_plugin_instance(
        plugin_type: PluginType, **kwargs
    ) -> Union[
        Tuple[IData, ISerializer, str],
        Tuple[IModel, ISerializer, str],
        Tuple[IAlgorithm, None, str],
    ]:
        """
        A method to retrieve the instance of plugins that is identified

        Args:
            plugin_type (PluginType): The plugin type to be identified

        Returns:
            Union[Tuple[IData, ISerializer, str], Tuple[IModel, ISerializer, str], Tuple[IAlgorithm, None, str]]:
            Returns an instance of the identified type, serializer instance, and error message.
        """
        # Get instance from PluginManager
        (
            plugin_instance,
            plugin_serializer_instance,
            error_message,
        ) = PluginController._get_from_plugin_manager(plugin_type, **kwargs)

        # Attempt to pull from algorithm registry if algorithm not found
        if plugin_instance is None and plugin_type is PluginType.ALGORITHM:
            # The plugin manager do not have the algorithm installed.
            # We need to query the Redis AlgorithmRegistry for it.
            algorithm_id = kwargs.get("algorithm_id")

            AppLogger.add_to_log(
                PluginController._logger,
                logging.INFO,
                f"Attempting to find {algorithm_id} in the algorithm registry",
            )

            # Search Algo Registry for the plugin
            algorithm_info = PluginController._get_from_algorithm_registry(algorithm_id)
            if algorithm_info is None:
                # Algorithm does not exist in algorithm registry too.
                error_message = (
                    f"The {algorithm_id} cannot be found in the algorithm registry"
                )
                AppLogger.add_to_log(
                    PluginController._logger, logging.ERROR, error_message
                )
                AppLogger.add_error_to_log(
                    PluginController._logger,
                    "PLG",
                    "CPLGx00091",
                    error_message,
                    "Critical",
                    "plugin_controller.py",
                )
                plugin_instance = None
                plugin_serializer_instance = None
            else:
                # Algorithm exists in algorithm registry but not in my PluginManager.
                # Proceed to ask PluginManager to discover from there.
                AppLogger.add_to_log(
                    PluginController._logger,
                    logging.INFO,
                    f"{algorithm_id} is in the algorithm registry. Attempting to re-discover algorithm",
                )

                # Install the algorithm plugin by providing the PluginManager the path to discover.
                PluginManager.discover(
                    algorithm_info.get_algorithm_path(), algorithm_id
                )

                # Search for the instance again from PluginManager.
                (
                    plugin_instance,
                    plugin_serializer_instance,
                    error_message,
                ) = PluginController._get_from_plugin_manager(plugin_type, **kwargs)

        return plugin_instance, plugin_serializer_instance, error_message

    @staticmethod
    def process_algorithm_install_callback(message: Dict) -> None:
        """
        A callback function to process algorithm install message

        Args:
            message (Dict): A pubsub message indicating the message id
        """
        algorithm_id = message.get("data", None)
        AppLogger.add_to_log(
            PluginController._logger,
            logging.INFO,
            f"The system received a request to install an algorithm: {algorithm_id}",
        )

        if not is_empty_string(algorithm_id):
            if PluginManager.is_plugin_exists(PluginType.ALGORITHM, algorithm_id):
                # Algorithm exists
                error_message = (
                    f"The {algorithm_id} cannot be installed: It already exists"
                )
                AppLogger.add_to_log(
                    PluginController._logger, logging.ERROR, error_message
                )
                AppLogger.add_error_to_log(
                    PluginController._logger,
                    "PLG",
                    "CPLGx00142",
                    error_message,
                    "Critical",
                    "plugin_controller.py",
                )
            else:
                # Algorithm does not exist
                # Search Algo Registry for the plugin
                algorithm_info = PluginController._get_from_algorithm_registry(
                    algorithm_id
                )
                if algorithm_info is None:
                    # Algorithm does not exist in algorithm registry too.
                    error_message = (
                        f"The {algorithm_id} cannot be installed: "
                        f"It cannot be found in the algorithm registry"
                    )
                    AppLogger.add_to_log(
                        PluginController._logger, logging.ERROR, error_message
                    )
                    AppLogger.add_error_to_log(
                        PluginController._logger,
                        "PLG",
                        "CPLGx00142",
                        error_message,
                        "Critical",
                        "plugin_controller.py",
                    )
                else:
                    # Algorithm exists in algorithm registry but not in my PluginManager.
                    # Proceed to ask PluginManager to discover from there.
                    AppLogger.add_to_log(
                        PluginController._logger,
                        logging.INFO,
                        f"The {algorithm_id} is found in the algorithm registry",
                    )

                    # Install the algorithm plugin by providing the PluginManager the path to discover.
                    PluginManager.discover(
                        algorithm_info.get_algorithm_path(), algorithm_id
                    )

                    # Check that the algorithm plugin is loaded
                    if PluginManager.is_plugin_exists(
                        PluginType.ALGORITHM, algorithm_id
                    ):
                        # Installation success
                        AppLogger.add_to_log(
                            PluginController._logger,
                            logging.INFO,
                            f"The {algorithm_id} is installed",
                        )
                    else:
                        # Installation failed
                        error_message = (
                            f"The {algorithm_id} cannot be installed: "
                            f"It is unable to discover the algorithm"
                        )
                        AppLogger.add_to_log(
                            PluginController._logger, logging.ERROR, error_message
                        )
                        AppLogger.add_error_to_log(
                            PluginController._logger,
                            "PLG",
                            "CPLGx00142",
                            error_message,
                            "Critical",
                            "plugin_controller.py",
                        )
        else:
            # Invalid algorithm id
            error_message = (
                f"The {algorithm_id} cannot be installed: It has an empty algorithm id"
            )
            AppLogger.add_to_log(PluginController._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                PluginController._logger,
                "PLG",
                "CPLGx00142",
                error_message,
                "Critical",
                "plugin_controller.py",
            )

    @staticmethod
    def process_algorithm_update_callback(message: Dict) -> None:
        """
        A callback function to process algorithm update message

        Args:
            message (Dict): A pubsub message indicating the message id
        """
        algorithm_id = message.get("data", None)
        AppLogger.add_to_log(
            PluginController._logger,
            logging.INFO,
            f"The system received a request to update an algorithm: {algorithm_id}",
        )

        if not is_empty_string(algorithm_id):
            if PluginManager.is_plugin_exists(PluginType.ALGORITHM, algorithm_id):
                # Algorithm exists
                # Search Algo Registry for the plugin
                algorithm_info = PluginController._get_from_algorithm_registry(
                    algorithm_id
                )
                if algorithm_info is None:
                    # Algorithm does not exist in algorithm registry.
                    error_message = (
                        f"The {algorithm_id} cannot be updated: "
                        f"It cannot be found in the algorithm registry"
                    )
                    AppLogger.add_to_log(
                        PluginController._logger, logging.ERROR, error_message
                    )
                    AppLogger.add_error_to_log(
                        PluginController._logger,
                        "PLG",
                        "CPLGx00143",
                        error_message,
                        "Critical",
                        "plugin_controller.py",
                    )
                else:
                    # Algorithm exists in algorithm registry and in my PluginManager.
                    # Proceed to ask PluginManager to discover from there.
                    AppLogger.add_to_log(
                        PluginController._logger,
                        logging.INFO,
                        f"The {algorithm_id} is found in the algorithm registry",
                    )

                    # Install the algorithm plugin by providing the PluginManager the path to discover.
                    PluginManager.discover(
                        algorithm_info.get_algorithm_path(), algorithm_id
                    )

                    AppLogger.add_to_log(
                        PluginController._logger,
                        logging.INFO,
                        f"The {algorithm_id} is updated",
                    )
            else:
                # Algorithm does not exist
                error_message = f"The {algorithm_id} cannot be updated: It is unable to discover the algorithm"
                AppLogger.add_to_log(
                    PluginController._logger, logging.ERROR, error_message
                )
                AppLogger.add_error_to_log(
                    PluginController._logger,
                    "PLG",
                    "CPLGx00143",
                    error_message,
                    "Critical",
                    "plugin_controller.py",
                )
        else:
            # Invalid algorithm id
            error_message = (
                f"The {algorithm_id} cannot be updated: It has an empty algorithm id"
            )
            AppLogger.add_to_log(PluginController._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                PluginController._logger,
                "PLG",
                "CPLGx00143",
                error_message,
                "Critical",
                "plugin_controller.py",
            )

    @staticmethod
    def process_algorithm_delete_callback(message: Dict) -> None:
        """
        A callback function to process algorithm delete message

        Args:
            message (Dict): A pubsub message indicating the message id
        """
        algorithm_id = message.get("data", None)
        AppLogger.add_to_log(
            PluginController._logger,
            logging.INFO,
            f"The system received a request to delete an algorithm: {algorithm_id}",
        )

        if not is_empty_string(algorithm_id):
            if PluginManager.is_plugin_exists(PluginType.ALGORITHM, algorithm_id):
                # Algorithm exists
                if PluginManager.remove_plugin(PluginType.ALGORITHM, algorithm_id):
                    AppLogger.add_to_log(
                        PluginController._logger,
                        logging.INFO,
                        f"The {algorithm_id} is deleted",
                    )
                else:
                    error_message = f"The {algorithm_id} is not deleted"
                    AppLogger.add_to_log(
                        PluginController._logger, logging.ERROR, error_message
                    )
                    AppLogger.add_error_to_log(
                        PluginController._logger,
                        "PLG",
                        "CPLGx00144",
                        error_message,
                        "Critical",
                        "plugin_controller.py",
                    )
            else:
                # Algorithm does not exist
                error_message = (
                    f"The {algorithm_id} cannot be deleted: It cannot be found"
                )
                AppLogger.add_to_log(
                    PluginController._logger, logging.ERROR, error_message
                )
                AppLogger.add_error_to_log(
                    PluginController._logger,
                    "PLG",
                    "CPLGx00144",
                    error_message,
                    "Critical",
                    "plugin_controller.py",
                )
        else:
            # Invalid algorithm id
            error_message = (
                f"The {algorithm_id} cannot be deleted: It has an empty algorithm id"
            )
            AppLogger.add_to_log(PluginController._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                PluginController._logger,
                "PLG",
                "CPLGx00144",
                error_message,
                "Critical",
                "plugin_controller.py",
            )

    @staticmethod
    def _get_from_plugin_manager(
        plugin_type: PluginType, **kwargs
    ) -> Union[
        Tuple[IData, ISerializer, str],
        Tuple[IModel, ISerializer, str],
        Tuple[IAlgorithm, None, str],
    ]:
        """
        A helper method to retrieve the plugin instance, plugin serializer instance and error message from PluginManager

        Args:
            plugin_type (PluginType): The plugin type to be identified

        Returns:
            Union[Tuple[IData, ISerializer, str], Tuple[IModel, ISerializer, str], Tuple[IAlgorithm, None, str]]:
            Returns an instance of the identified type, serializer instance and error message
        """
        # Default value
        plugin_instance = None
        plugin_serializer_instance = None
        error_message = ""

        try:
            # Request for input from PluginManager
            (
                plugin_instance,
                plugin_serializer_instance,
                error_message,
            ) = PluginManager.get_instance(plugin_type, **kwargs)

        except RuntimeError as error:
            # Set plugin instance to None. There is an error getting the instance.
            error_message = str(error)

        finally:
            return plugin_instance, plugin_serializer_instance, error_message

    @staticmethod
    def _get_from_algorithm_registry(algorithm_id: str) -> Union[AlgorithmInfo, None]:
        """
        A helper method to retrieve the algorithm from the algorithm registry

        Args:
            algorithm_id (str): The algorithm id to be retrieved

        Returns:
            Union[AlgorithmInfo, None]: AlgorithmInfo if found, None if not found
        """
        response = Redis.get_algorithm_info(algorithm_id)
        if response:
            # Create a new AlgorithmInfo with this info
            return AlgorithmInfo(algorithm_id, response)

        else:
            # Empty Dict. No algorithm found.
            return None
