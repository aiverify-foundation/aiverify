from pathlib import Path

import pytest
from aiverify_digital_corruptions.algo_init import AlgoInit
from test_engine_core.plugins.enums.model_type import ModelType

image_pipeline = {
    "data_path": str("../../../user_defined_files/data/raw_fashion_image_10"),
    "model_path": str(
        "../../../user_defined_files/pipeline/multiclass_classification_image_mnist_fashion"
    ),
    "ground_truth_path": str(
        "../../../user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
    ),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "label",
}


@pytest.mark.parametrize(
    "data_set",
    [
        image_pipeline,
    ],
)
def test_aiverify_digital_corruptions_plugin(data_set):
    # Create an instance of PluginTest with defined paths and arguments and Run.
    core_modules_path = ""
    plugin_argument_values = {
        "annotated_ground_truth_path": (
            "../../../user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
        ),
        "file_name_label": "file_name",
        "set_seed": 10,
    }

    plugin_test = AlgoInit(
        data_set["run_pipeline"],
        core_modules_path,
        data_set["data_path"],
        data_set["model_path"],
        data_set["ground_truth_path"],
        data_set["ground_truth"],
        data_set["model_type"],
        plugin_argument_values,
    )
    plugin_test.run()

    json_file_path = Path.cwd() / "output" / "results.json"
    assert json_file_path.exists()
