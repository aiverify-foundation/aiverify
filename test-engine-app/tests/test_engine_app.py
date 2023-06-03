import os
import signal
from concurrent.futures import ProcessPoolExecutor

import pytest

from test_engine_app.test_engine_app import TestEngineApp


class MyFuture:
    def cancel(self):
        return True


class TestCollectionTestEngineApp:
    @pytest.mark.parametrize(
        "num_of_cpu_count, expected_available_num_of_processes",
        [
            (
                    3,
                    3,
            ),
            (
                    1,
                    3,
            ),
            (
                    10,
                    10,
            ),
        ]
    )
    def test_init(self, mocker, num_of_cpu_count, expected_available_num_of_processes):
        with mocker.patch.object(os, "cpu_count", return_value=num_of_cpu_count):
            my_app = TestEngineApp()

            assert my_app._required_number_of_processes == 3
            assert my_app._available_number_of_processes == expected_available_num_of_processes
            assert isinstance(my_app._executor, ProcessPoolExecutor)
            assert isinstance(my_app._worker_futures, list)

    def test_run(self, mocker):
        with (
            mocker.patch.object(os, "cpu_count", return_value=4),
            mocker.patch.object(signal, "pause", return_value="HelloWorld"),
            mocker.patch.object(ProcessPoolExecutor, "submit", return_value="HelloWorld")
        ):
            my_app = TestEngineApp()
            my_app.run()
            assert len(my_app._worker_futures) == 4

    def test_sigint_handler(self, mocker):
        with (
            pytest.raises(SystemExit) as exit_error,
            mocker.patch.object(os, "cpu_count", return_value=4)
        ):
            my_app = TestEngineApp()
            my_app.sigint_handler(1, 2)

        assert exit_error.type == SystemExit
        assert exit_error.value.code == 0

    def test_sigint_handler_with_futures(self, mocker):
        with (
            pytest.raises(SystemExit) as exit_error,
            mocker.patch.object(os, "cpu_count", return_value=4)
        ):
            my_app = TestEngineApp()

            # Load the futures
            future_1 = MyFuture()
            future_2 = MyFuture()
            my_app._worker_futures = [future_1, future_2]

            my_app.sigint_handler(1, 2)

        assert exit_error.type == SystemExit
        assert exit_error.value.code == 0

    def test_sigint_handler_no_logger(self, mocker):
        with (
            pytest.raises(SystemExit) as exit_error,
            mocker.patch.object(os, "cpu_count", return_value=4)
        ):
            my_app = TestEngineApp()

            # Set logger to None
            TestEngineApp._logger = None

            my_app.sigint_handler(1, 2)

        assert exit_error.type == SystemExit
        assert exit_error.value.code == 0
