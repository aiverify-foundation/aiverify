import json
from typing import Dict

from test_engine_core.utils.json_utils import remove_numpy_formats
from test_engine_core.utils.validate_checks import is_empty_string

from test_engine_app.enums.service_response import ServiceResponse
from test_engine_app.enums.service_status import ServiceStatus
from test_engine_app.enums.service_validation_type import ServiceValidationType
from test_engine_app.enums.task_status import TaskStatus
from test_engine_app.processing.service_result import ServiceResult
from test_engine_app.processing.task_result import TaskResult


class StreamFormatter:
    """
    StreamFormatter focuses on formatting results into the specification defined
    """

    @staticmethod
    def format_task_response(result: TaskResult, log_filepath: str) -> Dict:
        """
        A method to format task response with task result.
        This method will format task result into a dictionary that is compliant with the interface specified.

        Args:
            result (TaskResult): Task result that comprises run information
            log_filepath (str): Task log file location

        Returns:
            Dict: response dict for update.
        """
        response_dict: Dict = dict()

        if (
            not isinstance(result, TaskResult)
            or result is None
            or is_empty_string(log_filepath)
        ):
            return response_dict

        if result.status is TaskStatus.ERROR:
            response_dict.update(
                {
                    "type": "TaskResponse",
                    "status": StreamFormatter._get_initial_case(result.status.name),
                    "elapsedTime": result.elapsed_time,
                    "startTime": result.start_time.isoformat(),
                    "output": result.results,
                    "errorMessages": str(result.error_messages),
                    "logFile": log_filepath,
                    "taskProgress": result.percentage,
                }
            )
        else:
            # Scan the dict to remove numpy formats
            results = remove_numpy_formats(result.results)
            response_dict.update(
                {
                    "type": "TaskResponse",
                    "status": StreamFormatter._get_initial_case(result.status.name),
                    "elapsedTime": result.elapsed_time,
                    "startTime": result.start_time.isoformat(),
                    "output": json.dumps(results),
                    "logFile": log_filepath,
                    "taskProgress": result.percentage,
                }
            )
        return response_dict

    @staticmethod
    def format_service_response(
        service_result: ServiceResult,
        validation_type: ServiceValidationType,
        log_filepath: str,
    ) -> Dict:
        """
        A method to format service response with service result.
        This method will format service result into a dictionary that is compliant
        with the interface specified.

        Args:
            service_result (ServiceResult): Service result that comprises run information of the validation
            validation_type (ServiceValidationType): Service validation type
            log_filepath (str): Service log file location

        Returns:
            Dict: response dict for update.
        """
        if (
            not isinstance(service_result, ServiceResult)
            or service_result is None
            or not isinstance(validation_type, ServiceValidationType)
            or validation_type is None
            or is_empty_string(log_filepath)
        ):
            return {}

        if validation_type is ServiceValidationType.VALIDATE_DATASET:
            return StreamFormatter._format_dataset_validation_response(
                service_result, log_filepath
            )

        else:
            return StreamFormatter._format_model_validation_response(
                service_result, log_filepath
            )

    @staticmethod
    def _format_dataset_validation_response(
        service_result: ServiceResult, log_filepath: str
    ) -> Dict:
        """
        A helper method to format dataset validation response with the service result information.
        This method will format service result into a dictionary that is compliant
        with the interface specified.

        Args:
            service_result (ServiceResult): Service result
            log_filepath (str): Service log file location

        Returns:
            Dict: The formatted dictionary
        """
        response_dict = dict()
        if service_result.status is ServiceStatus.ERROR:
            response_dict.update(
                {
                    "type": "ServiceResponse",
                    "status": service_result.status.name.lower(),
                    "validationResult": service_result.result.name.lower(),
                    "errorMessages": service_result.error_messages,
                    "logFile": log_filepath,
                }
            )
        else:
            if service_result.result is ServiceResponse.VALID:
                response_dict.update(
                    {
                        "type": "ServiceResponse",
                        "status": service_result.status.name.lower(),
                        "validationResult": service_result.result.name.lower(),
                        "serializedBy": service_result.serializer_type.name.lower(),
                        "dataFormat": service_result.data_format.name.lower(),
                        "columns": json.dumps(service_result.schema),
                        "numRows": service_result.numRows,
                        "numCols": service_result.numCols,
                        "logFile": log_filepath,
                    }
                )
            else:
                response_dict.update(
                    {
                        "type": "ServiceResponse",
                        "status": service_result.status.name.lower(),
                        "validationResult": service_result.result.name.lower(),
                        "errorMessages": service_result.error_messages,
                        "logFile": log_filepath,
                    }
                )
        return response_dict

    @staticmethod
    def _format_model_validation_response(
        service_result: ServiceResult, log_filepath: str
    ) -> Dict:
        """
        A helper method to format model validation response with the service result information.
        This method will format service result into a dictionary that is compliant
        with the interface specified.

        Args:
            service_result (ServiceResult): Service result
            log_filepath (str): Service log file location

        Returns:
            Dict: The formatted dictionary
        """
        response_dict = dict()
        if service_result.status is ServiceStatus.ERROR:
            response_dict.update(
                {
                    "type": "ServiceResponse",
                    "status": service_result.status.name.lower(),
                    "validationResult": service_result.result.name.lower(),
                    "errorMessages": service_result.error_messages,
                    "logFile": log_filepath,
                }
            )
        else:
            if service_result.result is ServiceResponse.VALID:
                response_dict.update(
                    {
                        "type": "ServiceResponse",
                        "status": service_result.status.name.lower(),
                        "validationResult": service_result.result.name.lower(),
                        "serializedBy": service_result.serializer_type.name.lower(),
                        "modelFormat": service_result.model_format.name.lower(),
                        "logFile": log_filepath,
                    }
                )
            else:
                response_dict.update(
                    {
                        "type": "ServiceResponse",
                        "status": service_result.status.name.lower(),
                        "validationResult": service_result.result.name.lower(),
                        "errorMessages": service_result.error_messages,
                        "logFile": log_filepath,
                    }
                )
        return response_dict

    @staticmethod
    def _get_initial_case(temp_string: str) -> str:
        """
        A helper method to return init case for the temp string provided

        Args:
            temp_string (str): The string to be converted to init case

        Returns:
            str: initial-case string
        """
        lower_case_str = temp_string.lower()
        init_case_str = lower_case_str[0].upper() + lower_case_str[1:]
        return init_case_str
