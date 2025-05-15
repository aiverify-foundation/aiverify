import glob
import importlib.util
import re
import sys
from importlib.machinery import ModuleSpec
from inspect import isclass, isfunction
from pathlib import Path
from types import ModuleType
from typing import Dict, Union

from aiverify_test_engine.utils.validate_checks import is_empty_string


def create_module_spec(
    module_name: str, module_file_path: str
) -> Union[None, ModuleSpec]:
    """
    A function to create module specifications

    Args:
        module_name (str): Input module name to be imported
        module_file_path (str): Input module file path to be imported

    Returns:
        Union[None, ModuleSpec]: Generated module specifications for importing or error
    """
    try:
        if (
            module_name is None
            or not isinstance(module_name, str)
            or module_file_path is None
            or not isinstance(module_file_path, str)
        ):
            return None

        # Create a module spec
        module_spec = importlib.util.spec_from_file_location(
            module_name, module_file_path
        )

        return module_spec

    except ValueError:
        # Unable to find spec from this file to create
        return None


def import_module_from_spec(module_spec: ModuleSpec) -> Union[ModuleType, None]:
    """
    A function to import python module using module specifications

    Args:
        module_spec (ModuleSpec): A generated module specifications for the module to be imported

    Returns:
        ModuleType: An imported module
    """
    if module_spec is None or not isinstance(module_spec, ModuleSpec):
        return None

    module = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(module)
    return module


def import_python_modules(discover_folder: str) -> None:
    """
    A function to import python modules to be imported into the system. This is to assist pipelining support

    Args:
        discover_folder (str): A path to discover py files
    """
    if discover_folder is None or is_empty_string(discover_folder):
        return

    # Find python files in the given folder.
    discover_paths = [
        file for file in glob.glob(f"{discover_folder}/**/*.py", recursive=True)
    ]

    # Search through the discovered paths and create modules
    for plugin_path in discover_paths:
        try:
            # Remove files that have underscores (__filename__.py)
            module_name = re.sub("\\.py$", "", Path(plugin_path).name)
            if module_name.__contains__("__"):
                continue

            # Import module with the module specification
            # Store modules in the dict
            module_spec = create_module_spec(module_name, plugin_path)
            if not module_spec:
                continue  # module spec is None

            module = import_module_from_spec(module_spec)

            # Update the modules and the attribute names of the class or functions in __main__
            sys.modules.update({module_name: module})
            for attribute_name in dir(module):
                attribute = getattr(module, attribute_name)
                if isclass(attribute) or isfunction(attribute):
                    setattr(sys.modules["__main__"], attribute_name, attribute)

        except Exception:
            pass  # Encountered an error while processing this py file; Continue next file


def get_non_python_files(discover_folder: str) -> Dict:
    """
    A function to get non-python files

    Args:
        discover_folder (str): A path to discover non-py files
    """
    # Initialize the dict
    non_python_dict: Dict = dict()

    # Find non-python files in the given folder.
    discover_paths = [
        file for file in glob.glob(f"{discover_folder}/**/*", recursive=True)
    ]

    # Search through the discovered paths and create modules
    for plugin_path in discover_paths:
        # Remove files that contains __ (e.g. __main__) and files that contains py (eg. pyc, py)
        if Path(plugin_path).name.__contains__("__") or Path(
            plugin_path
        ).suffix.__contains__("py"):
            continue
        else:
            non_python_dict.update({Path(plugin_path).name: plugin_path})

    return non_python_dict
