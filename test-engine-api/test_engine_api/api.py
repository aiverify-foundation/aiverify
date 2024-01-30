import glob
import json
from pathlib import Path
from typing import Callable

from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager
from test_engine_core.utils.json_utils import remove_numpy_formats

from test_engine_api.algorithm_info import AlgorithmInfo
from test_engine_api.test_argument import TestArgument
from test_engine_api.test_processing import TestProcessing


def discover_core_plugins(core_plugins_folder: str) -> None:
    """
    Discovers core plugins in the specified folder.

    Args:
        core_plugins_folder (str): The path to the folder containing core plugins.

    Returns:
        None
    """
    PluginManager.discover(core_plugins_folder)


def discover_algorithm_plugins(algorithms_plugins_folder: str) -> dict:
    """
    Discover algorithm plugins in the specified folder and gather metadata information.

    Args:
        algorithms_plugins_folder (str): The path to the folder containing the algorithm plugins.

    Returns:
        dict: A dictionary containing information about the discovered algorithm plugins.
    """
    discover_algorithms_metadata_path = [
        file
        for file in glob.glob(
            f"{algorithms_plugins_folder}/**/algorithms/**/*.meta.json", recursive=True
        )
    ]

    # Gather information on the algorithm and install
    discovered_algorithm_information = {}
    for algorithm_metadata_path in discover_algorithms_metadata_path:
        # Exclude plugin meta json
        if Path(algorithm_metadata_path).name == "plugin.meta.json":
            continue

        algorithm_base_path = str(Path(algorithm_metadata_path).parent)
        plugin_base_path = str(Path(algorithm_metadata_path).parent.parent.parent)

        plugin_metadata_path = plugin_base_path + "/plugin.meta.json"
        algorithm_metadata_path = algorithm_metadata_path
        algorithm_input_schema_path = algorithm_base_path + "/input.schema.json"
        algorithm_output_schema_path = algorithm_base_path + "/output.schema.json"
        algorithm_requirements_path = algorithm_base_path + "/requirements.txt"

        plugin_metadata = json.loads(open(plugin_metadata_path).read())
        algorithm_metadata = json.loads(open(algorithm_metadata_path).read())
        algorithm_input_schema = json.loads(open(algorithm_input_schema_path).read())
        algorithm_output_schema = json.loads(open(algorithm_output_schema_path).read())
        algorithm_requirements = open(algorithm_requirements_path).read()

        # data attribute
        data = {
            "gid": f"{plugin_metadata.get('gid')}:{algorithm_metadata.get('cid')}",
            "pluginGID": plugin_metadata.get("gid"),
            "type": "Algorithm",
            "algoPath": algorithm_base_path,
        }
        data.update(algorithm_metadata)

        # requirements attribute
        requirements_list = str(
            [
                line.strip()
                for line in algorithm_requirements.split("\n")
                if line.strip()
            ]
        )

        algorithm_information = {
            "data": json.dumps(data),
            "inputSchema": json.dumps(algorithm_input_schema),
            "outputSchema": json.dumps(algorithm_output_schema),
            "requirements": json.dumps(requirements_list),
        }

        # store the algorithm and information
        discovered_algorithm_information[
            f'algo:{data.get("gid")}'
        ] = algorithm_information

    return discovered_algorithm_information


def install_algorithm_plugin(
    algorithm_id: str, algorithm_info: dict
) -> tuple[bool, str]:
    """
    Install the algorithm plugin if it does not already exist.

    Args:
        algorithm_id (str): The ID of the algorithm plugin.
        algorithm_info (dict): Information about the algorithm plugin.

    Returns:
        tuple[bool, str]: A tuple containing a boolean indicating installation success
        and a string with an error message if installation fails.
    """
    # Check that the algorithm plugin requires installation
    if PluginManager.is_plugin_exists(PluginType.ALGORITHM, algorithm_id):
        # Algorithm exists
        error_message = (
            f"The {algorithm_id} cannot be installed: " f"It is already installed"
        )
        return False, error_message

    else:
        # Algorithm does not exist
        algo_instance = AlgorithmInfo(algorithm_id, algorithm_info)

        # Install the algorithm plugin by providing the PluginManager the path to discover.
        PluginManager.discover(algo_instance.get_algorithm_path(), algorithm_id)

        # Check that the algorithm plugin is loaded
        if PluginManager.is_plugin_exists(PluginType.ALGORITHM, algorithm_id):
            # Installation success
            return True, ""
        else:
            # Installation failed
            error_message = (
                f"The {algorithm_id} cannot be installed: "
                f"It is unable to discover the algorithm"
            )
            return False, error_message


def delete_algorithm_plugin(algorithm_id: str) -> tuple[bool, str]:
    """
    Delete the algorithm plugin with the given ID.

    Args:
        algorithm_id (str): The ID of the algorithm plugin to delete.

    Returns:
        tuple[bool, str]: A tuple containing a boolean indicating whether the
        deletion was successful and an error message if applicable.
    """
    if not PluginManager.is_plugin_exists(PluginType.ALGORITHM, algorithm_id):
        # Algorithm does not exist
        error_message = f"The {algorithm_id} cannot be deleted: " f"It is not installed"
        return False, error_message
    else:
        # Algorithm exists
        PluginManager.remove_plugin(PluginType.ALGORITHM, algorithm_id)
        return True, ""


def print_discovered_plugins() -> None:
    """
    Print the discovered plugins using PluginManager.get_printable_plugins.
    """
    print(PluginManager.get_printable_plugins())


def run_test(
    test_argument: TestArgument, update_progress_method: Callable
) -> tuple[bool, str, dict]:
    """
    Run the test with the given test argument and update progress method.

    Args:
        test_argument (TestArgument): The test argument.
        update_progress_method (Callable): The method to update the progress.

    Returns:
        tuple[bool, str]: A tuple containing the success status and error messages.
    """
    is_success: bool = False
    model_instance = None
    error_messages: str = ""
    test_results: dict = {}

    try:
        test_processing = TestProcessing(test_argument, update_progress_method)
        # Load instances
        (
            is_load_success,
            data_serializer_instance,
            model_serializer_instance,
            _,
            algorithm_serializer_instance,
            load_error_messages,
        ) = test_processing.load_instances()
        if not (
            is_load_success
            and data_serializer_instance[0]
            and model_serializer_instance[0]
            and algorithm_serializer_instance[0]
        ):
            # Load instances failed
            raise RuntimeError(load_error_messages)
        else:
            model_instance = model_serializer_instance[0]
            algorithm_instance = algorithm_serializer_instance[0]

        # Generate and get the output from the algorithm process
        algorithm_instance.generate()

        process_output = algorithm_instance.get_results()
        if not process_output:
            # Exception while processing algorithm
            raise RuntimeError(process_output)

        # Get the task results and convert to json friendly and validate against the output schema
        print("The raw task results: ", process_output)
        test_results = remove_numpy_formats(process_output)
        (
            is_validation_success,
            validation_error_messages,
        ) = test_processing.validate_task_results(test_results)

        if is_validation_success:
            is_success = True
            error_messages = ""
        else:
            # Validation failed
            print(
                f"Failed output schema validation: Task Output Results: {test_results}"
            )
            raise RuntimeError(validation_error_messages)

    except Exception as exception:
        is_success = False
        error_messages = str(exception)

    finally:
        if is_success:
            # Format result to json
            test_results = {
                "gid": test_argument.algorithm_plugin_information.data["pluginGID"],
                "version": test_argument.algorithm_plugin_information.data["version"],
                "cid": test_argument.algorithm_plugin_information.data["cid"],
                "output": test_results,
            }
            print("Task completed successfully")
        else:
            print(f"Task failed: {error_messages}")

        # Perform clean up for model instance
        if model_instance:
            model_instance.cleanup()

    return is_success, error_messages, test_results
