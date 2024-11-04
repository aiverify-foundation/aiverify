from aiverify_apigw.schemas.plugin import PluginMeta
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
