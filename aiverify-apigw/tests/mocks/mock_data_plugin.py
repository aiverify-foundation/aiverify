# mock_data_plugin.py
from operator import methodcaller
from sys import version
from faker import Faker
from typing import List
import json
from aiverify_apigw.models import PluginModel, AlgorithmModel

faker = Faker()


model_types = ['classification', 'regression']


def _create_mock_algorithm(gid: str):
    cid = ".".join(faker.words()).lower()
    model_type = ",".join(faker.random_elements(elements=model_types, unique=True))
    return AlgorithmModel(
        id=f"{gid}:{cid}",
        cid=cid,
        name=faker.name(),
        version=faker.numerify('%!!.%!!.%!!'),
        author=faker.name(),
        description=faker.text(max_nb_chars=256),
        gid=gid,
        meta=b'{"key1":"value1"}',
        model_type=model_type,
        require_ground_truth=faker.boolean(),
        input_schema=b'{"input": "schema"}',
        output_schema=b'{"output": "schema"}',
        plugin_id=gid
    )


def _create_mock_plugin(num_algo: int | None = None):
    gid = ".".join(faker.words()).lower()
    if num_algo is None:
        num_algo = faker.random_int(min=1, max=3)
    algorithms = [_create_mock_algorithm(gid) for i in range(num_algo)]
    meta = {
        "gid": gid,
        "version": faker.numerify('%!!.%!!.%!!'),  # Generates a semantic version string
        "name": faker.company(),  # Generates a fake company name
        "author": faker.name(),  # Generates a fake author name
        "description": faker.text(max_nb_chars=256),  # Generates a fake description text
        # "url": faker.url(), # Generates a fake url
    }
    return PluginModel(
        gid=gid,
        version=meta["version"],
        name=meta["name"],
        author=meta["author"],
        description=meta["description"],
        # url=meta["url"],
        meta=json.dumps(meta).encode('utf-8'),
        algorithms=algorithms
    )


def create_mock_plugins(session, num_plugins=2):
    """Create and save mock PluginModel instances with AlgorithmModel children."""

    plugins: List[PluginModel] = []
    for i in range(num_plugins):
        plugin = _create_mock_plugin()
        plugins.append(plugin)
    session.add_all(plugins)
    session.commit()
    return plugins
