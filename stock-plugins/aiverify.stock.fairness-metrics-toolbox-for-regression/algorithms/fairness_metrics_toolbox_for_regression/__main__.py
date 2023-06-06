from test_engine_core.plugins.enums.model_type import ModelType
from tests.plugin_test import PluginTest

if __name__ == "__main__":
    # Regression Non-Pipeline
    data_path = "tests/user_defined_files/data/pickle_pandas_mock_regression_donation_testing.sav"
    model_path = (
        "tests/user_defined_files/model/"
        "regression_mock_donation_sklearn.linear_model._base.LinearRegression.sav"
    )
    ground_truth_path = "tests/user_defined_files/data/pickle_pandas_mock_regression_donation_testing.sav"
    ground_truth = "donation"
    sensitive_feature = ["gender"]
    run_pipeline = False
    model_type = ModelType.REGRESSION

    # # Regression Binary Classification Pipeline
    # data_path = "tests/user_defined_files/data/pickle_pandas_mock_regression_pipeline_testing.sav"
    # model_path = "tests/user_defined_files/pipeline/regression_tabular_donation"
    # ground_truth_path = "tests/user_defined_files/data/pickle_pandas_mock_regression_pipeline_ytest.sav"
    # ground_truth = "donation"
    # sensitive_feature = ["gender"]
    # run_pipeline = True
    # model_type = ModelType.REGRESSION

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
