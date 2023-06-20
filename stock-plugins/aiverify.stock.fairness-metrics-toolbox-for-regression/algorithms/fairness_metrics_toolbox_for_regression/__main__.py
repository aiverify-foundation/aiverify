from test_engine_core.plugins.enums.model_type import ModelType
from tests.plugin_test import PluginTest

if __name__ == "__main__":
    # # Regression Non-Pipeline
    # data_path = "tests/user_defined_files/data/sample_reg_donation_data.sav"
    # model_path = "tests/user_defined_files/model/sample_reg_donation_sklearn_linear.LogisticRegression.sav"
    # ground_truth_path = "tests/user_defined_files/data/sample_reg_donation_data.sav"
    # ground_truth = "donation"
    # sensitive_feature = ["gender"]
    # run_pipeline = False
    # model_type = ModelType.REGRESSION

    # Regression Binary Classification Pipeline
    data_path = "tests/user_defined_files/data/sample_reg_pipeline_data.sav"
    model_path = "tests/user_defined_files/pipeline/regression_tabular_donation"
    ground_truth_path = (
        "tests/user_defined_files/data/sample_reg_pipeline_ytest_data.sav"
    )
    ground_truth = "donation"
    sensitive_feature = ["gender"]
    run_pipeline = True
    model_type = ModelType.REGRESSION

    core_modules_path = ""
    plugin_argument_values = {
        "sensitive_feature": sensitive_feature,
    }

    # =====================================================================================
    # NOTE: Do not modify the code below
    # =====================================================================================
    # Perform Plugin Testing
    try:
        # Create an instance of PluginTest with defined paths and arguments and Run.
        plugin_test = PluginTest(
            run_pipeline,
            core_modules_path,
            data_path,
            model_path,
            ground_truth_path,
            ground_truth,
            model_type,
            plugin_argument_values,
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")
