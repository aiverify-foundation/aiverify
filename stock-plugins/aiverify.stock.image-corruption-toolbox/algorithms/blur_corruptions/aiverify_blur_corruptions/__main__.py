# from test_engine_core.plugins.enums.model_type import ModelType
# from tests.plugin_test import PluginTest

# if __name__ == "__main__":
#     # Image Pipeline
#     data_path = "tests/user_defined_files/data/raw_fashion_image_10"
#     model_path = "tests/user_defined_files/pipeline/multiclass_classification_image_mnist_fashion"
#     ground_truth_path = "tests/user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
#     ground_truth = "label"
#     run_pipeline = True
#     model_type = ModelType.CLASSIFICATION
#     plugin_argument_values = {
#         "annotated_ground_truth_path": (
#             "tests/user_defined_files/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav"
#         ),
#         "file_name_label": "file_name",
#         "set_seed": 10,
#     }

#     core_modules_path = ""

#     # =====================================================================================
#     # NOTE: Do not modify the code below
#     # =====================================================================================
#     # Perform Plugin Testing
#     try:
#         # Create an instance of PluginTest with defined paths and arguments and Run.
#         plugin_test = PluginTest(
#             run_pipeline,
#             core_modules_path,
#             data_path,
#             model_path,
#             ground_truth_path,
#             ground_truth,
#             model_type,
#             plugin_argument_values,
#         )
#         plugin_test.run()

#     except Exception as exception:
#         print(f"Exception caught while running the plugin test: {str(exception)}")


"""
Allow aiverify_fairness_metrics_toolbox_for_classification to be executable through
`python3 -m aiverify_fairness_metrics_toolbox_for_classification`
"""
import sys
from importlib.metadata import version
from pathlib import Path

from aiverify_blur_corruptions.plugin_init import run


def main() -> None:
    """
    Print the version of test engine core
    """
    print("*" * 20)
    print(version_msg())
    print("*" * 20)
    # invoke algorithm
    run()


def version_msg():
    """
    Return the aiverify_fairness_metrics_toolbox_for_classification version, location and Python powering it.
    """
    python_version = sys.version
    location = Path(__file__).resolve().parent.parent

    return f"Fairness toolbox metrics for classification - {version} from {location} (Python {python_version})"


if __name__ == "__main__":
    main()
