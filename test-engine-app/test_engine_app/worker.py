import logging
import signal
import sys
from multiprocessing import Lock
from time import sleep
from typing import Dict, List, Tuple, Union

from test_engine_core.utils.validate_checks import is_empty_string

from test_engine_app.app_logger import AppLogger
from test_engine_app.config.environment_variables import EnvironmentVariables
from test_engine_app.enums.service_type import ServiceType
from test_engine_app.enums.task_type import TaskType
from test_engine_app.enums.worker_type import WorkerType
from test_engine_app.interfaces.iworkerfunction import IWorkerFunction
from test_engine_app.network.redis import Redis
from test_engine_app.network.redis_constants import (
    REDIS_STREAM_SERVICE_NAME,
    REDIS_STREAM_TASK_NAME,
)
from test_engine_app.processing.plugin_controller import PluginController
from test_engine_app.processing.service import Service
from test_engine_app.processing.task import Task


class Worker:
    """
    Worker class runs in a multiprocessing context.
    Each process will trigger the run method and perform what it requires.
    There are 2 types of worker, process or service worker.
    Process worker will perform differently compared to service workers.

    Process worker will wait for new tasks from the redis task stream to process tasks with the algorithm and
    Service worker will wait for new services from the redis service stream
    to perform queries on model, data, compatibility issues.
    """

    _running_item: Union[IWorkerFunction, None] = None
    _logger: AppLogger = AppLogger()
    _to_stop: bool = False
    _worker_name: str = ""
    _worker_type: Union[WorkerType, None] = None
    lock: Lock = Lock()

    @staticmethod
    def run_initializer() -> None:
        """
        A method to register a SIGINT signal
        """
        signal.signal(signal.SIGINT, Worker.sigint_handler)

    @staticmethod
    def setup() -> Tuple[bool, str]:
        """
        A method to set up the worker instances

        Returns:
            Tuple[bool, str]: Returns a bool to indicate if the call is successful.
            If it is successful, it will return no error message
            If it is unsuccessful, it will return an error message
        """
        try:
            # Read .env for environment variables.
            AppLogger.add_to_log(
                Worker._logger,
                logging.INFO,
                "The system worker is reading the environment variables",
            )
            EnvironmentVariables()
            AppLogger.add_to_log(
                Worker._logger,
                logging.DEBUG,
                EnvironmentVariables.print_environment_variables(),
            )

            # Setup PluginController
            PluginController.set_logger(Worker._logger)
            PluginController.setup(EnvironmentVariables.get_core_modules_folder())

            # Check if this thread is process worker or service worker
            if Worker._worker_type is WorkerType.SERVICE:
                stream_name = REDIS_STREAM_SERVICE_NAME
            else:
                stream_name = REDIS_STREAM_TASK_NAME

            # Setup Redis Pub/Sub channels and Streams
            Worker._setup_redis(stream_name)

            return True, ""
        except Exception as exception:
            error_message = f"The system worker encountered an error while setting up: {str(exception)}"
            AppLogger.add_to_log(
                Worker._logger,
                logging.ERROR,
                error_message,
            )
            AppLogger.add_error_to_log(
                Worker._logger,
                "SYS",
                "FSYSx00135",
                error_message,
                "Fatal",
                "worker.py",
            )
            return False, error_message

    @staticmethod
    def run(worker_type: WorkerType, worker_id: int) -> None:
        """
        A method to start off the process on getting new tasks or queries and return results

        Args:
            worker_type (WorkerType): Indicates the task/service this process should take on
            worker_id (int): Indicates the worker id

        Raises:
            RuntimeError: Raises exception when inputs do not meet the validation rules
        """
        try:
            # Set worker name and type
            if (
                worker_type is None
                or not isinstance(worker_type, WorkerType)
                or worker_id is None
                or not isinstance(worker_id, int)
            ):
                raise RuntimeError("The inputs do not meet the validation rules")

            Worker._worker_name = f"Worker{worker_id}"
            Worker._worker_type = worker_type

            # Setup logging and error manager
            Worker._logger.generate_logger()
            Redis.set_logger(Worker._logger)
            AppLogger.add_to_log(
                Worker._logger,
                logging.INFO,
                f"The system worker ({Worker._worker_name}) [{Worker._worker_type}] is running",
            )

        except RuntimeError as exception:
            # Base try-except to catch all possible leaked exception and log them.
            error_message = "The system worker encountered an error. " + str(exception)

            AppLogger.add_to_log(
                Worker._logger,
                logging.ERROR,
                error_message,
            )
            AppLogger.add_error_to_log(
                Worker._logger,
                "SYS",
                "FSYSx00134",
                error_message,
                "Fatal",
                "worker.py",
            )

            # Trigger a SIGINT signal to shut down the process properly.
            # Terminate process when it reaches the end
            Worker.sigint_handler(signal.SIGINT, 1)

        # Run setup and stream activities
        # Perform 5 seconds retry if exception or wrong configuration
        while not Worker._to_stop:
            try:
                # Perform worker set up
                is_success, _ = Worker.setup()
                if not is_success:
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.WARNING,
                        "Sleeping for 5 seconds before trying again",
                    )
                    sleep(5)

                # Perform task/stream tasks
                if is_success and not Worker._to_stop:
                    # Clear all pending items
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.INFO,
                        "The system worker is clearing pending stream messages",
                    )
                    Worker._clear_pending_items()

                    # Discover new items and process
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.INFO,
                        "The system worker is discovering new stream messages",
                    )
                    Worker._discover_new_items()

            except Exception as exception:
                # Set the running item
                Worker._set_running_item(None)

                # Base try-except to catch all possible leaked exception and log them.
                error_message = "The system worker encountered an error. " + str(
                    exception
                )

                AppLogger.add_to_log(
                    Worker._logger,
                    logging.ERROR,
                    error_message,
                )
                AppLogger.add_error_to_log(
                    Worker._logger,
                    "SYS",
                    "FSYSx00134",
                    error_message,
                    "Fatal",
                    "worker.py",
                )
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.WARNING,
                    "Sleeping for 5 seconds before restarting the system worker",
                )
                sleep(5)

        # Wait for CTRL-C to quit.
        signal.pause()

        # Trigger a SIGINT signal to shut down the process properly.
        # Terminate process when it reaches the end
        Worker.sigint_handler(signal.SIGINT, 1)

    @staticmethod
    def sigint_handler(signum, frame) -> None:
        """
        A method to handle the SIGINT and trigger shutdown for processes

        Args:
            signum (_type_): Not used
            frame (_type_): Not used
        """
        # Trigger stop processing
        Worker._to_stop = True

        # Cleanup Redis
        Redis.cleanup()

        if Worker._worker_name and Worker._worker_type:
            # Terminate logger instance
            AppLogger.add_to_log(
                Worker._logger,
                logging.INFO,
                f"Stopping: {Worker._worker_name} ({Worker._worker_type})",
            )

        if (
            Worker._logger
            and isinstance(Worker._logger, AppLogger)
            and Worker._logger.logger_instance
        ):
            Worker._logger.logger_instance.stop()

        if (
            Worker._logger
            and isinstance(Worker._logger, AppLogger)
            and Worker._logger.error_logger_instance
        ):
            Worker._logger.error_logger_instance.write_error_to_file()

        # Terminate the application with exit code 0
        sys.exit(0)

    @staticmethod
    def _clear_pending_items() -> None:
        """
        A helper method to clear pending tasks/services that are not fully completed.
        When tasks/services are not being acked and read from the queue, they are called pending tasks/services.
        In this method, we will get the number of pending tasks/services, run the pending tasks/services
        and respond with an error, send the message ack to clear the entry.
        """
        # Get the current pending items list
        pending_items_list = Redis.get_pending_items(Worker._process_redis_message)

        # Clean up all the pending items
        for count in range(len(pending_items_list)):
            AppLogger.add_to_log(
                Worker._logger,
                logging.INFO,
                f"Working on pending stream messages - {count + 1}/{len(pending_items_list)}",
            )

            # Read the pending item from the list
            # Get the pending item instance for processing
            if Worker._worker_type is WorkerType.SERVICE:
                # Service WorkerType
                message_id, message_arguments = pending_items_list[count]
                pending_item = Service(
                    message_id,
                    message_arguments,
                    EnvironmentVariables.get_validation_schemas_folder(),
                    ServiceType.PENDING,
                )
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.INFO,
                    f"Current pending service message: "
                    f"message_id {message_id}, "
                    f"message_args {message_arguments}",
                )
            else:
                # Process WorkerType
                message_id, message_arguments = pending_items_list[count]
                pending_item = Task(
                    message_id,
                    message_arguments,
                    EnvironmentVariables.get_validation_schemas_folder(),
                    TaskType.PENDING,
                )
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.INFO,
                    f"Clearing pending task message: "
                    f"message_id - {message_id}, "
                    f"message_args - {message_arguments}",
                )

            # Process the pending item
            is_success, error_messages = pending_item.process()
            if is_success:
                # Item completed processing
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.INFO,
                    f"The pending stream message processed successfully: "
                    f"message_id - {message_id}, "
                    f"message_args - {message_arguments}",
                )
            else:
                # Item failed processing
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.ERROR,
                    f"The pending stream message processed failed: "
                    f"message_id - {message_id}, "
                    f"message_args - {message_arguments}, "
                    f"error_messages - {error_messages}",
                )

            # Send Response and Ack
            if Worker._send_update(
                pending_item.get_id(),
                pending_item.get_formatted_results(),
                pending_item.get_logger(),
            ):
                Worker._send_acknowledgement(message_id, pending_item.get_logger())
            else:
                # Failed to send update. Do not send acknowledgement
                pass

            # Perform cleanup
            pending_item.cleanup()

    @staticmethod
    def _discover_new_items() -> None:
        """
        A helper method to discover new redis stream items
        In this method, we will get a new item, run the item and send the message ack to clear the entry.
        """
        # Indicate number of items to get from redis stream at one time
        # Indicate number of milliseconds to block each time when reading streams
        get_num_of_items = 1
        blocking_duration = 2000

        # Continuously get new items and generate results
        while not Worker._to_stop:
            # Request for new items to process
            new_items_list = Redis.get_new_items(
                Worker._process_redis_message,
                get_num_of_items,
                blocking_duration,
            )

            # Loop through the message information
            # Create a new item and process the item
            # Send the response through redis
            # Clean up the generated item
            for count in range(len(new_items_list)):
                # Store current running item
                Worker._set_running_item(None)

                # Read the new pending item from the list
                # Get the pending item instance for processing
                if Worker._worker_type is WorkerType.SERVICE:
                    # Service WorkerType
                    message_id, message_arguments = new_items_list[count]
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.INFO,
                        f"Working on new service message: "
                        f"message_id - {message_id}, "
                        f"message_args - {message_arguments}",
                    )
                    new_item = Service(
                        message_id,
                        message_arguments,
                        EnvironmentVariables.get_validation_schemas_folder(),
                        ServiceType.NEW,
                        Worker._send_update,
                    )
                else:
                    # Process WorkerType
                    message_id, message_arguments = new_items_list[count]
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.INFO,
                        f"Working on new task message: "
                        f"message_id - {message_id}, "
                        f"message_args - {message_arguments}",
                    )
                    new_item = Task(
                        message_id,
                        message_arguments,
                        EnvironmentVariables.get_validation_schemas_folder(),
                        TaskType.NEW,
                        Worker._send_update,
                    )

                # Store current running item
                Worker._set_running_item(new_item)

                # Process the new item
                is_success, error_messages = new_item.process()
                if is_success:
                    # Task completed processing
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.INFO,
                        f"The new stream message processed successfully: "
                        f"message_id - {message_id}, "
                        f"message_args - {message_arguments}",
                    )
                else:
                    # Task failed processing
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.ERROR,
                        f"The new stream message processed failed: "
                        f"message_id - {message_id}, "
                        f"message_args - {message_arguments}, "
                        f"error_messages - {error_messages}",
                    )

                # Send Task Response and Ack
                if Worker._send_update(
                    new_item.get_id(),
                    new_item.get_formatted_results(),
                    new_item.get_logger(),
                ):
                    Worker._send_acknowledgement(message_id, new_item.get_logger())
                else:
                    # Failed to send update. Do not send acknowledgement
                    pass

                # Perform cleanup
                new_item.cleanup()

                # Set running item
                Worker._set_running_item(None)

    @staticmethod
    def _get_running_item() -> Union[IWorkerFunction, None]:
        """
        A helper method to return the running item

        Returns:
            Union[IWorkerFunction, None]: An instance of IWorkerFunction or None
        """
        with Worker.lock:
            # Returns the current running item
            return Worker._running_item

    @staticmethod
    def _process_redis_message(response_list: List) -> List:
        """
        A helper callback method to perform processing on messages from redis stream

        Args:
            response_list (List): The list that contains response from the redis stream

        Returns:
            List: A list of items after processing the messages
        """
        new_list = list()
        if Worker._worker_type is WorkerType.SERVICE:
            # Get the message id and the service arguments from the message information
            for count in range(len(response_list[0][1])):
                if response_list[0][0] == REDIS_STREAM_SERVICE_NAME:
                    message_id, message_dict = response_list[0][1][count]
                    new_list.append((message_id, message_dict))
                else:
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.WARNING,
                        f"The new message is not from {REDIS_STREAM_SERVICE_NAME}",
                    )
        else:
            # Get the message id and the task arguments from the message information
            for count in range(len(response_list[0][1])):
                if response_list[0][0] == REDIS_STREAM_TASK_NAME:
                    message_id, message_dict = response_list[0][1][count]
                    new_list.append((message_id, message_dict["task"]))
                else:
                    AppLogger.add_to_log(
                        Worker._logger,
                        logging.WARNING,
                        f"The new message is not from {REDIS_STREAM_TASK_NAME}",
                    )

        return new_list

    @staticmethod
    def _process_task_stop_callback(message: Dict) -> bool:
        """
        A helper callback function to process task stop message

        Args:
            message (Dict): A pubsub message indicating the message id

        Returns:
            bool: True if the task is processed, else False
        """
        if not isinstance(message, dict) or not message:
            # Invalid inputs
            AppLogger.add_to_log(
                Worker._logger,
                logging.INFO,
                "The inputs do not meet the validation rules",
            )
            return False

        item_id = message.get("data", None)
        AppLogger.add_to_log(
            Worker._logger,
            logging.INFO,
            f"The system worker has received request to stop task: {item_id}",
        )

        if is_empty_string(item_id):
            # Invalid item id
            AppLogger.add_to_log(
                Worker._logger,
                logging.ERROR,
                "Requested task not stopped: Empty task id",
            )
            return False

        running_item = Worker._get_running_item()
        if running_item:
            if item_id == running_item.get_id():
                # This is the item that is running now. Cancel this item.
                running_item.cancel()
            else:
                # Running a different item
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.WARNING,
                    "Requested task not stopped: Currently running other tasks",
                )
        else:
            # No running item
            AppLogger.add_to_log(
                Worker._logger,
                logging.WARNING,
                "Requested task not stopped: No running task",
            )
        return True

    @staticmethod
    def _send_update(
        update_id: str, formatted_response: Dict, logger: AppLogger = None
    ) -> bool:
        """
        A helper method to send update using Redis

        Args:
            update_id (str): The id to be updated
            formatted_response (Dict): The formatted response
            logger (AppLogger, optional): The logger for logging.. Defaults to None.

        Returns:
            bool: True if the acknowledgement is sent, else False
        """
        if logger is None:
            logger = Worker._logger

        # Check that the id is not empty
        if (
            is_empty_string(update_id)
            or not isinstance(formatted_response, dict)
            or not formatted_response
        ):
            error_message = "The inputs do not meet the validation rules"
            AppLogger.add_to_log(logger, logging.WARNING, error_message)
            AppLogger.add_error_to_log(
                logger,
                "SYS",
                "FSYSx00135",
                error_message,
                "Fatal",
                "worker.py",
            )
            return False

        # Send Update
        if Redis.send_update(update_id, formatted_response):
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"The update sent successfully: {update_id}:{formatted_response}",
            )
            return True
        else:
            AppLogger.add_to_log(
                logger,
                logging.WARNING,
                f"The update failed to send: {update_id}:{formatted_response}",
            )
            return False

    @staticmethod
    def _send_acknowledgement(message_id: str, logger: AppLogger = None) -> bool:
        """
        A helper method to send acknowledgement using Redis

        Args:
            message_id (str): The message id
            logger (AppLogger, optional): The logger for logging. Defaults to None.

        Returns:
            bool: True if the acknowledgement is sent, else False
        """
        if logger is None:
            logger = Worker._logger

        # Check that the message_id is not empty
        if is_empty_string(message_id):
            error_message = "The inputs do not meet the validation rules"
            AppLogger.add_to_log(logger, logging.WARNING, error_message)
            AppLogger.add_error_to_log(
                logger,
                "SYS",
                "FSYSx00135",
                error_message,
                "Fatal",
                "worker.py",
            )
            return False

        # Send Acknowledgement
        if Redis.send_acknowledgement(message_id):
            AppLogger.add_to_log(
                logger,
                logging.INFO,
                f"The acknowledgement sent successfully - {message_id}",
            )
            return True
        else:
            AppLogger.add_to_log(
                logger,
                logging.WARNING,
                f"The acknowledgement failed to send: {message_id}",
            )
            return False

    @staticmethod
    def _set_running_item(item: Union[IWorkerFunction, None]) -> None:
        """
        A helper method to update the running item

        Args:
            item (Union[IWorkerFunction, None]): An instance of IWorkerFunction or None
        """
        with Worker.lock:
            # Set the running item
            Worker._running_item = item

    @staticmethod
    def _setup_redis(stream_name: str) -> None:
        """
        A helper method to perform setup for redis.
        This includes setting up the pub/sub channels and the stream connections

        Args:
            stream_name (str): The redis stream name to be connected

        Raises:
            RuntimeError: Raise RuntimeError when Redis Pub/Sub channels failed to set up properly
            RuntimeError: Raise RuntimeError when Redis streams failed to set up properly
        """
        AppLogger.add_to_log(
            Worker._logger,
            logging.INFO,
            f"The middleware is establishing connection to "
            f"{EnvironmentVariables.get_redis_server_hostname()}:"
            f"{EnvironmentVariables.get_redis_server_port()}",
        )

        # Establish redis connection
        Redis.setup(
            EnvironmentVariables.get_redis_server_hostname(),
            EnvironmentVariables.get_redis_server_port(),
        )

        # Setup pub/sub channels
        if Worker._worker_type is WorkerType.PROCESS:
            is_success = Redis.connect_to_pubsub(
                **{
                    "TASK_CANCEL": Worker._process_task_stop_callback,
                    "ALGO_INSTALL": PluginController.process_algorithm_install_callback,
                    "ALGO_UPDATE": PluginController.process_algorithm_update_callback,
                    "ALGO_DELETE": PluginController.process_algorithm_delete_callback,
                }
            )
            if is_success:
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.INFO,
                    "The middleware pub/sub channels is set up successfully",
                )
            else:
                error_message = (
                    "The middleware pub/sub channels failed to set up properly"
                )
                AppLogger.add_to_log(
                    Worker._logger,
                    logging.ERROR,
                    error_message,
                )
                AppLogger.add_error_to_log(
                    Worker._logger,
                    "CON",
                    "FCONx00137",
                    error_message,
                    "Fatal",
                    "worker.py",
                )
                raise RuntimeError(error_message)
        else:
            pass  # Other worker type do not need pubsub connection

        # Setup stream connection
        is_success, error_message = Redis.connect_to_stream(
            EnvironmentVariables.get_redis_consumer_group(),
            Worker._worker_name,
            stream_name,
        )
        if is_success:
            AppLogger.add_to_log(
                Worker._logger,
                logging.INFO,
                "The middleware stream connection is set up successfully",
            )
        else:
            # Error setting up redis.
            error_message = f"The middleware stream connection failed to set up properly: {error_message}"
            AppLogger.add_to_log(
                Worker._logger,
                logging.ERROR,
                error_message,
            )
            AppLogger.add_error_to_log(
                Worker._logger,
                "CON",
                "FCONx00136",
                error_message,
                "Fatal",
                "worker.py",
            )
            raise RuntimeError(error_message)
