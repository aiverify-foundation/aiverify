import logging
import signal
import sys
from typing import Union

import pathos
from aiohttp import web
from aiohttp.web_response import Response

from test_engine_app.api.requirements_checks import RequirementsChecks
from test_engine_app.app_logger import AppLogger
from test_engine_app.config.environment_variables import EnvironmentVariables
from test_engine_app.enums.worker_type import WorkerType


class RequirementsChecksApi:
    """
    RequirementsChecksApi class runs in a multiprocessing context.
    The run method and perform the generation of api server and the class handles the
    end point triggers using aiohttp.
    """

    _routes = web.RouteTableDef()
    _logger: AppLogger = AppLogger()
    _api_server_process: Union[pathos.helpers.mp.Process, None] = None
    _worker_name: str = ""
    _worker_type: Union[WorkerType, None] = None

    @staticmethod
    @_routes.get("/requirements/client")
    async def requirements_check(request: web.Request) -> Response:
        """
        A method for http endpoint to handle requirements check request

        Args:
            request (web.Request): Contains the request data

        Returns:
            Response: Result of each requirements received
        """
        requirements_check = RequirementsChecks(request.query)
        result = requirements_check.is_packages_supported()
        return web.json_response(result, content_type="application/json")

    @staticmethod
    def run_initializer() -> None:
        """
        A method to register a SIGINT signal
        """
        signal.signal(signal.SIGINT, RequirementsChecksApi.trigger_signal_handler)

    @staticmethod
    def run(worker_type: WorkerType, worker_id: int) -> None:
        """
        This method runs the api server to start listening on new requirements queries

        Args:
            worker_type (WorkerType): The worker type
            worker_id (int): The worker id

        Raises:
            RuntimeError: Raise exception when the inputs do not meet the validation rules
        """

        try:
            RequirementsChecksApi.run_initializer()

            # Set worker name and type
            if (
                worker_type is None
                or not isinstance(worker_type, WorkerType)
                or worker_id is None
                or not isinstance(worker_id, int)
            ):
                raise RuntimeError("The inputs do not meet the validation rules")

            RequirementsChecksApi._worker_name = f"Worker{worker_id}"
            RequirementsChecksApi._worker_type = worker_type

            # Setup logging and error manager
            RequirementsChecksApi._logger.generate_logger()
            AppLogger.add_to_log(
                RequirementsChecksApi._logger,
                logging.INFO,
                f"The system worker ({RequirementsChecksApi._worker_name}) "
                f"[{RequirementsChecksApi._worker_type}] is running",
            )

            # Read .env for environment variables.
            AppLogger.add_to_log(
                RequirementsChecksApi._logger,
                logging.INFO,
                "The system worker is reading the environment variables",
            )
            EnvironmentVariables()
            AppLogger.add_to_log(
                RequirementsChecksApi._logger,
                logging.DEBUG,
                EnvironmentVariables.print_environment_variables(),
            )

            # Run the api server in a separate process
            RequirementsChecksApi._api_server_process = pathos.helpers.mp.Process(
                target=RequirementsChecksApi.create_api_server,
                kwargs={
                    "logger": RequirementsChecksApi._logger,
                    "validation_schema_folder": EnvironmentVariables.get_validation_schemas_folder(),
                },
            )
            RequirementsChecksApi._api_server_process.start()

            # Wait for CTRL-C to quit.
            signal.pause()

        except Exception as exception:
            # Base try-except to catch all possible leaked exception and log them.
            error_message = "The system worker encountered an error. " + str(exception)

            AppLogger.add_to_log(
                RequirementsChecksApi._logger,
                logging.ERROR,
                error_message,
            )
            AppLogger.add_error_to_log(
                RequirementsChecksApi._logger,
                "SYS",
                "FSYSx00134",
                error_message,
                "Fatal",
                "requirements_check_api.py",
            )

        finally:
            # Trigger a SIGINT signal to shut down the process properly.
            # Terminate process when it reaches the end
            RequirementsChecksApi.trigger_signal_handler(signal.SIGINT, 1)

    @staticmethod
    def create_api_server(*args, **kwargs):
        """
        A method to create api server instance
        """
        try:
            # Set the static values for RequirementsChecks
            RequirementsChecks.set_logger(kwargs.get("logger"))
            RequirementsChecks.set_validation_folder(
                kwargs.get("validation_schema_folder")
            )

            # Create API server
            app = web.Application()
            app.add_routes(RequirementsChecksApi._routes)
            web.run_app(app, port=EnvironmentVariables.get_api_server_port())

        except Exception as exception:
            # Base try-except to catch all possible leaked exception and log them.
            error_message = "The system worker encountered an error. " + str(exception)

            AppLogger.add_to_log(
                RequirementsChecksApi._logger,
                logging.ERROR,
                error_message,
            )
            AppLogger.add_error_to_log(
                RequirementsChecksApi._logger,
                "SYS",
                "FSYSx00134",
                error_message,
                "Fatal",
                "requirements_check_api.py",
            )

    @staticmethod
    def trigger_signal_handler(signum, frame) -> None:
        """
        A method to handle the SIGINT and trigger shutdown for processes

        Args:
            signum (_type_): Not used
            frame (_type_): Not used
        """
        # Terminate logger instance
        AppLogger.add_to_log(
            RequirementsChecksApi._logger,
            logging.INFO,
            f"Stopping: {RequirementsChecksApi._worker_name} ({RequirementsChecksApi._worker_type})",
        )

        if (
            RequirementsChecksApi._logger
            and isinstance(RequirementsChecksApi._logger, AppLogger)
            and RequirementsChecksApi._logger.logger_instance
        ):
            RequirementsChecksApi._logger.logger_instance.stop()

        if (
            RequirementsChecksApi._logger
            and isinstance(RequirementsChecksApi._logger, AppLogger)
            and RequirementsChecksApi._logger.error_logger_instance
        ):
            RequirementsChecksApi._logger.error_logger_instance.write_error_to_file()

        if (
            RequirementsChecksApi._api_server_process is not None
            and isinstance(
                RequirementsChecksApi._api_server_process, pathos.helpers.mp.Process
            )
            and RequirementsChecksApi._api_server_process.is_alive()
        ):
            RequirementsChecksApi._api_server_process.terminate()

        # Terminate the application with exit code 0
        sys.exit(0)
