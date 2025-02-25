from pathlib import Path

import pytest
from aiverify_veritastool.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

credit_scoring_pipeline = {
    "data_path": str("../../../user_defined_files/veritas_data/cs_X_test.pkl"),
    "model_path": str("../../../user_defined_files/veritas_data/cs_model.pkl"),
    "ground_truth_path": str("../../../user_defined_files/veritas_data/cs_y_test.pkl"),
    "ground_truth": "y_test",
    "run_pipeline": True,
    "model_type": ModelType.CLASSIFICATION,
}

@pytest.mark.parametrize(
    "data_set",
    [
        credit_scoring_pipeline,
    ],
)
def test_veritas_plugin(data_set):
    # Create an instance of PluginTest with defined paths and arguments and Run.
    plugin_argument_values = {
        "use_case": "credit_scoring",
        "training_data_path": str("../../../user_defined_files/veritas_data/cs_X_train.pkl"),
        "training_ground_truth_path": str("../../../user_defined_files/veritas_data/cs_y_train.pkl"),
        "training_ground_truth": "y_train",
        "privileged_groups": {"SEX": [1], "MARRIAGE": [1]},
        "unprivileged_groups": None,
        "fair_threshold": 80,
        "fair_metric": "auto",
        "fair_concern": "eligible",
        "probability_threshold": 0.5,
        "performance_metric": "accuracy",
        "transparency_rows": [20, 40],
        "transparency_max_samples": 1000,
        "transparency_features": ["LIMIT_BAL"],
        "protected_features": None,
        "positive_label": [1],
        "negative_label": None,
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
