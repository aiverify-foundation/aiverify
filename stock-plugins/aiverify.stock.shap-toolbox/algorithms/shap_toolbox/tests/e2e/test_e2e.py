from pathlib import Path

import pytest
from aiverify_shap_toolbox.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

binary_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "default",
    "background_path": str("../../../user_defined_files/data/sample_bc_credit_data.sav"),
}

multiclass_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_mc_toxic_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_mc_toxic_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "toxic",
    "background_path": str("../../../user_defined_files/data/sample_mc_toxic_data.sav"),
}

tabular_binary_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/bc_tabular_credit"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "default",
    "background_path": str("../../../user_defined_files/data/sample_bc_pipeline_credit_data.sav"),
}

multiclass_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_mc_pipeline_toxic_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/mc_tabular_toxic"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_mc_pipeline_toxic_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
    "ground_truth": "toxic",
    "background_path": str("../../../user_defined_files/data/sample_mc_pipeline_toxic_data.sav"),
}

regression_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_reg_donation_data.sav"),
    "model_path": str("../../../user_defined_files/model/sample_reg_donation_sklearn_linear.LinearRegression.sav"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_reg_donation_data.sav"),
    "run_pipeline": False,
    "model_type": ModelType.REGRESSION,
    "ground_truth": "donation",
    "background_path": str("../../../user_defined_files/data/sample_reg_donation_data.sav"),
}

regression_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_reg_pipeline_data.sav"),
    "model_path": str("../../../user_defined_files/pipeline/regression_tabular_donation"),
    "ground_truth_path": str("../../../user_defined_files/data/sample_reg_pipeline_ytest_data.sav"),
    "run_pipeline": True,
    "model_type": ModelType.REGRESSION,
    "ground_truth": "donation",
    "background_path": str("../../../user_defined_files/data/sample_reg_donation_data.sav"),
}


@pytest.mark.parametrize(
    "data_set",
    [
        binary_non_pipeline,
        tabular_binary_pipeline,
        # multiclass_non_pipeline # TODO : Not working, revisit later
        multiclass_pipeline,
        regression_non_pipeline,
        regression_pipeline,
    ],
)
def test_pshap_toolbox_plugin(data_set):
    # Create an instance of PluginTest with defined paths and arguments and Run.
    plugin_argument_values = {
        "explain_type": "global",
        "background_path": data_set["background_path"],
        "background_samples": 25,
        "data_samples": 25,
    }

    core_modules_path = ""
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
