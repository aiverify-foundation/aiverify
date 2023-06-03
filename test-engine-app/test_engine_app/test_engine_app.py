import logging
import os
import signal
import sys
from concurrent.futures import ProcessPoolExecutor
from multiprocessing import get_context

from test_engine_core import version_msg as core_version

from test_engine_app import version_msg as app_version
from test_engine_app.api.requirements_checks_api import RequirementsChecksApi
from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.worker_type import WorkerType
from test_engine_app.worker import Worker


class TestEngineApp:
    """
    The TestEngineApp class will initialize the methods required to run the TestEngineApp application.
    It will launch multiple processes which reads the environment variables, and process tasks
    It will detect SIGINT and performs a graceful shutdown of the application.
    """

    # Class Variable
    _logger: AppLogger = AppLogger()

    def __init__(self):
        """
        Initialisation for Test Engine App
        """
        # Setup logger
        TestEngineApp._logger.generate_logger()

        # We need 3 (1 for task, 1 for service, 1 for api)
        self._required_number_of_processes = 3
        self._available_number_of_processes = max(
            os.cpu_count(), self._required_number_of_processes
        )
        self._executor = ProcessPoolExecutor(
            mp_context=get_context("spawn"),
            max_workers=self._available_number_of_processes,
            initializer=Worker.run_initializer,
        )
        AppLogger.add_to_log(
            TestEngineApp._logger,
            logging.INFO,
            f"The system detected {os.cpu_count()} available cores",
        )

        # Create a new list for worker futures
        self._worker_futures = list()

    def run(self) -> None:
        """
        A method to run TestEngineApp
        """
        # Log test engine core and app version message
        AppLogger.add_to_log(TestEngineApp._logger, logging.INFO, app_version())
        AppLogger.add_to_log(TestEngineApp._logger, logging.INFO, core_version())

        # Define the number of service and process workers
        num_of_api_workers = 1
        num_of_service_workers = 1
        num_of_process_workers = (
            self._available_number_of_processes
            - num_of_service_workers
            - num_of_api_workers
        )

        AppLogger.add_to_log(
            TestEngineApp._logger,
            logging.INFO,
            f"Test Engine App (Running): "
            f"Run log ID [{TestEngineApp._logger.log_id}], "
            f"{num_of_api_workers} API Workers, "
            f"{num_of_service_workers} Service Workers, "
            f"{num_of_process_workers} Process Workers",
        )

        # Submit tasks to the ProcessPool
        worker_count = 0
        for count in range(num_of_api_workers):
            worker_count += 1
            self._worker_futures.append(
                self._executor.submit(
                    RequirementsChecksApi.run, WorkerType.API_SERVER, worker_count
                )
            )
        for count in range(num_of_process_workers):
            worker_count += 1
            self._worker_futures.append(
                self._executor.submit(Worker.run, WorkerType.PROCESS, worker_count)
            )
        for count in range(num_of_service_workers):
            worker_count += 1
            self._worker_futures.append(
                self._executor.submit(Worker.run, WorkerType.SERVICE, worker_count)
            )

        # Wait for CTRL-C to quit.
        signal.signal(signal.SIGINT, self.sigint_handler)
        AppLogger.add_to_log(
            TestEngineApp._logger,
            logging.INFO,
            "Press Ctrl+C to terminate Test Engine App",
        )
        signal.pause()

    def sigint_handler(self, signum, frame) -> None:
        """
        A method to handle the SIGINT and trigger shutdown

        Args:
            signum (_type_): Not used
            frame (_type_): Not used
        """
        AppLogger.add_to_log(
            TestEngineApp._logger,
            logging.INFO,
            "Terminating Test Engine App. Please wait",
        )

        # Check the future list and call cancel
        for future in self._worker_futures:
            future.cancel()

        # Shutdown the executor
        self._executor.shutdown()

        # Terminate logger instance
        if (
            TestEngineApp._logger
            and isinstance(TestEngineApp._logger, AppLogger)
            and TestEngineApp._logger.logger_instance
        ):
            TestEngineApp._logger.logger_instance.stop()

        # Terminate the application with exit code 0
        sys.exit(0)
