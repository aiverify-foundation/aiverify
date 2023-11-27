import json
from pathlib import Path
from typing import Dict, Tuple, Union

from test_engine_app.processing.algorithm_info import AlgorithmInfo
from test_engine_app.processing.plugin_controller import PluginController
from test_engine_app.processing.stream_validation import StreamValidation
from test_engine_core.plugins.enums.model_mode_type import ModelModeType
from test_engine_core.plugins.enums.model_type import ModelType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.utils.json_utils import load_schema_file, validate_json
from test_engine_core.utils.validate_checks import is_empty_string


class TaskArgument:
    """
    TaskArgument class comprises task arguments information
    It also provides methods for validation and parsing task arguments
    """

    # Task ID
    id: Union[str, None]

    # Dataset Arguments
    data: Union[str, None]

    # Ground Truth Arguments
    ground_truth_dataset: Union[str, None]
    ground_truth: Union[str, None]

    # Model Arguments
    api_schema: Union[Dict, None]
    api_config: Union[Dict, None]
    mode: Union[ModelModeType, None]
    model: Union[str, None]
    model_type: Union[ModelType, None]

    # Algorithm Arguments
    algorithm_id: Union[str, None]
    algorithm_arguments: Union[Dict, None]

    # Others
    algorithm_plugin_information: Union[AlgorithmInfo, None]
    _validation_schema_file: Union[str, None]
    _validation_schema: Union[Dict, None]

    def __init__(self, validation_schema_folder: str):
        if is_empty_string(validation_schema_folder):
            raise RuntimeError("The inputs do not meet the validation rules")

        # Set default value as None
        self.id = None
        self.data = None
        self.ground_truth_dataset = None
        self.ground_truth = None
        self.api_schema = None
        self.api_config = None
        self.mode = None
        self.model = None
        self.model_type = None
        self.algorithm_id = None
        self.algorithm_arguments = None
        self.algorithm_plugin_information = None
        self._validation_schema_file = str(
            Path(validation_schema_folder) / "test_engine_task_schema.json"
        )
        self._validation_schema = None

    def parse(self, args: str) -> Tuple[bool, str]:
        """
        A method to parse the message arguments to validate and read the information

        Args:
            args (str): message arguments

        Raises:
            RuntimeError: Raise exception when inputs do not meet the validation rules

        Returns:
            Tuple[bool, str]: True if parsed successfully, else return False and error message
        """
        try:
            if is_empty_string(args):
                raise RuntimeError("The inputs do not meet the validation rules")

            # Load the validation schema and JSON str
            self._validation_schema = load_schema_file(self._validation_schema_file)
            args_dict: Dict = json.loads(args)

            # Perform JSON Validation on the schema.
            if validate_json(args_dict, self._validation_schema):
                # Validated Ok
                # Required fields
                self.id = args_dict.get("id")
                self.data = args_dict.get("testDataset")
                self.algorithm_id = args_dict.get("algorithmId")
                self.algorithm_arguments = args_dict.get("algorithmArgs")
                if args_dict.get("mode") == ModelModeType.API.name.lower():
                    self.mode = ModelModeType.API
                else:
                    self.mode = ModelModeType.UPLOAD

                # API/UPLOAD (Optional)
                self.api_schema = args_dict.get("apiSchema")
                self.api_config = args_dict.get("apiConfig")
                self.model = args_dict.get("modelFile")

                # ModelType (Optional)
                if args_dict.get("modelType") == ModelType.CLASSIFICATION.name.lower():
                    self.model_type = ModelType.CLASSIFICATION
                elif args_dict.get("modelType") == ModelType.REGRESSION.name.lower():
                    self.model_type = ModelType.REGRESSION
                else:
                    self.model_type = None

                # GroundTruth (Optional)
                self.ground_truth_dataset = args_dict.get("groundTruthDataset")
                self.ground_truth = args_dict.get("groundTruth")

                # Retrieve the algorithm plugin information
                self.algorithm_plugin_information = (
                    PluginController.get_plugin_information(
                        PluginType.ALGORITHM, **{"algorithm_id": self.algorithm_id}
                    )
                )

                # Perform args validation
                error_count, error_message = self.validate()
                if error_count == 0:
                    return True, error_message
                else:
                    return False, error_message

            else:
                # Attempt to get id despite failed validation.
                self.id = args_dict.get("id")
                return (
                    False,
                    f"The inputs do not meet the validation schema rules for {self.id}",
                )

        except Exception as error:
            return False, str(error)

    def validate(self) -> Tuple[int, str]:
        """
        A method to validate the task arguments are within bounds

        Raises:
            RuntimeError: Raises exception when it is unable to process API model types

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        # Perform Validation
        if self.mode is ModelModeType.API:
            validation_methods = [
                (StreamValidation.validate_data, [self.data]),
                (
                    StreamValidation.validate_model_api,
                    [self.api_schema, self.api_config],
                ),
                (
                    StreamValidation.validate_algorithm,
                    [
                        self.algorithm_plugin_information,
                        self.algorithm_arguments,
                        self.ground_truth_dataset,
                        self.ground_truth,
                    ],
                ),
            ]

        else:
            validation_methods = [
                (StreamValidation.validate_data, [self.data]),
                (StreamValidation.validate_model_upload, [self.model]),
                (
                    StreamValidation.validate_algorithm,
                    [
                        self.algorithm_plugin_information,
                        self.algorithm_arguments,
                        self.ground_truth_dataset,
                        self.ground_truth,
                    ],
                ),
            ]

        for method, method_args in validation_methods:
            tmp_count, tmp_error_msg = method(*method_args)
            error_count += tmp_count
            error_message += tmp_error_msg

        return error_count, error_message
