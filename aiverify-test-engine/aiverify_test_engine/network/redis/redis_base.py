from typing import Tuple, Union

import redis
from aiverify_test_engine.utils.validate_checks import is_empty_string


class RedisBase:
    """
    The RedisBase class focuses on being the base class that allows other classes to inherit.
    """

    def __init__(self):
        self._host_name: str = ""
        self._host_port: int = 0
        self._host_timeout: int = 5
        self._redis_instance: Union[redis.Redis, None] = None

    def connect(self, host_name: str, host_port: int) -> Tuple[bool, str]:
        """
        A method to set up the connection to the redis server for further communications

        Args:
            host_name (str): Redis server address
            host_port (int): Redis server port

        Returns:
            Tuple[bool, str]: True if success, False and the error message if failed
        """
        if (
            is_empty_string(host_name)
            or host_port is None
            or not isinstance(host_port, int)
            or host_port < 0
            or host_port > 65535
        ):
            return False, "There was an error validating the redis host information"

        else:
            self._host_name = host_name
            self._host_port = host_port
            self._redis_instance: redis.Redis = redis.Redis(
                self._host_name,
                self._host_port,
                decode_responses=True,
                socket_connect_timeout=self._host_timeout,
            )
            return True, ""

    def get_redis_instance(self) -> redis.Redis:
        """
        A method to return the redis connection instance

        Returns:
            redis.Redis: Redis instance
        """
        return self._redis_instance
