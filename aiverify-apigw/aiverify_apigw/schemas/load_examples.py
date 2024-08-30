import json
from pathlib import Path


def load_examples(filename: str):
    p = Path(__file__).parent.joinpath("examples").joinpath(filename)
    with open(p) as fp:
        examples = json.load(fp)
        return examples


test_result_examples = load_examples("test_result_examples.json")
