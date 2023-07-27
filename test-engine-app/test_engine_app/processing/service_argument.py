import json
from pathlib import Path
from typing import Dict, Tuple, Union

from test_engine_app.enums.service_validation_type import ServiceValidationType
from test_engine_app.processing.stream_validation import StreamValidation
from test_engine_core.plugins.enums.model_mode_type import ModelModeType
from test_engine_core.utils.json_utils import load_schema_file, validate_json
from test_engine_core.utils.validate_checks import is_empty_string


class ServiceArgument:
    """
    ServiceArgument class comprises service arguments information
    It also provides methods for validation and parsing service arguments
    """

    # Service ID
    id: Union[str, None]

    # Model Validation Arguments
    model_mode: Union[ModelModeType, None]
    model_path: Union[str, None]
    api_schema: Dict
    api_config: Dict

    # Dataset Validation Arguments
    data_path: Union[str, None]

    # Validation paths
    _validation_type: ServiceValidationType
    _validation_schema_file: Union[str, None]
    _validation_schema: Union[Dict, None]

    def __init__(
        self, validation_schema_folder: str, validation_type: ServiceValidationType
    ):
        if (
            is_empty_string(validation_schema_folder)
            or validation_type is None
            or not isinstance(validation_type, ServiceValidationType)
        ):
            raise RuntimeError("The inputs do not meet the validation rules")

        self.id = None
        self.model_mode = None
        self.model_path = None
        self.api_schema = dict()
        self.api_config = dict()
        self.data_path = None
        self._validation_type = validation_type
        self._validation_schema = None
        if self._validation_type is ServiceValidationType.VALIDATE_DATASET:
            self._validation_schema_file = str(
                Path(validation_schema_folder)
                / "test_engine_validate_dataset_schema.json"
            )
        else:
            self._validation_schema_file = str(
                Path(validation_schema_folder)
                / "test_engine_validate_model_schema.json"
            )

    def parse(self, args: str) -> Tuple[bool, str]:
        """
        A method to read the message arguments, validate the information

        Args:
            args (str): message arguments

        Raises:
            RuntimeError: Raises exception when inputs do not meet the validation rules

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
                if self._validation_type is ServiceValidationType.VALIDATE_DATASET:
                    self.id = args_dict.get("serviceId")
                    self.data_path = args_dict.get("filePath")

                else:
                    self.id = args_dict.get("serviceId")
                    self.model_path = args_dict.get("filePath")
                    if args_dict.get("mode") == ModelModeType.API.name.lower():
                        self.model_mode = ModelModeType.API
                    else:
                        self.model_mode = ModelModeType.UPLOAD

                # Perform args validation
                error_count, error_message = self.validate()
                if error_count == 0:
                    return True, error_message
                else:
                    return False, error_message

            else:
                # Attempt to get id despite failed validation.
                self.id = args_dict.get("serviceId")
                return (
                    False,
                    f"The inputs do not meet the validation schema rules for {self.id}",
                )

        except Exception as error:
            return False, str(error)

    def validate(self) -> Tuple[int, str]:
        """
        A method to validate the service arguments are within bounds

        Raises:
            RuntimeError: Raises exception when trying to process API model type

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if self._validation_type is ServiceValidationType.VALIDATE_DATASET:
            validation_methods = [(StreamValidation.validate_data, [self.data_path])]

        else:
            if self.model_mode is ModelModeType.API:
                validation_methods = [
                    (StreamValidation.validate_model_mode, [self.model_mode]),
                    (
                        StreamValidation.validate_model_api,
                        [self.api_schema, self.api_config],
                    ),
                ]

            else:
                validation_methods = [
                    (StreamValidation.validate_model_mode, [self.model_mode]),
                    (StreamValidation.validate_model_upload, [self.model_path]),
                ]

        for method, method_args in validation_methods:
            tmp_count, tmp_error_msg = method(*method_args)
            error_count += tmp_count
            error_message += tmp_error_msg

        return error_count, error_message
