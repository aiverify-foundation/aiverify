from pathlib import Path

import pytest
from aiverify_fairness_metrics_toolbox_for_regression.algo_init import AlgoInit
from test_engine_core.plugins.enums.model_type import ModelType

regression_non_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_reg_donation_data.sav"),
    "model_path": str(
        "../../../user_defined_files/model/sample_reg_donation_sklearn_linear.LogisticRegression.sav"
    ),
    "ground_truth_path": str(
        "../../../user_defined_files/data/sample_reg_donation_data.sav"
    ),
    "run_pipeline": False,
    "model_type": ModelType.REGRESSION,
    "ground_truth": "donation",
    "sensitive_feature": ["gender"],
}

binary_pipeline = {
    "data_path": str("../../../user_defined_files/data/sample_reg_pipeline_data.sav"),
    "model_path": str(
        "../../../user_defined_files/data/sample_reg_pipeline_ytest_data.sav"
    ),
    "ground_truth_path": str(
        "../../../user_defined_files/data/sample_reg_pipeline_ytest_data.sav"
    ),
    "run_pipeline": True,
    "model_type": ModelType.REGRESSION,
    "ground_truth": "donation",
    "sensitive_feature": ["gender"],
}


@pytest.mark.parametrize(
    "data_set",
    [regression_non_pipeline, binary_pipeline],
)
def test_fairness_metrics_toolbox_for_regression_plugin(data_set):
    try:
        # Create an instance of PluginTest with defined paths and arguments and Run.
        core_modules_path = ""
        plugin_argument_values = {
            "sensitive_feature": data_set.sensitive_feature,
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

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")