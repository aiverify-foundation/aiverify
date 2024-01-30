import json
import warnings
from pathlib import Path

from test_engine_core import version_msg as core_version_msg
from test_engine_core.utils.validate_checks import is_empty_string
from test_engine_pypi import version_msg as pypi_version_msg
from test_engine_pypi.algorithm_info import AlgorithmInfo
from test_engine_pypi.api import (
    delete_algorithm_plugin,
    discover_algorithm_plugins,
    discover_core_plugins,
    install_algorithm_plugin,
    print_discovered_plugins,
    run_test,
)
from test_engine_pypi.test_argument import TestArgument


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

    # Define test_output_file
    result_output_file = "principles_test_results.json"

    # Define core modules and algorithm folders
    core_plugins_path = "/Users/lionelteo/Documents/aiverify/test-engine-core-modules"
    algorithms_plugins_path = "/Users/lionelteo/Documents/aiverify/stock-plugins"

    # Print AI Verify package versions
    print(pypi_version_msg())
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
    print("Deleting algorithm plugins...")
    delete_algorithm_name = (
        "algo:aiverify.stock.fairness_metrics_toolbox_for_classification:"
        "fairness_metrics_toolbox_for_classification"
    )
    is_success, error_message = delete_algorithm_plugin(delete_algorithm_name)
    if is_success:
        print("Deleted algorithm plugin: ", delete_algorithm_name)
    else:
        print(
            f"Unable to delete algorithm plugin: delete_algorithm_name, Error: {error_message}"
        )

    # Print discovered plugins
    print("Discovered plugins...")
    print_discovered_plugins()

    # Run principles test
    print("Running principles test...")

    # Define test arguments
    my_test_arguments = {
        "testDataset": "sample/sample_bc_credit_data.sav",
        "modelFile": "sample/sample_bc_credit_sklearn_linear.LogisticRegression.sav",
        "groundTruthDataset": "sample/sample_bc_credit_data.sav",
        "groundTruth": "default",
        "algorithm_id": "algo:aiverify.stock.partial_dependence_plot:partial_dependence_plot",
        "algorithm_arguments": {},
        "mode": "upload",
        "modelType": "classification",
    }
    my_algorithm_info = AlgorithmInfo(
        my_test_arguments["algorithm_id"],
        discovered_algorithms[my_test_arguments["algorithm_id"]],
    )
    test_argument_inst = TestArgument(my_algorithm_info, my_test_arguments)

    # Process my test arguments
    is_success, error_message, test_results = run_test(
        test_argument_inst, update_task_progress
    )
    if is_success:
        print("Principles test passed. Writing to file...")
        write_result_to_file(result_output_file, test_results)

    else:
        print(f"Principles test failed. Error: {error_message}")


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
