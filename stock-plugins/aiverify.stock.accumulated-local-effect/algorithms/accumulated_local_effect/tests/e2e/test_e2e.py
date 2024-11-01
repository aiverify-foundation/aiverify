from pathlib import Path

import pytest
from aiverify_accumulated_local_effect.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

binary_classification = {
    "data_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "default",
}

multiclass = {
    "data_path": str("../../../user_defined_files/data/sample_mc_toxic_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_mc_toxic_sklearn_linear.LogisticRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_mc_toxic_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "toxic",
}

tabular_binary_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/bc_tabular_credit"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "default",
}

multiclass_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_mc_pipeline_toxic_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/mc_tabular_toxic"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_mc_pipeline_toxic_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "toxic",
}


@pytest.mark.parametrize(
    "data_set",
    [binary_classification, multiclass, tabular_binary_pipeline, multiclass_pipeline],
)
def test_ALE_plugin(data_set):
    core_modules_path = ""
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
    )
    plugin_test.run()

    json_file_path = Path.cwd() / "output" / "results.json"
    assert json_file_path.exists()
