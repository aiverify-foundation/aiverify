import copy
from typing import Callable, Union

from test_engine_core.interfaces.ialgorithm import IAlgorithm
from test_engine_core.interfaces.idata import IData
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.ipipeline import IPipeline
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.plugins.enums.model_mode_type import ModelModeType
from test_engine_core.plugins.enums.model_type import ModelType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager
from test_engine_core.utils.json_utils import validate_json
from test_engine_pypi.test_argument import TestArgument


class TestProcessing:
    def __init__(
        self, task_argument: TestArgument, update_progress_method: Callable
    ) -> None:
        self._task_argument = task_argument
        self._update_progress_method = update_progress_method

    def load_instances(
        self,
    ) -> tuple[
        bool,
        tuple[Union[IData, None], Union[ISerializer, None]],
        tuple[Union[IModel, None], Union[ISerializer, None]],
        tuple[Union[IData, None], Union[ISerializer, None]],
        tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
        str,
    ]:
        if self.detect_pipeline(self._task_argument.model):
            print("Found the pipeline model. Loading pipeline instances")
            return self.load_pipeline_instances()
        else:
            print("Unable to find pipeline model. Loading non-pipeline instances")
            return self.load_non_pipeline_instances()

    def detect_pipeline(self, pipeline_path: str) -> bool:
        """
        A method to detect pipeline

        Args:
            pipeline_path (str): The path to the pipeline folder

        Returns:
            bool: Returns True if model is pipeline else False
        """
        (
            pipeline_instance,
            _,
            _,
        ) = self._get_plugin_instance(
            PluginType.PIPELINE,
            **{"pipeline_path": pipeline_path},
        )
        # Return true if it is a pipeline model and false if not
        if pipeline_instance:
            return True
        else:
            return False

    def load_pipeline_instances(
        self,
    ) -> tuple[
        bool,
        tuple[Union[IData, None], Union[ISerializer, None]],
        tuple[Union[IPipeline, None], Union[ISerializer, None]],
        tuple[Union[IData, None], Union[ISerializer, None]],
        tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
        str,
    ]:
        """
        A helper method to load pipeline instances

        Raises:
            RuntimeError: Raises exception when there are issues loading data
            RuntimeError: Raises exception when there are issues loading pipeline
            RuntimeError: Raises exception when there are issues loading ground truth
            RuntimeError: Raises exception when there are issues with ground truth feature
            RuntimeError: Raises exception when there are issues loading algorithm

        Returns:
            tuple[ bool,
            tuple[Union[IData, None], Union[ISerializer, None]],
            tuple[Union[IPipeline, None], Union[ISerializer, None]],
            tuple[Union[IData, None], Union[ISerializer, None]],
            tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
            str, ]:
            If it is successful, it will return the data instance and serializer, model instance and serializer,
            ground truth instance and serializer, algorithm instance and serializer, with no error messages
            If it is not successful, it will return the error messages.
        """
        is_success = True
        data_serializer_instance = (None, None)
        model_serializer_instance = (None, None)
        ground_truth_serializer_instance = (None, None)
        algorithm_serializer_instance = (None, None)
        error_message = ""

        try:
            # Identify and load data information
            (
                is_load_data_success,
                data_serializer_instance,
                load_data_error_message,
            ) = self.load_data(self._task_argument.data)
            if not is_load_data_success:
                is_success = is_load_data_success
                raise RuntimeError(load_data_error_message)

            # Identify and load model information
            (
                is_load_model_success,
                model_serializer_instance,
                load_model_error_message,
            ) = self.load_pipeline(self._task_argument.model)
            if not is_load_model_success:
                is_success = is_load_model_success
                raise RuntimeError(load_model_error_message)

            # Perform a copy of the initial data and model information
            initial_data_serializer_instance = copy.deepcopy(data_serializer_instance)
            initial_model_serializer_instance = copy.deepcopy(model_serializer_instance)

            # Perform data transformation
            current_dataset = data_serializer_instance[0].get_data()
            current_pipeline = model_serializer_instance[0].get_pipeline()
            data_transformation_stages = current_pipeline[:-1]
            transformed_dataset = data_transformation_stages.transform(current_dataset)
            transformed_pipeline = current_pipeline[-1]
            # Set new transformed pipeline and dataset
            data_serializer_instance[0].set_data(transformed_dataset)
            model_serializer_instance[0].set_pipeline(transformed_pipeline)

            # Check if ground_truth is optional
            # Identify and load ground truth information
            if (
                self._task_argument.algorithm_plugin_information.get_algorithm_require_ground_truth()
            ):
                (
                    is_load_ground_truth_success,
                    ground_truth_serializer_instance,
                    load_ground_truth_error_message,
                ) = self.load_ground_truth(self._task_argument.ground_truth_dataset)
                if not is_load_ground_truth_success:
                    is_success = is_load_ground_truth_success
                    raise RuntimeError(load_ground_truth_error_message)

                # Leave only the ground truth feature in ground_truth_instance and
                # Remove ground truth feature from the data instance
                is_ground_truth_instance_success = ground_truth_serializer_instance[
                    0
                ].keep_ground_truth(self._task_argument.ground_truth)
                data_serializer_instance[0].remove_ground_truth(
                    self._task_argument.ground_truth
                )
                if not is_ground_truth_instance_success:
                    is_success = is_ground_truth_instance_success
                    raise RuntimeError("Unable to get ground truth data")
            else:
                # Do not require Ground Truth
                ground_truth_serializer_instance = (None, None)

            # Identify and load algorithm information
            (
                is_load_algorithm_success,
                algorithm_serializer_instance,
                load_algorithm_error_message,
            ) = self.load_algorithm(
                self._task_argument.algorithm_id,
                self._task_argument.algorithm_arguments,
                data_serializer_instance,
                ground_truth_serializer_instance,
                self._task_argument.ground_truth,
                model_serializer_instance,
                self._task_argument.model_type,
                self._update_progress_method,
                initial_data_serializer_instance[0],
                initial_model_serializer_instance[0],
            )
            if not is_load_algorithm_success:
                is_success = is_load_algorithm_success
                raise RuntimeError(load_algorithm_error_message)

        except RuntimeError as error:
            error_message = str(error)

        finally:
            return (
                is_success,
                data_serializer_instance,
                model_serializer_instance,
                ground_truth_serializer_instance,
                algorithm_serializer_instance,
                error_message,
            )

    def load_non_pipeline_instances(
        self,
    ) -> tuple[
        bool,
        tuple[Union[IData, None], Union[ISerializer, None]],
        tuple[Union[IModel, None], Union[ISerializer, None]],
        tuple[Union[IData, None], Union[ISerializer, None]],
        tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
        str,
    ]:
        """
        A helper method to load non pipeline instances

        Raises:
            RuntimeError: Raises exception when there are issues loading data
            RuntimeError: Raises exception when data is of IMAGE type
            RuntimeError: Raises exception when there are issues loading model
            RuntimeError: Raises exception when there are issues loading ground truth
            RuntimeError: Raises exception when there are issues with ground truth feature
            RuntimeError: Raises exception when there are issues loading algorithm

        Returns:
            tuple[ bool,
            tuple[Union[IData, None], Union[ISerializer, None]],
            tuple[Union[IModel, None], Union[ISerializer, None]],
            tuple[Union[IData, None], Union[ISerializer, None]],
            tuple[Union[IAlgorithm, None], Union[ISerializer, None]],
            str, ]:
            If it is successful, it will return the data instance and serializer, model instance and serializer,
            ground truth instance and serializer, algorithm instance and serializer, with no error messages
            If it is not successful, it will return the error messages.
        """
        is_success = True
        data_serializer_instance = (None, None)
        model_serializer_instance = (None, None)
        ground_truth_serializer_instance = (None, None)
        algorithm_serializer_instance = (None, None)
        error_message = ""

        try:
            # Identify and load data information
            (
                is_load_data_success,
                data_serializer_instance,
                load_data_error_message,
            ) = self.load_data(self._task_argument.data)
            if not is_load_data_success:
                is_success = is_load_data_success
                raise RuntimeError(load_data_error_message)

            # Check that data instance type is not IMAGE.
            if (
                data_serializer_instance[0].get_data_plugin_type()
                is DataPluginType.IMAGE
            ):
                is_success = False
                raise RuntimeError(
                    "The image data is not supported in non-pipeline model"
                )

            # Identify and load model information
            (
                is_load_model_success,
                model_serializer_instance,
                load_model_error_message,
            ) = self.load_model(
                self._task_argument.mode,
                self._task_argument.model,
                self._task_argument.api_schema,
                self._task_argument.api_config,
            )
            if not is_load_model_success:
                is_success = is_load_model_success
                raise RuntimeError(load_model_error_message)

            # Check if ground_truth is optional
            # Identify and load ground truth information
            if (
                self._task_argument.algorithm_plugin_information.get_algorithm_require_ground_truth()
            ):
                (
                    is_load_ground_truth_success,
                    ground_truth_serializer_instance,
                    load_ground_truth_error_message,
                ) = self.load_ground_truth(self._task_argument.ground_truth_dataset)
                if not is_load_ground_truth_success:
                    is_success = is_load_ground_truth_success
                    raise RuntimeError(load_ground_truth_error_message)

                # Leave only the ground truth feature in ground_truth_instance and
                # Remove ground truth feature from the data instance
                is_ground_truth_instance_success = ground_truth_serializer_instance[
                    0
                ].keep_ground_truth(self._task_argument.ground_truth)
                data_serializer_instance[0].remove_ground_truth(
                    self._task_argument.ground_truth
                )
                if not is_ground_truth_instance_success:
                    is_success = is_ground_truth_instance_success
                    raise RuntimeError("Unable to get ground truth data")
            else:
                # Do not require Ground Truth
                ground_truth_serializer_instance = (None, None)

            # Identify and load algorithm information
            (
                is_load_algorithm_success,
                algorithm_serializer_instance,
                load_algorithm_error_message,
            ) = self.load_algorithm(
                self._task_argument.algorithm_plugin_information.id,
                self._task_argument.algorithm_plugin_information.algorithm_dict,
                data_serializer_instance,
                ground_truth_serializer_instance,
                self._task_argument.ground_truth,
                model_serializer_instance,
                self._task_argument.model_type,
                self._update_progress_method,
            )
            if not is_load_algorithm_success:
                is_success = is_load_algorithm_success
                raise RuntimeError(load_algorithm_error_message)

        except RuntimeError as error:
            error_message = str(error)

        finally:
            return (
                is_success,
                data_serializer_instance,
                model_serializer_instance,
                ground_truth_serializer_instance,
                algorithm_serializer_instance,
                error_message,
            )

    def _get_plugin_instance(
        self, plugin_type: PluginType, **kwargs
    ) -> Union[
        tuple[IData, ISerializer, str],
        tuple[IModel, ISerializer, str],
        tuple[IAlgorithm, None, str],
    ]:
        """
        A method to retrieve the instance of plugins that is identified

        Args:
            plugin_type (PluginType): The plugin type to be identified

        Returns:
            Union[tuple[IData, ISerializer, str], tuple[IModel, ISerializer, str], tuple[IAlgorithm, None, str]]:
            Returns an instance of the identified type, serializer instance, and error message.
        """
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

    def load_data(
        self, data_path: str
    ) -> tuple[bool, tuple[Union[IData, None], Union[ISerializer, None]], str]:
        """
        A method to identify and load data information

        Args:
            data_path (str): The path to the data

        Returns:
            tuple[bool, tuple[Union[IData, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the data and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        (
            data_instance,
            data_serializer_instance,
            error_messages,
        ) = self._get_plugin_instance(PluginType.DATA, **{"filename": data_path})
        # log the instance and deserializer
        if data_serializer_instance:
            print(
                f"Data Instance: {data_instance}, "
                f"Data Deserializer: {data_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            print(
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

    def load_pipeline(
        self, pipeline_path: str
    ) -> tuple[bool, tuple[Union[IPipeline, None], Union[ISerializer, None]], str]:
        """
        A method to load pipeline information

        Args:
            pipeline_path (str): The path to the pipeline

        Returns:
            tuple[bool, tuple[Union[IPipeline, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the pipeline and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        (
            pipeline_instance,
            pipeline_serializer_instance,
            error_messages,
        ) = self._get_plugin_instance(
            PluginType.PIPELINE,
            **{"pipeline_path": pipeline_path},
        )
        # log the instance and deserializer
        if pipeline_serializer_instance:
            print(
                f"Pipeline Instance: {pipeline_instance}, "
                f"Pipeline Deserializer: {pipeline_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            print(
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

    def load_model(
        self,
        model_mode: ModelModeType,
        model_path: str,
        api_schema: Union[dict, None],
        api_config: Union[dict, None],
    ) -> tuple[bool, tuple[Union[IModel, None], Union[ISerializer, None]], str]:
        """
        A method to load model information

        Args:
            model_mode (ModelModeType): The model mode
            model_path (str): The path to the model
            api_schema (Union[dict, None]): The api schema information (Not used)
            api_config (Union[dict, None]): The api config information (Not used)

        Returns:
            tuple[bool, tuple[Union[IModel, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the model and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        (
            model_instance,
            model_serializer_instance,
            error_messages,
        ) = self._get_plugin_instance(
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
            print(
                f"Model Instance: {model_instance}, "
                f"Model Deserializer: {model_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            print(
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

    def load_ground_truth(
        self, ground_truth_path: str
    ) -> tuple[bool, tuple[Union[IData, None], Union[ISerializer, None]], str]:
        """
        A method to load ground truth information

        Args:
            ground_truth_path (str): The path to the ground truth

        Returns:
            tuple[bool, tuple[Union[IData, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the ground truth and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        # Require Ground Truth
        (
            ground_truth_instance,
            ground_truth_serializer_instance,
            error_messages,
        ) = self._get_plugin_instance(
            PluginType.DATA,
            **{"filename": ground_truth_path},
        )
        # log the instance and deserializer
        if ground_truth_serializer_instance:
            print(
                f"GroundTruth Instance: {ground_truth_instance}, "
                f"GroundTruth Deserializer: {ground_truth_serializer_instance.get_serializer_plugin_type()}",
            )
        else:
            print(
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

    def load_algorithm(
        self,
        algorithm_id: str,
        algorithm_arguments: dict,
        data_serializer_instance: tuple[IData, ISerializer],
        ground_truth_serializer_instance: tuple[IData, ISerializer],
        ground_truth: str,
        model_serializer_instance: tuple[Union[IModel, IPipeline], ISerializer],
        model_type: ModelType,
        update_progress_cb: Callable,
        initial_data_instance: Union[IData, None] = None,
        initial_model_instance: Union[IModel, None] = None,
    ) -> tuple[bool, tuple[Union[IAlgorithm, None], Union[ISerializer, None]], str]:
        """
        A method to load algorithm information

        Args:
            algorithm_id (str): The algorithm id to retrieve
            algorithm_arguments (dict): The algorithm arguments for the algorithm
            data_serializer_instance (tuple[IData, ISerializer]): The tuple consisting of data instance and
            serializer instance
            ground_truth_serializer_instance (tuple[IData, ISerializer]): The tuple consisting of ground truth
            instance and serializer instance
            ground_truth (str): The string on which feature is the ground truth
            model_serializer_instance (tuple[Union[IModel, IPipeline], ISerializer]): The tuple consisting of model
            instance and serializer instance
            model_type (ModelType): The model type
            update_progress_cb (Callable): The callback function for the algorithm progress update
            initial_data_instance (Union[IData, None], optional): The data instance before the pipeline applies the
            transformation. Defaults to None.
            initial_model_instance (Union[IModel, None], optional): The model instance before the pipeline applies the
            transformation. Defaults to None.

        Returns:
            tuple[bool, tuple[Union[IAlgorithm, None], Union[ISerializer, None]], str]:
            Returns a boolean on whether the call is successful.
            If the call is successful, it will include the algorithm and serializer instance and no error messages
            If the call is unsuccessful, it will include error messages
        """
        # Get the algorithm instance and check if valid instance
        (
            algorithm_instance,
            algorithm_serializer_instance,
            error_messages,
        ) = self._get_plugin_instance(
            PluginType.ALGORITHM,
            **{
                "algorithm_id": algorithm_id,
                "algorithm_arguments": algorithm_arguments,
                "data_serializer_instance": data_serializer_instance,
                "ground_truth_serializer_instance": ground_truth_serializer_instance,
                "ground_truth": ground_truth,
                "model_serializer_instance": model_serializer_instance,
                "model_type": model_type,
                "logger": None,
                "progress_callback": update_progress_cb,
                "initial_data_instance": initial_data_instance,
                "initial_model_instance": initial_model_instance,
            },
        )
        if algorithm_instance:
            print(f"Algorithm Instance: {algorithm_instance}")
            return True, (algorithm_instance, algorithm_serializer_instance), ""
        else:
            # Algorithm Instance not available
            return (
                False,
                (algorithm_instance, algorithm_serializer_instance),
                f"Unable to get algorithm instance: {error_messages}",
            )

    def validate_task_results(self, test_result: dict) -> tuple[bool, str]:
        """
        A helper method to validate task results according to output schema

        Args:
            test_result (dict): A dictionary of results generated by the algorithm

        Returns:
            tuple[bool, str]: True if validated, False if validation failed and included the error message
        """
        is_success = True
        error_message = ""

        # Check that results type is dict
        if type(test_result) is not dict:
            # Raise error - wrong type
            is_success = False
            error_message = (
                f"The results contained an invalid type: {type(test_result).__name__}"
            )

        else:
            # Validate the json result with the relevant schema.
            # Check that it meets the required format before sending out to the UI for display
            if not validate_json(
                test_result,
                self._task_argument.algorithm_plugin_information.get_algorithm_output_schema(),
            ):
                is_success = False
                error_message = "The algorithm output schema validation failed"

        return is_success, error_message
