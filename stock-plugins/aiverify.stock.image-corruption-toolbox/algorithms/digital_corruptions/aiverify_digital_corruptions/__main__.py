from test_engine_core.plugins.enums.model_type import ModelType
from tests.plugin_test import PluginTest

if __name__ == "__main__":
    # Image Pipeline
    data_path = "tests/user_defined_files/data/raw_fashion_image_10"
    model_path = "tests/user_defined_files/pipeline/multiclass_classification_image_mnist_fashion"
    ground_truth_path = "tests/user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
    ground_truth = "label"
    run_pipeline = True
    model_type = ModelType.CLASSIFICATION
    plugin_argument_values = {
        "annotated_ground_truth_path": (
            "tests/user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
        ),
        "file_name_label": "file_name",
        "set_seed": 10,
    }

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
            plugin_argument_values,
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")
