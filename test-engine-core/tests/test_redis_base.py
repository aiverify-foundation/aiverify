import pytest
import redis

from test_engine_core.network.redis.redis_base import RedisBase

pytest.skip("skipping redis test; possibly deprecating", allow_module_level=True)


class TestCollectionRedisBase:
    def test_init_redis_base(self):
        """
        Tests init default values
        """
        redis_base = RedisBase()
        assert redis_base._host_name == ""
        assert redis_base._host_port == 0
        assert redis_base._host_timeout == 5
        assert redis_base._redis_instance is None

    @pytest.mark.parametrize(
        "host_name, host_port, expected_instance, expected_response, expected_error_msg",
        [
            ("localhost", 5000, True, True, ""),
            ("127.0.0.1", 6379, True, True, ""),
            ("1.2.3.4", 6379, True, True, ""),
            (
                "localhost",
                99999,
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                -5000,
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "8080",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "",
                "8080",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "",
                "",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                "8080",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                None,
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                None,
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                "8080",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "localhost",
                "None",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                "None",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                "None",
                None,
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                None,
                "None",
                False,
                False,
                "There was an error validating the redis host information",
            ),
            (
                123,
                "8080",
                False,
                False,
                "There was an error validating the redis host information",
            ),
        ],
    )
    def test_connect_redis_base(
        self,
        host_name,
        host_port,
        expected_instance,
        expected_response,
        expected_error_msg,
    ):
        """
        Tests connect with redis base
        """
        redis_base = RedisBase()
        response, error_msg = redis_base.connect(host_name, host_port)
        assert response is expected_response
        assert error_msg == expected_error_msg

        if expected_instance:
            assert redis_base._host_name == host_name
            assert redis_base._host_port == host_port
            assert redis_base._host_timeout == 5
            assert redis_base._redis_instance is not None
            assert type(redis_base._redis_instance) is redis.Redis
        else:
            assert redis_base._host_name == ""
            assert redis_base._host_port == 0
            assert redis_base._host_timeout == 5
            assert redis_base._redis_instance is None

    @pytest.mark.parametrize(
        "host_name, host_port, expected_instance",
        [
            ("localhost", 5000, True),
            ("localhost", 6379, True),
            ("1.2.3.4", 6379, True),
            ("localhost", -5000, False),
            ("localhost", "8080", False),
            ("", "8080", False),
            ("localhost", "", False),
            ("", "", False),
            (None, "8080", False),
            ("localhost", None, False),
            (None, None, False),
            ("None", "8080", False),
            ("localhost", "None", False),
            ("None", "None", False),
            ("None", None, False),
            (None, "None", False),
            (123, "8080", False),
        ],
    )
    def test_get_redis_instance(self, host_name, host_port, expected_instance):
        """
        Tests getting redis instance
        """
        redis_base = RedisBase()
        assert redis_base.get_redis_instance() is None

        redis_base.connect(host_name, host_port)
        if expected_instance:
            assert redis_base.get_redis_instance() is not None
            assert type(redis_base.get_redis_instance()) == redis.Redis
        else:
            assert redis_base.get_redis_instance() is None
