import subprocess

import numpy as np
import pandas as pd
import pytest
from aiverify_test_engine.utils.json_utils import (
    load_schema_file,
    remove_numpy_formats,
    scan_for_single_quotes,
    validate_json,
    validate_test_result_schema,
)


class TestCollectionJsonUtils:
    @pytest.mark.parametrize(
        "input_data, expected_response",
        [
            # Test input data
            (
                "{'123': '12333'}",
                '{"123": "12333"}',
            ),
            (
                "{'12312333'}",
                '{"12312333"}',
            ),
            (
                "12312333",
                "12312333",
            ),
            (
                "",
                "",
            ),
            (
                None,
                "",
            ),
            (
                "None",
                "None",
            ),
            (
                123,
                "",
            ),
            (
                [],
                "",
            ),
            (
                {},
                "",
            ),
        ],
    )
    def test_scan_for_single_quotes(self, input_data, expected_response):
        """
        Tests scanning for single quotes
        """
        assert scan_for_single_quotes(input_data) == expected_response

    @pytest.mark.parametrize(
        "input_data, expected_response",
        [
            # Test input data
            (
                '{"123": "12333"}',
                '{"123": "12333"}',
            ),
            (
                '{"12312333"}',
                '{"12312333"}',
            ),
            (
                "12312333",
                "12312333",
            ),
            (
                "",
                "",
            ),
            (
                None,
                None,
            ),
            (
                "None",
                "None",
            ),
            (
                123,
                123,
            ),
            (
                [],
                [],
            ),
            (
                {},
                {},
            ),
            # Test numpy values
            (
                np.NaN,
                0.0,
            ),
            (
                np.inf,
                1.7976931348623157e308,
            ),
            (
                [
                    np.float32(2.0),
                    np.int64(2),
                    np.float32(2.0),
                    np.int32(3),
                    {"key": np.float64(23.2)},
                ],
                [2.0, 2, 2.0, 3, {"key": 23.2}],
            ),
            (
                [
                    np.float32(2.0),
                    np.int64(2),
                    np.float32(2.0),
                    np.int32(3),
                    {"key": np.float64(23.2)},
                    np.ndarray(
                        (2,),
                        buffer=np.array([1, 2, 3]),
                        offset=np.int_().itemsize,
                        dtype=int,
                    ),
                ],
                [2.0, 2, 2.0, 3, {"key": 23.2}, [2, 3]],
            ),
            (
                {
                    "first_val": np.float32(2.0),
                    "second_val": np.int64(2),
                    "third_val": np.float32(2.0),
                    "fourth_val": np.int32(3),
                    "fifth_val": [np.float32(22.0), np.float64(23.2)],
                    "sixth_val": np.ndarray(
                        (2,),
                        buffer=np.array([1, 2, 3]),
                        offset=np.int_().itemsize,
                        dtype=int,
                    ),
                },
                {
                    "first_val": 2.0,
                    "second_val": 2,
                    "third_val": 2.0,
                    "fourth_val": 3,
                    "fifth_val": [22.0, 23.2],
                    "sixth_val": [2, 3],
                },
            ),
            (
                pd.Series([1.0, np.nan, np.inf], dtype=np.float64),
                [1.0, 0.0, 1.7976931348623157e308],
            ),
            # Structured array with named fields
            (
                np.array(
                    [(1.0, np.nan), (np.inf, 2.0)], dtype=[("x", "f8"), ("y", "f8")]
                ),
                [(1.0, 0.0), (1.7976931348623157e308, 2.0)],
            ),
            (
                {
                    "series": pd.Series([1.0, np.nan]),
                    "list": [np.array([6.0, np.nan]), pd.Series([np.inf, 8.0])],
                },
                {
                    "series": [1.0, 0.0],
                    "list": [[6.0, 0.0], [1.7976931348623157e308, 8.0]],
                },
            ),
        ],
    )
    def test_remove_numpy_formats(self, input_data, expected_response):
        """
        Tests if it removes numpy formats
        """
        assert remove_numpy_formats(input_data) == expected_response

    @pytest.mark.parametrize(
        "input_data, schema, expected_response",
        [
            (
                {"id": 123},
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                True,
            ),
            (
                {"id": "123"},
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                False,
            ),
            (
                {},
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                True,
            ),
            (
                "",
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                False,
            ),
            (
                None,
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                False,
            ),
            (
                "None",
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                False,
            ),
            (
                123,
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                False,
            ),
            (
                [],
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
                False,
            ),
            (
                {"id": 123},
                {},
                True,
            ),
            (
                {"id": 123},
                [],
                False,
            ),
            (
                {"id": 123},
                "",
                False,
            ),
            (
                {"id": 123},
                None,
                False,
            ),
            (
                {"id": 123},
                "None",
                False,
            ),
            (
                {"id": 123},
                123,
                False,
            ),
            (
                {"id": 123},
                [],
                False,
            ),
        ],
    )
    def test_validate_json(self, input_data, schema, expected_response):
        """
        Tests validating json
        """
        assert validate_json(input_data, schema) is expected_response

    @pytest.mark.parametrize(
        "schema_path, expected_results",
        [
            # Test input schema path
            (
                "tests/schemas/json_schema.json",
                {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "$id": "https://example.com/employee.schema.json",
                    "title": "Record of employee",
                    "description": "This document records the details of an employee",
                    "type": "object",
                    "properties": {
                        "id": {
                            "description": "A unique identifier for an employee",
                            "type": "number",
                        }
                    },
                },
            ),
        ],
    )
    def test_load_schema_file(self, schema_path, expected_results):
        """
        Tests loading schema file
        """
        assert load_schema_file(schema_path) == expected_results

    @pytest.mark.parametrize(
        "schema_path, expected_results",
        [
            # Test input schema path
            (
                "tests/schemas/invalid_json_schema.json",
                "There was an error due to an invalid JSON in schema: "
                "Expecting property name enclosed in double quotes: line 11 column 9 (char 383)",
            ),
        ],
    )
    def test_load_schema_file_invalid_json(self, schema_path, expected_results):
        """
        Tests loading schema file with invalid json
        """
        with pytest.raises(RuntimeError) as error:
            load_schema_file(schema_path)
        assert str(error.value) == expected_results

    @pytest.mark.parametrize(
        "schema_path, expected_results",
        [
            # Test input schema path
            (
                "tests/schemas/invalid_filepath.json",
                "There was an error due to file not found: "
                "[Errno 2] No such file or directory: 'tests/schemas/invalid_filepath.json'",
            ),
            (
                "tests/invalid_folder/json_schema.json",
                "There was an error due to file not found: "
                "[Errno 2] No such file or directory: 'tests/invalid_folder/json_schema.json'",
            ),
        ],
    )
    def test_load_schema_file_invalid_path(self, schema_path, expected_results):
        """
        Tests loading schema file with invalid path
        """
        with pytest.raises(RuntimeError) as error:
            load_schema_file(schema_path)
        assert str(error.value) == expected_results

    @pytest.mark.parametrize(
        "schema_path, expected_results",
        [
            # Test input schema path
            (
                "",
                "There was an error due to an invalid schema path: ",
            ),
            (
                None,
                "There was an error due to an invalid schema path: None",
            ),
            (
                123,
                "There was an error due to an invalid schema path: 123",
            ),
            (
                [],
                "There was an error due to an invalid schema path: []",
            ),
            (
                {},
                "There was an error due to an invalid schema path: {}",
            ),
        ],
    )
    def test_load_schema_file_invalid_inputs(self, schema_path, expected_results):
        """
        Tests loading schema file with invalid inputs
        """
        with pytest.raises(RuntimeError) as error:
            load_schema_file(schema_path)
        assert str(error.value) == expected_results

    @pytest.mark.parametrize(
        "schema_path, expected_results",
        [
            # Test input schema path
            (
                "tests/schemas/json_schema.json",
                "[Errno 13] Permission denied: 'tests/schemas/json_schema.json'",
            ),
        ],
    )
    def test_load_schema_file_permissions(self, schema_path, expected_results):
        """
        Tests loading schema file with no file permissions
        """
        with pytest.raises(PermissionError) as error:
            # Modify the folder no write permission
            subprocess.call(["chmod", "000", "tests/schemas"])

            load_schema_file(schema_path)

        # Modify the permission back to before
        subprocess.call(["chmod", "755", "tests/schemas"])
        assert str(error.value) == expected_results


@pytest.mark.parametrize(
    "test_input, expected",
    [
        (
            {
                "gid": "plugin-1234",
                "cid": "algorithm-5678",
                "version": "1.0.0",
                "startTime": "2024-09-29T12:00:00Z",
                "timeTaken": 120.5,
                "testArguments": {
                    "testDataset": "http://example.com/test-dataset",
                    "mode": "upload",
                    "modelType": "classification",
                    "groundTruthDataset": "http://example.com/ground-truth-dataset",
                    "groundTruth": "label",
                    "algorithmArgs": {},
                },
                "output": {},
                "artifacts": ["artifact1.png", "artifact2.png"],
            },
            True,
        ),
        (
            {
                "gid": "invalid_gid!!",  # Invalid gid pattern
                "cid": "algorithm-5678",
                "version": "1.0.0",
                "startTime": "2024-09-29T12:00:00Z",
                "timeTaken": 120.5,
                "testArguments": {
                    "testDataset": "file://example.com/test-dataset",
                    "mode": "upload",
                    "modelType": "classification",
                    "groundTruthDataset": "http://example.com/ground-truth-dataset",
                    "groundTruth": "label",
                    "algorithmArgs": {},
                },
                "output": {},
                "artifacts": ["artifact1.png", "artifact2.png"],
            },
            False,
        ),
        (
            {
                "gid": "plugin-1234",
                "cid": "algorithm-5678",
                "version": "1.0.0",
                "startTime": "2024-09-29T12:00:00Z",
                "timeTaken": 120.5,
                "testArguments": {
                    "testDataset": "file://example.com/test-dataset",
                    "mode": "upload2",  # Invalid mode
                    "modelType": "classification",
                    "groundTruthDataset": "http://example.com/ground-truth-dataset",
                    "groundTruth": "label",
                    "algorithmArgs": {},
                },
                "output": {},
                "artifacts": ["artifact1.png", "artifact2.png"],
            },
            False,  # Expected to be invalid due to missing field
        ),
    ],
)
def test_validate_test_result_schema(test_input, expected):
    assert validate_test_result_schema(test_input) == expected
