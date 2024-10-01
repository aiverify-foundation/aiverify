import json
from pathlib import Path
from typing import Any, Dict

import jsonschema
import numpy
import numpy as np
from aiverify_test_engine.utils.validate_checks import is_empty_string
from jsonschema.validators import validate


def scan_for_single_quotes(input_data: str) -> str:
    """
    A function to replace all single quotes to double quotes in error messages

    Args:
        input_data (str): input data

    Returns:
        str: modified input data without single quotes
    """
    if is_empty_string(input_data) or not isinstance(input_data, str):
        return ""
    else:
        return input_data.replace("'", '"')


def remove_numpy_formats(data: Any) -> Any:
    """
    A recursive function to check through the given dictionary to
    ensure the keys are strings and recast numpy formats values from the dictionary

    Args:
        data (Any): Input data

    Returns:
         Any: Formatted result
    """
    if data is None:
        return None

    elif isinstance(data, numpy.integer):
        return int(data)

    elif isinstance(data, numpy.floating):
        return float(data)

    elif isinstance(data, numpy.ndarray):
        return remove_numpy_formats(data.tolist())

    elif isinstance(data, list):
        for count, _ in enumerate(data):
            data[count] = remove_numpy_formats(data[count])
        return data

    elif isinstance(data, dict):
        new_results = dict()
        for key, value in data.items():
            new_results.update({str(key): remove_numpy_formats(value)})
        return new_results

    elif not isinstance(data, str) and np.isnan(data):
        return np.nan_to_num(data)

    elif not isinstance(data, str) and np.isinf(data):
        return np.nan_to_num(data)

    else:
        return data


def validate_json(data: dict, schema: dict) -> bool:
    """
    A function to validate data with the provided json schema

    Args:
        data (dict): input data dictionary
        schema (dict): input json schema to be validated with

    Returns:
        bool: True if validation is successful
    """
    try:
        if (
            data is None
            or schema is None
            or not isinstance(data, dict)
            or not isinstance(schema, dict)
        ):
            return False

        else:
            validate(instance=data, schema=schema)
            return True

    except jsonschema.exceptions.ValidationError:
        return False


def load_schema_file(schema_path: str) -> Dict:
    """
    A function to load the JSON schema at the given path as a Python object

    Args:
        schema_path (str): A filename for a JSON schema.

    Raises:
        RuntimeError: Exception raised when there is an invalid schema path
        RuntimeError: Exception raised when there is an invalid json in schema file
        RuntimeError: Exception raised when the file is not found

    Returns:
        Dict: A Python object representation of the schema.
    """
    try:
        if schema_path is None or not isinstance(schema_path, str) or not schema_path:
            raise RuntimeError(
                f"There was an error due to an invalid schema path: {schema_path}"
            )

        else:
            with open(schema_path) as schema_path:
                schema = json.load(schema_path)
                return schema

    except ValueError as error:
        raise RuntimeError(
            f"There was an error due to an invalid JSON in schema: {str(error)}"
        )

    except FileNotFoundError as error:
        raise RuntimeError(f"There was an error due to file not found: {str(error)}")


def validate_test_result_schema(result: dict) -> bool:
    """
    A function to validate the test result schema

    Args:
        result (dict): input data dictionary

    Returns:
        bool: True if validation is successful
    """
    return validate_json(
        result,
        load_schema_file(
            str(Path(__file__).parent / "aiverify.testresult.schema.json")
        ),
    )
