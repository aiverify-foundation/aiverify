import logging
from pathlib import Path
from typing import Dict, Tuple, Union

from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.utils.log_utils import log_message


class AlgorithmManager:
    """
    The AlgorithmManager comprises methods that focuses on finding algorithm from the supported algorithm plugins.
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
            AlgorithmManager._logger = logger

    @staticmethod
    def get_algorithm(
        algorithm_plugins: Dict, **kwargs
    ) -> Tuple[bool, Union[IAlgorithm, None], str]:
        """
        A method to retrieve the algorithm with the algoId and return the algorithm instance.

        Args:
            algorithm_plugins (Dict): A dictionary of supported algorithm plugins
            algorithm_id (kwargs): The algorithm id to retrieve
            algorithm_arguments (kwargs): The algorithm arguments to pass to the algorithm

            data_serializer_instance (kwargs): The data instance and serializer
            to be passed to the algorithm

            ground_truth_serializer_instance (kwargs): The ground truth instance and serializer
            to be passed to the algorithm

            model_serializer_instance (kwargs): The model instance and serializer
            to be passed to the algorithm

            initial_data_instance (kwargs): The initial data instance before the data transformation for pipeline
            initial_model_instance (kwargs): The initial pipeline before the data transformation for pipeline

        Returns:
            Tuple[bool, Union[IAlgorithm, None], str]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IAlgorithm, and returns an empty string
            If it fails to deserialize/identify, it will contain None object and returns the error message
        """
        try:
            # Validate the inputs
            if algorithm_plugins is None or not isinstance(algorithm_plugins, dict):
                return (
                    False,
                    None,
                    "There was an error validating the input parameters",
                )

            # Get required information
            algorithm_id = kwargs.get("algorithm_id", "")
            algorithm_arguments = kwargs.get("algorithm_arguments", dict())
            data_serializer_instance = kwargs.get(
                "data_serializer_instance", (None, None)
            )
            ground_truth_serializer_instance = kwargs.get(
                "ground_truth_serializer_instance", (None, None)
            )
            model_serializer_instance = kwargs.get(
                "model_serializer_instance", (None, None)
            )
            initial_data_instance = kwargs.get("initial_data_instance", None)
            initial_model_instance = kwargs.get("initial_model_instance", None)

            # Validate the required information
            if not isinstance(algorithm_id, str) or not isinstance(
                algorithm_arguments, dict
            ):
                return (
                    False,
                    None,
                    f"There was an error getting algorithm id, algorithm arguments "
                    f"(unsupported type): {type(algorithm_id)}, {type(algorithm_arguments)}",
                )

            # Search through the algorithm list and get an instance
            if algorithm_id in algorithm_plugins.keys():
                # Found the algorithm in our detected list
                is_success = True
                error_message = ""

                # Update the base path and create an instance of the plugin
                algorithm_arguments["project_base_path"] = Path(
                    algorithm_plugins[algorithm_id].__file__
                ).parent
                algorithm_arguments["logger"] = kwargs.get("logger", None)
                algorithm_arguments["progress_callback"] = kwargs.get(
                    "progress_callback", None
                )
                algorithm_arguments["ground_truth"] = kwargs.get("ground_truth", "")
                algorithm_arguments["model_type"] = kwargs.get("model_type")
                algorithm = algorithm_plugins[algorithm_id].Plugin(
                    data_serializer_instance,
                    model_serializer_instance,
                    ground_truth_serializer_instance,
                    initial_data_instance,
                    initial_model_instance,
                    **algorithm_arguments,
                )
                log_message(
                    AlgorithmManager._logger,
                    logging.INFO,
                    f"Supported algorithm: {algorithm_id}, {algorithm.get_plugin_type()}",
                )

            else:
                algorithm = None
                is_success = False
                error_message = f"There was an error getting algorithm instance (not found): {algorithm_id}"
                log_message(AlgorithmManager._logger, logging.ERROR, error_message)

            return is_success, algorithm, error_message

        except Exception as error:
            return (
                False,
                None,
                f"There was an error encountered getting algorithm instance (exception): {str(error)}",
            )
