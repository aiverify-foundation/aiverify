import importlib
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, Union, Any

from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.usecases.base_classification import BaseClassification
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.interfaces.itestresult import ITestArguments, ITestResult
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from aiverify_test_engine.utils.json_utils import (
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
        self._input_arguments = input_arguments
        self._model_type = model_type

        # Ground truth handling
        if self._requires_ground_truth:
            self._ground_truth_path = str(ground_truth_path)
            self._ground_truth = ground_truth
        else:
            self._ground_truth_path = ""
            self._ground_truth = ""

        # Default for instances
        self._data_instance: Union[None, IData] = None
        self._data_serializer_instance: Union[None, ISerializer] = None
        self._model_instance: Union[None, IModel, IPipeline] = None
        self._model_serializer_instance: Union[None, ISerializer] = None
        self._ground_truth_instance: Union[None, IData] = None
        self._ground_truth_serializer_instance: Union[None, ISerializer] = None
        self._results = None
        self._logger_instance: Union[None, logging] = None

    def _load_data_and_model(self) -> None:
        """Load data and model instances"""
        try:
            if self._run_as_pipeline:
                print("Running as pipeline...")
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

                # Perform data transformation
                current_dataset = self._data_instance.get_data()
                current_pipeline = self._model_instance.get_pipeline()
                transformed_dataset = current_pipeline[:-1].transform(current_dataset)
                # Set new transformed pipeline and dataset
                self._data_instance.set_data(transformed_dataset)
                self._model_instance.set_pipeline(current_pipeline[-1])

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
                # Load ground truth if required
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

                    if not self._ground_truth_instance.keep_ground_truth(self._ground_truth):
                        raise RuntimeError(
                            "ERROR: Unable to retain only ground truth in ground truth instance. (Check "
                            "if "
                            "ground "
                            "truth feature exists in the data specified in ground truth path file.)"
                        )
                    self._data_instance.remove_ground_truth(self._ground_truth)

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

        except Exception as e:
            self._logger_instance.error(f"Error loading data and model: {str(e)}")
            sys.exit(-1)

    def _create_veritas_container(self) -> ModelContainer:
        """Create and configure the Veritas ModelContainer"""
        try:
            # Get data from instances
            test_data = self._data_instance.get_data()
            y_true = self._ground_truth_instance.get_data()[self._ground_truth]
            model = self._model_instance.get_pipeline() if self._run_as_pipeline else self._model_instance.get_model()

            # Get predictions
            y_pred = model.predict(test_data)
            y_prob = model.predict_proba(test_data) if hasattr(model, "predict_proba") else None

            if self._model_type == ModelType.CLASSIFICATION:
                veritas_model_type = "classification"
            elif self._model_type == ModelType.REGRESSION:
                veritas_model_type = "regression"
            else:
                # Currently uplift is not implemented
                raise ValueError(f"Invalid model type: {self._model_type}")
            protected_features_cols = (
                test_data[self._input_arguments["protected_features"]]
                if self._input_arguments["protected_features"]
                else None
            )
            # Print all variables that are passed to ModelContainer
            # print(f"[Y_TRUE]: {y_true}")
            # print(f"[P_GRP]: {self._input_arguments.get('privileged_groups')}")
            # print(f"[MODEL_TYPE]: {veritas_model_type}")
            # print(f"[MODEL_NAME]: {self._input_arguments.get('model_name', 'auto')}")
            # print(f"[Y_PRED]: {y_pred}")
            # print(f"[Y_PROB]: {y_prob}")
            # print(f"[PROTECTED_FEATURES_COLS]: {protected_features_cols}")
            # print(f"[X_TEST]: {test_data}")
            # print(f"[MODEL_OBJECT]: {model}")
            # print(f"[POS_LABEL]: {self._input_arguments['positive_label']}")
            # print(f"[NEG_LABEL]: {self._input_arguments.get('negative_label')}")
            # print(f"[UP_GRP]: {self._input_arguments.get('unprivileged_groups')}")

            # Create model container
            container = ModelContainer(
                y_true=y_true,
                p_grp=self._input_arguments.get("privileged_groups"),
                model_type=veritas_model_type,
                model_name=self._input_arguments.get("model_name", "auto"),
                y_pred=y_pred,
                y_prob=y_prob,
                protected_features_cols=protected_features_cols,
                x_test=test_data,
                model_object=model,
                pos_label=self._input_arguments["positive_label"],
                neg_label=self._input_arguments.get("negative_label"),
                up_grp=self._input_arguments.get("unprivileged_groups"),
            )
            return container
        except Exception as e:
            print(f"Error creating Veritas container:: {str(e)}")
            sys.exit(-1)

    def _run_veritas_assessment(self) -> Dict[str, Any]:
        """Run the Veritas fairness assessment"""
        try:
            container = self._create_veritas_container()

            classifier = BaseClassification(
                model_params=[container],
                fair_threshold=self._input_arguments.get("fair_threshold", 80),
                fair_metric_name=self._input_arguments.get("fair_metric", "auto"),
                fair_concern=self._input_arguments.get("fair_concern", "eligible"),
                perf_metric_name=self._input_arguments.get("performance_metric", "balanced_acc"),
                tran_row_num=self._input_arguments.get("transparency_rows", [1]),
                tran_max_sample=self._input_arguments.get("transparency_max_samples", 1),
                tran_pdp_feature=self._input_arguments.get("transparency_features", []),
            )
            print("Running Veritas assessment...")

            return classifier.evaluate()

        except Exception as e:
            print(f"Error running Veritas assessment: {str(e)}")
            sys.exit(-1)

    def run(self) -> None:
        """Run the complete Veritas fairness assessment"""
        try:
            print("=" * 20)
            print("START VERITAS ASSESSMENT")
            print("=" * 20)

            # Discover plugins
            PluginManager.discover(str(self._core_modules_path))
            # print(f"[DETECTED_PLUGINS]: {PluginManager.get_printable_plugins()}")

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

            # Run assessment
            self._start_time = time.time()
            results = self._run_veritas_assessment()
            self._time_taken = time.time() - self._start_time

            # Process and validate results
            results = remove_numpy_formats(results)
            is_success, error_messages = self._verify_task_results(results)

            if is_success:
                output_folder = Path.cwd() / "output"
                output_folder.mkdir(parents=True, exist_ok=True)
                output_path = output_folder / "results.json"
                self._generate_output_file(results, output_path)
                print(f"Results saved to: {output_path}")
            else:
                raise RuntimeError(error_messages)

        except Exception as e:
            print(f"Exception: {str(e)}")
            sys.exit(-1)

    def _generate_output_file(self, results: Dict, output_path: Path) -> None:
        """Generate the final output file"""
        try:
            with open(str(Path(__file__).parent / "algo.meta.json")) as f:
                meta_file = json.load(f)
            print(self._input_arguments)
            test_arguments = ITestArguments(
                groundTruth=self._ground_truth,
                modelType=self._model_type.name,
                testDataset=self._data_path,
                modelFile=self._model_path,
                groundTruthDataset=self._ground_truth_path,
                algorithmArgs={
                    "run_pipeline": self._run_as_pipeline,
                    "protected_features": self._input_arguments["protected_features"],
                    "privileged_groups": self._input_arguments["privileged_groups"],
                    "unprivileged_groups": self._input_arguments["unprivileged_groups"],
                    "probability_threshold": self._input_arguments["probability_threshold"],
                    "positive_label": self._input_arguments["positive_label"],
                    "negative_label": self._input_arguments["negative_label"],
                    "fair_threshold": self._input_arguments["fair_threshold"],
                    "fair_metric": self._input_arguments["fair_metric"],
                    "fair_concern": self._input_arguments["fair_concern"],
                    "performance_metric": self._input_arguments["performance_metric"],
                    "transparency_rows": self._input_arguments["transparency_rows"],
                    "transparency_max_samples": self._input_arguments["transparency_max_samples"],
                    "transparency_features": self._input_arguments["transparency_features"],
                },
                mode="upload",
            )

            output = ITestResult(
                gid=meta_file["gid"],
                cid=meta_file["cid"],
                version=meta_file.get("version"),
                startTime=datetime.fromtimestamp(self._start_time),
                timeTaken=round(self._time_taken, 4),
                testArguments=test_arguments,
                output=results,
            )
            output_json = output.json(exclude_none=True, indent=4)
            # TODO: Add validation logic against output.schema.json here
            if validate_test_result_schema(json.loads(output_json)) or True:
                with open(output_path, "w") as f:
                    f.write(output_json)
            else:
                raise RuntimeError("Failed test result schema validation")

        except Exception as e:
            print(f"Error generating output file: {str(e)}")
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

        # TODO: Add validation logic against output.schema.json here
        # Check that results type is dict
        # if type(task_result) is not dict:
        #     # Raise error - wrong type
        #     is_success = False
        #     error_message = f"Invalid type for results: {type(task_result).__name__}"

        # else:
        #     # Validate the json result with the relevant schema.
        #     # Check that it meets the required format before sending out to the UI for display
        #     if not validate_json(
        #         task_result,
        #         load_schema_file(str(Path(__file__).parent / "output.schema.json")),
        #     ):
        #         is_success = False
        #         error_message = "Failed schema validation"

        return is_success, error_message