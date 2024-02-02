import json
import warnings
from pathlib import Path

from test_engine_api import version_msg as core_version_msg
from test_engine_core.utils.validate_checks import is_empty_string
from test_engine_api import version_msg as api_version_msg
from test_engine_api.algorithm_info import AlgorithmInfo
from test_engine_api.api import (
    delete_algorithm_plugin,
    discover_algorithm_plugins,
    discover_core_plugins,
    install_algorithm_plugin,
    print_discovered_plugins,
    run_test,
)
from test_engine_api.test_argument import TestArgument


def update_task_progress(completion_progress: int) -> None:
    """
    A helper method to update the new task progress and send task update

    Args:
        completion_progress (int): Current progress completion
    """
    # Set the task completion progress
    print(f"Task Completion Progress: {str(completion_progress)}")


def write_result_to_file(filename: str, result: dict) -> None:
    """
    Write the given result to the specified file in JSON format.

    Args:
        filename (str): The name of the file to write the result to.
        result (dict): The dictionary containing the result to be written.

    Returns:
        None
    """
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)


def run_example_test() -> None:
    # Settings the warnings to be ignored
    warnings.filterwarnings("ignore")

    # Define example variables
    # Define core modules and algorithm folders
    core_plugins_path = "test-engine-core-modules"
    algorithms_plugins_path = "stock-plugins"

    # Define output filename
    result_output_file = "output_test_results.json"

    # Print AI Verify package versions
    print(api_version_msg())
    print(core_version_msg())

    # Validate core plugins folder
    print("Validating core plugins folder...")
    validation_error_count, validation_error_message = validate_folder(
        core_plugins_path
    )
    if validation_error_count != 0:
        print(
            f"Core modules folder validation failed. Error messages: {validation_error_message}"
        )
        return

    # Validate algorithms plugins folder
    print("Validating algorithm plugins folder...")
    validation_error_count, validation_error_message = validate_folder(
        algorithms_plugins_path
    )
    if validation_error_count != 0:
        print(
            f"Algorithm plugins folder validation failed. Error messages: {validation_error_message}"
        )
        return

    # Discover core plugins
    print("Discovering core plugins...")
    discover_core_plugins(core_plugins_path)

    # Discover algorithm plugins
    print("Discovering algorithm plugins...")
    discovered_algorithms = discover_algorithm_plugins(algorithms_plugins_path)
    print(f"Discovered {len(discovered_algorithms)} algorithm plugins.")

    # Install algorithm plugins
    for algorithm_cid, algorithm_information in discovered_algorithms.items():
        is_success, error_message = install_algorithm_plugin(
            algorithm_cid, algorithm_information
        )
        if is_success:
            print("Installed algorithm plugin: ", algorithm_cid)
        else:
            print(
                f"Unable to install algorithm plugin: ({algorithm_cid}): {error_message}"
            )

    # Delete algorithm plugins
    # print("Deleting algorithm plugins...")
    # delete_algorithm_name = (
    #     "algo:aiverify.stock.fairness_metrics_toolbox_for_classification:"
    #     "fairness_metrics_toolbox_for_classification"
    # )
    # is_success, error_message = delete_algorithm_plugin(delete_algorithm_name)
    # if is_success:
    #     print("Deleted algorithm plugin: ", delete_algorithm_name)
    # else:
    #     print(
    #         f"Unable to delete algorithm plugin: delete_algorithm_name, Error: {error_message}"
    #     )

    # Print discovered plugins
    print("Discovered plugins...")
    print_discovered_plugins()

    # Define test cases
    my_ale_test = (
        {
            "testDataset": "examples/data/sample_bc_credit_data.sav",
            "modelFile": "examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
            "groundTruthDataset": "examples/data/sample_bc_credit_data.sav",
            "groundTruth": "default",
            "algorithmId": "algo:aiverify.stock.accumulated_local_effect:accumulated_local_effect",
            "algorithmArgs": {},
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-ale"
    )
    my_pdp_test = (
        {
            "testDataset": "examples/data/sample_bc_credit_data.sav",
            "modelFile": "examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
            "groundTruthDataset": "examples/data/sample_bc_credit_data.sav",
            "groundTruth": "default",
            "algorithmId": "algo:aiverify.stock.partial_dependence_plot:partial_dependence_plot",
            "algorithmArgs": {},
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-pdp"
    )
    my_fmtc_non_pipeline_test = (
        {
            "testDataset": "examples/data/sample_bc_credit_data.sav",
            "modelFile": "examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
            "groundTruthDataset": "examples/data/sample_bc_credit_data.sav",
            "groundTruth": "default",
            "algorithmId": "algo:aiverify.stock.fairness_metrics_toolbox_for_classification:fairness_metrics_toolbox_for_classification",
            "algorithmArgs": {
                "sensitive_feature": ["gender"],
                "annotated_labels_path": "examples/data/sample_bc_credit_data.sav",
                "file_name_label": "NA"
            },
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-fmtc-non-pipeline",
    )
    my_fmtc_pipeline_test = (
        {
            "testDataset": "examples/data/sample_mc_pipeline_toxic_data.sav",
            "modelFile": "examples/pipeline/mc_tabular_toxic",
            "groundTruthDataset": "examples/data/sample_mc_pipeline_toxic_ytest_data.sav",
            "groundTruth": "toxic",
            "algorithmId": "algo:aiverify.stock.fairness_metrics_toolbox_for_classification:fairness_metrics_toolbox_for_classification",
            "algorithmArgs": {
                "sensitive_feature": ["gender"],
                "annotated_labels_path": "",
                "file_name_label": ""
            },
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-fmtc-pipeline",
    )
    my_fmtc_image_pipeline_test = (
        {
            "testDataset": f"{algorithms_plugins_path}/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/tests/user_defined_files/data/small_test",
            "modelFile": f"{algorithms_plugins_path}/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/tests/user_defined_files/pipeline/bc_image_face",
            "groundTruthDataset": f"{algorithms_plugins_path}/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/tests/user_defined_files/data/pickle_pandas_annotated_labels_50.sav",
            "groundTruth": "gender",
            "algorithmId": "algo:aiverify.stock.fairness_metrics_toolbox_for_classification:fairness_metrics_toolbox_for_classification",
            "algorithmArgs": {
                "sensitive_feature": ["race"],
                "annotated_labels_path": f"{algorithms_plugins_path}/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/tests/user_defined_files/data/pickle_pandas_annotated_labels_50.sav",
                "file_name_label": "image_directory"
            },
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-fmtc-image-pipeline",
    )
    my_fmtr_non_pipeline_test = (
        {
            "testDataset": "examples/data/sample_reg_donation_data.sav",
            "modelFile": "examples/model/sample_reg_donation_sklearn_linear.LogisticRegression.sav",
            "groundTruthDataset": "examples/data/sample_reg_donation_data.sav",
            "groundTruth": "donation",
            "algorithmId": "algo:aiverify.stock.fairness_metrics_toolbox_for_regression:fairness_metrics_toolbox_for_regression",
            "algorithmArgs": {
                "sensitive_feature": ["gender"]
            },
            "mode": "upload",
            "modelType": "regression",
        },
        "test-engine-api-example-fmtr-non-pipeline",
    )
    my_fmtr_pipeline_test = (
        {
            "testDataset": "examples/data/sample_reg_pipeline_data.sav",
            "modelFile": "examples/pipeline/regression_tabular_donation",
            "groundTruthDataset": "examples/data/sample_reg_pipeline_ytest_data.sav",
            "groundTruth": "donation",
            "algorithmId": "algo:aiverify.stock.fairness_metrics_toolbox_for_regression:fairness_metrics_toolbox_for_regression",
            "algorithmArgs": {
                "sensitive_feature": ["gender"]
            },
            "mode": "upload",
            "modelType": "regression",
        },
        "test-engine-api-example-fmtr-pipeline",
    )
    my_robustness_test = (
        {
            "testDataset": "examples/data/sample_bc_credit_data.sav",
            "modelFile": "examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
            "groundTruthDataset": "examples/data/sample_bc_credit_data.sav",
            "groundTruth": "default",
            "algorithmId": "algo:aiverify.stock.robustness_toolbox:robustness_toolbox",
            "algorithmArgs": {
                "annotated_ground_truth_path": "examples/data/sample_bc_credit_data.sav",
                "file_name_label": "na"
            },
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-robustness",
    )
    my_robustness_image_test = (
        {
            "testDataset": "examples/data/raw_fashion_image_10",
            "modelFile": "examples/pipeline/multiclass_classification_image_mnist_fashion",
            "groundTruthDataset": "examples/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav",
            "groundTruth": "label",
            "algorithmId": "algo:aiverify.stock.robustness_toolbox:robustness_toolbox",
            "algorithmArgs": {
                "annotated_ground_truth_path": "examples/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav",
                "file_name_label": "file_name"
            },
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-robustness-image",
    )
    my_shap_test = (
        {
            "testDataset": "examples/data/sample_bc_credit_data.sav",
            "modelFile": "examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
            "groundTruthDataset": "examples/data/sample_bc_credit_data.sav",
            "groundTruth": "default",
            "algorithmId": "algo:aiverify.stock.shap_toolbox:shap_toolbox",
            "algorithmArgs": {
                "explain_type": "global",
                "background_path": "examples/data/sample_bc_credit_data.sav",
                "background_samples": 5,
                "data_samples": 5
            },
            "mode": "upload",
            "modelType": "classification",
        },
        "test-engine-api-example-shap",
    )

    # Run principles test
    principles_test_cases = [
        my_ale_test, my_pdp_test, my_fmtc_non_pipeline_test, my_fmtc_image_pipeline_test, my_fmtc_pipeline_test,
        my_fmtr_non_pipeline_test, my_fmtr_pipeline_test, my_robustness_test, my_robustness_image_test, my_shap_test
    ]
    print("=" * 50)
    for my_test_arguments, result_output_file in principles_test_cases:
        my_algorithm_info = AlgorithmInfo(
            my_test_arguments["algorithmId"],
            discovered_algorithms[my_test_arguments["algorithmId"]],
        )
        test_argument_inst = TestArgument(my_algorithm_info, my_test_arguments)

        # Process my test arguments
        is_success, error_message, test_results = run_test(
            test_argument_inst, update_task_progress
        )
        if is_success:
            print(f"{result_output_file} test passed. Writing to file...")
            write_result_to_file(result_output_file, test_results)
        else:
            print(f"{result_output_file} test failed. Error: {error_message}")

        # Print footer
        print("=" * 50)


def validate_folder(folder: str) -> tuple[int, str]:
    """
    A helper method to perform data validation on the folder.

    Args:
        folder (str): The folder path

    Returns:
        Tuple[int, str]: Returns the error count and the error messages.
    """
    error_count: int = 0
    error_message: str = ""

    if is_empty_string(folder) or not Path(folder).is_dir():
        error_count += 1
        error_message += "The folder is not a directory."

    return error_count, error_message


if __name__ == "__main__":  # pragma: no cover
    run_example_test()
