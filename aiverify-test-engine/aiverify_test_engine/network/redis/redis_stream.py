from typing import Dict, Tuple, Union

import redis
from aiverify_test_engine.network.redis.redis_base import RedisBase
from aiverify_test_engine.utils.validate_checks import is_empty_string


class RedisStream(RedisBase):
    """
    The RedisStream class inherits from RedisBase which does the underlying connection to redis server
    The RedisStream class comprises methods that focus on performing streams-related commands
    """

    def __init__(self):
        super().__init__()
        self._is_setup_completed: bool = False
        self._stream_name: str = ""
        self._consumer_group: str = ""
        self._consumer_name: str = ""

    def setup(
        self,
        host_name: str,
        host_port: int,
        stream_name: str,
        consumer_group: str,
        consumer_name: str,
    ) -> Tuple[bool, str]:
        """
        A method to set up the connection to the redis server for further communications

        Args:
            host_name (str): Redis server address
            host_port (int): Redis server port
            stream_name (str): Redis Stream Name
            consumer_group (str): Redis Consumer Group
            consumer_name (str): Redis Consumer Name

        Returns:
            Tuple[bool, str]: True if success, False if failed
        """
        # Validate the stream arguments
        if (
            stream_name is None
            or not stream_name
            or not isinstance(stream_name, str)
            or consumer_group is None
            or not consumer_group
            or not isinstance(consumer_group, str)
            or consumer_name is None
            or not consumer_name
            or not isinstance(consumer_name, str)
        ):
            return False, "There was an error validating the redis stream information"

        # Create a redis instance that connects to host name and port
        is_success, error_message = super(RedisStream, self).connect(
            host_name, host_port
        )
        if not is_success:
            return False, error_message

        else:
            self._stream_name: str = stream_name
            self._consumer_group: str = consumer_group
            self._consumer_name: str = consumer_name

            # Create consumer group
            try:
                if not self._is_consumer_group_exists():
                    self._create_consumer_group()

                self._is_setup_completed = True
                return True, ""

            except redis.exceptions.TimeoutError as error:
                return (
                    False,
                    f"There was a timeout error to the redis server: {str(error)}",
                )

            except redis.exceptions.ConnectionError as error:
                return (
                    False,
                    f"There was a connection error to the redis server: {str(error)}",
                )

    def read_algorithm_registry(self, algorithm_id: str) -> Union[Dict, None]:
        """
        A method to perform a HGETALL to read the algorithm information for this id.

        Args:
            algorithm_id (str): Algorithm ID to retrieve

        Returns:
            Dict: The algorithm information or None if instance is None
        """
        if (
            not self._is_setup_completed
            or not isinstance(algorithm_id, str)
            or not algorithm_id
        ):
            return None
        else:
            message = (
                super(RedisStream, self).get_redis_instance().hgetall(algorithm_id)
            )
            return message

    def read_number_of_pending_messages(self) -> int:
        """
        A method to perform a consumer group read on the stream for the number of pending message.

        Returns:
            int: The number of pending messages regardless if it is the consumer name. 0 if error found
        """
        if not self._is_setup_completed:
            return 0
        else:
            message = (
                super(RedisStream, self)
                .get_redis_instance()
                .xpending(self._stream_name, self._consumer_group)
            )
            return message.get("pending")

    def read_pending_message(
        self, num_of_messages: int = 1, blocking_duration_ms: Union[int, None] = None
    ) -> Union[list, None]:
        """
        A method to perform a consumer group read on the stream for pending message.

        Args:
            num_of_messages (int, optional): Number of messages to read from redis stream. Defaults to 1.
            blocking_duration_ms (Union[int, None], optional): Number of milliseconds for
            blocking call. Defaults to None.

        Returns:
            Union[list, None]: A list of message information or None if instance is None
        """
        if (
            not self._is_setup_completed
            or not isinstance(num_of_messages, int)
            or not (
                blocking_duration_ms is None or isinstance(blocking_duration_ms, int)
            )
        ):
            return None
        else:
            message = (
                super(RedisStream, self)
                .get_redis_instance()
                .xreadgroup(
                    self._consumer_group,
                    self._consumer_name,
                    {self._stream_name: "0-0"},
                    num_of_messages,
                    blocking_duration_ms,
                )
            )
            return message

    def read_message(
        self, num_of_messages: int = 1, blocking_duration_ms: Union[int, None] = None
    ) -> Union[list, None]:
        """
        A method to perform a consumer group read on the stream and returns a message if there is

        Args:
            num_of_messages (int, optional): Number of messages to read from redis stream. Defaults to 1.
            blocking_duration_ms (Union[int, None], optional): Number of milliseconds for
            blocking call. Defaults to None.

        Returns:
            Union[list, None]: A list of message information or None if instance is None
        """
        if (
            not self._is_setup_completed
            or not isinstance(num_of_messages, int)
            or not (
                blocking_duration_ms is None or isinstance(blocking_duration_ms, int)
            )
        ):
            return None
        else:
            message = (
                super(RedisStream, self)
                .get_redis_instance()
                .xreadgroup(
                    self._consumer_group,
                    self._consumer_name,
                    {self._stream_name: ">"},
                    num_of_messages,
                    blocking_duration_ms,
                )
            )
            return message

    def send_update(self, message_id: str, message_dict: Dict) -> bool:
        """
        A method to send message response through HSET.

        Args:
            message_id (str): The HSET identifier
            message_dict (Dict): A dictionary of items to be set by HSET

        Returns:
            bool: True if success, False if failed
        """
        if (
            not self._is_setup_completed
            or is_empty_string(message_id)
            or message_dict is None
            or not isinstance(message_id, str)
            or not isinstance(message_dict, dict)
            or not message_dict
        ):
            return False
        else:
            for key, value in message_dict.items():
                super(RedisStream, self).get_redis_instance().hset(
                    message_id, key, value
                )
            return True

    def send_message_acknowledgement(self, message_id: str) -> bool:
        """
        A method to perform an acknowledgement on the message id

        Args:
            message_id (str): Redis message id

        Returns:
            bool: True if success, False if failed
        """
        if (
            not self._is_setup_completed
            or is_empty_string(message_id)
            or not isinstance(message_id, str)
        ):
            return False
        else:
            try:
                super(RedisStream, self).get_redis_instance().xack(
                    self._stream_name, self._consumer_group, message_id
                )
                return True

            except redis.exceptions.ResponseError:
                return False

    def _is_consumer_group_exists(self) -> bool:
        """
        A helper method to verifies if the consumer group exists in the stream

        Returns:
            bool: True if consumer group exists, False if it does not exist
        """
        is_group_exists = False

        # Get the consumer groups for this stream
        # Search through the return consumer groups list and see if it exists
        # It is possible that stream name might not be found yet.
        try:
            groups = (
                super(RedisStream, self)
                .get_redis_instance()
                .xinfo_groups(self._stream_name)
            )
            for tmp_group in groups:
                if tmp_group.get("name") == self._consumer_group:
                    is_group_exists = True
                else:
                    pass  # pragma: no cover

            return is_group_exists

        except Exception as error:
            if str(error) == "no such key":
                # This just means that the stream name does not exist in redis yet.
                return is_group_exists
            else:
                raise

    def _create_consumer_group(self) -> None:
        """
        A helper method to create a consumer group on the stream.
        """
        super(RedisStream, self).get_redis_instance().xgroup_create(
            self._stream_name, self._consumer_group, "0", True
        )
