from pathlib import Path
from typing import Union

from test_engine_core.plugins.enums.model_mode_type import ModelModeType
from test_engine_core.utils.json_utils import validate_json
from test_engine_core.utils.validate_checks import is_empty_string, is_file, is_folder
from test_engine_pypi.algorithm_info import AlgorithmInfo


class TestValidation:
    @staticmethod
    def validate_data(data: str) -> tuple[int, str]:
        """
        A method to validate data file

        Args:
            data (str): The data to be validated

        Returns:
            tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if type(data) is not str:
            error_count += 1
            error_message += "The data file is not a string;"
        elif is_empty_string(data):
            error_count += 1
            error_message += "The data file is an empty string;"
        else:
            if not (is_file(data) or is_folder(str(Path(data)))):
                error_count += 1
                error_message += "The data file is not found;"

        return error_count, error_message

    @staticmethod
    def validate_ground_truth(
        ground_truth_dataset: str, ground_truth: str
    ) -> tuple[int, str]:
        """
        A method to validate ground truth dataset and the ground truth feature

        Args:
            ground_truth_dataset (str): The ground truth dataset to be validated
            ground_truth (str): The ground truth feature

        Returns:
            tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        # Ground Truth Dataset is defined.
        if type(ground_truth_dataset) is not str:
            error_count += 1
            error_message += "The ground truth dataset file is not a string;"
        elif is_empty_string(ground_truth_dataset):
            error_count += 1
            error_message += "The ground truth dataset file is an empty string;"
        else:
            if not is_file(ground_truth_dataset):
                error_count += 1
                error_message += "The ground truth dataset file is not found;"

        # Ground Truth is defined
        if type(ground_truth) is not str:
            error_count += 1
            error_message += "The ground truth is not a string;"
        elif is_empty_string(ground_truth):
            error_count += 1
            error_message += "The ground truth is an empty string;"

        return error_count, error_message

    @staticmethod
    def validate_model_mode(model_mode: ModelModeType) -> tuple[int, str]:
        """
        A method to validate model mode

        Args:
            model_mode (ModelModeType): The model mode

        Returns:
            tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if not (isinstance(model_mode, ModelModeType)):
            error_count += 1
            error_message += "The model mode is invalid;"

        return error_count, error_message

    @staticmethod
    def validate_model_upload(model_file: str) -> tuple[int, str]:
        """
        A method to validate model upload

        Args:
            model_file (str): The model file to be validated

        Returns:
            tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        # If model is tf, the path should be a folder, else it is a file.
        # As long as the model exists either a file or model, we pass it first. Will check when detected.
        if type(model_file) is not str:
            error_count += 1
            error_message += "The model file is not a string;"
        elif is_empty_string(model_file):
            error_count += 1
            error_message += "The model file is an empty string;"
        else:
            if not (is_file(model_file) or is_folder(str(Path(model_file)))):
                error_count += 1
                error_message += "The model file is not found;"

        return error_count, error_message

    @staticmethod
    def validate_model_api(api_schema: dict, api_config: dict) -> tuple[int, str]:
        """
        A method to validate model api

        Args:
            api_schema (dict): The api schema to be validated
            api_config (dict): The api config to be validated

        Returns:
            tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if type(api_schema) is not dict:
            error_count += 1
            error_message += "The api schema is not a dict;"

        if type(api_config) is not dict:
            error_count += 1
            error_message += "The api config is not a dict;"

        return error_count, error_message

    @staticmethod
    def validate_algorithm(
        algorithm_plugin_information: Union[AlgorithmInfo, None],
        algorithm_arguments: Union[dict, None],
        ground_truth_dataset: Union[str, None],
        ground_truth: Union[str, None],
    ) -> tuple[int, str]:
        """
        A method to validate the algorithm

        Args:
            algorithm_plugin_information (Union[AlgorithmInfo, None]): The algorithm plugin information to be validated
            algorithm_arguments (Union[dict, None]): The algorithm plugin arguments to be validated
            ground_truth_dataset (Union[str, None]): The ground truth dataset
            ground_truth (Union[str, None]): The ground truth feature

        Returns:
            tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if algorithm_plugin_information:
            # Get the algorithm input schema and validate the algorithm arguments
            if validate_json(
                algorithm_arguments,
                algorithm_plugin_information.get_algorithm_input_schema(),
            ):
                # Validate Ground Truth
                if algorithm_plugin_information.get_algorithm_require_ground_truth():
                    if not ground_truth or not ground_truth_dataset:
                        error_count += 1
                        error_message += "The ground truth validation failed;"
                    else:
                        # Both ground truth exists.
                        (
                            error_count,
                            error_message,
                        ) = TestValidation.validate_ground_truth(
                            ground_truth_dataset, ground_truth
                        )
                else:
                    pass  # Ground truth not required. values don't matter.
            else:
                error_count += 1
                error_message += "The algorithm arguments validation failed;"
        else:
            error_count += 1
            error_message += "The algorithm ID is not found;"

        return error_count, error_message
