import subprocess

import pytest
import redis.client

from test_engine_core.network.redis.redis_pubsub import RedisPubSub

pytest.skip("skipping redis test; possibly deprecating", allow_module_level=True)


def subscribe_callback_function():
    """
    A test callback function
    """
    print("HelloWorld")


class TestCollectionRedisPubSub:
    pytest.callback_func = subscribe_callback_function

    def test_init_redis_pubsub(self):
        """
        Tests initalizing redis pubsub
        """
        redis_pubsub = RedisPubSub()
        assert redis_pubsub._channel_name == ""
        assert redis_pubsub._is_setup_completed is False
        assert redis_pubsub._pubsub_instance is None
        assert redis_pubsub._pubsub_instance is None

    @pytest.mark.parametrize(
        "host_name, host_port, channel_name, expected_instance, expected_response, expected_error_msg",
        [
            # Test host name and host port
            ("localhost", 5000, "my_channel", True, True, ""),
            ("127.0.0.1", 6379, "my_channel", True, True, ""),
            ("1.2.3.4", 6379, "my_channel", True, True, ""),
            (
                "localhost",
                99999,
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                -5000,
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "8080",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "",
                "8080",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "",
                "",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                "8080",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                None,
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                None,
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                "8080",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "None",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                "None",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                None,
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                "None",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                123,
                "8080",
                "my_channel",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            # Test channel name
            (
                "localhost",
                5000,
                "",
                False,
                False,
                "There was an error validating the redis channel name",
            ),
            ("localhost", 5000, "None", True, True, ""),
            ("localhost", 5000, "&^@*^#@*^#@", True, True, ""),
            ("localhost", 5000, "12345", True, True, ""),
            (
                "localhost",
                5000,
                12345,
                False,
                False,
                "There was an error validating the redis channel name",
            ),
            (
                "localhost",
                5000,
                None,
                False,
                False,
                "There was an error validating the redis channel name",
            ),
        ],
    )
    def test_setup(
        self,
        host_name,
        host_port,
        channel_name,
        expected_instance,
        expected_response,
        expected_error_msg,
    ):
        """
        Tests setting up the redis pubsub
        """
        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.setup(host_name, host_port, channel_name)
        assert response is expected_response
        assert error_message == expected_error_msg

        if expected_instance:
            assert redis_pubsub._pubsub_instance is not None
            assert type(redis_pubsub._pubsub_instance) is redis.client.PubSub
        else:
            assert redis_pubsub._pubsub_instance is None

    def test_publish_no_instance(self):
        """
        Tests publish without initializing the instance
        """
        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.publish("new_message")
        assert response is False
        assert (
            error_message == "There was an error publishing message through the "
            "pubsub channel due to the setup not completed"
        )

    def test_publish_no_connection(self):
        """
        Tests publish with no connection to redis server
        """
        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.setup("localhost", 5000, "my_channel")
        assert response is True
        assert error_message == ""

        response, error_message = redis_pubsub.publish("message")
        assert response is False
        assert (
            error_message == "There was a connection error to the redis server: "
            "Error 111 connecting to localhost:5000. Connection refused."
        )

    @pytest.mark.parametrize(
        "message, expected_response, expected_error_message",
        [
            # Test host name and host port
            ("my_message", True, ""),
            (
                None,
                False,
                "There was an error publishing message through the "
                "pubsub channel due to the message: None",
            ),
            (
                "",
                False,
                "There was an error publishing message through the "
                "pubsub channel due to the message: ",
            ),
            ("None", True, ""),
        ],
    )
    def test_publish(self, message, expected_response, expected_error_message):
        """
        Tests for publishing message
        """
        # Setup for redis-server to start:
        subprocess.call(["sudo", "service", "redis-server", "start"])

        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.setup("localhost", 6379, "my_channel")
        assert response is True
        assert error_message == ""

        response, error_message = redis_pubsub.publish(message)
        assert response is expected_response
        assert error_message == expected_error_message

    def test_subscribe_no_instance(self):
        """
        Tests subscribe without initializing the instance
        """
        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.subscribe(pytest.callback_func)
        assert response is False
        assert (
            error_message == "There was an error subscribing message through the "
            "pubsub channel due to the setup not completed"
        )

    def test_subscribe_no_connection(self):
        """
        Tests subscribe with no connection to redis server
        """
        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.setup("localhost", 5000, "my_channel")
        assert response is True
        assert error_message == ""
        response, error_message = redis_pubsub.subscribe(pytest.callback_func)
        assert response is False
        assert (
            error_message == "There was a connection error to the redis server: "
            "Error 111 connecting to localhost:5000. Connection refused."
        )

    @pytest.mark.parametrize(
        "callback_function, sleep_time, has_instance, expected_response, expected_error_message",
        [
            (pytest.callback_func, 1.0, True, True, ""),
            (pytest.callback_func, 0.0, True, True, ""),
            (
                pytest.callback_func,
                -1.0,
                False,
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to an invalid sleep time: -1.0",
            ),
            (
                pytest.callback_func,
                None,
                False,
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to an invalid sleep time: None",
            ),
            (
                pytest.callback_func,
                "None",
                False,
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to an invalid sleep time: None",
            ),
            (
                None,
                1.0,
                False,
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to an invalid callback: None",
            ),
            (
                "None",
                1.0,
                False,
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to an invalid callback: None",
            ),
            (
                123,
                1.0,
                False,
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to an invalid callback: 123",
            ),
            (
                -123,
                1.0,
                False,
                False,
                "There was an error subscribing message through the "
                "pubsub channel due to an invalid callback: -123",
            ),
        ],
    )
    def test_subscribe(
        self,
        callback_function,
        sleep_time,
        has_instance,
        expected_response,
        expected_error_message,
    ):
        """
        Tests subscribe to redis server
        """
        # Setup for redis-server to start:
        subprocess.call(["sudo", "service", "redis-server", "start"])

        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.setup("localhost", 6379, "my_channel")
        assert response is True
        assert error_message == ""

        response, error_message = redis_pubsub.subscribe(callback_function, sleep_time)
        assert response is expected_response
        assert error_message == expected_error_message

        if has_instance:
            # Stop subscribing to the channel
            assert redis_pubsub._pubsub_thread is not None
            redis_pubsub.stop()

    def test_stop_no_instance(self):
        """
        Tests stop to redis server with no instance
        """
        redis_pubsub = RedisPubSub()
        assert redis_pubsub._pubsub_thread is None

        redis_pubsub.stop()
        assert redis_pubsub._pubsub_thread is None

    def test_stop_no_subscription(self):
        """
        Tests stop to redis server
        """
        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.setup("localhost", 6379, "my_channel")
        assert response is True
        assert error_message == ""

        assert redis_pubsub._pubsub_thread is None
        redis_pubsub.stop()
        assert redis_pubsub._pubsub_thread is None

    def test_stop(self):
        """
        Tests stop function
        """
        redis_pubsub = RedisPubSub()
        response, error_message = redis_pubsub.setup("localhost", 6379, "my_channel")
        assert response is True
        assert error_message == ""

        response, error_message = redis_pubsub.subscribe(pytest.callback_func)
        assert response is True
        assert error_message == ""

        assert redis_pubsub._pubsub_thread is not None
        redis_pubsub.stop()
        assert redis_pubsub._pubsub_thread is None
