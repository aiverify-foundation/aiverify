import logging
from typing import Callable, Dict, Tuple, Union

from test_engine_core.interfaces.ialgorithm import IAlgorithm
from test_engine_core.interfaces.idata import IData
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.ipipeline import IPipeline
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.model_mode_type import ModelModeType
from test_engine_core.plugins.enums.model_type import ModelType
from test_engine_core.plugins.enums.plugin_type import PluginType

from test_engine_app.app_logger import AppLogger
from test_engine_app.processing.plugin_controller import PluginController


class StreamProcessing:
    @staticmethod
    def detect_pipeline(logger: AppLogger, pipeline_path: str) -> bool:
        """
        A method to detect pipeline

        Args:
            logger (AppLogger): The logger for adding logs
            pipeline_path (str): The path to the pipeline folder

        Returns:
            bool: Returns True if model is pipeline else False
        """
        AppLogger.add_to_log(
            logger,
            logging.INFO,
            "Attempting to detect pipeline model from the given path",
        )
        (
            pipeline_instance,
            _,
            _,
        ) = PluginController.get_plugin_instance(
            PluginType.PIPELINE,
            **{"pipeline_path": pipeline_path},
        )
        # Return true if it is a pipeline model and false if not
        if pipeline_instance:
            return True
        else:
            return False

    @staticmethod
    def load_data(
        logger: AppLogger, data_path: str
    ) -> Tuple[bool, Tuple[Union[IData, None], Union[ISerializer, None]], str]:
        """
        A method to identify and load data information

        Args:
            logger (AppLogger): The logger for adding logs
            data_path (str): The path to the data

        Returns:
            Tuple[bool, Tuple[Union[IData, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the data and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        (
            data_instance,
            data_serializer_instance,
            error_messages,
        ) = PluginController.get_plugin_instance(
            PluginType.DATA, **{"filename": data_path}
        )
        # log the instance and deserializer
        if data_serializer_instance:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"Data Instance: {data_instance}, "
                f"Data Deserializer: {data_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"Data Instance: {data_instance}, Data Deserializer: None",
            )
        # perform data setup
        if data_instance:
            is_setup_success, error_messages = data_instance.setup()
            if is_setup_success:
                return True, (data_instance, data_serializer_instance), ""
            else:
                return (
                    False,
                    (data_instance, data_serializer_instance),
                    f"Unable to setup data instance: {error_messages}",
                )
        else:
            return (
                False,
                (data_instance, data_serializer_instance),
                f"Unable to get data instance: {error_messages}",
            )

    @staticmethod
    def load_pipeline(
        logger: AppLogger, pipeline_path: str
    ) -> Tuple[bool, Tuple[Union[IPipeline, None], Union[ISerializer, None]], str]:
        """
        A method to load pipeline information

        Args:
            logger (AppLogger): The logger for adding logs
            pipeline_path (str): The path to the pipeline

        Returns:
            Tuple[bool, Tuple[Union[IPipeline, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the pipeline and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        (
            pipeline_instance,
            pipeline_serializer_instance,
            error_messages,
        ) = PluginController.get_plugin_instance(
            PluginType.PIPELINE,
            **{"pipeline_path": pipeline_path},
        )
        # log the instance and deserializer
        if pipeline_serializer_instance:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"Pipeline Instance: {pipeline_instance}, "
                f"Pipeline Deserializer: {pipeline_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"Pipeline Instance: {pipeline_instance}, Pipeline Deserializer: None",
            )
        # perform pipeline setup
        if pipeline_instance:
            is_setup_success, error_messages = pipeline_instance.setup()
            if is_setup_success:
                return True, (pipeline_instance, pipeline_serializer_instance), ""
            else:
                return (
                    False,
                    (pipeline_instance, pipeline_serializer_instance),
                    f"Unable to setup pipeline instance: {error_messages}",
                )
        else:
            return (
                False,
                (pipeline_instance, pipeline_serializer_instance),
                f"Unable to get pipeline instance: {error_messages}",
            )

    @staticmethod
    def load_model(
        logger: AppLogger,
        model_mode: ModelModeType,
        model_path: str,
        api_schema: Union[Dict, None],
        api_config: Union[Dict, None],
    ) -> Tuple[bool, Tuple[Union[IModel, None], Union[ISerializer, None]], str]:
        """
        A method to load model information

        Args:
            logger (AppLogger): The logger for adding logs
            model_mode (ModelModeType): The model mode
            model_path (str): The path to the model
            api_schema (Union[Dict, None]): The api schema information (Not used)
            api_config (Union[Dict, None]): The api config information (Not used)

        Returns:
            Tuple[bool, Tuple[Union[IModel, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the model and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        (
            model_instance,
            model_serializer_instance,
            error_messages,
        ) = PluginController.get_plugin_instance(
            PluginType.MODEL,
            **{
                "mode": model_mode,
                "filename": model_path,
                "api_schema": api_schema,
                "api_config": api_config,
            },
        )
        # log the instance and deserializer
        if model_serializer_instance:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"Model Instance: {model_instance}, "
                f"Model Deserializer: {model_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"Model Instance: {model_instance}, Model Deserializer: None",
            )
        # perform model setup
        if model_instance:
            is_setup_success, error_messages = model_instance.setup()
            if is_setup_success:
                return True, (model_instance, model_serializer_instance), ""
            else:
                return (
                    False,
                    (model_instance, model_serializer_instance),
                    f"Unable to setup model instance: {error_messages}",
                )
        else:
            return (
                False,
                (model_instance, model_serializer_instance),
                f"Unable to get model instance: {error_messages}",
            )

    @staticmethod
    def load_ground_truth(
        logger: AppLogger, ground_truth_path: str
    ) -> Tuple[bool, Tuple[Union[IData, None], Union[ISerializer, None]], str]:
        """
        A method to load ground truth information

        Args:
            logger (AppLogger): The logger for adding logs
            ground_truth_path (str): The path to the ground truth

        Returns:
            Tuple[bool, Tuple[Union[IData, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the ground truth and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        # Require Ground Truth
        (
            ground_truth_instance,
            ground_truth_serializer_instance,
            error_messages,
        ) = PluginController.get_plugin_instance(
            PluginType.DATA,
            **{"filename": ground_truth_path},
        )
        # log the instance and deserializer
        if ground_truth_serializer_instance:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"GroundTruth Instance: {ground_truth_instance}, "
                f"GroundTruth Deserializer: {ground_truth_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"GroundTruth Instance: {ground_truth_instance}, GroundTruth Deserializer: None",
            )
        # perform ground truth setup
        if ground_truth_instance:
            is_setup_success, error_messages = ground_truth_instance.setup()
            if is_setup_success:
                return (
                    True,
                    (ground_truth_instance, ground_truth_serializer_instance),
                    "",
                )
            else:
                return (
                    False,
                    (ground_truth_instance, ground_truth_serializer_instance),
                    f"Unable to setup ground truth instance: {error_messages}",
                )
        else:
            return (
                False,
                (ground_truth_instance, ground_truth_serializer_instance),
                f"Unable to get ground truth instance: {error_messages}",
            )

    @staticmethod
    def load_algorithm(
        logger: AppLogger,
        algorithm_id: str,
        algorithm_arguments: Dict,
        data_serializer_instance: Tuple[IData, ISerializer],
        ground_truth_serializer_instance: Tuple[IData, ISerializer],
        ground_truth: str,
        model_serializer_instance: Tuple[Union[IModel, IPipeline], ISerializer],
        model_type: ModelType,
        update_progress_cb: Callable,
        initial_data_instance: Union[IData, None] = None,
        initial_model_instance: Union[IModel, None] = None,
    ) -> Tuple[bool, Tuple[Union[IAlgorithm, None], Union[ISerializer, None]], str]:
        """
        A method to load algorithm information

        Args:
            logger (AppLogger): The logger for adding logs
            algorithm_id (str): The algorithm id to retrieve
            algorithm_arguments (Dict): The algorithm arguments for the algorithm
            data_serializer_instance (Tuple[IData, ISerializer]): The tuple consisting of data instance and
            serializer instance
            ground_truth_serializer_instance (Tuple[IData, ISerializer]): The tuple consisting of ground truth
            instance and serializer instance
            ground_truth (str): The string on which feature is the ground truth
            model_serializer_instance (Tuple[Union[IModel, IPipeline], ISerializer]): The tuple consisting of model
            instance and serializer instance
            model_type (ModelType): The model type
            update_progress_cb (Callable): The callback function for the algorithm progress update
            initial_data_instance (Union[IData, None], optional): The data instance before the pipeline applies the
            transformation. Defaults to None.
            initial_model_instance (Union[IModel, None], optional): The model instance before the pipeline applies the
            transformation. Defaults to None.

        Returns:
            Tuple[bool, Tuple[Union[IAlgorithm, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the algorithm and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        # Get the algorithm instance and check if valid instance
        (
            algorithm_instance,
            algorithm_serializer_instance,
            error_messages,
        ) = PluginController.get_plugin_instance(
            PluginType.ALGORITHM,
            **{
                "algorithm_id": algorithm_id,
                "algorithm_arguments": algorithm_arguments,
                "data_serializer_instance": data_serializer_instance,
                "ground_truth_serializer_instance": ground_truth_serializer_instance,
                "ground_truth": ground_truth,
                "model_serializer_instance": model_serializer_instance,
                "model_type": model_type,
                "logger": logger.raw_logger_instance,
                "progress_callback": update_progress_cb,
                "initial_data_instance": initial_data_instance,
                "initial_model_instance": initial_model_instance,
            },
        )
        if algorithm_instance:
            AppLogger.add_to_log(
                logger, logging.INFO, f"Algorithm Instance: {algorithm_instance}"
            )
            return True, (algorithm_instance, algorithm_serializer_instance), ""
        else:
            # Algorithm Instance not available
            return (
                False,
                (algorithm_instance, algorithm_serializer_instance),
                f"Unable to get algorithm instance: {error_messages}",
            )
