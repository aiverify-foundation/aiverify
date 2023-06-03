import logging
from typing import Dict, Union

from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.plugins.enums.model_plugin_type import ModelPluginType
from test_engine_core.plugins.enums.serializer_plugin_type import SerializerPluginType

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.service_response import ServiceResponse
from test_engine_app.enums.service_status import ServiceStatus
from test_engine_app.enums.service_validation_type import ServiceValidationType


class ServiceResult:
    """
    ServiceResult class comprises information on the service such as serviceType, serviceStatus, and validationResults
    """

    status: ServiceStatus
    result: Union[ServiceResponse, None]
    schema: str
    numRows: int
    numCols: int
    error_messages: str
    model_format: Union[ModelPluginType, None]
    data_format: Union[DataPluginType, None]
    serializer_type: Union[SerializerPluginType, None]
    data_type: str

    def __init__(self, logger: AppLogger):
        if not isinstance(logger, AppLogger):
            raise RuntimeError("The inputs do not meet the validation rules")

        self.status = ServiceStatus.INIT
        self.result = ServiceResponse.NONE
        self.schema = ""
        self.numRows = 0
        self.numCols = 0
        self.error_messages = ""
        self.model_format = None
        self.data_format = None
        self.serializer_type = None
        self.data_type = ""
        self._logger = logger

    def set_results(
        self, results: Dict, validation_type: ServiceValidationType
    ) -> None:
        """
        A method to set the service results

        Args:
            results (Dict): The results to be updated
            validation_type (ServiceValidationType): The service validation type

        Raises:
            RuntimeError: Raise exception when current service receives an invalid input
        """
        if isinstance(results, dict) and isinstance(
            validation_type, ServiceValidationType
        ):
            if validation_type is ServiceValidationType.VALIDATE_DATASET:
                self.schema = results["schema"]
                self.numRows = results["rows"]
                self.numCols = results["cols"]
                self.serializer_type = results["serializer_type"]
                self.data_format = results["data_format"]
                AppLogger.add_to_log(
                    self._logger,
                    logging.INFO,
                    "The current service has received the following results: "
                    f"Schema: {self.schema}, Rows: {self.numRows}, "
                    f"Columns: {self.numCols}, SerializerType: {self.serializer_type}, "
                    f"DataType: {self.data_format}",
                )
            else:
                self.model_format = results["model_format"]
                self.serializer_type = results["serializer_type"]
                AppLogger.add_to_log(
                    self._logger,
                    logging.INFO,
                    "The current service has received the following results: "
                    f"ModelFormat: {self.model_format}, SerializerType: {self.serializer_type}",
                )
        else:
            error_message = (
                f"The current service received an invalid input: "
                f"{results} ({type(results)}), "
                f"{validation_type} ({type(validation_type)})"
            )
            AppLogger.add_to_log(self._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                self._logger,
                "INP",
                "CINPx00139",
                error_message,
                "Critical",
                "service_result.py",
            )
            raise RuntimeError(error_message)

    def set_success(self) -> None:
        """
        A method to set the service as DONE and validation results as valid.
        It will write errors found to file and set validation result as valid.
        """
        self.error_messages = ""
        self.result = ServiceResponse.VALID
        self.set_status(ServiceStatus.DONE)

    def set_failure(self) -> None:
        """
        A method to set the service as ERROR.
        It will write errors found to file and set validation result as None.
        """
        # Write error to file
        AppLogger.write_error_to_file(self._logger)

        self.error_messages = AppLogger.get_errors_in_json_str(self._logger)
        self.result = ServiceResponse.NONE
        self.set_status(ServiceStatus.ERROR)

    def set_invalid(self) -> None:
        """
        A helper method to set the service as DONE and validation results as invalid.
        It will write errors found to file and set validation result as invalid.
        """
        # Write error to file
        AppLogger.write_error_to_file(self._logger)

        self.error_messages = AppLogger.get_errors_in_json_str(self._logger)
        self.result = ServiceResponse.INVALID
        self.set_status(ServiceStatus.DONE)

    def set_status(self, service_status: ServiceStatus) -> None:
        """
        A method to set the service status

        Args:
            service_status (ServiceStatus): service status

        Raises:
            RuntimeError: Raise exception when current service receives an invalid input
        """
        if isinstance(service_status, ServiceStatus):
            # Set the service status
            self.status = service_status
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"The current service has changed status to {self.status}",
            )
        else:
            error_message = f"The current service received an invalid input: {service_status} ({type(service_status)})"
            AppLogger.add_to_log(self._logger, logging.ERROR, error_message)
            AppLogger.add_error_to_log(
                self._logger,
                "INP",
                "CINPx00139",
                error_message,
                "Critical",
                "service_result.py",
            )
            raise RuntimeError(error_message)
