from faker import Faker
from typing import List
import json
from aiverify_apigw.models import TestResultModel, PluginModel, TestArtifactModel
from aiverify_apigw.models.test_dataset_model import TestDatasetModel
from aiverify_apigw.models.test_model_model import TestModelModel
from .mock_test_model import create_mock_test_models
from .mock_test_dataset import create_mock_test_datasets

faker = Faker()


def _create_mock_test_artifact():
    # import mimetypes
    # mimetype = faker.mime_type(category="image")
    # suffix = mimetypes.guess_extension(mimetype)
    mimetype = "image/png"
    suffix = ".png"
    filename = faker.file_name(extension=suffix[1:])
    artifact = TestArtifactModel(
        filename=filename,
        suffix=suffix,
        mimetype=mimetype,
    )
    return artifact


def _create_mock_test_result(plugin: PluginModel, model: TestModelModel, test_dataset: TestDatasetModel, ground_truth_dataset: TestDatasetModel | None, num_artifacts: int):
    gid = ".".join(faker.words()).lower()
    cid = ".".join(faker.words()).lower()
    fake_date = faker.date_object()
    algorithm = faker.random_element(plugin.algorithms)
    artifacts = []
    for i in range(num_artifacts):
        artifact = _create_mock_test_artifact()
        artifacts.append(artifact)
    test_result_model = TestResultModel(
        # id=1,
        name=f"Result for {cid}",
        gid=gid,
        cid=cid,
        algorithm=algorithm,
        version=algorithm.version,
        model=model,
        test_dataset=test_dataset,
        ground_truth_dataset=ground_truth_dataset,
        ground_truth=faker.word() if ground_truth_dataset else None,
        start_time=fake_date,
        time_taken=faker.random_int(min=1, max=300),
        algo_arguments=faker.json_bytes(),
        output=json.dumps({"result": 100}).encode('utf-8'),
        created_at=fake_date,
        updated_at=fake_date,
        artifacts=artifacts,
    )
    return test_result_model


def create_mock_test_results(session, plugins: List[PluginModel], num_test_results=5):
    """Create and save mock TestResultModel instances."""
    plugin = plugins[0]
    test_results: List[TestResultModel] = []
    for i in range(num_test_results):
        plugin = faker.random_element(plugins)
        model = create_mock_test_models(session=session, num_models=1)[0]
        test_dataset = create_mock_test_datasets(session=session, num_datasets=1)[0]
        ground_truth_dataset = None
        match faker.random_int(min=1, max=2):
            case 1:
                ground_truth_dataset = test_dataset
            case 2:
                ground_truth_dataset = create_mock_test_datasets(session=session, num_datasets=1)[0]
        test_result = _create_mock_test_result(
            plugin, model=model, test_dataset=test_dataset, ground_truth_dataset=ground_truth_dataset, num_artifacts=i)
        test_results.append(test_result)
    session.add_all(test_results)
    session.flush()
    return test_results
