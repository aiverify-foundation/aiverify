import subprocess

import pytest
from aiverify_test_engine.network.redis.redis_stream import RedisStream

pytest.skip("skipping redis test; possibly deprecating", allow_module_level=True)


class TestCollectionRedisStream:
    def test_init_redis_stream(self):
        """
        Tests initializing redis stream
        """
        redis_stream = RedisStream()
        assert redis_stream._is_setup_completed is False
        assert redis_stream._stream_name == ""
        assert redis_stream._consumer_group == ""
        assert redis_stream._consumer_name == ""

    @pytest.mark.parametrize(
        "host_name, host_port, stream_name, consumer_group, consumer_name, expected_response, expected_error_message",
        [
            # Test host name and host port
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                "consumer_name",
                True,
                "",
            ),
            (
                "127.0.0.1",
                6379,
                "my_stream",
                "consumer_group",
                "consumer_name",
                True,
                "",
            ),
            (
                "127.0.0.1",
                5000,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was a connection error to the redis server: "
                "Error 111 connecting to 127.0.0.1:5000. Connection refused.",
            ),
            (
                "1.2.3.4",
                6379,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was a timeout error to the redis server: "
                "Timeout connecting to server",
            ),
            (
                "localhost",
                99999,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                -5000,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "8080",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "",
                "8080",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "",
                "",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                "8080",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                None,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                None,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                "8080",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "None",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                "None",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                None,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                "",
                None,
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                "None",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                "",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            (
                123,
                "8080",
                "my_stream",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis host information",
            ),
            # Test stream name
            (
                "localhost",
                6379,
                "",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                None,
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "None",
                "consumer_group",
                "consumer_name",
                True,
                "",
            ),
            (
                "localhost",
                6379,
                "",
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                1234,
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                [1234],
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                {123: 123},
                "consumer_group",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            # Test consumer group
            (
                "localhost",
                6379,
                "my_stream",
                "",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                None,
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "None",
                "consumer_name",
                True,
                "",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "",
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                1234,
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                [1234],
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                {123: 123},
                "consumer_name",
                False,
                "There was an error validating the redis stream information",
            ),
            # Test consumer name
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                "",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                None,
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                "None",
                True,
                "",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                "",
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                1234,
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                [1234],
                False,
                "There was an error validating the redis stream information",
            ),
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                {123: 123},
                False,
                "There was an error validating the redis stream information",
            ),
        ],
    )
    def test_setup(
        self,
        host_name,
        host_port,
        stream_name,
        consumer_group,
        consumer_name,
        expected_response,
        expected_error_message,
    ):
        """
        Tests setting up the redis stream
        """
        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        redis_stream = RedisStream()
        response, error_message = redis_stream.setup(
            host_name, host_port, stream_name, consumer_group, consumer_name
        )
        assert response is expected_response
        assert error_message == expected_error_message

    def test_setup_consumer_group_exists(self):
        """
        Tests setting up with existing consumer group
        """
        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        redis_stream = RedisStream()
        response, error_message = redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group", "consumer_name"
        )
        assert response is True
        assert error_message == ""

        response, error_message = redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group", "consumer_name"
        )
        assert response is True
        assert error_message == ""

    def test_setup_with_multiple_consumer_group_exists(self):
        """
        Tests setting up with multiple consumer groups already created
        """
        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        redis_stream = RedisStream()
        response, error_message = redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group1", "consumer_name"
        )
        assert response is True
        assert error_message == ""

        redis_stream = RedisStream()
        response, error_message = redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group2", "consumer_name"
        )
        assert response is True
        assert error_message == ""

        redis_stream = RedisStream()
        response, error_message = redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group3", "consumer_name"
        )
        assert response is True
        assert error_message == ""

    def test_read_algorithm_registry_no_instance(self):
        """
        Tests reading algorithm registry with no instance
        """
        redis_stream = RedisStream()
        response = redis_stream.read_algorithm_registry("1234")
        assert response is None

    @pytest.mark.parametrize(
        "message, expected_message_response",
        [
            # Test message
            ("algorithm", {"testkey": "testvalue"}),
            ("algorithm_do_not_exist", {}),
            (None, None),
            ("None", {}),
            ("", None),
            (123, None),
            ([123], None),
            ({"key": 123}, None),
        ],
    )
    def test_read_algorithm_registry(self, message, expected_message_response):
        """
        Tests reading algorithm registry
        """
        # Setup for redis-server to start and flushall redis information
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])
        subprocess.call(["redis-cli", "hset", "algorithm", "testkey", "testvalue"])

        redis_stream = RedisStream()
        redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group", "consumer_name"
        )

        response = redis_stream.read_algorithm_registry(message)
        assert response == expected_message_response

    def test_read_number_of_pending_message_no_instance(self):
        """
        Tests reading number of pending message with no instance
        """
        redis_stream = RedisStream()
        response = redis_stream.read_number_of_pending_messages()
        assert response == 0

    @pytest.mark.parametrize(
        "host_name, host_port, stream_name, consumer_group, consumer_name, expected_read_message",
        [
            # Test host name and host port
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                "consumer_name",
                3,
            ),
            (
                "127.0.0.1",
                6379,
                "my_stream",
                "consumer_group",
                "consumer_name",
                3,
            ),
            (
                "127.0.0.1",
                5000,
                "my_stream",
                "consumer_group",
                "consumer_name",
                0,
            ),
            (
                "1.2.3.4",
                6379,
                "my_stream",
                "consumer_group",
                "consumer_name",
                0,
            ),
            # Test stream name
            (
                "localhost",
                6379,
                "mystream",
                "consumer_group",
                "consumer_name",
                0,
            ),
            # Test consumer group
            (
                "localhost",
                6379,
                "my_stream",
                "consumergroup",
                "consumer_name",
                0,
            ),
            # Test consumer name
            (
                "localhost",
                6379,
                "my_stream",
                "consumer_group",
                "consumername",
                3,
            ),
        ],
    )
    def test_read_number_of_pending_message(
        self,
        host_name,
        host_port,
        stream_name,
        consumer_group,
        consumer_name,
        expected_read_message,
    ):
        """
        Tests reading the number of pending message in the stream
        """
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        redis_stream = RedisStream()
        redis_stream.setup(
            host_name, host_port, stream_name, consumer_group, consumer_name
        )
        response = redis_stream.read_number_of_pending_messages()
        assert response == 0

        subprocess.call(["redis-cli", "XADD", "my_stream", "*", "task", "task1"])
        subprocess.call(["redis-cli", "XADD", "my_stream", "*", "task", "task2"])
        subprocess.call(["redis-cli", "XADD", "my_stream", "*", "task", "task3"])
        subprocess.call(
            [
                "redis-cli",
                "XREADGROUP",
                "GROUP",
                "consumer_group",
                "consumer_name",
                "COUNT",
                "3",
                "STREAMS",
                "my_stream",
                ">",
            ]
        )

        response = redis_stream.read_number_of_pending_messages()
        assert response == expected_read_message

    def test_read_pending_message_no_instance(self):
        """
        Tests reading pending messages with no instance
        """
        redis_stream = RedisStream()
        response = redis_stream.read_message(1, 1)
        assert response is None

    @pytest.mark.parametrize(
        "num_of_message, blocking_duration_ms, expected_output",
        [
            (1, 1, [["my_stream", [("1680794311013-0", {"task": "task1"})]]]),
            (None, 1, None),
            ("None", 1, None),
            ("", 1, None),
            ({}, 1, None),
            ([], 1, None),
            (1, None, [["my_stream", [("1680794311013-0", {"task": "task1"})]]]),
            (1, "None", None),
            (1, "", None),
            (1, [], None),
            (1, {}, None),
        ],
    )
    def test_read_pending_message(
        self, num_of_message, blocking_duration_ms, expected_output
    ):
        """
        Tests reading pending messages
        """
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        redis_stream = RedisStream()
        redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group", "consumer_name"
        )

        subprocess.call(
            ["redis-cli", "XADD", "my_stream", "1680794311013-0", "task", "task1"]
        )
        subprocess.call(
            [
                "redis-cli",
                "XREADGROUP",
                "GROUP",
                "consumer_group",
                "consumer_name",
                "COUNT",
                "1",
                "STREAMS",
                "my_stream",
                ">",
            ]
        )

        response = redis_stream.read_pending_message(
            num_of_message, blocking_duration_ms
        )
        assert response == expected_output

    def test_read_message_no_instance(self):
        """
        Tests read messages with no instance
        """
        redis_stream = RedisStream()
        response = redis_stream.read_message(1, 1)
        assert response is None

    @pytest.mark.parametrize(
        "num_of_message, blocking_duration_ms, expected_output",
        [
            (1, 1, [["my_stream", [("1680794311013-0", {"task": "task1"})]]]),
            (None, 1, None),
            ("None", 1, None),
            ("", 1, None),
            ({}, 1, None),
            ([], 1, None),
            (1, None, [["my_stream", [("1680794311013-0", {"task": "task1"})]]]),
            (1, "None", None),
            (1, "", None),
            (1, [], None),
            (1, {}, None),
        ],
    )
    def test_read_message(self, num_of_message, blocking_duration_ms, expected_output):
        """
        Tests reading messages
        """
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])
        subprocess.call(
            ["redis-cli", "XADD", "my_stream", "1680794311013-0", "task", "task1"]
        )

        redis_stream = RedisStream()
        redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group", "consumer_name"
        )
        response = redis_stream.read_message(num_of_message, blocking_duration_ms)
        assert response == expected_output

    def test_send_update_no_instance(self):
        """
        Tests sending update with no instance
        """
        redis_stream = RedisStream()
        response = redis_stream.send_update("1234", {"message": "1234"})
        assert response is False

    @pytest.mark.parametrize(
        "message_id, message_dict, expected_result",
        [
            ("messageid", {"task": "result12345"}, True),
            (None, {"task": "task1result"}, False),
            ("None", {"task": "task1result"}, True),
            ("", {"task": "task1result"}, False),
            ([], {"task": "task1result"}, False),
            ({}, {"task": "task1result"}, False),
            ("123", None, False),
            ("123", "None", False),
            ("123", "", False),
            ("123", [], False),
            ("123", {}, False),
        ],
    )
    def test_send_update(self, message_id, message_dict, expected_result):
        """
        Tests sending update
        """
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        redis_stream = RedisStream()
        redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group", "consumer_name"
        )
        response = redis_stream.send_update(message_id, message_dict)
        assert response is expected_result

        # Check if it is written to redis
        if expected_result:
            count = subprocess.check_output(f"redis-cli hlen {message_id}", shell=True)
            assert int(count.decode()) == 1

    def test_send_message_ack_no_instance(self):
        """
        Tests sending message acknowledgement with no instance
        """
        redis_stream = RedisStream()
        response = redis_stream.send_message_acknowledgement("1234")
        assert response is False

    @pytest.mark.parametrize(
        "message_id, expected_result",
        [
            ("16807942311013-0", True),
            ("", False),
            ("messageid", False),
            (None, False),
            ("None", False),
            ([], False),
            ({}, False),
        ],
    )
    def test_send_message_acknowledgement(self, message_id, expected_result):
        """
        Tests sending message acknowledgement
        """
        subprocess.call(["sudo", "service", "redis-server", "start"])
        subprocess.call(["redis-cli", "flushall"])

        redis_stream = RedisStream()
        redis_stream.setup(
            "localhost", 6379, "my_stream", "consumer_group", "consumer_name"
        )

        subprocess.call(
            ["redis-cli", "XADD", "my_stream", "16807942311013-0", "task", "task1"]
        )
        subprocess.call(
            [
                "redis-cli",
                "XREADGROUP",
                "GROUP",
                "consumer_group",
                "consumer_name",
                "COUNT",
                "1",
                "STREAMS",
                "my_stream",
                ">",
            ]
        )

        # Check the number of pending values
        count = subprocess.check_output(
            "redis-cli xpending my_stream consumer_group", shell=True
        )
        assert int(count.decode().split("\n")[0]) == 1

        response = redis_stream.send_message_acknowledgement(message_id)
        assert response is expected_result

        # Check the number of pending values
        count = subprocess.check_output(
            "redis-cli xpending my_stream consumer_group", shell=True
        )
        if response:
            assert int(count.decode().split("\n")[0]) == 0
        else:
            assert int(count.decode().split("\n")[0]) == 1
