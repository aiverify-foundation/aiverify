from pathlib import Path

import pytest
from aiverify_test_engine.plugins.enums.model_type import ModelType

from aiverify_environment_corruptions.algo_init import AlgoInit

image_pipeline = {
    "data_path": "../../../user_defined_files/data/raw_fashion_image_10",
    "model_path": "../../../user_defined_files/pipeline/multiclass_classification_image_mnist_fashion",
    "ground_truth_path": "../../../user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav",
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth_label": "label",
    "file_name_label": "file_name",
    "set_seed": 10,
    "core_modules_path": "",
    "user_defined_params": {
        "corruptions": ["fog", "rain"],
        "rain_type": ["drizzle", "heavy"],
        "snow_intensity": [0, 1, 2],
    },
}

image_pipeline_pytorch = {
    **image_pipeline,
    "model_path": "../../../user_defined_files/pipeline/sample_fashion_mnist_pytorch",
}


@pytest.mark.parametrize(
    "data_set",
    [
        image_pipeline,
        image_pipeline_pytorch,
    ],
)
def test_aiverify_environment_corruptions_plugin(data_set):
    # Create an instance of PluginTest with defined paths and arguments and Run.
    plugin_test = AlgoInit(
        run_as_pipeline=True,
        data_path=data_set["data_path"],
        model_path=data_set["model_path"],
        model_type=data_set["model_type"],
        ground_truth_path=data_set["ground_truth_path"],
        ground_truth=data_set["ground_truth_label"],
        file_name_label=data_set["file_name_label"],
        set_seed=data_set["set_seed"],
        core_modules_path=data_set["core_modules_path"],
        **data_set["user_defined_params"],
    )
    plugin_test.run()

    json_file_path = Path.cwd() / "output" / "results.json"
    assert json_file_path.exists()
