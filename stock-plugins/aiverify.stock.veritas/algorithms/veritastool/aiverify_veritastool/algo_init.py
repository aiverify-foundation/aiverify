import importlib
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Union

from aiverify_veritastool.algo import Plugin
from aiverify_veritastool.util.aiverify import process_dict, generate_veritas_images
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
    validate_json,
    remove_numpy_formats,
    validate_test_result_schema,
)


class AlgoInit:
    """
    AlgoInit class for initializing and running Veritas toolkit.
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
        # Core parameters
        self._supported_algorithm_model_type: List = [
            ModelType.CLASSIFICATION,
            ModelType.REGRESSION,
            ModelType.UPLIFT,
        ]
        self._base_path: Path = Path().absolute()
        self._requires_ground_truth: bool = True
        self._run_as_pipeline: bool = run_as_pipeline
        self._start_time = None
        self._time_taken = None

        # Input paths and arguments
        if core_modules_path == "":
            core_modules_path = Path(importlib.util.find_spec("aiverify_test_engine").origin).parent
        self._core_modules_path = core_modules_path
        self._data_path = str(data_path)
        self._model_path = str(model_path)
        self._training_data_path = input_arguments.get("training_data_path", None)
        self._training_ground_truth_path = input_arguments.get("training_ground_truth_path", None)
        self._input_arguments = input_arguments
        self._model_type = model_type
        if self._model_type not in self._supported_algorithm_model_type:
            raise RuntimeError("The algorithm has failed validation for model type")

        # Ground truth handling
        if self._requires_ground_truth:
            self._ground_truth_path = str(ground_truth_path)
            self._ground_truth = ground_truth
            self._training_ground_truth = input_arguments.get("training_ground_truth", None)
        else:
            self._ground_truth_path = ""
            self._ground_truth = ""

        # Default for instances
        self._data_instance: Union[None, IData] = None
        self._data_serializer_instance: Union[None, ISerializer] = None
        self._model_instance: Union[None, IModel, IPipeline] = None
        self._model_serializer_instance: Union[None, ISerializer] = None
        self._training_data_instance: Union[None, IData] = None
        self._training_data_serializer_instance: Union[None, ISerializer] = None
        self._ground_truth_instance: Union[None, IData] = None
        self._ground_truth_serializer_instance: Union[None, ISerializer] = None
        self._training_ground_truth_instance: Union[None, IData] = None
        self._training_ground_truth_serializer_instance: Union[None, ISerializer] = None
        self._results = None
        self._logger_instance: Union[None, logging] = None
        self._initial_data_instance = None
        self._initial_model_instance = None

    def _load_data_and_model(self) -> None:
        """Load data and model instances"""
        try:
            (
                self._data_instance,
                self._data_serializer_instance,
                data_error_message,
            ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._data_path})

            if self._training_data_path:
                (
                    self._training_data_instance,
                    self._training_data_serializer_instance,
                    training_data_error_message,
                ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._training_data_path})

            if self._run_as_pipeline:
                (
                    self._model_instance,
                    self._model_serializer_instance,
                    model_error_message,
                ) = PluginManager.get_instance(
                    PluginType.PIPELINE,
                    **{"pipeline_path": self._model_path},
                )
            else:
                (
                    self._model_instance,
                    self._model_serializer_instance,
                    model_error_message,
                ) = PluginManager.get_instance(PluginType.MODEL, **{"filename": self._model_path})

            # Print the instances we found from the paths and identified from the core plugins
            print(f"[DATA]: {self._data_instance} - {self._data_serializer_instance} ({data_error_message})")
            print(f"[MODEL]: {self._model_instance} - {self._model_serializer_instance} ({model_error_message})")

            if self._data_instance and self._model_instance:
                # Load ground truth if required
                if self._requires_ground_truth:
                    # Get the ground truth instance
                    (
                        self._ground_truth_instance,
                        self._ground_truth_serializer_instance,
                        _ground_truth_error_message,
                    ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._ground_truth_path})

                    if self._training_ground_truth_path:
                        print("Loading training ground truth...")
                        (
                            self._training_ground_truth_instance,
                            self._training_ground_truth_serializer_instance,
                            _training_ground_truth_error_message,
                        ) = PluginManager.get_instance(
                            PluginType.DATA,
                            **{"filename": self._training_ground_truth_path},
                        )

                    print(f"[GROUND_TRUTH]: {self._ground_truth_instance}{self._ground_truth_serializer_instance}")
                    print(f"[GROUND_TRUTH]: {self._ground_truth}")
                    print(f"[MODEL_TYPE]: {self._model_type}")
                    print(f"[GROUND_TRUTH FEATURES]: {self._ground_truth_instance.read_labels()}")

                    print("Removing ground truth from data and keep only ground truth in ground truth data...")

                    if not self._ground_truth_instance.keep_ground_truth(self._ground_truth):
                        raise RuntimeError(
                            "ERROR: Unable to retain only ground truth in ground truth instance. (Check "
                            "if ground truth feature exists in the data specified in ground truth path file.)"
                        )
                    self._data_instance.remove_ground_truth(self._ground_truth)

                    print(f"[GROUND_TRUTH FEATURES AFTER PROCESSING]: {self._ground_truth_instance.read_labels()}")
                else:
                    # Do not require Ground Truth
                    self._ground_truth_instance = None

        except Exception as e:
            if self._logger_instance:
                self._logger_instance.error(f"Error loading data and model: {str(e)}")
            print(f"Error loading data and model: {str(e)}")
            sys.exit(-1)

    def run(self) -> None:
        """Run the complete Veritas fairness assessment using the Plugin"""
        try:
            print("=" * 20)
            print("START VERITAS ASSESSMENT")
            print("=" * 20)

            # Discover plugins
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

            # Load data and model
            self._load_data_and_model()

            # Add additional kwargs parameters for the Plugin
            print("Setting additional parameters...")
            self._input_arguments["ground_truth"] = self._ground_truth
            self._input_arguments["model_type"] = self._model_type
            self._input_arguments["logger"] = self._logger_instance
            self._input_arguments["progress_callback"] = AlgoInit.progress_callback
            self._input_arguments["project_base_path"] = self._base_path

            # Convert protected_features from dictionary keys to array if provided as dict and cast values to int
            if "privileged_groups" in self._input_arguments and self._input_arguments["privileged_groups"]:
                for key, value in self._input_arguments["privileged_groups"].items():
                    if isinstance(value, list):
                        self._input_arguments["privileged_groups"][key] = [int(v) for v in value]
                    else:
                        self._input_arguments["privileged_groups"][key] = int(value)

                if self._input_arguments.get("protected_features") is None:
                    self._input_arguments["protected_features"] = list(
                        self._input_arguments["privileged_groups"].keys()
                    )
                    print(f"Auto-detected protected features: {self._input_arguments['protected_features']}")

            if "unprivileged_groups" in self._input_arguments and self._input_arguments["unprivileged_groups"]:
                for key, value in self._input_arguments["unprivileged_groups"].items():
                    if isinstance(value, list):
                        self._input_arguments["unprivileged_groups"][key] = [int(v) for v in value]
                    else:
                        self._input_arguments["unprivileged_groups"][key] = int(value)

            # Add training data instances to the arguments
            if self._training_data_instance:
                self._input_arguments["training_data_instance"] = self._training_data_instance
            if self._training_ground_truth_instance:
                self._input_arguments["training_ground_truth_instance"] = self._training_ground_truth_instance
                self._input_arguments["training_ground_truth"] = self._training_ground_truth

            # Run the plugin with the arguments and instances
            print("Creating an instance of the Plugin...")
            self._start_time = time.time()
            plugin = Plugin(
                (self._data_instance, self._data_serializer_instance),
                (self._model_instance, self._model_serializer_instance),
                (self._ground_truth_instance, self._ground_truth_serializer_instance),
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

            # Verify results with output schema
            print("Verifying results with output schema...")
            is_success, error_messages = self._verify_task_results(results)
            self._time_taken = time.time() - self._start_time

            if is_success:
                # Process the results for visualization
                output_folder = Path.cwd() / "output"
                output_folder.mkdir(parents=True, exist_ok=True)
                output_path = output_folder / "results.json"

                # Process results for visualization
                processed_results = process_dict(results, output_folder)

                # Generate output file with visualization
                self._generate_output_file(processed_results, output_path)
                print(f"Results saved to: {output_path}")
            else:
                raise RuntimeError(error_messages)
        except Exception as e:
            print(f"Error running the algorithm: {str(e)}")
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
            output_schema = load_schema_file(str(Path(__file__).parent / "output.schema.json"))
            if not validate_json(task_result, output_schema):
                is_success = False
                error_message = "Failed schema validation"

        return is_success, error_message

    def _generate_output_file(self, results: Dict, output_path: Path) -> None:
        """
        Generate the final output file including visualization images

        Args:
            results (Dict): The processed results to save
            output_path (Path): The path to save the output file
        """
        try:
            with open(str(Path(__file__).parent / "algo.meta.json")) as f:
                meta_file = json.load(f)

            # Create test arguments object
            test_arguments = ITestArguments(
                groundTruth=self._ground_truth,
                modelType=self._model_type.name,
                testDataset=self._data_path,
                modelFile=self._model_path,
                groundTruthDataset=self._ground_truth_path,
                algorithmArgs={
                    "run_pipeline": self._run_as_pipeline,
                    "protected_features": self._input_arguments.get("protected_features"),
                    "privileged_groups": self._input_arguments.get("privileged_groups"),
                    "unprivileged_groups": self._input_arguments.get("unprivileged_groups"),
                    "probability_threshold": self._input_arguments.get("probability_threshold", 0.5),
                    "positive_label": self._input_arguments.get("positive_label"),
                    "negative_label": self._input_arguments.get("negative_label"),
                    "fair_threshold": self._input_arguments.get("fair_threshold", 80),
                    "fair_metric": self._input_arguments.get("fair_metric", "auto"),
                    "fair_concern": self._input_arguments.get("fair_concern", "eligible"),
                    "performance_metric": self._input_arguments.get("performance_metric", "balanced_acc"),
                    "transparency_rows": self._input_arguments.get("transparency_rows"),
                    "transparency_max_samples": self._input_arguments.get("transparency_max_samples"),
                    "transparency_features": self._input_arguments.get("transparency_features"),
                    "use_case": self._input_arguments.get("use_case", "base_classification"),
                },
                mode="upload",
            )

            # Create output directory
            output_dir = output_path.parent
            output_dir.mkdir(parents=True, exist_ok=True)

            # Generate visualization images
            visualization_images, report_plots_structure = generate_veritas_images(results, output_dir)

            # Extract artifacts if present
            artifacts = results.pop("artifacts", []) if "artifacts" in results else []
            artifacts.extend(visualization_images)

            # Add report_plots structure to the output results
            for section, data in report_plots_structure.items():
                if section in results:
                    if results[section] is None:
                        results[section] = data
                    else:
                        results[section].update(data)
                else:
                    results[section] = data

            # Create test result object
            output = ITestResult(
                gid=meta_file["gid"],
                cid=meta_file["cid"],
                version=meta_file.get("version"),
                startTime=datetime.fromtimestamp(self._start_time),
                timeTaken=round(self._time_taken, 4),
                testArguments=test_arguments,
                output=results,
                artifacts=artifacts,
            )

            # Convert to JSON and validate
            output_json = output.model_dump_json(exclude_none=True, indent=4)
            if validate_test_result_schema(json.loads(output_json)) is True:
                with open(output_path, "w") as f:
                    f.write(output_json)
                print(f"Output file successfully written to {output_path}")
            else:
                raise RuntimeError("Failed test result schema validation")

        except Exception as e:
            print(f"Error generating output file: {str(e)}")
            if self._logger_instance:
                self._logger_instance.error(f"Error generating output file: {str(e)}")
            sys.exit(-1)
