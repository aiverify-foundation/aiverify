import copy
from typing import Union

from test_engine_api.algorithm_info import AlgorithmInfo
from test_engine_api.test_validation import TestValidation
from test_engine_core.plugins.enums.model_mode_type import ModelModeType
from test_engine_core.plugins.enums.model_type import ModelType


class TestArgument:
    """
    TaskArgument class comprises task arguments information
    It also provides methods for validation and parsing task arguments
    """

    # Dataset Arguments
    data: Union[str, None]

    # Ground Truth Arguments
    ground_truth_dataset: Union[str, None]
    ground_truth: Union[str, None]

    # Model Arguments
    api_schema: Union[dict, None]
    api_config: Union[dict, None]
    mode: Union[ModelModeType, None]
    model: Union[str, None]
    model_type: Union[ModelType, None]

    # Algorithm Arguments
    algorithm_id: Union[str, None]
    algorithm_arguments: Union[dict, None]

    def __init__(self, algorithm_information: AlgorithmInfo, test_arguments: dict):
        # Retrieve the algorithm plugin information
        # Store original task arguments
        self.test_arguments = copy.deepcopy(test_arguments)
        self.algorithm_plugin_information = algorithm_information

        # Required fields
        self.data = test_arguments.get("testDataset")
        self.algorithm_id = test_arguments.get("algorithmId")
        self.algorithm_arguments = test_arguments.get("algorithmArgs")
        if test_arguments.get("mode") == ModelModeType.API.name.lower():
            self.mode = ModelModeType.API
        else:
            self.mode = ModelModeType.UPLOAD

        # API/UPLOAD (Optional)
        self.api_schema = test_arguments.get("apiSchema")
        self.api_config = test_arguments.get("apiConfig")
        self.model = test_arguments.get("modelFile")

        # ModelType (Optional)
        if test_arguments.get("modelType") == ModelType.CLASSIFICATION.name.lower():
            self.model_type = ModelType.CLASSIFICATION
        elif test_arguments.get("modelType") == ModelType.REGRESSION.name.lower():
            self.model_type = ModelType.REGRESSION
        else:
            self.model_type = None

        # GroundTruth (Optional)
        self.ground_truth_dataset = test_arguments.get("groundTruthDataset")
        self.ground_truth = test_arguments.get("groundTruth")

    def validate(self) -> tuple[int, str]:
        """
        A method to validate the task arguments are within bounds

        Raises:
            RuntimeError: Raises exception when it is unable to process API model types

        Returns:
            tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        # Perform Validation
        if self.data is None:
            error_count += 1
            error_message += "data is required\n"

        if self.algorithm_id is None:
            error_count += 1
            error_message += "algorithm_id is required\n"

        if self.algorithm_arguments is None:
            error_count += 1
            error_message += "algorithm_arguments is required\n"

        if self.mode is ModelModeType.API:
            validation_methods = [
                (TestValidation.validate_data, [self.data]),
                (
                    TestValidation.validate_model_api,
                    [self.api_schema, self.api_config],
                ),
                (
                    TestValidation.validate_algorithm,
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
                (TestValidation.validate_data, [self.data]),
                (TestValidation.validate_model_upload, [self.model]),
                (
                    TestValidation.validate_algorithm,
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
