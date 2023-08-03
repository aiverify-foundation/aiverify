from test_engine_core.plugins.enums.model_type import ModelType
from tests.plugin_test import PluginTest

if __name__ == "__main__":
    # # Binary Classification Non-Pipeline
    # data_path = "tests/user_defined_files/data/sample_bc_credit_data.sav"
    # model_path = "tests/user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav"
    # ground_truth_path = "tests/user_defined_files/data/sample_bc_credit_data.sav"
    # ground_truth = "default"
    # run_pipeline = False
    # model_type = ModelType.CLASSIFICATION

    # # Multiclass Classification Non-Pipeline
    # data_path = "tests/user_defined_files/data/sample_mc_toxic_data.sav"
    # model_path = "tests/user_defined_files/model/sample_mc_toxic_sklearn_linear.LogisticRegression.sav"
    # ground_truth_path = "tests/user_defined_files/data/sample_mc_toxic_data.sav"
    # ground_truth = "toxic"
    # run_pipeline = False
    # model_type = ModelType.CLASSIFICATION

    # # Tabular Binary Classification Pipeline
    # data_path = "tests/user_defined_files/data/sample_bc_pipeline_credit_data.sav"
    # model_path = "tests/user_defined_files/pipeline/bc_tabular_credit"
    # ground_truth_path = "tests/user_defined_files/data/sample_bc_pipeline_credit_ytest_data.sav"
    # ground_truth = "default"
    # run_pipeline = True
    # model_type = ModelType.CLASSIFICATION

    # Multiclass Classification Pipeline
    data_path = "tests/user_defined_files/data/sample_mc_pipeline_toxic_data.sav"
    model_path = "tests/user_defined_files/pipeline/mc_tabular_toxic"
    ground_truth_path = (
        "tests/user_defined_files/data/sample_mc_pipeline_toxic_ytest_data.sav"
    )
    ground_truth = "toxic"
    run_pipeline = True
    model_type = ModelType.CLASSIFICATION

    core_modules_path = ""

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
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")
