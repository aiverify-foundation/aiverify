import logging
from typing import Callable, Dict, Tuple, Union

from test_engine_core.utils.validate_checks import is_empty_string

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.service_type import ServiceType
from test_engine_app.enums.service_validation_type import ServiceValidationType
from test_engine_app.interfaces.iworkerfunction import IWorkerFunction
from test_engine_app.processing.plugin_controller import PluginController
from test_engine_app.processing.service_argument import ServiceArgument
from test_engine_app.processing.service_processing import ServiceProcessing
from test_engine_app.processing.service_result import ServiceResult
from test_engine_app.processing.stream_formatter import StreamFormatter


class Service(IWorkerFunction):
    """
    Service class focuses on storing information and allows data processing and
    printing results of dataset and model validation
    """

    def __init__(
        self,
        message_id: str,
        message_arguments: Dict,
        validation_schemas_folder: str,
        service_type: ServiceType,
        service_update_cb: Union[Callable, None] = None,
    ):
        if (
            is_empty_string(message_id)
            or message_arguments is None
            or not isinstance(message_arguments, dict)
            or not message_arguments
            or is_empty_string(validation_schemas_folder)
            or service_type is None
            or not isinstance(service_type, ServiceType)
            or not (
                service_update_cb is None or isinstance(service_update_cb, Callable)
            )
        ):
            raise RuntimeError("The inputs do not meet the validation rules")

        self._message_id: str = message_id
        self._message_arguments: str = ""
        self._service_type: ServiceType = service_type
        self._validation_type: Union[ServiceValidationType, None] = None

        if (
            "validateModel" in message_arguments.keys()
            or "validateDataset" in message_arguments.keys()
        ):
            if "validateModel" in message_arguments.keys():
                self._message_arguments = message_arguments["validateModel"]
                self._validation_type = ServiceValidationType.VALIDATE_MODEL

            else:
                self._message_arguments = message_arguments["validateDataset"]
                self._validation_type = ServiceValidationType.VALIDATE_DATASET
        else:
            raise RuntimeError(
                "The message arguments inputs do not meet the validation rules"
            )

        # Callback method
        self._service_update_callback: Union[Callable, None] = service_update_cb

        # Service
        self._logger: AppLogger = AppLogger()
        self._service_arguments: ServiceArgument = ServiceArgument(
            validation_schemas_folder, self._validation_type
        )
        self._service_results = ServiceResult(self._logger)
        self._service_processing = ServiceProcessing(
            self._logger,
            self._send_service_update,
            self._service_results,
            self._validation_type,
        )

    def cancel(self) -> None:
        """
        A method to cancel the current operation

        Raises:
            NotImplementedError: Raise error when cancel method is called.
            Service worker does not require to cancel service requests.
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            "The system has received notification to cancel service (Not Implemented)",
        )
        raise NotImplementedError

    def cleanup(self) -> None:
        """
        A method to perform service clean up
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            "The system has received notification to clean up service",
        )
        if self._logger.logger_instance:
            self._logger.logger_instance.stop()
            self._logger.logger_instance = None

    def get_formatted_results(self) -> Dict:
        """
        A method to return the result for HSET.

        Returns:
            Dict: service result
        """
        return StreamFormatter.format_service_response(
            self._service_results, self._validation_type, self._logger.log_filepath
        )

    def get_id(self) -> str:
        """
        A method to return the service id

        Returns:
            str: service id
        """
        return self._service_arguments.id

    def get_logger(self) -> AppLogger:
        """
        A method to return the service logger

        Returns:
            AppLogger: service logger
        """
        return self._logger

    def process(self) -> Tuple[bool, str]:
        """
        A method to run the service to generate the validation results
        Print the results to log file
        Write results to the respective output modules

        Returns:
            Tuple[bool, str]: Returns True if processing complete and indicate the error messages if failure
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            f"Service has received notification to process: {self._message_arguments}",
        )

        # Validate the service arguments
        is_success, error_messages = self._service_arguments.parse(
            self._message_arguments
        )
        if is_success:
            # Setup stream logger and route the logs to service logger
            self._logger.generate_stream_logger(self._service_arguments.id)
            PluginController.set_logger(self._logger)
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"The service validation is successful: {self._service_arguments.id}",
            )
            AppLogger.add_to_log(
                self._logger,
                logging.INFO,
                f"Working on service: "
                f"message_id {self._message_id}, "
                f"message_args {self._message_arguments}, "
                f"service_type: {self._service_type}",
            )

            # Process the incoming service
            if self._service_type is ServiceType.PENDING:
                (
                    is_success,
                    error_messages,
                ) = self._service_processing.process_pending_service(
                    self._service_arguments
                )
            else:
                (
                    is_success,
                    error_messages,
                ) = self._service_processing.process_new_service(
                    self._service_arguments
                )

        else:
            # Check if id is not None, we can set HSET with error messages
            if self._service_arguments.id is not None and not is_empty_string(
                self._service_arguments.id
            ):
                self._logger.generate_stream_logger(self._service_arguments.id)
                PluginController.set_logger(self._logger)
                error_message = (
                    "There was an error parsing the provided service arguments: "
                    + error_messages
                )
                AppLogger.add_to_log(
                    self._logger,
                    logging.ERROR,
                    error_message,
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "SYS",
                    "FSYSx00138",
                    error_message,
                    "Warning",
                    "service.py",
                )
            else:
                # Cannot get id value from the message.
                error_message = (
                    "There was an error parsing the provided task arguments "
                    "(Unable to get id): " + error_messages
                )
                AppLogger.add_to_log(
                    self._logger,
                    logging.ERROR,
                    error_message,
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "SYS",
                    "FSYSx00138",
                    error_message,
                    "Warning",
                    "service.py",
                )

            # Failed validation and Set service failure
            self._service_results.set_failure()

        return is_success, error_messages

    def _send_service_update(self) -> None:
        """
        A helper method to trigger service update for current service
        """
        AppLogger.add_to_log(
            self._logger,
            logging.INFO,
            "Service has received notification to send service update",
        )
        if self._service_update_callback:
            self._service_update_callback(
                self._service_arguments.id, self.get_formatted_results(), self._logger
            )
