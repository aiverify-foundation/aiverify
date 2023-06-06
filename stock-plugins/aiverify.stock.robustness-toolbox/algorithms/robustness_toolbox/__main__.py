from test_engine_core.plugins.enums.model_type import ModelType
from tests.plugin_test import PluginTest

if __name__ == "__main__":
    # # Tabular Binary Classification Pipeline
    # data_path = (
    #     "tests/user_defined_files/data/"
    #     "pickle_pandas_mock_binary_classification_pipeline_credit_risk_testing.sav"
    # )
    # model_path = (
    #     "tests/user_defined_files/pipeline/binary_classification_tabular_credit_loan"
    # )
    # ground_truth_path = (
    #     "tests/user_defined_files/data/"
    #     "pickle_pandas_mock_binary_classification_pipeline_credit_risk_ytest.sav"
    # )
    # ground_truth = "default"
    # run_pipeline = True
    # model_type = ModelType.CLASSIFICATION

    # # Regression Non-Pipeline
    # data_path = "tests/user_defined_files/data/pickle_pandas_mock_regression_donation_testing.sav"
    # model_path = ("tests/user_defined_files/model/"
    #               "regression_mock_donation_sklearn.linear_model._base.LinearRegression.sav")
    # ground_truth_path = (
    #     "tests/user_defined_files/data/pickle_pandas_mock_regression_donation_testing.sav"
    # )
    # ground_truth = "donation"
    # run_pipeline = False
    # model_type = ModelType.REGRESSION

    # Image Pipeline
    data_path = "tests/user_defined_files/data/raw_fashion_image_10"
    model_path = "tests/user_defined_files/pipeline/multiclass_classification_image_mnist_fashion"
    ground_truth_path = "tests/user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
    ground_truth = "label"
    run_pipeline = True
    model_type = ModelType.CLASSIFICATION

    core_modules_path = "../../../../test-engine-core-modules"
    plugin_argument_values = {
        "annotated_ground_truth_path": (
            "tests/user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
        ),
        "file_name_label": ("file_name"),
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
