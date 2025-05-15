import importlib
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

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

from aiverify_general_corruptions.algo import Plugin


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
        run_as_pipeline: bool,  # This is not used in this plugin, but is required to match the algo_execute signature
        core_modules_path: Optional[str],
        data_path: str,
        model_path: str,
        ground_truth_path: Optional[str],
        ground_truth: Optional[str],
        model_type: ModelType,
        file_name_label: Optional[str] = None,
        set_seed: Optional[int] = None,
        **user_defined_params: dict,
    ):
        # Store the input arguments as private vars
        self._data_path = data_path
        self._model_path = model_path
        self._model_type = model_type
        self._ground_truth_path = ground_truth_path
        self._ground_truth_label = ground_truth
        self._file_name_label = file_name_label
        self._set_seed = set_seed
        self._core_modules_path = core_modules_path or str(Path(importlib.util.find_spec("aiverify_test_engine").origin).parent)  # fmt: skip
        self._user_defined_params = user_defined_params

        # Other variables
        self._requires_ground_truth = model_type in (ModelType.CLASSIFICATION,)

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
            PluginManager.discover(self._core_modules_path)
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

            # Identify and load data
            (
                self._data_instance,
                self._data_serializer_instance,
                data_error_message,
            ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._data_path})

            # Identify and load model
            (
                self._model_instance,
                self._model_serializer_instance,
                model_error_message,
            ) = PluginManager.get_instance(PluginType.PIPELINE, **{"pipeline_path": self._model_path})

            # Print the instances we found from the paths and identified from the core plugins
            print(f"[DATA]: {self._data_instance} - {self._data_serializer_instance} ({data_error_message})")
            print(f"[MODEL]: {self._model_instance} - {self._model_serializer_instance} ({model_error_message})")
            print(f"[MODEL_TYPE]: {self._model_type}")

            if data_error_message or model_error_message:
                raise RuntimeError("ERROR: Unable to get data or model instances")

            print(f"[REQUIRES_GROUND_TRUTH]: {self._requires_ground_truth}")
            if self._requires_ground_truth:
                if self._ground_truth_label is None:
                    raise RuntimeError("ERROR: Ground truth label is required")
                if self._file_name_label is None:
                    raise RuntimeError("ERROR: File name label is required")

                (
                    self._ground_truth_instance,
                    self._ground_truth_serializer_instance,
                    ground_truth_error_message,
                ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._ground_truth_path})

                print(
                    f"[GROUND_TRUTH]: {self._ground_truth_instance} - {self._ground_truth_serializer_instance} ({ground_truth_error_message})"
                )

                if ground_truth_error_message:
                    raise RuntimeError("ERROR: Unable to get ground truth instance")
                if self._ground_truth_label not in self._ground_truth_instance.read_labels():
                    raise RuntimeError(
                        f"ERROR: Ground truth label '{self._ground_truth_label}' not found in ground truth data."
                    )

                print(f"[GROUND_TRUTH_LABEL]: {self._ground_truth_label}")
                print(self._ground_truth_instance.get_data())

                print("Removing ground truth label from test data...")
                self._data_instance.remove_ground_truth(self._ground_truth_label)
                print(self._data_instance.get_data())

            else:
                self._ground_truth_instance = self._ground_truth_serializer_instance = None

            # Run the plugin with the arguments and instances
            print("Creating an instance of the Plugin...")
            self._start_time = time.time()
            plugin = Plugin(
                data_instance_and_serializer=(
                    self._data_instance,
                    self._data_serializer_instance,
                ),
                model_instance_and_serializer=(
                    self._model_instance,
                    self._model_serializer_instance,
                ),
                ground_truth_instance_and_serializer=(
                    self._ground_truth_instance,
                    self._ground_truth_serializer_instance,
                ),
                initial_data_instance=None,
                initial_model_instance=None,
                model_type=self._model_type,
                requires_ground_truth=self._requires_ground_truth,
                logger=self._logger_instance,
                progress_callback=AlgoInit.progress_callback,
                ground_truth=self._ground_truth_label,
                file_name_label=self._file_name_label,
                set_seed=self._set_seed,
                **self._user_defined_params,
            )

            # Generate the results using this plugin
            print("Generating the results with the plugin...")
            plugin.generate()

            # Get the task results and convert to json friendly and validate against the output schema
            print("Converting numpy formats if exists...")
            results = remove_numpy_formats(plugin.get_results())

            # Verify the results with the output schema
            print("Verifying results with output schema...")
            is_success, error_messages = self._verify_task_results(results)
            self._time_taken = time.time() - self._start_time

            if is_success:
                # Save the output results
                output_folder = Path.cwd() / "output"
                output_folder.mkdir(parents=True, exist_ok=True)

                json_file_path = output_folder / "results.json"
                self._generate_output_file(results, json_file_path)
                print("*" * 20)
                print(f"check the results here : {json_file_path}")
                print("*" * 20)
            else:
                raise RuntimeError(error_messages)

        except Exception as error:
            # Print the error
            print(f"Exception: {str(error)}")

            # Exit with error
            sys.exit(-1)

    def _generate_output_file(self, results, output_path: Path) -> None:
        """
        Format the output results into the AI Verify Test Result and write to a JSON file
        """
        with open(str(Path(__file__).parent / "algo.meta.json")) as f:
            meta_file = json.load(f)

        # Prepare test arguments
        test_arguments = ITestArguments(
            testDataset=self._data_path,
            mode="upload",
            modelType=self._model_type.name,
            groundTruthDataset=self._ground_truth_path,
            groundTruth=self._ground_truth_label,
            algorithmArgs={
                "ground_truth_path": self._ground_truth_path,
                "file_name_label": self._file_name_label,
                "set_seed": self._set_seed,
                "corruptions": self._user_defined_params["corruptions"],
            },
            modelFile=self._model_path,
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
            artifacts=self._populate_all_image_urls(results),
        )

        output_json = output.model_dump_json(exclude_none=True, indent=4)
        if validate_test_result_schema(json.loads(output_json)) is True:
            with open(output_path, "w") as json_file:
                json_file.write(output_json)
        else:
            raise RuntimeError("Failed test result schema validation")

    def _populate_all_image_urls(self, data):
        image_urls = []

        for result in data["results"]:
            for info in result.get("display_info", {}).values():
                for item in info:
                    if str(item).endswith((".png", ".jpg", ".jpeg")):
                        image_urls.append(item)

        return image_urls

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
        if not isinstance(task_result, dict):
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
