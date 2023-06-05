import copy
import json
import logging
import sys
from pathlib import Path
from typing import Dict, Tuple, Union

from partial_dependence_plot import Plugin
from test_engine_core.interfaces.idata import IData
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.ipipeline import IPipeline
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.model_type import ModelType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager
from test_engine_core.utils.json_utils import (
    load_schema_file,
    remove_numpy_formats,
    validate_json,
)
from test_engine_core.utils.time import time_class_method


# =====================================================================================
# NOTE: Do not modify this file unless you know what you are doing.
# =====================================================================================
class PluginTest:
    """
    The PluginTest class specifies methods in supporting testing for the plugin.
    """

    @staticmethod
    def progress_callback(completion_value: int):
        """
        A callback function to print the current progress completion

        Args:
            completion_value (int): Current progress completion
        """
        print(f"[PluginTest] Progress Update: {completion_value}")

    def __init__(
        self,
        run_as_pipeline: bool,
        core_modules_path: str,
        data_path: str,
        model_path: str,
        ground_truth_path: str,
        ground_truth: str,
        model_type: ModelType,
    ):
        # Other variables
        self._base_path: Path = Path().absolute()
        self._requires_ground_truth: bool = True
        self._run_as_pipeline: bool = run_as_pipeline

        # Store the input arguments as private vars
        if core_modules_path == "":
            core_modules_path = "../../core_modules"
        self._core_modules_path: str = core_modules_path
        self._data_path: str = str(self._base_path / data_path)
        self._model_path: str = str(self._base_path / model_path)
        self._input_arguments: Dict = {}
        self._model_type: ModelType = model_type

        if self._requires_ground_truth:
            self._ground_truth_path: str = str(self._base_path / ground_truth_path)
            self._ground_truth: str = ground_truth
        else:
            self._ground_truth_path: str = ""
            self._ground_truth: str = ""

        # Default for instances
        self._initial_data_instance: Union[None, IData] = None
        self._data_instance: Union[None, IData] = None
        self._data_serializer_instance: Union[None, ISerializer] = None

        self._initial_model_instance: Union[None, IModel, IPipeline] = None
        self._model_instance: Union[None, IModel, IPipeline] = None
        self._model_serializer_instance: Union[None, ISerializer] = None

        self._ground_truth_instance: Union[None, IData] = None
        self._ground_truth_serializer_instance: Union[None, ISerializer] = None

        self._logger_instance: Union[None, logging] = None

    @time_class_method
    def run(self) -> None:
        """
        A function to run the plugin test with the provided arguments.
        """
        try:
            print("=" * 20)
            print("START PLUGIN TEST")
            print("=" * 20)

            # Discover available core plugins
            PluginManager.discover(str(self._base_path / self._core_modules_path))
            print(f"[DETECTED_PLUGINS]: {PluginManager.get_printable_plugins()}")

            # Create logger
            self._logger_instance = logging.getLogger("PluginTestLogger")
            self._logger_instance.setLevel(logging.DEBUG)
            log_format = logging.Formatter(
                fmt="%(levelname)s %(asctime)s \t %(pathname)s %(funcName)s L%(lineno)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
            file_handler = logging.FileHandler(filename="test.log")
            file_handler.setFormatter(log_format)
            file_handler.setLevel(level=logging.DEBUG)
            self._logger_instance.addHandler(file_handler)

            if self._run_as_pipeline:
                # Identify and load data information
                (
                    self._data_instance,
                    self._data_serializer_instance,
                    data_error_message,
                ) = PluginManager.get_instance(
                    PluginType.DATA, **{"filename": self._data_path}
                )

                # Identify and load model information
                (
                    self._model_instance,
                    self._model_serializer_instance,
                    model_error_message,
                ) = PluginManager.get_instance(
                    PluginType.PIPELINE,
                    **{"pipeline_path": self._model_path},
                )

                # Perform a copy of the initial data and model information
                self._initial_data_instance = copy.deepcopy(self._data_instance)
                self._initial_model_instance = copy.deepcopy(self._model_instance)

                # Perform data transformation
                current_dataset = self._data_instance.get_data()
                current_pipeline = self._model_instance.get_pipeline()
                data_transformation_stages = current_pipeline[:-1]
                transformed_dataset = data_transformation_stages.transform(
                    current_dataset
                )
                transformed_pipeline = current_pipeline[-1]
                # Set new transformed pipeline and dataset
                self._data_instance.set_data(transformed_dataset)
                self._model_instance.set_pipeline(transformed_pipeline)

            else:
                # Get the data, model, and ground truth instance
                (
                    self._data_instance,
                    self._data_serializer_instance,
                    data_error_message,
                ) = PluginManager.get_instance(
                    PluginType.DATA, **{"filename": self._data_path}
                )
                (
                    self._model_instance,
                    self._model_serializer_instance,
                    model_error_message,
                ) = PluginManager.get_instance(
                    PluginType.MODEL, **{"filename": self._model_path}
                )

            # Print the instances we found from the paths and identified from the core plugins
            print(
                f"[DATA]: {self._data_instance} - {self._data_serializer_instance} ({data_error_message})"
            )
            print(
                f"[MODEL]: {self._model_instance} - {self._model_serializer_instance} ({model_error_message})"
            )
            print(f"Requires Ground Truth?: {self._requires_ground_truth}")

            if self._data_instance and self._model_instance:
                # Check if ground_truth is optional
                if self._requires_ground_truth:
                    # Get the ground truth instance
                    (
                        self._ground_truth_instance,
                        self._ground_truth_serializer_instance,
                        ground_truth_error_message,
                    ) = PluginManager.get_instance(
                        PluginType.DATA, **{"filename": self._ground_truth_path}
                    )

                    print(
                        f"[GROUND_TRUTH]: {self._ground_truth_instance}{self._ground_truth_serializer_instance}"
                    )
                    print(f"[GROUND_TRUTH]: {self._ground_truth}")
                    print(f"[MODEL_TYPE]: {self._model_type}")
                    print(f"[DATA FEATURES]: {self._data_instance.read_labels()}")
                    print(
                        f"[GROUND_TRUTH FEATURES]: {self._ground_truth_instance.read_labels()}"
                    )
                    print(self._ground_truth_instance.get_data())

                    print(
                        "Removing ground truth from data and keep only ground truth in ground truth data..."
                    )

                    # Leave only the ground truth feature in self._ground_truth_instance and
                    # Remove ground truth feature from the data instance
                    is_ground_truth_instance_success = (
                        self._ground_truth_instance.keep_ground_truth(
                            self._ground_truth
                        )
                    )
                    self._data_instance.remove_ground_truth(self._ground_truth)
                    if not is_ground_truth_instance_success:
                        raise RuntimeError(
                            "ERROR: Unable to retain only ground truth in ground truth instance. (Check "
                            "if "
                            "ground "
                            "truth feature exists in the data specified in ground truth path file.)"
                        )

                    print(f"[DATA FEATURES]: {self._data_instance.read_labels()}")
                    print(
                        f"[GROUND_TRUTH FEATURES]: {self._ground_truth_instance.read_labels()}"
                    )

                else:
                    # Do not require Ground Truth
                    self._ground_truth_instance = None

                # Add additional kwargs parameters
                print("Setting additional parameters...")
                self._input_arguments["ground_truth"] = self._ground_truth
                self._input_arguments["model_type"] = self._model_type
                self._input_arguments["logger"] = self._logger_instance
                self._input_arguments[
                    "progress_callback"
                ] = PluginTest.progress_callback
                self._input_arguments["project_base_path"] = self._base_path

                # Run the plugin with the arguments and instances
                print("Creating an instance of the Plugin...")
                plugin = Plugin(
                    (self._data_instance, self._data_serializer_instance),
                    (self._model_instance, self._model_serializer_instance),
                    (self._ground_truth_instance, self._ground_truth_instance),
                    self._initial_data_instance,
                    self._initial_model_instance,
                    **self._input_arguments,
                )

                # Generate the results using this plugin
                print("Generating the results with the plugin...")
                plugin.generate()

                # Get the task results and convert to json friendly and validate against the output schema
                print("Converting numpy formats if exists...")
                results = remove_numpy_formats(plugin.get_results())

                print("Verifying results with output schema...")
                is_success, error_messages = self._verify_task_results(results)
                if is_success:
                    # Print the output results
                    print(json.dumps(results))

                    # Exit successfully
                    sys.exit(0)
                else:
                    raise RuntimeError(error_messages)
            else:
                raise RuntimeError("ERROR: Unable to get data or model instances")

        except Exception as error:
            # Print the error
            print(f"Exception: {str(error)}")

            # Exit with error
            sys.exit(-1)

    def _verify_task_results(self, task_result: Dict) -> Tuple[bool, str]:
        """
        A helper method to validate the task results according to the output schema

        Args:
            task_result (Dict): A dictionary of results generated by the algorithm

        Returns:
            Tuple[bool, str]: True if validated, False if validation failed.
        """
        is_success = True
        error_message = ""

        # Check that results type is dict
        if type(task_result) is not dict:
            # Raise error - wrong type
            is_success = False
            error_message = f"Invalid type for results: {type(task_result).__name__}"

        else:
            # Validate the json result with the relevant schema.
            # Check that it meets the required format before sending out to the UI for display
            if not validate_json(
                task_result,
                load_schema_file(str(self._base_path / "output.schema.json")),
            ):
                is_success = False
                error_message = "Failed schema validation"

        return is_success, error_message
