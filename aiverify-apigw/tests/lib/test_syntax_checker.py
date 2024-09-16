from aiverify_apigw.lib.syntax_checker import *
from pathlib import Path
from unittest.mock import patch, mock_open
import pytest


class TestValidatePythonScript:
    """Test cases for the validate_python_script function."""

    @pytest.mark.parametrize("script_content", [
        "def hello():\n    return 'Hello, World!'",  # Valid Python function
        "x = 1 + 2\nprint(x)",  # Valid simple script
        "if True:\n    pass",  # Valid simple if-statement
    ])
    def test_validate_python_script_valid(self, script_content):
        """Test with valid Python script contents that should return True."""
        mock_path = Path("valid_script.py")
        with patch("builtins.open", mock_open(read_data=script_content)):
            assert validate_python_script(mock_path) is True

    @pytest.mark.parametrize("script_content", [
        "def hello(:\n    return 'Hello, World!'",  # Syntax error: missing close parenthesis
        "x = 1 +\nprint(x)",  # Syntax error: incomplete expression
        "if True\n    pass",  # Syntax error: missing colon
    ])
    def test_validate_python_script_invalid(self, script_content):
        """Test with invalid Python script contents that should return False."""
        mock_path = Path("invalid_script.py")
        with patch("builtins.open", mock_open(read_data=script_content)):
            assert validate_python_script(mock_path) is False

    def test_validate_python_script_file_not_found(self):
        """Test when the file is not found, should return False and log an error."""
        mock_path = Path("non_existent_script.py")
        with patch("builtins.open", side_effect=FileNotFoundError):
            with patch("aiverify_apigw.lib.syntax_checker.logger") as mock_logger:
                assert validate_python_script(mock_path) is False
                mock_logger.debug.assert_called_once()
                assert "Invalid script" in mock_logger.debug.call_args[0][0]

    def test_validate_python_script_empty_file(self):
        """Test with an empty file content, should return True as empty files are valid."""
        mock_path = Path("empty_script.py")
        with patch("builtins.open", mock_open(read_data="")):
            assert validate_python_script(mock_path) is True

    def test_validate_python_script_with_syntax_error_logging(self):
        """Test with a script that has a syntax error and ensure logging is called."""
        invalid_script_content = "def foo("
        mock_path = Path("syntax_error_script.py")
        with patch("builtins.open", mock_open(read_data=invalid_script_content)):
            with patch("aiverify_apigw.lib.syntax_checker.logger") as mock_logger:
                assert validate_python_script(mock_path) is False
                mock_logger.debug.assert_called_once()
                assert "Invalid script" in mock_logger.debug.call_args[0][0]
