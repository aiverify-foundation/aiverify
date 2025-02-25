import copy
import importlib
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, Union

from aiverify_fairness_metrics_toolbox_for_classification.algo import Plugin
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.interfaces.itestresult import ITestArguments, ITestResult
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from aiverify_test_engine.utils.json_utils import (
    load_schema_file,
    remove_numpy_formats,
    validate_json,
    validate_test_result_schema,
)
from aiverify_test_engine.utils.time import time_class_method
from aiverify_test_engine.utils.url_utils import get_absolute_path


# =====================================================================================
# NOTE: Do not modify this file unless you know what you are doing.
# =====================================================================================
class AlgoInit:
    """
    The AlgoInit class specifies methods in supporting testing for the plugin.
    """

    @staticmethod
    def progress_callback(completion_value: int):
        """
        A callback function to print the current progress completion

        Args:
            completion_value (int): Current progress completion
        """
        print(f"[AlgoInit] Progress Update: {completion_value}")

    def __init__(
        self,
        run_as_pipeline: bool,
        core_modules_path: str,
        data_path: str,
        model_path: str,
        ground_truth_path: str,
        ground_truth: str,
        model_type: ModelType,
        input_arguments: dict,
    ):
        # Other variables
        self._base_path: Path = Path().absolute()
        self._requires_ground_truth: bool = True
        self._run_as_pipeline: bool = run_as_pipeline
        self._start_time = None
        self._time_taken = None

        # Store the input arguments as private vars
        if core_modules_path == "":
            core_modules_path = Path(importlib.util.find_spec("aiverify_test_engine").origin).parent
        self._core_modules_path: str = core_modules_path
        self._data_path: str = str(data_path)
        self._model_path: str = str(model_path)
        self._input_arguments: Dict = input_arguments
        self._model_type: ModelType = model_type

        if self._requires_ground_truth:
            self._ground_truth_path: str = str(ground_truth_path)
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
            PluginManager.discover(str(self._core_modules_path))
            print(f"[DETECTED_PLUGINS]: {PluginManager.get_printable_plugins()}")

            # Create logger
            self._logger_instance = logging.getLogger("AlgoInitLogger")
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
                ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._data_path})

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
                transformed_dataset = data_transformation_stages.transform(current_dataset)
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
                ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._data_path})
                (
                    self._model_instance,
                    self._model_serializer_instance,
                    model_error_message,
                ) = PluginManager.get_instance(PluginType.MODEL, **{"filename": self._model_path})

            # Print the instances we found from the paths and identified from the core plugins
            print(f"[DATA]: {self._data_instance} - {self._data_serializer_instance} ({data_error_message})")
            print(f"[MODEL]: {self._model_instance} - {self._model_serializer_instance} ({model_error_message})")
            print(f"Requires Ground Truth?: {self._requires_ground_truth}")

            if self._data_instance and self._model_instance:
                # Check if ground_truth is optional
                if self._requires_ground_truth:
                    # Get the ground truth instance
                    (
                        self._ground_truth_instance,
                        self._ground_truth_serializer_instance,
                        _ground_truth_error_message,
                    ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._ground_truth_path})

                    print(f"[GROUND_TRUTH]: {self._ground_truth_instance}{self._ground_truth_serializer_instance}")
                    print(f"[GROUND_TRUTH]: {self._ground_truth}")
                    print(f"[MODEL_TYPE]: {self._model_type}")
                    print(f"[GROUND_TRUTH FEATURES]: {self._ground_truth_instance.read_labels()}")

                    print("Removing ground truth from data and keep only ground truth in ground truth data...")

                    # Leave only the ground truth feature in self._ground_truth_instance and
                    # Remove ground truth feature from the data instance
                    is_ground_truth_instance_success = self._ground_truth_instance.keep_ground_truth(self._ground_truth)
                    self._data_instance.remove_ground_truth(self._ground_truth)
                    if not is_ground_truth_instance_success:
                        raise RuntimeError(
                            "ERROR: Unable to retain only ground truth in ground truth instance. (Check "
                            "if "
                            "ground "
                            "truth feature exists in the data specified in ground truth path file.)"
                        )

                    print(f"[GROUND_TRUTH FEATURES]: {self._ground_truth_instance.read_labels()}")

                else:
                    # Do not require Ground Truth
                    self._ground_truth_instance = None

                # Add additional kwargs parameters
                print("Setting additional parameters...")
                self._input_arguments["ground_truth"] = self._ground_truth
                self._input_arguments["model_type"] = self._model_type
                self._input_arguments["logger"] = self._logger_instance
                self._input_arguments["progress_callback"] = AlgoInit.progress_callback
                self._input_arguments["project_base_path"] = self._base_path

                self._start_time = time.time()
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
                self._time_taken = time.time() - self._start_time

                if is_success:
                    output_folder = Path.cwd() / "output"
                    output_folder.mkdir(parents=True, exist_ok=True)

                    json_file_path = output_folder / "results.json"
                    self._generate_output_file(results, json_file_path)
                    print("*" * 20)
                    print(f"check the results here : {json_file_path}")
                    print("*" * 20)
                else:
                    raise RuntimeError(error_messages)
            else:
                raise RuntimeError("ERROR: Unable to get data or model instances")

        except Exception as error:
            # Print the error
            print(f"Exception: {str(error)}")

            # Exit with error
            sys.exit(-1)

    def _generate_output_file(self, results, output_path: Path) -> None:
        """
        Format the output results into the AI Verify Test Result and write to a JSON file
        """
        f = open(str(Path(__file__).parent / "algo.meta.json"))
        meta_file = json.load(f)
        annotated_labels_path = get_absolute_path(self._input_arguments["annotated_labels_path"])

        # Prepare test arguments
        test_arguments = ITestArguments(
            groundTruth=self._ground_truth,
            modelType=self._model_type.name,
            testDataset=self._data_path,
            modelFile=self._model_path,
            groundTruthDataset=self._ground_truth_path,
            algorithmArgs={
                "run_pipeline": self._run_as_pipeline,
                "sensitive_feature": self._input_arguments["sensitive_feature"],
                "annotated_labels_path": annotated_labels_path,
                "file_name_label": self._input_arguments["file_name_label"],
            },
            mode="upload",
        )

        # Create the output result
        output = ITestResult(
            gid=meta_file["gid"],
            cid=meta_file["cid"],
            version=meta_file.get("version"),
            startTime=datetime.fromtimestamp(self._start_time),
            timeTaken=round(self._time_taken, 4),
            testArguments=test_arguments,
            output=results,
        )

        output_json = output.model_dump_json(exclude_none=True, indent=4)
        if validate_test_result_schema(json.loads(output_json)) is True:
            with open(output_path, "w") as json_file:
                json_file.write(output_json)
        else:
            raise RuntimeError("Failed test result schema validation")

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
                load_schema_file(str(Path(__file__).parent / "output.schema.json")),
            ):
                is_success = False
                error_message = "Failed schema validation"

        return is_success, error_message
