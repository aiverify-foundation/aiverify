from pathlib import Path

import pytest
from aiverify_partial_dependence_plot.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

binary_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.REGRESSION,
    "ground_truth": "default",
}

multiclass_non_pipeline = {
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
    [
        binary_non_pipeline,
        tabular_binary_pipeline,
        # multiclass_non_pipeline, #TODO : revisit multiclass data sets
        # multiclass_pipeline, #TODO : revisit multiclass data sets
    ],
)
def test_partial_dependence_plot_plugin(data_set):
    # Create an instance of PluginTest with defined paths and arguments and Run.
    core_modules_path = ""
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
