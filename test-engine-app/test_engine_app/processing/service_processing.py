import logging
from typing import Callable, Dict, Tuple

from test_engine_core.utils.json_utils import validate_json

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.service_status import ServiceStatus
from test_engine_app.enums.service_validation_type import ServiceValidationType
from test_engine_app.processing.service_argument import ServiceArgument
from test_engine_app.processing.service_result import ServiceResult
from test_engine_app.processing.stream_processing import StreamProcessing


class ServiceProcessing:
    """
    ServiceProcessing class focuses on how to process pending and new services.
    """

    def __init__(
        self,
        logger: AppLogger,
        service_update_cb: Callable,
        service_result: ServiceResult,
        validation_type: ServiceValidationType,
    ):
        self._logger: AppLogger = logger
        self._service_update_callback: Callable = service_update_cb
        self._service_result: ServiceResult = service_result
        self._service_validation_type: ServiceValidationType = validation_type

    def stop(self) -> None:
        """
        A method to stop all processing

        Raises:
            NotImplementedError: Raise exception when stop function is called.
            Service worker type do not have stop functionality
        """
        raise NotImplementedError

    def process_new_service(
        self, service_argument: ServiceArgument
    ) -> Tuple[bool, str]:
        """
        A method to process on new services
        It will run the service and set the respective service response

        Args:
            service_argument (ServiceArgument): Contains the arguments for this service

        Returns:
            Tuple[bool, str]: Returns is_success and indicate the error messages if failure
        """
        # Set current service as Running and send update
        self._service_result.set_status(ServiceStatus.RUNNING)
        AppLogger.add_to_log(self._logger, logging.INFO, "Sending service update")
        self._service_update_callback()

        if self._service_validation_type is ServiceValidationType.VALIDATE_DATASET:
            return self._process_validate_dataset(service_argument)

        else:
            # Perform pipeline detection
            if StreamProcessing.detect_pipeline(
                self._logger, service_argument.model_path
            ):
                return self._process_validate_pipeline(service_argument)
            else:
                return self._process_validate_model(service_argument)

    def _process_validate_model(
        self, service_argument: ServiceArgument
    ) -> Tuple[bool, str]:
        """
        A helper method to perform validation of model

        Args:
            service_argument (ServiceArgument): Contains the arguments for this service

        Returns:
            Tuple[bool, str]: Returns is_success and indicate the error messages if failure
        """
        try:
            # Identify and load model information
            (
                is_load_model_success,
                model_serializer_instance,
                load_model_error_message,
            ) = StreamProcessing.load_model(
                self._logger,
                service_argument.model_mode,
                service_argument.model_path,
                service_argument.api_schema,
                service_argument.api_config,
            )
            if not is_load_model_success:
                error_messages = (
                    f"The model {service_argument.model_path} is not supported. "
                    f"Please upload a supported model: {load_model_error_message}"
                )
                AppLogger.add_to_log(
                    self._logger,
                    logging.ERROR,
                    f"{error_messages}",
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "DAT",
                    "CDATx00048",
                    f"{error_messages}",
                    "Critical",
                    "service_processing.py",
                )
                is_success = True
                self._service_result.set_invalid()

            else:
                # Write serializer type and model format to results
                model_instance = model_serializer_instance[0]
                serializer_instance = model_serializer_instance[1]
                self._service_result.set_results(
                    {
                        "model_format": model_instance.get_model_plugin_type(),
                        "serializer_type": serializer_instance.get_serializer_plugin_type(),
                    },
                    ServiceValidationType.VALIDATE_MODEL,
                )
                is_success = True
                error_messages = ""
                self._service_result.set_success()

        except Exception as exception:
            # Failed validation, failure info in error message
            error_messages = (
                f"Model upload failed. Please retry upload again: {str(exception)}"
            )
            AppLogger.add_to_log(
                self._logger,
                logging.ERROR,
                f"{error_messages}",
            )
            AppLogger.add_error_to_log(
                self._logger,
                "SYS",
                "CSYSx00046",
                f"{error_messages}",
                "Critical",
                "service_processing.py",
            )

            # Set validation complete and set file as invalid
            is_success = False
            self._service_result.set_failure()

        return is_success, error_messages

    def _process_validate_pipeline(
        self, service_argument: ServiceArgument
    ) -> Tuple[bool, str]:
        """
        A helper method to perform validation of pipeline

        Args:
            service_argument (ServiceArgument): Contains the arguments for this service

        Returns:
            Tuple[bool, str]: Returns is_success and indicate the error messages if failure
        """
        try:
            # Identify and load model information
            (
                is_load_model_success,
                model_serializer_instance,
                load_model_error_message,
            ) = StreamProcessing.load_pipeline(
                self._logger,
                service_argument.model_path,
            )
            if not is_load_model_success:
                error_messages = (
                    f"The model {service_argument.model_path} is not supported. "
                    f"Please upload a supported model: {load_model_error_message}"
                )
                AppLogger.add_to_log(
                    self._logger,
                    logging.ERROR,
                    f"{error_messages}",
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "DAT",
                    "CDATx00048",
                    f"{error_messages}",
                    "Critical",
                    "service_processing.py",
                )
                is_success = True
                self._service_result.set_invalid()

            else:
                # Write serializer type and model format to results
                model_instance = model_serializer_instance[0]
                serializer_instance = model_serializer_instance[1]
                self._service_result.set_results(
                    {
                        "model_format": model_instance.get_pipeline_plugin_type(),
                        "serializer_type": serializer_instance.get_serializer_plugin_type(),
                    },
                    ServiceValidationType.VALIDATE_MODEL,
                )
                is_success = True
                error_messages = ""
                self._service_result.set_success()

        except Exception as exception:
            # Failed validation, failure info in error message
            error_messages = (
                f"Model upload failed. Please retry upload again: {str(exception)}"
            )
            AppLogger.add_to_log(
                self._logger,
                logging.ERROR,
                f"{error_messages}",
            )
            AppLogger.add_error_to_log(
                self._logger,
                "SYS",
                "CSYSx00046",
                f"{error_messages}",
                "Critical",
                "service_processing.py",
            )

            # Set validation complete and set file as invalid
            is_success = False
            self._service_result.set_failure()

        return is_success, error_messages

    def _process_validate_dataset(self, service_argument: ServiceArgument):
        """
        A helper method to perform validation of dataset

        Args:
            service_argument (ServiceArgument): Contains the arguments for this service

        Returns:
            Tuple[bool, str]: Returns is_success and indicate the error messages if failure
        """
        error_messages = ""
        try:
            # Identify and load data information
            (
                is_load_data_success,
                data_serializer_instance,
                load_data_error_message,
            ) = StreamProcessing.load_data(self._logger, service_argument.data_path)
            if not is_load_data_success:
                error_messages = (
                    f"The dataset {service_argument.data_path} is not supported. "
                    f"Please upload a supported dataset: {load_data_error_message}"
                )
                AppLogger.add_to_log(
                    self._logger,
                    logging.ERROR,
                    f"{error_messages}",
                )
                AppLogger.add_error_to_log(
                    self._logger,
                    "DAT",
                    "CDATx00059",
                    f"{error_messages}",
                    "Critical",
                    "service_processing.py",
                )
                is_success = True
                self._service_result.set_invalid()

            else:
                # Validate dataset
                data_instance = data_serializer_instance[0]
                is_data_valid, validation_error_message = data_instance.validate()
                if is_data_valid:
                    # Get dataset features, number of rows and columns, serializer type and data format
                    if not data_instance.read_labels():
                        error_messages = (
                            f"The dataset {service_argument.data_path} has no headers. "
                            f"Please upload a valid dataset"
                        )
                        AppLogger.add_to_log(
                            self._logger,
                            logging.ERROR,
                            f"{error_messages}",
                        )
                        AppLogger.add_error_to_log(
                            self._logger,
                            "DAT",
                            "CDATx00061",
                            f"{error_messages}",
                            "Critical",
                            "service_processing.py",
                        )
                        is_success = True
                        self._service_result.set_invalid()

                    else:
                        # Get dataset features and write with serializer type and data format to results
                        json_array = list()
                        for key, value in data_instance.read_labels().items():
                            json_array.append({"name": key, "datatype": value})
                        num_rows, num_cols = data_instance.get_shape()

                        self._service_result.set_results(
                            {
                                "schema": json_array,
                                "rows": num_rows,
                                "cols": num_cols,
                                "data_format": data_serializer_instance[
                                    0
                                ].get_data_plugin_type(),
                                "serializer_type": data_serializer_instance[
                                    1
                                ].get_serializer_plugin_type(),
                            },
                            ServiceValidationType.VALIDATE_DATASET,
                        )

                        is_success = True
                        self._service_result.set_success()
                else:
                    error_messages = (
                        f"The dataset {service_argument.data_path} could not be validated. "
                        f"Please upload the dataset again: {validation_error_message}"
                    )
                    AppLogger.add_to_log(
                        self._logger,
                        logging.ERROR,
                        f"{error_messages}",
                    )
                    AppLogger.add_error_to_log(
                        self._logger,
                        "SYS",
                        "CSYSx00060",
                        f"{error_messages}",
                        "Critical",
                        "service_processing.py",
                    )
                    is_success = True
                    self._service_result.set_invalid()

        except Exception as exception:
            # Failed validation, failure info in error message
            error_messages = (
                f"Dataset upload failed. Please try upload again: {str(exception)}"
            )
            AppLogger.add_to_log(
                self._logger,
                logging.ERROR,
                f"{error_messages}",
            )
            AppLogger.add_error_to_log(
                self._logger,
                "SYS",
                "CSYSx00058",
                f"{error_messages}",
                "Critical",
                "service_processing.py",
            )
            # Set validation complete and set file as invalid
            is_success = False
            self._service_result.set_failure()

        return is_success, error_messages

    def process_pending_service(
        self, service_argument: ServiceArgument
    ) -> Tuple[bool, str]:
        """
        A method to process on pending services
        It will write error logs and set the respective service response to set in hset

        Args:
            service_argument (ServiceArgument): Contains the service arguments

        Returns:
            Tuple[bool, str]: Returns True and no error messages
        """
        # Set the error and logs messages
        error_messages = f"Cleaning up pending service: {service_argument.id}"
        AppLogger.add_to_log(
            self._logger,
            logging.ERROR,
            f"{error_messages}",
        )
        AppLogger.add_error_to_log(
            self._logger,
            "SYS",
            "CSYSx00141",
            f"{error_messages}",
            "Critical",
            "service_processing.py",
        )
        # Set current service as failure
        self._service_result.set_failure()
        return True, ""

    def _verify_service_results(
        self, service_result: Dict, output_schema: Dict
    ) -> Tuple[bool, str]:
        """
        A helper method to validate the service results according to the output schema

        Args:
            service_result (Dict): A dictionary of results generated by the algorithm

        Returns:
            Tuple[bool, str]: True if validated, False if validation failed.
        """
        is_success = True
        error_message = ""

        # Check that results type is dict
        if type(service_result) is not dict:
            is_success = False
            error_message = f"The results contained an invalid type: {type(service_result).__name__}"

        else:
            # Validate the json result with the relevant schema.
            # Check that it meets the required format before sending out to the UI for display
            if not validate_json(service_result, output_schema):
                is_success = False
                error_message = "The service output schema validation failed"

        return is_success, error_message
