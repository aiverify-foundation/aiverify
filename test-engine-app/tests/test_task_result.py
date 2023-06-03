from datetime import datetime

import pytest

from test_engine_app.app_logger import AppLogger
from test_engine_app.enums.task_status import TaskStatus
from test_engine_app.processing.task_result import TaskResult


class TestCollectionTaskResult:
    pytest.logger = AppLogger()

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        pytest.logger.generate_logger()

        # Perform tests
        yield

    @pytest.mark.parametrize(
        "logger",
        [
            pytest.logger
        ],
    )
    def test_init(self, logger):
        new_task_result = TaskResult(logger)

        assert new_task_result.elapsed_time == 0
        assert new_task_result.start_time is not None
        assert isinstance(new_task_result.start_time, datetime)
        assert new_task_result.percentage == 0
        assert new_task_result.status is TaskStatus.PENDING
        assert new_task_result.results == ""
        assert new_task_result.error_messages == ""
        assert new_task_result._logger == logger

    @pytest.mark.parametrize(
        "logger, expected_output",
        [
            (
                    None,
                    "The inputs do not meet the validation rules"
            ),
            (
                    "None",
                    "The inputs do not meet the validation rules"
            ),
            (
                    "",
                    "The inputs do not meet the validation rules"
            ),
            (
                    [],
                    "The inputs do not meet the validation rules"
            ),
            (
                    {},
                    "The inputs do not meet the validation rules"
            ),
            (
                    1234,
                    "The inputs do not meet the validation rules"
            ),
        ]
    )
    def test_init_with_exception(self, logger, expected_output):
        with pytest.raises(RuntimeError) as exc_info:
            new_task_result = TaskResult(logger)

            assert new_task_result.elapsed_time == 0
            assert new_task_result.start_time is not None
            assert isinstance(new_task_result.start_time, datetime)
            assert new_task_result.percentage == 0
            assert new_task_result.status is TaskStatus.PENDING

        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "logger",
        [
            pytest.logger
        ],
    )
    def test_set_elapsed_time(self, logger):
        new_task_result = TaskResult(logger)

        # Check that end time is set and later than the previous end time
        end_time = new_task_result.end_time
        new_task_result.set_elapsed_time()
        new_end_time = new_task_result.end_time
        if new_end_time > end_time:
            assert True
        else:
            assert False

        # Check that the elapsed time is set
        assert int((new_end_time-end_time).total_seconds()) == new_task_result.elapsed_time

    def test_set_success(self):
        new_task_result = TaskResult(pytest.logger)

        assert new_task_result.error_messages == ""
        assert new_task_result.percentage == 0
        assert new_task_result.status is TaskStatus.PENDING

        new_task_result.set_success()

        assert new_task_result.error_messages == ""
        assert new_task_result.percentage == 100
        assert new_task_result.status is TaskStatus.SUCCESS

    def test_set_failure(self):
        new_task_result = TaskResult(pytest.logger)

        assert new_task_result.error_messages == ""
        assert new_task_result.results == ""
        assert new_task_result.percentage == 0
        assert new_task_result.status is TaskStatus.PENDING

        AppLogger.add_error_to_log(pytest.logger, "SYS", "FSYS1234", "Description", "Critical", "task_result.py")
        new_task_result.set_failure()

        assert new_task_result.error_messages == \
               '[{"category": "SYSTEM_ERROR", "code": "FSYS1234", "description": "Description", ' \
               '"severity": "critical", "component": "task_result.py"}]'
        assert new_task_result.results == ""
        assert new_task_result.percentage == 100
        assert new_task_result.status is TaskStatus.ERROR

    def test_set_cancelled(self):
        new_task_result = TaskResult(pytest.logger)

        assert new_task_result.error_messages == ""
        assert new_task_result.results == ""
        assert new_task_result.percentage == 0
        assert new_task_result.status is TaskStatus.PENDING

        # Add an error
        AppLogger.add_error_to_log(pytest.logger, "SYS", "FSYS1234", "Description", "Critical", "task_result.py")
        new_task_result.set_cancelled()

        assert new_task_result.error_messages == \
               '[{"category": "SYSTEM_ERROR", "code": "FSYS1234", "description": "Description", ' \
               '"severity": "critical", "component": "task_result.py"}]'
        assert new_task_result.results == ""
        assert new_task_result.percentage == 100
        assert new_task_result.status is TaskStatus.CANCELLED

    @pytest.mark.parametrize(
        "results, expected_output",
        [
            (
                    {"results": "MyResult"},
                    {"results": "MyResult"}
            ),
            (
                    {},
                    {}
            ),
        ],
    )
    def test_set_results(self, results, expected_output):
        new_task_result = TaskResult(pytest.logger)

        assert new_task_result.results == ""
        new_task_result.set_results(results)
        assert new_task_result.results == expected_output

    @pytest.mark.parametrize(
        "results, expected_results, expected_error_message",
        [
            (
                    None,
                    "",
                    "The current task received an invalid input: None (<class 'NoneType'>)"
            ),
            (
                    "None",
                    "",
                    "The current task received an invalid input: None (<class 'str'>)"
            ),
            (
                    [],
                    "",
                    "The current task received an invalid input: [] (<class 'list'>)"
            ),
            (
                    1234,
                    "",
                    "The current task received an invalid input: 1234 (<class 'int'>)"
            ),
        ],
    )
    def test_set_results_with_exception(self, results, expected_results, expected_error_message):
        with pytest.raises(RuntimeError) as exc_info:
            new_task_result = TaskResult(pytest.logger)

            assert new_task_result.results == ""
            new_task_result.set_results(results)
            assert new_task_result.results == expected_results

        assert str(exc_info.value) == expected_error_message

    @pytest.mark.parametrize(
        "completion_progress, expected_completion_progress",
        [
            (
                    0,
                    0
            ),
            (
                    1,
                    1
            ),
            (
                    100,
                    100
            ),
            (
                    1234,
                    1234
            ),
        ],
    )
    def test_set_progress(self, completion_progress, expected_completion_progress):
        new_task_result = TaskResult(pytest.logger)
        # Check percentage and elapsed time
        assert new_task_result.elapsed_time == 0
        assert new_task_result.percentage == 0

        new_task_result.set_progress(completion_progress)

        assert new_task_result.elapsed_time == \
               int((new_task_result.end_time-new_task_result.start_time).total_seconds())
        assert new_task_result.percentage == expected_completion_progress

    @pytest.mark.parametrize(
        "completion_progress, expected_completion_progress, expected_error_message",
        [
            (
                    None,
                    0,
                    "The current task received an invalid input: None (<class 'NoneType'>)"
            ),
            (
                    "None",
                    0,
                    "The current task received an invalid input: None (<class 'str'>)"
            ),
            (
                    [],
                    0,
                    "The current task received an invalid input: [] (<class 'list'>)"
            ),
            (
                    {},
                    0,
                    "The current task received an invalid input: {} (<class 'dict'>)"
            ),
            (
                    "",
                    0,
                    "The current task received an invalid input:  (<class 'str'>)"
            ),
        ],
    )
    def test_set_progress_with_exception(self, completion_progress, expected_completion_progress, expected_error_message):
        with pytest.raises(RuntimeError) as exc_info:
            new_task_result = TaskResult(pytest.logger)
            # Check percentage and elapsed time
            assert new_task_result.elapsed_time == 0
            assert new_task_result.percentage == 0

            new_task_result.set_progress(completion_progress)

            assert new_task_result.elapsed_time == \
                   int((new_task_result.end_time-new_task_result.start_time).total_seconds())
            assert new_task_result.percentage == expected_completion_progress

        assert str(exc_info.value) == expected_error_message

    @pytest.mark.parametrize(
        "task_status, expected_task_status",
        [
            (
                    TaskStatus.PENDING,
                    TaskStatus.PENDING
            ),
            (
                    TaskStatus.CANCELLED,
                    TaskStatus.CANCELLED
            ),
            (
                    TaskStatus.RUNNING,
                    TaskStatus.RUNNING
            ),
            (
                    TaskStatus.SUCCESS,
                    TaskStatus.SUCCESS
            ),
            (
                    TaskStatus.ERROR,
                    TaskStatus.ERROR
            ),
        ],
    )
    def test_set_status(self, task_status, expected_task_status):
        new_task_result = TaskResult(pytest.logger)

        assert new_task_result.elapsed_time == 0
        assert new_task_result.status == TaskStatus.PENDING

        new_task_result.set_status(task_status)

        assert new_task_result.elapsed_time == \
               int((new_task_result.end_time - new_task_result.start_time).total_seconds())
        assert new_task_result.status == expected_task_status

    @pytest.mark.parametrize(
        "task_status, expected_task_status, expected_error_message",
        [
            (
                    None,
                    TaskStatus.PENDING,
                    "The current task received an invalid input: None (<class 'NoneType'>)"
            ),
            (
                    "None",
                    TaskStatus.PENDING,
                    "The current task received an invalid input: None (<class 'str'>)"
            ),
            (
                    [],
                    TaskStatus.PENDING,
                    "The current task received an invalid input: [] (<class 'list'>)"
            ),
            (
                    {},
                    TaskStatus.PENDING,
                    "The current task received an invalid input: {} (<class 'dict'>)"
            ),
            (
                    "",
                    TaskStatus.PENDING,
                    "The current task received an invalid input:  (<class 'str'>)"
            ),
            (
                    1234,
                    TaskStatus.PENDING,
                    "The current task received an invalid input: 1234 (<class 'int'>)"
            ),
        ],
    )
    def test_set_status_with_exception(self, task_status, expected_task_status, expected_error_message):
        with pytest.raises(RuntimeError) as exc_info:
            new_task_result = TaskResult(pytest.logger)

            assert new_task_result.elapsed_time == 0
            assert new_task_result.status == TaskStatus.PENDING

            new_task_result.set_status(task_status)

            assert new_task_result.elapsed_time == \
                   int((new_task_result.end_time - new_task_result.start_time).total_seconds())
            assert new_task_result.status == expected_task_status

        assert str(exc_info.value) == expected_error_message
