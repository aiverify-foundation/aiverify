from pathlib import Path

import pytest
from aiverify_fairness_metrics_toolbox_for_classification.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

multiclass_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_mc_pipeline_toxic_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/mc_tabular_toxic"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_mc_pipeline_toxic_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "toxic",
    "sensitive_feature": ["gender"],
    "annotated_labels_path": "",
    "file_name_label": "",
}

tabular_binary_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/bc_tabular_credit"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "default",
    "sensitive_feature": ["gender"],
    "annotated_labels_path": "",
    "file_name_label": "",
}

multiclass_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_mc_toxic_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_mc_toxic_sklearn_linear.LogisticRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_mc_toxic_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "toxic",
    "sensitive_feature": ["gender"],
    "annotated_labels_path": "",
    "file_name_label": "",
}

binary_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "default",
    "sensitive_feature": ["gender"],
    "annotated_labels_path": "",
    "file_name_label": "",
}

image_pipeline = {
    "data_path": str("../../../user_defined_files/data/small_test"),
    "model_path": str("../../../user_defined_files/pipeline/bc_image_face"),
    "ground_truth_path": str("../../../user_defined_files/data/pickle_pandas_annotated_labels_50.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "race",
    "sensitive_feature": ["gender"],
    "annotated_labels_path": str("../../../user_defined_files/data/pickle_pandas_annotated_labels_50.sav"),
    "file_name_label": "image_directory",
}


@pytest.mark.parametrize(
    "data_set",
    [
        multiclass_pipeline,
        tabular_binary_pipeline,
        multiclass_non_pipeline,
        binary_non_pipeline,
        image_pipeline,
    ],
)
def test_fairness_metrics_toolbox_for_classification_plugin(data_set):
    # Create an instance of PluginTest with defined paths and arguments and Run.
    core_modules_path = ""
    plugin_argument_values = {
        "sensitive_feature": data_set["sensitive_feature"],
        "annotated_labels_path": data_set["annotated_labels_path"],
        "file_name_label": data_set["file_name_label"],
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
    assert json_file_path.exists(), f"File not found: {json_file_path}"
