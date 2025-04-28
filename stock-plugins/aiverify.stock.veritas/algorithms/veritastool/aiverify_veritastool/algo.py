import logging
from pathlib import Path, PurePath
from typing import Dict, List, Tuple, Union

from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.utils.json_utils import load_schema_file, validate_json
from aiverify_test_engine.utils.simple_progress import SimpleProgress

from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.usecases import (
    BaseClassification,
    BaseRegression,
    CreditScoring,
    CustomerMarketing,
    PredictiveUnderwriting,
)


class Plugin(IAlgorithm):
    """
    The Plugin(Veritas) class specifies methods for fairness assessment using the Veritas toolkit
    """

    # Plugin information
    _name: str = "Veritas Fairness Assessment"
    _description: str = "Veritas Diagnosis tool for fairness & transparency assessment"
    _version: str = "0.1.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.ALGORITHM
    _requires_ground_truth: bool = True
    _supported_algorithm_model_type: List = [
        ModelType.CLASSIFICATION,
        ModelType.REGRESSION,
        ModelType.UPLIFT,
    ]

    # Use case mapping
    _use_case_map = {
        "base_classification": BaseClassification,
        "base_regression": BaseRegression,
        "credit_scoring": CreditScoring,
        "customer_marketing": CustomerMarketing,
        "predictive_underwriting": PredictiveUnderwriting,
    }

    @staticmethod
    def get_metadata() -> PluginMetadata:
        """
        A method to return the metadata for this plugin

        Returns:
            PluginMetadata: Metadata of this plugin
        """
        return Plugin._metadata

    @staticmethod
    def get_plugin_type() -> PluginType:
        """
        A method to return the type for this plugin

        Returns:
            PluginType: Type of this plugin
        """
        return Plugin._plugin_type

    def __init__(
        self,
        data_instance_and_serializer: Tuple[IData, ISerializer],
        model_instance_and_serializer: Tuple[IModel, ISerializer],
        ground_truth_instance_and_serializer: Tuple[IData, ISerializer],
        initial_data_instance: Union[IData, None],
        initial_model_instance: Union[IModel, IPipeline, None],
        **kwargs,
    ):
        self._initial_data_instance = initial_data_instance
        self._initial_model_instance = initial_model_instance

        # Store all input arguments for later use
        self._all_input_arguments = kwargs.copy()

        # Look for kwargs values for log_instance, progress_callback and base path
        self._logger = kwargs.get("logger", None)
        self._progress_inst = SimpleProgress(1, 0, kwargs.get("progress_callback", None))

        # Check if data and model are tuples and if the tuples contain 2 items
        if not isinstance(data_instance_and_serializer, Tuple) or len(data_instance_and_serializer) != 2:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed data validation: {data_instance_and_serializer}",
            )
            raise RuntimeError("The algorithm has failed data validation")

        if not isinstance(model_instance_and_serializer, Tuple) or len(model_instance_and_serializer) != 2:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed model validation: {model_instance_and_serializer}",
            )
            raise RuntimeError("The algorithm has failed model validation")

        self._data_instance = data_instance_and_serializer[0]
        self._model_instance = model_instance_and_serializer[0]
        self._model_type = kwargs.get("model_type")

        if Plugin._requires_ground_truth:
            # Check if ground truth instance is tuple and if the tuple contains 2 items
            if (
                not isinstance(ground_truth_instance_and_serializer, Tuple)
                or len(ground_truth_instance_and_serializer) != 2
            ):
                self.add_to_log(
                    logging.ERROR,
                    f"The algorithm has failed ground truth data validation: \
                        {ground_truth_instance_and_serializer}",
                )
                raise RuntimeError("The algorithm has failed ground truth data validation")
            self._requires_ground_truth = True
            self._ground_truth_instance = ground_truth_instance_and_serializer[0]
            self._ground_truth_serializer = ground_truth_instance_and_serializer[1]
            self._ground_truth = kwargs.get("ground_truth")
        else:
            self._ground_truth_instance = None
            self._ground_truth = ""

        # Training data instances
        self._training_data_instance = kwargs.get("training_data_instance", None)
        self._training_ground_truth_instance = kwargs.get("training_ground_truth_instance", None)
        self._training_ground_truth = kwargs.get("training_ground_truth", None)

        self._base_path = kwargs.get("project_base_path", Path().absolute())

        # Other variables
        self._data = None
        self._results = None
        self._probability_threshold = kwargs.get("probability_threshold", 0.5)
        self._use_case = kwargs.get("use_case", "base_classification")

        # Perform setup for this plug-in
        self.setup()

        # Algorithm input schema defined in input.schema.json
        current_file_dir = Path(__file__).parent
        self._input_schema = load_schema_file(str(Path(__file__).parent / "input.schema.json"))

        # Algorithm output schema defined in output.schema.json
        self._output_schema = load_schema_file(str(current_file_dir / "output.schema.json"))

        # Retrieve and transform the input parameters defined in the input schema
        self._input_arguments = dict()

        # Only include parameters defined in the schema
        schema_properties = self._input_schema.get("properties").keys()
        for key in schema_properties:
            value = self._all_input_arguments.get(key)

            # Apply transformations to make input compatible with schema
            if key == "model_type" and isinstance(value, ModelType):
                # Convert ModelType enum to string
                value = value.name
            elif key == "protected_features" and value is None:
                # Ensure protected_features is an array if None
                value = []

            # Only set properties that are not None and defined in the schema
            if value is not None:
                self._input_arguments[key] = value
            elif key in self._input_schema.get("properties") and "default" in self._input_schema["properties"][key]:
                # Use default from schema if available
                self._input_arguments[key] = self._input_schema["properties"][key]["default"]

        # Perform validation on input argument schema
        if not validate_json(self._input_arguments, self._input_schema):
            # Add more detailed validation errors
            import jsonschema

            validation_errors = []
            try:
                validator = jsonschema.Draft7Validator(self._input_schema)
                errors = sorted(validator.iter_errors(self._input_arguments), key=lambda e: e.path)
                for error in errors:
                    path = "/".join(str(p) for p in error.path) if error.path else "root"
                    message = f"At {path}: {error.message}"
                    validation_errors.append(message)
                    self.add_to_log(logging.ERROR, f"Validation error: {message}")
            except Exception as e:
                validation_errors.append(f"Error during validation: {str(e)}")
                self.add_to_log(logging.ERROR, f"Error during validation: {str(e)}")

            # Print input and schema for debugging
            import json

            self.add_to_log(logging.ERROR, f"Input: {json.dumps(self._input_arguments, indent=2)}")
            self.add_to_log(logging.ERROR, f"Schema: {json.dumps(self._input_schema, indent=2)}")

            error_details = "\n".join(validation_errors)
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed input schema validation. \
                    The input must adhere to the schema in input.schema.json: {self._input_arguments}\n\
                    Validation errors: {error_details}",
            )
            raise RuntimeError(
                f"The algorithm has failed input schema validation. \
                The input must adhere to the schema in input.schema.json\n\
                Validation errors: {error_details}"
            )

    def add_to_log(self, log_level: int, log_message: str) -> None:
        """
        A helper method to log messages to store events occurred

        Args:
            log_level (int): The logging level
            log_message (str): The logging message
        """
        if self._logger is not None:
            if not isinstance(log_level, int) or not isinstance(log_message, str):
                raise RuntimeError(
                    "The algorithm has invalid log level or message. The log level should be a \
                    logging level(i.e. logging.DEBUG) and log message should be in String format"
                )
        if self._logger is not None:
            if log_level is logging.DEBUG:
                self._logger.debug(log_message)
            elif log_level is logging.INFO:
                self._logger.info(log_message)
            elif log_level is logging.WARNING:
                self._logger.warning(log_message)
            elif log_level is logging.ERROR:
                self._logger.error(log_message)
            elif log_level is logging.CRITICAL:
                self._logger.critical(log_message)
            else:
                pass  # Invalid log level
        else:
            pass  # No log instance

    def setup(self) -> None:
        """
        A method to perform setup for this algorithm plugin
        """
        # Perform validation on logger
        if self._logger:
            if not isinstance(self._logger, logging.Logger):
                raise RuntimeError("The algorithm has failed to set up logger. The logger type is invalid")

        # Perform validation on model type
        if self._model_type not in Plugin._supported_algorithm_model_type:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed validation for model type: {self._model_type}",
            )
            raise RuntimeError("The algorithm has failed validation for model type")

        # Perform validation on data instance
        if not isinstance(self._data_instance, IData):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed data validation: {self._data_instance}",
            )
            raise RuntimeError("The algorithm has failed data validation")

        # Perform validation on model instance
        if not isinstance(self._model_instance, IModel) and not isinstance(self._model_instance, IPipeline):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed model validation: {self._model_instance}",
            )
            raise RuntimeError("The algorithm has failed model validation")

        # Perform validation on ground truth instance
        if self._requires_ground_truth:
            if not isinstance(self._ground_truth_instance, IData):
                self.add_to_log(
                    logging.ERROR,
                    f"The algorithm has failed ground truth data validation: {self._ground_truth_instance}",
                )
                raise RuntimeError("The algorithm has failed ground truth data validation")

            # Perform validation on ground truth header
            if not isinstance(self._ground_truth, str):
                self.add_to_log(
                    logging.ERROR,
                    "The algorithm has failed ground truth header validation. \
                    Header must be in String and must be present in the dataset: {self._ground_truth}",
                )
                raise RuntimeError(
                    "The algorithm has failed ground truth header validation. \
                    Header must be in String and must be present in the dataset"
                )

        # Perform validation on progress_inst
        if self._progress_inst:
            if not isinstance(self._progress_inst, SimpleProgress):
                raise RuntimeError("The algorithm has failed validation for the progress bar")

        # Perform validation on project_base_path
        if not isinstance(self._base_path, PurePath):
            self.add_to_log(
                logging.ERROR,
                "The algorithm has failed validation for the project path. \
                Ensure that the project path is a valid path: {self._base_path}",
            )
            raise RuntimeError(
                "The algorithm has failed validation for the project path. \
                Ensure that the project path is a valid path"
            )

        # Perform validation on metadata
        if not isinstance(self._metadata, PluginMetadata):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed validation for its metadata: {Plugin._metadata}",
            )
            raise RuntimeError("The algorithm has failed validation for its metadata")

        # Perform validation on plugin type
        if not isinstance(self._plugin_type, PluginType):
            self.add_to_log(
                logging.ERROR,
                "The algorithm has failed validation for its plugin type. \
                Ensure that PluginType is PluginType.ALGORITHM: {Plugin._plugin_type}",
            )
            raise RuntimeError(
                "The algorithm has failed validation for its plugin type. \
                Ensure that PluginType is PluginType.ALGORITHM"
            )

        # Perform validation on use case
        if self._use_case not in self._use_case_map:
            self.add_to_log(
                logging.ERROR,
                f"Unsupported use case: {self._use_case}",
            )
            raise RuntimeError(f"Unsupported use case: {self._use_case}")

        # Log input parameters for debugging
        self.add_to_log(
            logging.INFO,
            f"Input parameters: protected_features={self._all_input_arguments.get('protected_features')}, "
            f"privileged_groups={self._all_input_arguments.get('privileged_groups')}, "
            f"unprivileged_groups={self._all_input_arguments.get('unprivileged_groups')}, "
            f"model_type={self._model_type}, "
            f"positive_label={self._all_input_arguments.get('positive_label')}",
        )

        # Perform logging
        self.add_to_log(logging.INFO, "Setup completed")

    def get_progress(self) -> int:
        """
        A method to return the current progress for this plugin

        Returns:
            int: Completion Progress
        """
        return self._progress_inst.get_progress()

    def get_results(self) -> Dict:
        """
        A method to return generated results for this plugin

        Returns:
            Dict: The results to be returned for display
        """
        return self._results

    def _create_veritas_container(self) -> ModelContainer:
        """
        A helper method to create a Veritas ModelContainer from the data and model instances

        Returns:
            ModelContainer: The configured Veritas ModelContainer
        """
        try:
            # Get data from instances
            test_data = self._data_instance.get_data()
            y_true = self._ground_truth_instance.get_data()[self._ground_truth]
            model = (
                self._model_instance.get_pipeline()
                if hasattr(self._model_instance, "get_pipeline")
                else self._model_instance.get_model()
            )

            # Get predictions
            y_prob = model.predict_proba(test_data)[:, 1] if hasattr(model, "predict_proba") else None
            y_pred = (y_prob >= self._probability_threshold).astype(int)

            if self._model_type == ModelType.CLASSIFICATION:
                veritas_model_type = "classification"
            elif self._model_type == ModelType.REGRESSION:
                veritas_model_type = "regression"
            elif self._model_type == ModelType.UPLIFT:
                veritas_model_type = "uplift"
            else:
                raise ValueError(f"Invalid model type: {self._model_type}")

            protected_features = self._all_input_arguments.get("protected_features")
            protected_features_cols = test_data[protected_features] if protected_features else None

            x_train = None
            y_train = None
            if self._training_data_instance:
                x_train = self._training_data_instance.get_data()
            if self._training_ground_truth_instance and self._training_ground_truth:
                y_train = self._training_ground_truth_instance.get_data()[self._training_ground_truth]

            model_name = self._all_input_arguments.get("model_name", "auto")
            p_grp = self._all_input_arguments.get("privileged_groups")
            up_grp = self._all_input_arguments.get("unprivileged_groups")
            pos_label = self._all_input_arguments.get("positive_label")
            neg_label = self._all_input_arguments.get("negative_label")
            neg_label = None if neg_label == [] else neg_label

            container = ModelContainer(
                y_true=y_true,
                p_grp=p_grp,
                model_type=veritas_model_type,
                model_name=model_name,
                y_pred=y_pred,
                y_prob=y_prob,
                y_train=y_train,
                protected_features_cols=protected_features_cols,
                x_test=test_data,
                x_train=x_train,
                model_object=model,
                pos_label=pos_label,
                neg_label=neg_label,
                up_grp=up_grp,
            )

            return container

        except Exception as e:
            self.add_to_log(logging.ERROR, f"Error creating Veritas container: {str(e)}")
            raise RuntimeError(f"Error creating Veritas container: {str(e)}")

    def generate(self) -> None:
        """
        A method to generate the algorithm results with the provided data, model, ground truth information.
        """
        try:
            # Update progress
            self._progress_inst.update(0.1)
            self.add_to_log(logging.INFO, "Creating Veritas model container")

            # Create model container
            container = self._create_veritas_container()

            # Update progress
            self._progress_inst.update(0.3)
            self.add_to_log(logging.INFO, "Container created, initializing fairness assessment")

            # Get fairness parameters from all input arguments to ensure we use original values
            fair_threshold = self._all_input_arguments.get("fair_threshold", 80)
            fair_metric_name = self._all_input_arguments.get("fair_metric", "auto")
            fair_concern = self._all_input_arguments.get("fair_concern", "eligible")
            perf_metric_name = self._all_input_arguments.get("performance_metric", "balanced_acc")
            tran_row_num = self._all_input_arguments.get("transparency_rows", None)
            tran_max_sample = self._all_input_arguments.get("transparency_max_samples", None)
            tran_pdp_feature = self._all_input_arguments.get("transparency_features", None)
            fair_priority = self._all_input_arguments.get("fair_priority", "benefit")
            fair_impact = self._all_input_arguments.get("fair_impact", "normal")

            # Get the use case class
            use_case_class = self._use_case_map.get(self._use_case)

            # Update progress
            self._progress_inst.update(0.5)
            self.add_to_log(
                logging.INFO,
                f"Running fairness assessment with use case: {self._use_case}, metric: {fair_metric_name}, threshold: {fair_threshold}",
            )

            # Create use case instance with parameters
            use_case_instance = use_case_class(
                model_params=[container],
                fair_threshold=fair_threshold,
                fair_metric_name=fair_metric_name,
                fair_concern=fair_concern,
                fair_priority=fair_priority,
                fair_impact=fair_impact,
                perf_metric_name=perf_metric_name,
                tran_row_num=tran_row_num,
                tran_max_sample=tran_max_sample,
                tran_pdp_feature=tran_pdp_feature,
            )

            # Update progress
            self._progress_inst.update(0.7)
            self.add_to_log(logging.INFO, "Compiling fairness results")

            # Compile results
            results = use_case_instance.compile(save_artifact=False)

            # Get results as dictionary
            self._results = results.dict()

            # Update progress (For 100% completion)
            self._progress_inst.update(1)
            self.add_to_log(logging.INFO, "Fairness assessment completed")

        except Exception as e:
            self.add_to_log(logging.ERROR, f"Error generating results: {str(e)}")
            raise RuntimeError(f"Error generating results: {str(e)}")
