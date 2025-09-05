import pytest
from unittest.mock import patch
from aiverify_test_engine_worker.pipeline.validate_input.validate_input import ValidateInput
from aiverify_test_engine_worker.pipeline.pipe import PipeException
from aiverify_test_engine_worker.pipeline.scripts.algorithm_utils import AlgorithmValidationError
from pathlib import Path
import os
import json
from jsonschema import ValidationError


# Fixture to create an instance of ValidateInput
@pytest.fixture
def validate_input_pipe():
    pipe = ValidateInput()
    pipe.setup()
    return pipe


# Test for setup method
class TestSetup:
    @patch.dict(os.environ, {"PYTHON": "custom-python"})
    def test_setup_with_custom_value(self):
        validate_input_pipe = ValidateInput()
        validate_input_pipe.setup()
        assert validate_input_pipe.python_bin == "custom-python"

    @patch.dict(os.environ, {})
    def test_setup_with_default_value(self):
        validate_input_pipe = ValidateInput()
        validate_input_pipe.setup()
        assert validate_input_pipe.python_bin == "python3"


# Test for execute method
class TestExecute:
    @patch("aiverify_test_engine_worker.pipeline.validate_input.validate_input.validate_algorithm")
    @patch("json.load")
    @patch("builtins.open")
    @patch("jsonschema.validate")
    def test_execute_success(self, mock_validate, mock_open, mock_json_load, mock_validate_algorithm, validate_input_pipe, mock_pipeline_data):
        mock_validate_algorithm.return_value = (
            Path("/tmp/algorithm/algo_script.py"),
            Path("/tmp/algorithm/input_schema.json"),
            Path("/tmp/algorithm/output_schema.json"),
            {"meta": "data"}
        )
        mock_json_load.return_value = {"type": "object"}
        validate_input_pipe.setup()
        result = validate_input_pipe.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
        assert result.algorithm_script_path == Path(
            "/tmp/algorithm/algo_script.py")
        assert result.input_schema_path == Path(
            "/tmp/algorithm/input_schema.json")
        assert result.output_schema_path == Path(
            "/tmp/algorithm/output_schema.json")

    @patch("aiverify_test_engine_worker.pipeline.validate_input.validate_input.validate_algorithm")
    def test_execute_algorithm_validation_error(self, mock_validate_algorithm, validate_input_pipe, mock_pipeline_data):
        mock_validate_algorithm.side_effect = AlgorithmValidationError(
            "Invalid algorithm")
        with pytest.raises(PipeException, match="Invalid algorithm: Invalid algorithm"):
            validate_input_pipe.execute(mock_pipeline_data)

    @patch("aiverify_test_engine_worker.pipeline.validate_input.validate_input.validate_algorithm")
    @patch("json.load", side_effect=json.JSONDecodeError("Invalid JSON", "doc", 0))
    @patch("builtins.open")
    def test_execute_invalid_schema(self, mock_open, mock_json_load, mock_validate_algorithm, validate_input_pipe, mock_pipeline_data):
        mock_validate_algorithm.return_value = (
            Path("/tmp/algorithm/algo_script.py"),
            Path("/tmp/algorithm/input_schema.json"),
            Path("/tmp/algorithm/output_schema.json"),
            {"meta": "data"}
        )
        with pytest.raises(PipeException, match=f"Algorithm {mock_pipeline_data.algorithm_id} has invalid input schema"):
            validate_input_pipe.execute(mock_pipeline_data)

    @patch("aiverify_test_engine_worker.pipeline.validate_input.validate_input.validate_algorithm")
    @patch("json.load")
    @patch("builtins.open")
    @patch("aiverify_test_engine_worker.pipeline.validate_input.validate_input.validate", side_effect=ValidationError("Invalid input"))
    def test_execute_input_validation_error(self, mock_validate, mock_open, mock_json_load, mock_validate_algorithm, validate_input_pipe, mock_pipeline_data):
        mock_validate_algorithm.return_value = (
            Path("/tmp/algorithm/algo_script.py"),
            Path("/tmp/algorithm/input_schema.json"),
            Path("/tmp/algorithm/output_schema.json"),
            {"meta": "data"}
        )
        mock_json_load.return_value = {"type": "object"}
        with pytest.raises(PipeException, match="Input arguments is invalid: Invalid input"):
            validate_input_pipe.execute(mock_pipeline_data)

    @patch("aiverify_test_engine_worker.pipeline.validate_input.validate_input.validate_algorithm", side_effect=Exception("Unexpected Error"))
    def test_execute_unexpected_error(self, mock_validate_algorithm, validate_input_pipe, mock_pipeline_data):
        with pytest.raises(PipeException, match="Unexpected error during input argument validation: Unexpected Error"):
            validate_input_pipe.execute(mock_pipeline_data)
