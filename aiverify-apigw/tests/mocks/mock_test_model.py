from faker import Faker
from typing import List

from aiverify_apigw.models import TestModelModel, TestModelStatus
from aiverify_apigw.lib.constants import TestModelMode

faker = Faker()

model_types = ['classification', 'regression']


def _create_mock_test_model():
    filename = faker.file_name(extension='sav')
    fake_date = faker.date_object()
    test_model = TestModelModel(
        name=faker.name(),
        mode=TestModelMode.Upload,
        model_type=faker.random_element(model_types),
        status=TestModelStatus.Valid,
        filepath=f"file:///examples/model/{filename}",
        filename=filename,
        created_at=fake_date,
        updated_at=fake_date,
    )
    return test_model


def create_mock_test_models(session, num_models=1):
    """Create and save mock TestModelModel instances."""
    test_models: List[TestModelModel] = []
    for i in range(num_models):
        model = _create_mock_test_model()
        test_models.append(model)
    session.add_all(test_models)
    session.flush()
    return test_models
