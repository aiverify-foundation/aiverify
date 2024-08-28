import json
from pathlib import Path
from typing import Any
from jsonschema import validate

base_schema_dir = Path(__file__).parent.parent.parent.parent.joinpath("common/schemas")

def load_schema(schema_filename: str):
    path = base_schema_dir.joinpath(schema_filename)
    with open(path, "r") as fp:
        schema = json.load(fp)
    return schema


plugin_schema = load_schema("aiverify.plugin.schema.json")
algorithm_schema = load_schema("aiverify.algorithm.schema.json")
widget_schema = load_schema("aiverify.widget.schema.json")
input_block_schema = load_schema("aiverify.inputBlock.schema.json")
template_schema = load_schema("aiverify.template.schema.json")
test_result_schema = load_schema("aiverify.testresult.schema.json")


def read_and_validate(path: Path, schema: Any) -> Any | None:
    try:
        with open(path, "r") as fp:
            obj = json.load(fp)
            validate(obj, schema)
            return obj
    except:
        return None
