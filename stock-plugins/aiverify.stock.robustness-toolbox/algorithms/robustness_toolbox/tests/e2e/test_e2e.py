from pathlib import Path

import pytest
from aiverify_robustness_toolbox.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

binary_classification = {
    "data_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/bc_tabular_credit"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "default",
}

regression_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_reg_donation_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_reg_donation_sklearn_linear.LinearRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_reg_donation_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.REGRESSION,
    "ground_truth": "donation",
}

image_pipeline = {
    "data_path": str("../../../user_defined_files/data/raw_fashion_image_10/0.png"),
    "model_path": str("../../../user_defined_files/pipeline/mc_image_fashion"),
    "ground_truth_path": str("../../../user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "label",
}


@pytest.mark.parametrize(
    "data_set",
    [binary_classification, regression_non_pipeline, image_pipeline],
)
def test_robustness_toolbox_plugin(data_set):
    core_modules_path = ""
    plugin_argument_values = {
        "annotated_ground_truth_path": (
            "../../../user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
        ),
        "file_name_label": ("file_name"),
    }
    # =====================================================================================
    # NOTE: Do not modify the code below
    # =====================================================================================
    # Perform Plugin Testing

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
