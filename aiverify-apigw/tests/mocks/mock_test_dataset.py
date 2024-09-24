from faker import Faker
from typing import List

from aiverify_apigw.models import TestDatasetModel, TestDatasetStatus, TestDatasetFileType

faker = Faker()

model_types = ['classification', 'regression']


def _create_mock_test_dataset():
    filename = faker.file_name(extension='sav')
    test_dataset = TestDatasetModel(
        name=faker.name(),
        status=TestDatasetStatus.Valid,
        filepath=f"file:///examples/data/{filename}",
        filename=filename,
        file_type=TestDatasetFileType.File,
    )
    return test_dataset


def create_mock_test_datasets(session, num_datasets=1):
    """Create and save mock TestDatasetModel instances."""
    test_datasets: List[TestDatasetModel] = []
    for i in range(num_datasets):
        ds = _create_mock_test_dataset()
        test_datasets.append(ds)
    session.add_all(test_datasets)
    session.flush()
    return test_datasets
