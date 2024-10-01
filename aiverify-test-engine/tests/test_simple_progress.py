import pytest
from aiverify_test_engine.utils.simple_progress import SimpleProgress


def simple_progress_callback(progress_update: int):
    """
    A test callback function
    """
    pytest.progress = progress_update
    pytest.has_callback = True


class TestCollectionSimpleProgress:
    pytest.has_callback = False
    pytest.callback_func = simple_progress_callback

    def test_init(self):
        """
        Tests the initialization
        """
        simple_prog = SimpleProgress()
        assert simple_prog.total == 0
        assert simple_prog.completed == 0
        assert simple_prog.callback is None

    @pytest.mark.parametrize(
        "total, completed, callback, expected_total, expected_completed, expected_callback",
        [
            (
                0,
                0,
                None,
                0,
                0,
                None,
            ),
            (
                1,
                1,
                pytest.callback_func,
                1,
                1,
                pytest.callback_func,
            ),
            # Test total
            (
                None,
                1,
                pytest.callback_func,
                0,
                1,
                pytest.callback_func,
            ),
            (
                "None",
                1,
                pytest.callback_func,
                0,
                1,
                pytest.callback_func,
            ),
            (
                [],
                1,
                pytest.callback_func,
                0,
                1,
                pytest.callback_func,
            ),
            (
                {},
                1,
                pytest.callback_func,
                0,
                1,
                pytest.callback_func,
            ),
            # Test completed
            (
                1,
                None,
                pytest.callback_func,
                1,
                0,
                pytest.callback_func,
            ),
            (
                1,
                "None",
                pytest.callback_func,
                1,
                0,
                pytest.callback_func,
            ),
            (
                1,
                [],
                pytest.callback_func,
                1,
                0,
                pytest.callback_func,
            ),
            (
                1,
                {},
                pytest.callback_func,
                1,
                0,
                pytest.callback_func,
            ),
            # Test callable
            (
                1,
                1,
                None,
                1,
                1,
                None,
            ),
            (
                1,
                1,
                "None",
                1,
                1,
                None,
            ),
            (
                1,
                1,
                [],
                1,
                1,
                None,
            ),
            (
                1,
                1,
                {},
                1,
                1,
                None,
            ),
        ],
    )
    def test_init_parameters(
        self,
        total,
        completed,
        callback,
        expected_total,
        expected_completed,
        expected_callback,
    ):
        """
        Tests initial parameters
        """
        simple_prog = SimpleProgress(total, completed, callback)
        assert simple_prog.total == expected_total
        assert simple_prog.completed == expected_completed
        assert simple_prog.callback == expected_callback

    @pytest.mark.parametrize(
        "total, expected_total",
        [
            (5, 5),
            (None, 0),
            ("None", 0),
            ([], 0),
            ({}, 0),
        ],
    )
    def test_add_total(self, total, expected_total):
        """
        Tests adding total value
        """
        simple_prog = SimpleProgress()
        simple_prog.add_total(total)
        assert simple_prog.total == expected_total

    @pytest.mark.parametrize(
        "total, completed, callback, expected_progress",
        [
            (0, 0, pytest.callback_func, 0),
            (10, 0, pytest.callback_func, 0),
            (0, 10, pytest.callback_func, 0),
            (5, 10, pytest.callback_func, 200),
            (10, 5, pytest.callback_func, 50),
            (10, 3, pytest.callback_func, 30),
            # Test total
            (None, 3, pytest.callback_func, 0),
            ("None", 3, pytest.callback_func, 0),
            ([], 0, pytest.callback_func, 0),
            ({}, 0, pytest.callback_func, 0),
            # Test Completed
            (3, None, pytest.callback_func, 0),
            (3, "None", pytest.callback_func, 0),
            (3, [], pytest.callback_func, 0),
            (3, {}, pytest.callback_func, 0),
            # Test None
            (None, None, pytest.callback_func, 0),
            ("None", "None", pytest.callback_func, 0),
            ([], [], pytest.callback_func, 0),
            ({}, {}, pytest.callback_func, 0),
        ],
    )
    def test_get_progress(self, total, completed, callback, expected_progress):
        """
        Tests getting progress
        """
        simple_prog = SimpleProgress(total, completed, callback)
        output = simple_prog.get_progress()
        assert output == expected_progress

    @pytest.mark.parametrize(
        "total, completed, update_completed, callback, expected_callback, expected_completed, expected_progress",
        [
            (2, 0, 2, pytest.callback_func, True, 2, 100),
            (2, 0, 1, pytest.callback_func, True, 1, 50),
            (2, 1, 1, pytest.callback_func, True, 2, 100),
            (100, 1, 1, pytest.callback_func, True, 2, 2),
            (1000, 1, 1, pytest.callback_func, False, 2, 0),
            (10000, 1, 1, pytest.callback_func, False, 2, 0),
            # Test update completed
            (2, 1, None, pytest.callback_func, False, 1, 50),
            (2, 1, "None", pytest.callback_func, False, 1, 50),
            (2, 1, [], pytest.callback_func, False, 1, 50),
            (2, 1, {}, pytest.callback_func, False, 1, 50),
            # Test division by 0
            (0, 1, None, pytest.callback_func, False, 1, 0),
            (0, 1, "None", pytest.callback_func, False, 1, 0),
            (0, 1, [], pytest.callback_func, False, 1, 0),
            (0, 1, {}, pytest.callback_func, False, 1, 0),
            # Test Callback
            (2, 1, 1, None, False, 2, 100),
            (2, 1, 1, "None", False, 2, 100),
            (2, 1, 1, [], False, 2, 100),
            (2, 1, 1, {}, False, 2, 100),
        ],
    )
    def test_update(
        self,
        total,
        completed,
        update_completed,
        callback,
        expected_callback,
        expected_completed,
        expected_progress,
    ):
        """
        Tests updating the value
        """
        # Reset value
        pytest.has_callback = False

        simple_prog = SimpleProgress(total, completed, callback)
        simple_prog.update(update_completed)
        assert simple_prog.completed == expected_completed
        assert pytest.has_callback is expected_callback

        if expected_callback:
            assert pytest.progress == expected_progress
