from aiverify_apigw.schemas import PluginMeta, AlgorithmMeta
import json
from faker import Faker

faker = Faker()


def create_mock_plugin_meta():
    gid = ".".join(faker.words()).lower()
    meta = {
        "gid": gid,
        "version": faker.numerify("%!!.%!!.%!!"),  # Generates a semantic version string
        "name": faker.company(),  # Generates a fake company name
        "author": faker.name(),  # Generates a fake author name
        "description": faker.text(max_nb_chars=256),  # Generates a fake description text
        # "url": faker.url(), # Generates a fake url
    }
    return PluginMeta.model_validate_json(json.dumps(meta))


def create_mock_algorithm_meta(gid: str | None=None):
    if gid is None:
        gid = str(faker.uuid4())
    meta = {
        "cid": faker.uuid4(),  # Generates a unique identifier for the algorithm within the plugin
        "gid": gid,  # Generates a unique global identifier for the plugin
        "name": faker.word(),  # Generates a fake algorithm name
        "modelType": [faker.random_element(elements=("classification", "regression"))],  # Randomly selects a model type
        "version": faker.numerify("%!!.%!!.%!!"),  # Generates a semantic version string
        "author": faker.name(),  # Generates a fake author name
        "description": faker.text(max_nb_chars=256),  # Generates a fake description text
        "tags": [faker.word() for _ in range(faker.random_int(min=1, max=5))],  # Generates a list of fake tags
        "requireGroundTruth": faker.boolean()  # Randomly assigns a boolean value
    }
    return AlgorithmMeta.model_validate(meta, strict=False)
