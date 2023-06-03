import subprocess
from typing import List

import pytest
import redis.exceptions
from redis.commands.core import HashCommands, StreamCommands
from test_engine_core.network.redis.redis_pubsub import RedisPubSub
from test_engine_core.network.redis.redis_stream import RedisStream

from test_engine_app.app_logger import AppLogger
from test_engine_app.network.redis import Redis


class TestCollectionRedis:
    pytest.my_logger = AppLogger()
    pytest.my_logger.generate_logger()

    def connection_error_side_effect(self, *args, **kwargs):
        raise redis.exceptions.ConnectionError("MockConnectionErrorResponse")

    def my_callback_function(self, message):
        print(message)

    def my_callback_function_get_items(self, items: List):
        print(items)
        return items

    def my_callback_function_false_get_items(self, items: List):
        print(items)
        return "HelloWorld"

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        Redis._logger = None
        Redis._server_hostname = None
        Redis._server_hostport = None
        Redis._alert_pubsub = None
        Redis._algo_install_pubsub = None
        Redis._algo_update_pubsub = None
        Redis._algo_delete_pubsub = None
        Redis._task_cancel_pubsub = None
        Redis._stream_listener = None

        # Perform tests
        yield

        # Reset
        Redis._logger = None
        Redis._server_hostname = None
        Redis._server_hostport = None
        Redis._alert_pubsub = None
        Redis._algo_install_pubsub = None
        Redis._algo_update_pubsub = None
        Redis._algo_delete_pubsub = None
        Redis._task_cancel_pubsub = None
        Redis._stream_listener = None

    @pytest.mark.parametrize(
        "hostname, port, expected_hostname, expected_hostport",
        [
            ("localhost", 1234, "localhost", 1234),
            (None, 1234, None, 1234),
            ("None", 1234, "None", 1234),
            (1234, 1234, None, 1234),
            ([], 1234, None, 1234),
            ({}, 1234, None, 1234),
            ("localhost", None, "localhost", None),
            ("localhost", "None", "localhost", None),
            ("localhost", 1234, "localhost", 1234),
            ("localhost", [], "localhost", None),
            ("localhost", {}, "localhost", None),
        ],
    )
    def test_set_setup(self, hostname, port, expected_hostname, expected_hostport):
        """
        Tests set setup
        """
        assert Redis._server_hostname is None
        assert Redis._server_hostport is None

        Redis.setup(hostname, port)

        assert Redis._server_hostname == expected_hostname
        assert Redis._server_hostport == expected_hostport

    @pytest.mark.parametrize(
        "logger, expected_response",
        [
            (pytest.my_logger, pytest.my_logger),
            (None, None),
            ("None", None),
            (1234, None),
            ([], None),
            ({}, None),
        ],
    )
    def test_set_logger(self, logger, expected_response):
        """
        Tests set logger
        """
        assert Redis._logger is None
        Redis.set_logger(logger)
        assert Redis._logger == expected_response

    @pytest.mark.parametrize(
        "hostname, hostport, consumer_group, consumer_name, stream_name, expected_output",
        [
            # Ok
            ("localhost", 6379, "MyGroup", "ConsumerName", "StreamName", (True, "")),

            # Test host name
            (None, 6379, "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("None", 6379, "MyGroup", "ConsumerName", "StreamName",
             (False, "The middleware is unreachable. There was a connection error to the redis server: "
                     "Error -3 connecting to None:6379. Temporary failure in name resolution.")),
            ("", 6379, "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ([], 6379, "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ({}, 6379, "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            (1234, 6379, "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),

            # Test host port
            ("localhost", None, "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", "None", "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", "", "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", [], "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", {}, "MyGroup", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 1234, "MyGroup", "ConsumerName", "StreamName",
             (False, "The middleware is unreachable. There was a connection error to the redis server: "
                     "Error 111 connecting to localhost:1234. Connection refused.")),

            # Test consumer group
            ("localhost", 6379, None, "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "None", "ConsumerName", "StreamName", (True, "")),
            ("localhost", 6379, "", "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, [], "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, {}, "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, 1234, "ConsumerName", "StreamName",
             (False, "The inputs do not meet the validation rules")),

            # Test consumer name
            ("localhost", 6379, "MyGroup", None, "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", "None", "StreamName", (True, "")),
            ("localhost", 6379, "MyGroup", "", "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", [], "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", {}, "StreamName",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", 1234, "StreamName",
             (False, "The inputs do not meet the validation rules")),

            # Test stream name
            ("localhost", 6379, "MyGroup", "ConsumerName", None,
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", "ConsumerName", "None", (True, "")),
            ("localhost", 6379, "MyGroup", "ConsumerName", "",
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", "ConsumerName", [],
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", "ConsumerName", {},
             (False, "The inputs do not meet the validation rules")),
            ("localhost", 6379, "MyGroup", "ConsumerName", 1234,
             (False, "The inputs do not meet the validation rules")),
        ],
    )
    def test_connect_to_stream(self, hostname, hostport, consumer_group, consumer_name, stream_name, expected_output):
        """
        Tests connecting to stream
        """
        # Set logger
        Redis.set_logger(pytest.my_logger)

        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        # Setup redis host name and host port
        Redis.setup(hostname, hostport)

        # Connect to stream
        output_tuple = Redis.connect_to_stream(consumer_group, consumer_name, stream_name)
        assert output_tuple == expected_output

    @pytest.mark.parametrize(
        "hostname, hostport, consumer_group, consumer_name, stream_name, expected_output",
        [
            ("localhost", 6379, "MyGroup", "ConsumerName", "StreamName",
             (False, "The middleware is unreachable. There was a connection error to the redis server: "
                     "Error 111 connecting to localhost:6379. Connection refused.")),
        ]
    )
    def test_connect_to_stream_no_redis_server(self, hostname, hostport, consumer_group, consumer_name, stream_name, expected_output):
        """
        Tests connecting to stream with no redis server
        """
        # Set logger
        Redis.set_logger(pytest.my_logger)

        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "stop"])

        # Setup redis host name and host port
        Redis.setup(hostname, hostport)

        # Connect to stream
        output_tuple = Redis.connect_to_stream(consumer_group, consumer_name, stream_name)
        assert output_tuple == expected_output

    @pytest.mark.parametrize(
        "kwargs, expected_output",
        [
            (
                {
                    "TASK_CANCEL": my_callback_function,
                    "ALGO_INSTALL": my_callback_function,
                    "ALGO_UPDATE": my_callback_function,
                    "ALGO_DELETE": my_callback_function,
                },
                True
            ),
            (
                {
                    "TASK_CANCEL": my_callback_function,
                },
                False
            ),
            (
                {
                    "TASK_CANCEL": None,
                },
                False
            )
        ]
    )
    def test_connect_to_pubsub(self, kwargs, expected_output):
        """
        Tests connecting to pubsub
        """
        # Set logger
        Redis.set_logger(pytest.my_logger)

        # Setup redis host name and host port
        Redis.setup("localhost", 1234)

        # Connect to pubsub
        output = Redis.connect_to_pubsub(**kwargs)
        assert output == expected_output

    @pytest.mark.parametrize(
        "kwargs, expected_output",
        [
            (
                {
                    "TASK_CANCEL": my_callback_function,
                    "ALGO_INSTALL": my_callback_function,
                    "ALGO_UPDATE": my_callback_function,
                    "ALGO_DELETE": my_callback_function,
                },
                False
            ),
        ]
    )
    def test_connect_to_pubsub_no_redis_server(self, kwargs, expected_output):
        """
        Tests connecting to pubsub with no redis server
        """
        # Set logger
        Redis.set_logger(pytest.my_logger)

        # Connect to pubsub
        output = Redis.connect_to_pubsub(**kwargs)
        assert output == expected_output

    @pytest.mark.parametrize(
        "kwargs, expected_output",
        [
            (
                {
                    "TASK_CANCEL": my_callback_function,
                    "ALGO_INSTALL": my_callback_function,
                    "ALGO_UPDATE": my_callback_function,
                    "ALGO_DELETE": my_callback_function,
                },
                False
            ),
        ]
    )
    def test_connect_to_pubsub_mock_failed_subscription(self, mocker, kwargs, expected_output):
        """
        Tests connecting to pubsub with failed subscription
        """
        with mocker.patch.object(RedisPubSub, "subscribe", return_value=False):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup redis host name and host port
            Redis.setup("localhost", 1234)

            # Connect to pubsub
            output = Redis.connect_to_pubsub(**kwargs)
            assert output == expected_output

    @pytest.mark.parametrize(
        "kwargs, expected_output",
        [
            (
                {
                    "TASK_CANCEL": my_callback_function,
                    "ALGO_INSTALL": my_callback_function,
                    "ALGO_UPDATE": my_callback_function,
                    "ALGO_DELETE": my_callback_function,
                },
                False
            ),
        ]
    )
    def test_connect_to_pubsub_mock_failed_setup(self, mocker, kwargs, expected_output):
        """
        Tests connecting to pubsub with failed setup
        """
        with mocker.patch.object(RedisPubSub, "setup",
                                 return_value=(False, "There was an error validating the redis channel name")):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup redis host name and host port
            Redis.setup("localhost", 1234)

            # Connect to pubsub
            output = Redis.connect_to_pubsub(**kwargs)
            assert output == expected_output

    @pytest.mark.parametrize(
        "kwargs, expected_output",
        [
            (
                {
                    "TASK_CANCEL": my_callback_function,
                    "ALGO_INSTALL": my_callback_function,
                    "ALGO_UPDATE": my_callback_function,
                    "ALGO_DELETE": my_callback_function,
                },
                True
            ),
        ]
    )
    def test_cleanup(self, kwargs, expected_output):
        """
        Tests cleaning up all the pubsub channels
        """
        # Set logger
        Redis.set_logger(pytest.my_logger)

        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        # Setup redis host name and host port
        Redis.setup("localhost", 6379)

        # Connect to pubsub
        output = Redis.connect_to_pubsub(**kwargs)
        assert output == expected_output

        # Perform cleanup
        assert Redis._task_cancel_pubsub._pubsub_thread is not None
        assert Redis._algo_install_pubsub._pubsub_thread is not None
        assert Redis._algo_update_pubsub._pubsub_thread is not None
        assert Redis._algo_delete_pubsub._pubsub_thread is not None

        Redis.cleanup()

        assert Redis._task_cancel_pubsub._pubsub_thread is None
        assert Redis._algo_install_pubsub._pubsub_thread is None
        assert Redis._algo_update_pubsub._pubsub_thread is None
        assert Redis._algo_delete_pubsub._pubsub_thread is None

    @pytest.mark.parametrize(
        "kwargs, expected_output",
        [
            (
                {
                    "TASK_CANCEL": my_callback_function,
                    "ALGO_INSTALL": my_callback_function,
                    "ALGO_UPDATE": my_callback_function,
                    "ALGO_DELETE": my_callback_function,
                },
                True
            ),
        ]
    )
    def test_cleanup_no_redis_server(self, kwargs, expected_output):
        """
        Tests cleaning up all the pubsub channels
        """
        # Set logger
        Redis.set_logger(pytest.my_logger)

        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "stop"])
        subprocess.call(["redis-cli", "flushall"])

        # Setup redis host name and host port
        Redis.setup("localhost", 6379)

        # Connect to pubsub
        output = Redis.connect_to_pubsub(**kwargs)
        assert output == expected_output

        # Perform cleanup
        assert Redis._task_cancel_pubsub._pubsub_thread is None
        assert Redis._algo_install_pubsub._pubsub_thread is None
        assert Redis._algo_update_pubsub._pubsub_thread is None
        assert Redis._algo_delete_pubsub._pubsub_thread is None

        Redis.cleanup()

        assert Redis._task_cancel_pubsub._pubsub_thread is None
        assert Redis._algo_install_pubsub._pubsub_thread is None
        assert Redis._algo_update_pubsub._pubsub_thread is None
        assert Redis._algo_delete_pubsub._pubsub_thread is None

    @pytest.mark.parametrize(
        "kwargs, expected_output",
        [
            (
                {
                },
                False
            ),
        ]
    )
    def test_cleanup_no_kwargs(self, kwargs, expected_output):
        """
        Tests cleaning up all the pubsub channels
        """
        # Set logger
        Redis.set_logger(pytest.my_logger)

        # Setup redis host name and host port
        Redis.setup("localhost", 6379)

        # Connect to pubsub
        output = Redis.connect_to_pubsub(**kwargs)
        assert output == expected_output

        # Perform cleanup
        assert Redis._task_cancel_pubsub is None
        assert Redis._algo_install_pubsub is None
        assert Redis._algo_update_pubsub is None
        assert Redis._algo_delete_pubsub is None

        Redis.cleanup()

        assert Redis._task_cancel_pubsub is None
        assert Redis._algo_install_pubsub is None
        assert Redis._algo_update_pubsub is None
        assert Redis._algo_delete_pubsub is None

    @pytest.mark.parametrize(
        "algorithm_id, expected_output",
        [
            (
                    "partial_dependence_plot",
                    {
                        "partial_dependence_plot": "algorithm_info"
                    }
            ),
            (
                "",
                {}
            )
        ]
    )
    def test_get_algorithm_info(self, mocker, algorithm_id, expected_output):
        """
        Tests getting the algorithm info
        """
        with mocker.patch.object(HashCommands, "hgetall",
                                 return_value={algorithm_id: "algorithm_info"}):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.get_algorithm_info(algorithm_id)
            assert output == expected_output

    @pytest.mark.parametrize(
        "algorithm_id, expected_output",
        [
            (
                "partial_dependence_plot",
                {}
            ),
        ]
    )
    def test_get_algorithm_info_no_stream_listener(self, mocker, algorithm_id, expected_output):
        """
        Tests getting the algorithm info
        """
        with mocker.patch.object(HashCommands, "hgetall",
                                 return_value={algorithm_id: "algorithm_info"}):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "stop"])
            subprocess.call(["redis-cli", "flushall"])

            # Get the algorithm information
            output = Redis.get_algorithm_info(algorithm_id)
            assert output == expected_output


    @pytest.mark.parametrize(
        "algorithm_id, return_value, expected_output",
        [
            (
                "partial_dependence_plot",
                False,
                {}
            ),
            (
                "partial_dependence_plot",
                None,
                {}
            ),
            (
                "partial_dependence_plot",
                "None",
                {}
            ),
            (
                "partial_dependence_plot",
                {},
                {}
            ),
            (
                "partial_dependence_plot",
                [],
                {}
            ),
            (
                "partial_dependence_plot",
                1234,
                {}
            ),
        ]
    )
    def test_get_algorithm_info_invalid_read_algorithm_registry(self, mocker, algorithm_id, return_value, expected_output):
        """
        Tests getting the algorithm info
        """
        with mocker.patch.object(RedisStream, "read_algorithm_registry",
                                 return_value=return_value):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.get_algorithm_info(algorithm_id)
            assert output == expected_output


    @pytest.mark.parametrize(
        "algorithm_id, return_value, expected_output",
        [
            (
                "partial_dependence_plot",
                False,
                {}
            ),
        ]
    )
    def test_get_algorithm_info_connection_error(self, mocker, algorithm_id, return_value, expected_output):
        """
        Tests getting the algorithm info
        """
        with mocker.patch.object(RedisStream, "read_algorithm_registry",
                                 side_effect=self.connection_error_side_effect):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.get_algorithm_info(algorithm_id)
            assert output == expected_output

    @pytest.mark.parametrize(
        "read_num_of_jobs, blocking_duration_ms, true_callback_function, expected_output",
        [
            (
                    1,
                    1000,
                    True,
                    ["mymockmessage"]
            ),
            (
                    None,
                    1000,
                    True,
                    []
            ),
            (
                    "None",
                    1000,
                    True,
                    []
            ),
            (
                    {},
                    1000,
                    True,
                    []
            ),
            (
                    [],
                    1000,
                    True,
                    []
            ),
            (
                    1234,
                    1000,
                    True,
                    ["mymockmessage"]
            ),
            (
                    1,
                    None,
                    True,
                    ["mymockmessage"]
            ),
            (
                    1,
                    "None",
                    True,
                    []
            ),
            (
                    1,
                    {},
                    True,
                    []
            ),
            (
                    1,
                    [],
                    True,
                    []
            ),
            (
                    1,
                    1234,
                    False,
                    []
            ),
            (
                    1,
                    1000,
                    False,
                    []
            ),
            (
                    None,
                    1000,
                    False,
                    []
            ),
            (
                    "None",
                    1000,
                    False,
                    []
            ),
            (
                    {},
                    1000,
                    False,
                    []
            ),
            (
                    [],
                    1000,
                    False,
                    []
            ),
            (
                    1234,
                    1000,
                    False,
                    []
            ),
            (
                    1,
                    None,
                    False,
                    []
            ),
            (
                    1,
                    "None",
                    False,
                    []
            ),
            (
                    1,
                    {},
                    False,
                    []
            ),
            (
                    1,
                    [],
                    False,
                    []
            ),
            (
                    1,
                    1234,
                    False,
                    []
            )
        ]
    )
    def test_get_new_items(self, mocker, read_num_of_jobs, blocking_duration_ms, true_callback_function,
                           expected_output):
        """
        Tests getting the new items
        """
        with mocker.patch.object(StreamCommands, "xreadgroup",
                                 return_value=["mymockmessage"]):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            if true_callback_function:
                output = Redis.get_new_items(self.my_callback_function_get_items, read_num_of_jobs,
                                             blocking_duration_ms)
            else:
                output = Redis.get_new_items(self.my_callback_function_false_get_items, read_num_of_jobs,
                                             blocking_duration_ms)

            assert output == expected_output

    @pytest.mark.parametrize(
        "read_num_of_jobs, blocking_duration_ms, expected_output",
        [
            (
                    1,
                    1000,
                    []
            ),
        ]
    )
    def test_get_new_items_invalid_validation(self, mocker, read_num_of_jobs, blocking_duration_ms,
                                              expected_output):
        """
        Tests getting the new items
        """
        with mocker.patch.object(StreamCommands, "xreadgroup",
                                 return_value=["mymockmessage"]):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.get_new_items(None, read_num_of_jobs,
                                         blocking_duration_ms)

            assert output == expected_output

    @pytest.mark.parametrize(
        "read_num_of_jobs, blocking_duration_ms, expected_output",
        [
            (
                    1,
                    1000,
                    []
            ),
        ]
    )
    def test_get_new_items_no_stream_listener(self, mocker, read_num_of_jobs, blocking_duration_ms, expected_output):
        """
        Tests getting the new items
        """
        with mocker.patch.object(StreamCommands, "xreadgroup",
                                 return_value=["mymockmessage"]):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "stop"])
            subprocess.call(["redis-cli", "flushall"])

            # Get the algorithm information
            output = Redis.get_new_items(self.my_callback_function_get_items, read_num_of_jobs, blocking_duration_ms)
            assert output == expected_output

    @pytest.mark.parametrize(
        "read_num_of_jobs, blocking_duration_ms, expected_output",
        [
            (
                    1,
                    1000,
                    []
            ),
        ]
    )
    def test_get_new_items_invalid_read_message(self, mocker, read_num_of_jobs, blocking_duration_ms, expected_output):
        """
        Tests getting the new items
        """
        with mocker.patch.object(RedisStream, "read_message", return_value=None):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.get_new_items(self.my_callback_function_get_items, read_num_of_jobs, blocking_duration_ms)
            assert output == expected_output

    @pytest.mark.parametrize(
        "read_num_of_jobs, blocking_duration_ms, expected_output",
        [
            (
                    1,
                    1000,
                    []
            ),
        ]
    )
    def test_get_new_items_connection_error(self, mocker, read_num_of_jobs, blocking_duration_ms, expected_output):
        """
        Tests getting the new items
        """
        with mocker.patch.object(RedisStream, "read_message",
                                 side_effect=self.connection_error_side_effect):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.get_new_items(self.my_callback_function_get_items, read_num_of_jobs, blocking_duration_ms)
            assert output == expected_output

    @pytest.mark.parametrize(
        "true_callback_function, expected_output",
        [
            (
                    True,
                    ["mymockmessage"]
            ),
            (
                    False,
                    []
            ),
        ]
    )
    def test_get_pending_items(self, mocker, true_callback_function, expected_output):
        """
        Tests getting the pending items
        """
        with (
            mocker.patch.object(RedisStream, "read_number_of_pending_messages", return_value=1),
            mocker.patch.object(StreamCommands, "xreadgroup", return_value=["mymockmessage"])
        ):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            if true_callback_function:
                output = Redis.get_pending_items(self.my_callback_function_get_items)
            else:
                output = Redis.get_pending_items(self.my_callback_function_false_get_items)

            assert output == expected_output

    @pytest.mark.parametrize(
        "true_callback_function, expected_output",
        [
            (
                    True,
                    []
            ),
            (
                    False,
                    []
            ),
        ]
    )
    def test_get_pending_items_no_pending_items(self, mocker, true_callback_function, expected_output):
        """
        Tests getting the pending items
        """
        with (
            mocker.patch.object(RedisStream, "read_number_of_pending_messages", return_value=0),
            mocker.patch.object(StreamCommands, "xreadgroup", return_value=["mymockmessage"])
        ):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            if true_callback_function:
                output = Redis.get_pending_items(self.my_callback_function_get_items)
            else:
                output = Redis.get_pending_items(self.my_callback_function_false_get_items)

            assert output == expected_output

    def test_get_pending_items_invalid_validation(self, mocker):
        """
        Tests getting the pending items
        """
        with (
            mocker.patch.object(RedisStream, "read_number_of_pending_messages", return_value=1),
            mocker.patch.object(StreamCommands, "xreadgroup", return_value=["mymockmessage"])
        ):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.get_pending_items(None)

            assert output == []

    @pytest.mark.parametrize(
        "true_callback_function, expected_output",
        [
            (
                    True,
                    []
            ),
        ]
    )
    def test_get_pending_items_connection_error(self, mocker, true_callback_function, expected_output):
        """
        Tests getting the pending items
        """
        with (
            mocker.patch.object(RedisStream, "read_number_of_pending_messages", return_value=1),
            mocker.patch.object(RedisStream, "read_pending_message", side_effect=self.connection_error_side_effect)
        ):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            if true_callback_function:
                output = Redis.get_pending_items(self.my_callback_function_get_items)
            else:
                output = Redis.get_pending_items(self.my_callback_function_false_get_items)

            assert output == expected_output

    @pytest.mark.parametrize(
        "true_callback_function, expected_output",
        [
            (
                    True,
                    []
            ),
            (
                    False,
                    []
            ),
        ]
    )
    def test_get_pending_items_invalid_pending_message(self, mocker, true_callback_function, expected_output):
        """
        Tests getting the pending items
        """
        with (
            mocker.patch.object(RedisStream, "read_number_of_pending_messages", return_value=1),
            mocker.patch.object(RedisStream, "read_pending_message", return_value=None)
        ):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            if true_callback_function:
                output = Redis.get_pending_items(self.my_callback_function_get_items)
            else:
                output = Redis.get_pending_items(self.my_callback_function_false_get_items)

            assert output == expected_output

    @pytest.mark.parametrize(
        "true_callback_function, expected_output",
        [
            (
                    True,
                    []
            ),
            (
                    False,
                    []
            ),
        ]
    )
    def test_get_pending_items_no_stream_listener(self, mocker, true_callback_function, expected_output):
        """
        Tests getting the pending items
        """
        with (
            mocker.patch.object(RedisStream, "read_number_of_pending_messages", return_value=1),
            mocker.patch.object(RedisStream, "read_pending_message", return_value=None)
        ):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Get the algorithm information
            if true_callback_function:
                output = Redis.get_pending_items(self.my_callback_function_get_items)
            else:
                output = Redis.get_pending_items(self.my_callback_function_false_get_items)

            assert output == expected_output

    @pytest.mark.parametrize(
        "message_id, expected_output",
        [
            (
                    "mymessage",
                    True
            ),
            (
                    "",
                    False
            ),
            (
                    None,
                    False
            ),
            (
                    "None",
                    True
            ),
            (
                    {},
                    False
            ),
            (
                    [],
                    False
            ),
            (
                    1234,
                    False
            ),
        ]
    )
    def test_send_message_acknowledgement(self, mocker, message_id, expected_output):
        """
        Tests sending message acknowledgement
        """
        with mocker.patch.object(StreamCommands, "xack", return_value=True):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.send_acknowledgement(message_id)
            assert output == expected_output

    @pytest.mark.parametrize(
        "message_id, expected_output",
        [
            (
                "mymessage",
                False
            ),
            (
                "",
                False
            ),
            (
                None,
                False
            ),
            (
                "None",
                False
            ),
            (
                {},
                False
            ),
            (
                [],
                False
            ),
            (
                1234,
                False
            ),
        ]
    )
    def test_send_message_acknowledgement_no_stream_listener(self, mocker, message_id, expected_output):
        """
        Tests sending message acknowledgement
        """
        with mocker.patch.object(StreamCommands, "xack", return_value=True):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Get the algorithm information
            output = Redis.send_acknowledgement(message_id)
            assert output == expected_output

    @pytest.mark.parametrize(
        "message_id, expected_output",
        [
            (
                "mymessage",
                False
            ),
        ]
    )
    def test_send_message_acknowledgement_connection_error(self, mocker, message_id, expected_output):
        """
        Tests sending message acknowledgement
        """
        with mocker.patch.object(RedisStream, "send_message_acknowledgement", side_effect=self.connection_error_side_effect):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.send_acknowledgement(message_id)
            assert output == expected_output

    @pytest.mark.parametrize(
        "update_id, update_dict, expected_output",
        [
            (
                "myupdateid",
                {"response": "good"},
                True
            ),
            (
                None,
                {},
                False
            ),
            (
                "None",
                {},
                False
            ),
            (
                {},
                {},
                False
            ),
            (
                [],
                {},
                False
            ),
            (
                None,
                1234,
                False
            ),
            (
                "",
                None,
                False
            ),
            (
                "",
                "None",
                False
            ),
            (
                "",
                {},
                False
            ),
            (
                "",
                [],
                False
            ),
            (
                "",
                1234,
                False
            ),
        ]
    )
    def test_send_update(self, mocker, update_id, update_dict, expected_output):
        """
        Tests sending update
        """
        with mocker.patch.object(HashCommands, "hset", return_value=True):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.send_update(update_id, update_dict)
            assert output == expected_output

    @pytest.mark.parametrize(
        "update_id, update_dict, expected_output",
        [
            (
                    "myupdateid",
                    {"response": "good"},
                    False
            ),
            (
                    None,
                    {},
                    False
            ),
            (
                    "None",
                    {},
                    False
            ),
            (
                    {},
                    {},
                    False
            ),
            (
                    [],
                    {},
                    False
            ),
            (
                    None,
                    1234,
                    False
            ),
            (
                    "",
                    None,
                    False
            ),
            (
                    "",
                    "None",
                    False
            ),
            (
                    "",
                    {},
                    False
            ),
            (
                    "",
                    [],
                    False
            ),
            (
                    "",
                    1234,
                    False
            ),
        ]
    )
    def test_send_update_no_stream_listener(self, mocker, update_id, update_dict, expected_output):
        """
        Tests sending update
        """
        with mocker.patch.object(HashCommands, "hset", return_value=True):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Get the algorithm information
            output = Redis.send_update(update_id, update_dict)
            assert output == expected_output

    @pytest.mark.parametrize(
        "update_id, update_dict, expected_output",
        [
            (
                "myupdateid",
                {"response": "good"},
                False
            ),
        ]
    )
    def test_send_update_connection_error(self, mocker, update_id, update_dict, expected_output):
        """
        Tests sending message acknowledgement
        """
        with mocker.patch.object(RedisStream, "send_update", side_effect=self.connection_error_side_effect):
            # Set logger
            Redis.set_logger(pytest.my_logger)

            # Setup for redis-server to start and flushall redis information
            subprocess.call(["sudo", "service", "redis-server", "start"])
            subprocess.call(["redis-cli", "flushall"])

            # Setup redis host name and host port
            Redis.setup("localhost", 6379)

            # Connect to stream
            Redis.connect_to_stream("MyConsumerGroup", "MyConsumerName", "MyStreamName")

            # Get the algorithm information
            output = Redis.send_update(update_id, update_dict)
            assert output == expected_output
