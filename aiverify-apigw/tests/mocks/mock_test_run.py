from faker import Faker
from typing import List
from aiverify_apigw.models import TestRunModel, PluginModel, TestResultModel
from aiverify_apigw.lib.constants import TestRunStatus
from .mock_test_result import create_mock_test_results


faker = Faker()


def _create_mock_test_run(
    test_result: TestResultModel | None = None,
    error_messages: str | None = None,
    status: TestRunStatus = TestRunStatus.Pending,
):
    fake_date = faker.date_time_this_year()
    if test_result:
        return TestRunModel(
            job_id=str(faker.uuid4()).encode("utf-8"),
            status=status,
            algorithm=test_result.algorithm,
            algo_arguments=test_result.algo_arguments,
            model=test_result.model,
            test_dataset=test_result.test_dataset,
            ground_truth_dataset=test_result.ground_truth_dataset,
            ground_truth=faker.word() if test_result.ground_truth_dataset else None,
            test_result=test_result,
            progress=100,
            error_messages=error_messages,
            created_at=fake_date,
            updated_at=fake_date,
        )
    else:
        return TestRunModel(
            job_id=str(faker.uuid4()).encode("utf-8"),
            status=status,
            algorithm=test_result.algorithm,
            algo_arguments=test_result.algo_arguments,
            model=test_result.model,
            test_dataset=test_result.test_dataset,
            ground_truth_dataset=test_result.ground_truth_dataset,
            ground_truth=faker.word() if test_result.ground_truth_dataset else None,
            test_result=None,
            progress =faker.pyint(min_value=0, max_value=100) if status == TestRunStatus.Pending else 0,
            error_messages=error_messages,
            created_at=fake_date,
            updated_at=fake_date,
        )


def create_mock_test_runs(
    session,
    plugins: List[PluginModel], 
    num_success: int = 5,
):
    """Create and save mock TestRunModel instances."""
    test_runs: List[TestRunModel] = []
    test_results = create_mock_test_results(session=session, plugins=plugins, num_test_results=num_success)
    for i in range(num_success):
        test_result = test_results[i]
        test_run = _create_mock_test_run(
            test_result=test_result,
            status=TestRunStatus.Success,
            # error_messages=error_messages,
        )
        test_runs.append(test_run)

    # add for pending, cancelled, error
    test_runs.append(_create_mock_test_run(
        test_result=test_result,
        status=TestRunStatus.Pending,
        # error_messages=error_messages,
    ))
    test_runs.append(_create_mock_test_run(
        test_result=test_result,
        status=TestRunStatus.Cancelled,
        # error_messages=error_messages,
    ))
    test_runs.append(_create_mock_test_run(
        test_result=test_result,
        status=TestRunStatus.Error,
        error_messages="Test error",
    ))
    
    session.add_all(test_runs)
    session.flush()
    return test_runs
