# test_read_and_validate.py
from aiverify_apigw.lib.schemas_utils import *
import pytest
import json
from pathlib import Path
from unittest.mock import patch, mock_open


class TestReadAndValidate:
    """Test cases for the read_and_validate function."""

    @pytest.fixture
    def valid_schema(self):
        """Fixture for a valid JSON schema."""
        return {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "number"}
            },
            "required": ["name", "age"]
        }

    @pytest.fixture
    def valid_json(self):
        """Fixture for a valid JSON object."""
        return json.dumps({
            "name": "John Doe",
            "age": 30
        })

    @pytest.fixture
    def invalid_json(self):
        """Fixture for an invalid JSON object (invalid syntax)."""
        return '{"name": "John Doe", "age": 30'  # Missing closing brace

    @pytest.fixture
    def schema_mismatch_json(self):
        """Fixture for a valid JSON object that does not match the schema."""
        return json.dumps({
            "name": "John Doe"
        })  # Missing required 'age' property

    def test_read_and_validate_valid(self, valid_json, valid_schema):
        """Test with a valid JSON file and matching schema, should return parsed object."""
        mock_path = Path("valid.json")
        with patch("builtins.open", mock_open(read_data=valid_json)):
            result = read_and_validate(mock_path, valid_schema)
            assert result == json.loads(valid_json)

    def test_read_and_validate_invalid_json(self, invalid_json, valid_schema):
        """Test with an invalid JSON file, should return None."""
        mock_path = Path("invalid.json")
        with patch("builtins.open", mock_open(read_data=invalid_json)):
            result = read_and_validate(mock_path, valid_schema)
            assert result is None

    def test_read_and_validate_schema_mismatch(self, schema_mismatch_json, valid_schema):
        """Test with a valid JSON that does not match the schema, should return None."""
        mock_path = Path("mismatch.json")
        with patch("builtins.open", mock_open(read_data=schema_mismatch_json)):
            result = read_and_validate(mock_path, valid_schema)
            assert result is None

    def test_read_and_validate_file_not_found(self, valid_schema):
        """Test with a non-existent file, should return None."""
        mock_path = Path("non_existent.json")
        with patch("builtins.open", side_effect=FileNotFoundError):
            result = read_and_validate(mock_path, valid_schema)
            assert result is None

    def test_read_and_validate_validation_error(self, valid_json):
        """Test with a valid JSON but schema raises ValidationError, should return None."""
        invalid_schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "string"}  # Age should be a number, not a string
            },
            "required": ["name", "age"]
        }
        mock_path = Path("valid.json")
        with patch("builtins.open", mock_open(read_data=valid_json)):
            result = read_and_validate(mock_path, invalid_schema)
            assert result is None
