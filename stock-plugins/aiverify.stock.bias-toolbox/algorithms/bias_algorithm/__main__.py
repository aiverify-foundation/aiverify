from test_engine_core.plugins.enums.model_type import ModelType

from tests.plugin_test import PluginTest

if __name__ == "__main__":
    # TODO: Define data, model, ground_truth file location. Requires absolute path.
    #       Define core modules path as relative/absolute path. If you cloned the project using 
    #       the provided setup script, leave core_modules_path as an empty string.
    # Example:
    # data_path = "tests/user_defined_files/data/sample_reg_donation_data.sav"
    # model_path = "tests/user_defined_files/model/sample_reg_donation_sklearn_linear.LogisticRegression.sav"
    # ground_truth_path = "tests/user_defined_files/data/sample_reg_donation_data.sav"
    # ground_truth = "default"
    # model_type = ModelType.REGRESSION
    core_modules_path = ""
    
    data_path = "tests/user_defined_files/data/sample_bc_credit_data.sav"
    model_path = "tests/user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav"
    ground_truth_path = "tests/user_defined_files/data/sample_bc_credit_data.sav"
    ground_truth = "default"
    model_type = ModelType.CLASSIFICATION
    run_pipeline = False

    # TODO: Define the plugin input parameters value referenced from input.schema.json
    # Example:
    plugin_argument_values = {
        "data_path": data_path,
        "test_variable": ["race", "gender", "loan_amount"],
        'target_variable': 'income',
        "p_value": 0.05
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
