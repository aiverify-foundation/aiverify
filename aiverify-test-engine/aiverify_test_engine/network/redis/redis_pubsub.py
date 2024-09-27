from typing import Callable, Tuple, Union

import redis
from aiverify_test_engine.network.redis.redis_base import RedisBase
from aiverify_test_engine.utils.validate_checks import is_empty_string


class RedisPubSub(RedisBase):
    """
    The RedisPubSub class inherits from RedisBase which does the underlying connection to redis server
    The RedisPubSub class comprises methods that focus on performing pub/sub related commands
    """

    def __init__(self):
        super().__init__()
        self._channel_name: str = ""
        self._is_setup_completed: bool = False
        self._pubsub_instance: Union[redis.client.PubSub, None] = None
        self._pubsub_thread: Union[redis.client.PubSubWorkerThread, None] = None

    def setup(
        self, host_name: str, host_port: int, channel_name: str
    ) -> Tuple[bool, str]:
        """
        A method to set up the connection to the redis server for further communications

        Args:
            host_name (str): Redis server address
            host_port (int): Redis server port
            channel_name (str): Redis pub channel name

        Returns:
            Tuple[bool, str]: True if success, False and error message if failed
        """
        # Validate the pub arguments
        if is_empty_string(channel_name) or not isinstance(channel_name, str):
            return False, "There was an error validating the redis channel name"

        # Create a redis instance that connects to host name and port
        is_success, error_message = super(RedisPubSub, self).connect(
            host_name, host_port
        )
        if not is_success:
            return False, error_message

        else:
            self._channel_name = channel_name
            self._is_setup_completed = True
            self._pubsub_instance = (
                super(RedisPubSub, self).get_redis_instance().pubsub()
            )
            return True, ""

    def publish(self, message: str) -> Tuple[bool, str]:
        """
        A method to publish message through the PUB/SUB channel

        Args:
            message (str): A message to be published through the PUB/SUB channel

        Returns:
            Tuple[bool, str]: True if success, False if failed with error message
        """
        if not self._is_setup_completed:
            return (
                False,
                "There was an error publishing message through the "
                "pubsub channel due to the setup not completed",
            )

        elif is_empty_string(message):
            return (
                False,
                f"There was an error publishing message through the "
                f"pubsub channel due to the message: {message}",
            )

        else:
            try:
                super(RedisPubSub, self).get_redis_instance().publish(
                    self._channel_name, message
                )
                return True, ""

            except redis.exceptions.ConnectionError as error:
                return (
                    False,
                    f"There was a connection error to the redis server: {str(error)}",
                )

    def subscribe(
        self, callback: Callable, sleep_time: float = 1.0
    ) -> Tuple[bool, str]:
        """
        A method to subscribe to PUB/SUB channel

        Args:
            callback (Callable): The callback method when receive a message on the channel
            sleep_time (float, optional): Sleeping time when there is no msg. Defaults to 1.0.

        Returns:
            bool: True if success, False if failed with error message
        """
        if not self._is_setup_completed:
            return (
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to the setup not completed",
            )

        elif (
            sleep_time is None or not isinstance(sleep_time, float) or sleep_time < 0.0
        ):
            return (
                False,
                "There was an error subscribing message through the "
                f"pubsub channel due to an invalid sleep time: {sleep_time}",
            )

        elif callback is None or not callable(callback):
            return (
                False,
                "There was an error subscribing message through the "
                f"pubsub channel due to an invalid callback: {callback}",
            )

        else:
            try:
                self._pubsub_instance.subscribe(**{self._channel_name: callback})
                self._pubsub_thread = self._pubsub_instance.run_in_thread(
                    sleep_time=sleep_time
                )
                return True, ""

            except redis.exceptions.ConnectionError as error:
                return (
                    False,
                    f"There was a connection error to the redis server: {str(error)}",
                )

    def stop(self) -> None:
        """
        A method to stop the subscription thread
        """
        if self._pubsub_thread:
            self._pubsub_thread.stop()
            self._pubsub_thread = None
