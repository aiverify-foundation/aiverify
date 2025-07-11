import glob
import re
import sys
from logging import Logger
from multiprocessing import Lock
from pathlib import Path
from typing import Dict, List, Tuple, Union

from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iplugin import IPlugin
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.algorithm_manager import AlgorithmManager
from aiverify_test_engine.plugins.data_manager import DataManager
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.model_mode_type import ModelModeType
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.pipeline_plugin_type import PipelinePluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.enums.serializer_plugin_type import (
    SerializerPluginType,
)
from aiverify_test_engine.plugins.model_manager import ModelManager
from aiverify_test_engine.plugins.pipeline_manager import PipelineManager
from aiverify_test_engine.utils.import_modules import (
    create_module_spec,
    import_module_from_spec,
)
from aiverify_test_engine.utils.validate_checks import is_empty_string


class PluginManager:
    """
    The PluginManager class provides functionality for discovering plugins and interacting with different plugins
    """

    # Variables
    _logger: Logger = None
    _data_priority_list: List = [
        DataPluginType.PANDAS,
        DataPluginType.IMAGE,
        DataPluginType.DELIMITER,
    ]
    _model_priority_list: List = [
        ModelPluginType.LIGHTGBM,
        ModelPluginType.XGBOOST,
        ModelPluginType.SKLEARN,
        ModelPluginType.TENSORFLOW,
        ModelPluginType.PYTORCH,
        ModelPluginType.API,
    ]
    _serializer_priority_list: List = [
        SerializerPluginType.PICKLE,
        SerializerPluginType.JOBLIB,
        SerializerPluginType.TENSORFLOW,
        SerializerPluginType.IMAGE,
        SerializerPluginType.PYTORCH,
        SerializerPluginType.DELIMITER,
    ]
    _pipeline_priority_list: List = [
        PipelinePluginType.SKLEARN,
        PipelinePluginType.PYTORCH,
        PipelinePluginType.CUSTOM,
    ]
    _plugins: Dict = {plugin_type.name: dict() for plugin_type in PluginType}
    lock: Lock = Lock()
    plugin_name: str = "Plugin"

    @staticmethod
    def set_logger(logger: Logger) -> None:
        """
        A method to set up the logger instance for logging

        Args:
            logger (Logger): The logger instance
        """
        # Set all the different managers to the logger to perform logging when in operation
        if isinstance(logger, Logger):
            PluginManager._logger = logger
            DataManager.set_logger(logger)
            ModelManager.set_logger(logger)
            AlgorithmManager.set_logger(logger)
            PipelineManager.set_logger(logger)

    @staticmethod
    def discover(
        discover_folder: str = str(Path().absolute() / "plugins"), tag_name: str = None
    ) -> None:
        """
        A method to discover possible plugins in the Discover folder indicated during setup phase

        Args:
            discover_folder (str, optional): A path to discover new plugins.
            Defaults to str(Path().absolute() / "plugins").
            tag_name (str, optional): A string to tag this name with the module found. Defaults to None
        """
        if discover_folder is None or is_empty_string(discover_folder):
            return

        # Find python files in the given folder.
        discover_paths = [
            file for file in glob.glob(f"{discover_folder}/**/*.py", recursive=True)
        ]

        # Search through the discovered paths and create modules
        plugin_modules = dict()
        for plugin_path in discover_paths:
            # Add the plugin folder in case it uses relative path
            plugin_folder_path = str(Path(plugin_path).parent)
            sys.path.append(plugin_folder_path)

            try:
                # Remove files that have underscores (__filename__.py)
                module_name = re.sub("\\.py$", "", Path(plugin_path).name)
                if module_name.__contains__("__"):
                    continue

                # Import module with the module specification
                # Store modules in the dict
                module_spec = create_module_spec(module_name, plugin_path)
                if not module_spec:
                    continue  # module spec is None

                module = import_module_from_spec(module_spec)
                if (
                    PluginManager.plugin_name in dir(module)
                    and module.Plugin.get_plugin_type() in PluginType
                ):
                    if tag_name:
                        plugin_modules.update({tag_name: module})
                    else:
                        plugin_modules.update({module_name: module})
                else:
                    pass  # Unexpected module or Invalid plugin type

            except Exception:
                pass  # Encountered an error while processing this py file; Continue next file

            finally:
                # Remove the plugin folder from sys search path
                sys.path.remove(plugin_folder_path)

        # Update list of plugin modules
        PluginManager._update_plugin_modules(plugin_modules)

    @staticmethod
    def get_instance(
        plugin_type: PluginType, **kwargs
    ) -> Union[
        Tuple[IData, ISerializer, str],
        Tuple[IModel, ISerializer, str],
        Tuple[IPipeline, ISerializer, str],
        Tuple[IAlgorithm, None, str],
    ]:
        """
        A method to retrieve the instance of plugins that is identified

        Args:
            plugin_type (PluginType): The plugin type to be identified

        Returns:
            Union[Tuple[IData, ISerializer, str], Tuple[IModel, ISerializer, str],
            Tuple[IPipeline, ISerializer, str], Tuple[IAlgorithm, None, str]]:
            Returns a tuple consisting of the identified type (IData, IModel, IPipeline, IAlgorithm),
            its identified serializer and error messages.
            If it succeeds, it will contain an object of the identified type and an object of ISerializer
            If it fails to get instance, it will contain None objects and error message
        """
        if plugin_type is None or not isinstance(plugin_type, PluginType):
            return (
                None,
                None,
                f"There was an error getting instance due to an invalid plugin type: {plugin_type}",
            )

        elif plugin_type is PluginType.DATA:
            return PluginManager._get_data_serializer_instance(kwargs)

        elif plugin_type is PluginType.MODEL:
            return PluginManager._get_model_serializer_instance(kwargs)

        elif plugin_type is PluginType.PIPELINE:
            return PluginManager._get_pipeline_serializer_instance(kwargs)

        else:
            return PluginManager._get_algorithm_serializer_instance(kwargs)

    @staticmethod
    def get_printable_plugins() -> str:
        """
        A method to get a printable string of detected plugins

        Returns:
            str: A string of detected plugins
        """
        with PluginManager.lock:
            return str(PluginManager._plugins)

    @staticmethod
    def is_plugin_exists(plugin_type: PluginType, plugin_name: str) -> bool:
        """
        A method to return if the plugin exists in detected plugins

        Args:
            plugin_type (PluginType): The plugin type (e.g. Data, Model, Algorithm, Serializer)
            plugin_name (str): The plugin name to be removed

        Returns:
            bool:
            If plugin exists, returns True
            If plugin does not exist, returns False
        """
        plugins = PluginManager._get_plugins_by_type(plugin_type)
        return plugin_name in plugins.keys()

    @staticmethod
    def remove_plugin(plugin_type: PluginType, plugin_name: str) -> None:
        """
        A method to remove plugin from the detected plugins

        Args:
            plugin_type (PluginType): The plugin type (e.g. Data, Model, Algorithm, Serializer)
            plugin_name (str): The plugin name to be removed
        """
        # Delete the plugin
        PluginManager._delete_plugins_by_type(plugin_type, plugin_name)

    @staticmethod
    def _get_data_serializer_instance(
        arguments: Dict,
    ) -> Tuple[IData, ISerializer, str]:
        """
        A helper method to retrieve the data and serializer instance from DataManager

        Args:
            arguments (Dict): The arguments to be passed to the DataManager to process

        Raises:
            RuntimeError: Failure to load the data from the provided filepath

        Returns:
            Tuple[IData, ISerializer, str]:
            Returns a tuple consisting of an object of IData, ISerializer and str,
            If it succeeds, it will contain an object of IData, and an object of ISerializer and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        # Pass the information to DataManager to process and return the detected data instance
        filename = arguments.get("filename", "")
        (
            is_success,
            data_instance,
            serializer_instance,
            error_message,
        ) = DataManager.read_data(
            filename,
            PluginManager._get_plugins_by_type(PluginType.DATA),
            PluginManager._get_plugins_by_type(PluginType.SERIALIZER),
        )

        if is_success:
            return data_instance, serializer_instance, error_message
        else:
            raise RuntimeError(
                f"There was an error loading dataset(file): {filename} ({error_message})"
            )

    @staticmethod
    def _get_model_serializer_instance(
        arguments: Dict,
    ) -> Tuple[IModel, ISerializer, str]:
        """
        A helper method to retrieve the model and serializer instance from ModelManager

        Args:
            arguments (Dict): The arguments to be passed to the ModelManager to process

        Raises:
            RuntimeError: Failure to load the model from the provided filepath

        Returns:
            Tuple[IModel, ISerializer, str]:
            Returns a tuple consisting of an object of IModel, ISerializer and str,
            If it succeeds, it will contain an object of IModel, and an object of ISerializer
            and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        # Pass the information to ModelManager to process and return the detected model instance
        model_mode = arguments.get("mode", ModelModeType.UPLOAD)

        # Process differently if it is API, or UPLOAD.
        if model_mode is ModelModeType.API:
            api_schema = arguments.get("api_schema", dict())
            api_config = arguments.get("api_config", dict())
            (
                is_success,
                model_instance,
                serializer_instance,
                error_message,
            ) = ModelManager.read_api(
                api_schema,
                api_config,
                PluginManager._get_plugins_by_type(PluginType.MODEL),
            )

            if is_success:
                return model_instance, serializer_instance, error_message
            else:
                raise RuntimeError(
                    f"There was an error loading model(api): {api_schema} | {api_config} ({error_message})"
                )

        else:
            filename = arguments.get("filename", "")
            (
                is_success,
                model_instance,
                serializer_instance,
                error_message,
            ) = ModelManager.read_model_file(
                filename,
                PluginManager._get_plugins_by_type(PluginType.MODEL),
                PluginManager._get_plugins_by_type(PluginType.SERIALIZER),
            )

            if is_success:
                return model_instance, serializer_instance, error_message
            else:
                raise RuntimeError(
                    f"There was an error loading model(file): {filename} ({error_message})"
                )

    @staticmethod
    def _get_pipeline_serializer_instance(
        arguments: Dict,
    ) -> Tuple[IPipeline, ISerializer, str]:
        """
        A helper method to retrieve the pipeline and serializer instance from PipelineManager

        Args:
            arguments (Dict): The arguments to be passed to the PipelineManager to process

        Raises:
            RuntimeError: Failure to load the pipeline from the provided filepath

        Returns:
            Tuple[IPipeline, ISerializer, str]:
            Returns a tuple consisting of an object of IPipeline, ISerializer and str,
            If it succeeds, it will contain an object of IPipeline, and an object of ISerializer
            and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        # Pass the information to PipelineManager to process and return the detected pipeline instance
        pipeline_path = arguments.get("pipeline_path", "")
        
        (
            is_success,
            pipeline_instance,
            serializer_instance,
            error_message,
        ) = PipelineManager.read_pipeline_path(
            pipeline_path,
            PluginManager._get_plugins_by_type(PluginType.PIPELINE),
            PluginManager._get_plugins_by_type(PluginType.SERIALIZER),
        )

        if is_success:
            return pipeline_instance, serializer_instance, error_message
        else:
            raise RuntimeError(
                f"There was an error loading pipeline(file): {pipeline_path} ({error_message})"
            )

    @staticmethod
    def _get_algorithm_serializer_instance(
        arguments: Dict,
    ) -> Tuple[IAlgorithm, None, str]:
        """
        A helper method to retrieve algorithm and serializer instance from AlgorithmManager

        Args:
            arguments (Dict): The arguments to be passed to the AlgorithmManager to process

        Raises:
            RuntimeError: Failure to load algorithm from the provided algorithm id

        Returns:
            Tuple[IAlgorithm, None, str]:
            Returns a tuple consisting of an object of IAlgorithm, None and str,
            If it succeeds, it will contain an object of IAlgorithm, and None object and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        # Pass the information to AlgorithmManager to process and return the detected algorithm instance
        is_success, algorithm_instance, error_message = AlgorithmManager.get_algorithm(
            PluginManager._get_plugins_by_type(PluginType.ALGORITHM), **arguments
        )
        if is_success:
            return algorithm_instance, None, error_message
        else:
            raise RuntimeError(f"There was an error loading algorithm: {error_message}")

    @staticmethod
    def _delete_plugins_by_type(plugin_type: PluginType, plugin_name: str) -> None:
        """
        A helper method to delete plugin from stored plugins

        Args:
            plugin_type (PluginType): The plugin type (e.g. Data, Model, Algorithm, Pipeline, Serializer)
            plugin_name (str): The plugin name to be removed
        """
        with PluginManager.lock:
            if plugin_name in PluginManager._plugins[plugin_type.name].keys():
                PluginManager._plugins[plugin_type.name].pop(plugin_name)

    @staticmethod
    def _get_plugins_by_type(plugin_type: PluginType) -> Dict:
        """
        A helper method to return plugins from stored plugins

        Args:
            plugin_type (PluginType): The plugin type (e.g. Data, Model, Pipeline, Algorithm, Serializer)

        Returns:
            Dict: The installed plugins under this plugin type
        """
        with PluginManager.lock:
            if plugin_type is PluginType.DATA:
                return PluginManager._plugins[PluginType.DATA.name]
            elif plugin_type is PluginType.MODEL:
                return PluginManager._plugins[PluginType.MODEL.name]
            elif plugin_type is PluginType.PIPELINE:
                return PluginManager._plugins[PluginType.PIPELINE.name]
            elif plugin_type is PluginType.SERIALIZER:
                return PluginManager._plugins[PluginType.SERIALIZER.name]
            else:
                return PluginManager._plugins[PluginType.ALGORITHM.name]

    @staticmethod
    def _sort_plugin(plugin_tuple: Tuple[str, IPlugin]) -> int:
        """
        A helper method to sort plugin based on priority listing

        Args:
            plugin_tuple (Tuple[str, IPlugin]): The plugin tuple that consist of the plugin name and the plugin module

        Returns:
            int : The order of this plugin with reference to the priority listing
        """
        plugin_type = plugin_tuple[1].Plugin.get_plugin_type()

        if plugin_type is PluginType.DATA:
            return PluginManager._data_priority_list.index(
                plugin_tuple[1].Plugin.get_data_plugin_type()
            )

        elif plugin_type is PluginType.MODEL:
            return PluginManager._model_priority_list.index(
                plugin_tuple[1].Plugin.get_model_plugin_type()
            )

        elif plugin_type is PluginType.PIPELINE:
            return PluginManager._pipeline_priority_list.index(
                plugin_tuple[1].Plugin.get_pipeline_plugin_type()
            )

        elif plugin_type is PluginType.SERIALIZER:
            return PluginManager._serializer_priority_list.index(
                plugin_tuple[1].Plugin.get_serializer_plugin_type()
            )

        else:
            return list(
                PluginManager._plugins[PluginType.ALGORITHM.name].values()
            ).index(plugin_tuple[1])

    @staticmethod
    def _update_plugins_by_type(plugin_type: PluginType, plugin_dict: Dict) -> None:
        """
        A helper method to add/update plugin to stored plugins

        Args:
            plugin_type (PluginType): The plugin type (e.g. Data, Model, Algorithm, Serializer)
            plugin_dict (Dict): The dict that contains the (plugin_name: plugin_obj)
        """
        with PluginManager.lock:
            PluginManager._plugins[plugin_type.name].update(plugin_dict)
            PluginManager._plugins[plugin_type.name] = dict(
                sorted(
                    PluginManager._plugins[plugin_type.name].items(),
                    key=PluginManager._sort_plugin,
                )
            )

    @staticmethod
    def _update_plugin_modules(modules: Dict) -> None:
        """
        A helper method to update the plugin manager plugins directory with new-found plugins

        Args:
            modules (Dict): A dictionary of newly found plugins
        """
        for module_name, module in modules.items():
            # Get the module plugin type
            plugin_type = module.Plugin.get_plugin_type()

            # Check if this module exists in the pluginmanager plugins list.
            # Add plugin if the module does not exist.
            if module_name not in PluginManager._get_plugins_by_type(plugin_type):
                PluginManager._update_plugins_by_type(
                    plugin_type, {module_name: module}
                )
