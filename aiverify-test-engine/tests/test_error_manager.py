import os
import shutil
import subprocess
from pathlib import Path
from typing import Any

import pytest
from aiverify_test_engine.logging.enums.error_category_type import ErrorCategory
from aiverify_test_engine.logging.enums.error_severity_type import ErrorSeverity
from aiverify_test_engine.logging.error import Error
from aiverify_test_engine.logging.error_manager import ErrorManager


class TestCollectionErrorManager:
    pytest.running_dir = str(Path.cwd()) + "/"

    @pytest.fixture(autouse=True)
    def init(self):
        # Setup:
        # Remove folder
        try:
            shutil.rmtree("errors")
        except FileNotFoundError:
            pass

        yield  # this is where the testing happens

        # Teardown:
        # Remove folder
        try:
            shutil.rmtree("errors")
        except FileNotFoundError:
            pass

    @pytest.mark.parametrize(
        "error_name, error_folder, output_file_path",
        [("error_file", "errors", f"{pytest.running_dir}" + "errors/error_file.json")],
    )
    def test_init_error_manager(self, error_name, error_folder, output_file_path):
        """
        Tests error manager initialization
        - Check default error name, error filepath, length of list, default folder name
        - Check folder not created
        """
        error_manager = ErrorManager()
        # Check variables
        assert error_manager._name == error_name
        assert error_manager._filepath == ""
        assert len(error_manager._error_list) == 0
        assert error_manager._default_folder == error_folder

        # Check folder and file
        assert os.path.exists(output_file_path) is False

    @pytest.mark.parametrize(
        "error_name, error_folder, output_folder_path, output_file_path",
        [
            (
                "error_file",
                "errors",
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            )
        ],
    )
    def test_create_error_manager_default_error_name(
        self, error_name, error_folder, output_folder_path, output_file_path
    ):
        """
        Tests error manager create function with no error name string
        - Check error name, error filepath, length of list, folder name
        - Check folder is created and no error file are created
        """
        error_manager = ErrorManager()
        output = error_manager.create_error_manager()
        # Check variables
        assert error_manager._name == error_name
        assert error_manager._filepath == output_file_path
        assert len(error_manager._error_list) == 0
        assert error_manager._default_folder == error_folder

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

        # Check output correct
        assert output is True

    @pytest.mark.parametrize(
        "error_name, expected_error_name, error_folder, num_of_errors, output_folder_path, output_file_path",
        [
            (
                "my_error_name",
                "my_error_name",
                "errors",
                0,
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/my_error_name.json",
            ),
            (
                None,
                "error_file",
                "errors",
                0,
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
            (
                999,
                "999",
                "errors",
                0,
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/999.json",
            ),
            (
                "",
                "error_file",
                "errors",
                0,
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
            (
                "  my_trailing_str  ",
                "my_trailing_str",
                "errors",
                0,
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/my_trailing_str.json",
            ),
        ],
    )
    def test_create_error_manager_error_name(
        self,
        error_name: Any,
        expected_error_name: str,
        error_folder: str,
        num_of_errors: int,
        output_folder_path: str,
        output_file_path: str,
    ):
        """
        Tests error manager create function with defined string
        - Check error name, error filepath, length of list, folder name
        - Check folder is created and no error file are created
        """
        error_manager = ErrorManager()
        output = error_manager.create_error_manager(error_name)
        # Check variables
        assert error_manager._name == expected_error_name
        assert error_manager._filepath == output_file_path
        assert len(error_manager._error_list) == num_of_errors
        assert error_manager._default_folder == error_folder

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

        # Check output correct
        assert output is True

    @pytest.mark.parametrize(
        "error_folder, output_folder_path, output_file_path",
        [
            (
                "errors",
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            )
        ],
    )
    def test_create_error_manager_folder_exists(
        self, error_folder, output_folder_path, output_file_path
    ):
        """
        Tests error manager create function with existing folder
        """
        # create folder if it does not exist
        os.mkdir(error_folder)

        error_manager = ErrorManager()
        output = error_manager.create_error_manager()

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

        # Check output correct
        assert output is True

    def test_create_error_manager_folder_permission(self):
        """
        Tests error manager create folder with permission error
        """
        # Modify the permission to only owner read
        subprocess.call(["chmod", "000", pytest.running_dir])

        error_manager = ErrorManager()
        output = error_manager.create_error_manager()

        # Modify the permission back to before
        subprocess.call(["chmod", "755", pytest.running_dir])

        # Check output correct
        assert output is False

    @pytest.mark.parametrize("path", ["/temp/errors"])
    def test_create_error_manager_folder_path(self, path: str):
        """
        Tests error manager create folder in root path
        """
        error_manager = ErrorManager()

        # Modify the default folder
        error_manager._default_folder = path

        output = error_manager.create_error_manager()
        # Check output correct
        assert output is False

    @pytest.mark.parametrize(
        "len_of_error_list, category, code, description, severity, "
        "component, expected_bool, error_message, total_error",
        # Test User
        [
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to incomplete setup of ErrorManager",
                0,
            ),
        ],
    )
    def test_add_error_to_list_no_instance(
        self,
        len_of_error_list: int,
        category: str,
        code: str,
        description: str,
        severity: str,
        component: str,
        expected_bool: bool,
        error_message: str,
        total_error: int,
    ):
        """
        Tests error manager add error to list with no instance
        """
        error_manager = ErrorManager()
        assert len(error_manager._error_list) == len_of_error_list

        is_success, error_message = error_manager.add_error_to_list(
            category, code, description, severity, component
        )
        assert is_success is expected_bool
        assert error_message == error_message

        assert len(error_manager._error_list) == total_error

    @pytest.mark.parametrize(
        "len_of_error_list, category, code, description, severity, "
        "component, expected_bool, error_message, total_error",
        # Test User
        [
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "Critical",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "Warning",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "ALG",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "ALG",
                "Code",
                "SomeUnsupportedData",
                "Critical",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "ALG",
                "Code",
                "SomeUnsupportedData",
                "Warning",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "INP",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "INP",
                "Code",
                "SomeUnsupportedData",
                "Critical",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "INP",
                "Code",
                "SomeUnsupportedData",
                "Warning",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "DAT",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "DAT",
                "Code",
                "SomeUnsupportedData",
                "Critical",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "DAT",
                "Code",
                "SomeUnsupportedData",
                "Warning",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "CON",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "CON",
                "Code",
                "SomeUnsupportedData",
                "Critical",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "CON",
                "Code",
                "SomeUnsupportedData",
                "Warning",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "PLG",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "PLG",
                "Code",
                "SomeUnsupportedData",
                "Critical",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "PLG",
                "Code",
                "SomeUnsupportedData",
                "Warning",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            # Test None values
            (
                0,
                None,
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Category: None",
                0,
            ),
            (
                0,
                "SYS",
                None,
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "SYS",
                "Code",
                None,
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                None,
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Severity: None",
                0,
            ),
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                None,
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                None,
                None,
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                None,
                None,
                None,
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                None,
                None,
                None,
                None,
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                None,
                None,
                None,
                None,
                None,
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            # Test Empty strings
            (
                0,
                "",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Category: ",
                0,
            ),
            (
                0,
                "SYS",
                "",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "SYS",
                "Code",
                "",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "",
                "",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "",
                "",
                "",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "",
                "",
                "",
                "",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            (
                0,
                "",
                "",
                "",
                "",
                "",
                False,
                "Failed adding error due to invalid arguments: Invalid description, code or component",
                0,
            ),
            # Test single quotes
            (
                0,
                "'SingleQuoteMessage'",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Category: 'SingleQuoteMessage'",
                0,
            ),
            (
                0,
                "SYS",
                "'SingleQuoteMessage'",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "SYS",
                "Code",
                "'SingleQuoteMessage'",
                "Fatal",
                "test_error_manager.py",
                True,
                "",
                1,
            ),
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "'SingleQuoteMessage'",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Severity: 'SingleQuoteMessage'",
                0,
            ),
            (
                0,
                "SYS",
                "Code",
                "SomeUnsupportedData",
                "Fatal",
                "'SingleQuoteMessage'",
                True,
                "",
                1,
            ),
            (
                0,
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "SomeUnsupportedData",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Category: 'SingleQuoteMessage'",
                0,
            ),
            (
                0,
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "Fatal",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Category: 'SingleQuoteMessage'",
                0,
            ),
            (
                0,
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "test_error_manager.py",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Category: 'SingleQuoteMessage'",
                0,
            ),
            (
                0,
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                "'SingleQuoteMessage'",
                False,
                "Failed adding error due to invalid arguments: Unsupported Error Category: 'SingleQuoteMessage'",
                0,
            ),
        ],
    )
    def test_add_error_to_list(
        self,
        len_of_error_list: int,
        category: str,
        code: str,
        description: str,
        severity: str,
        component: str,
        expected_bool: bool,
        error_message: str,
        total_error: int,
    ):
        """
        Tests error manager add error to list
        """
        error_manager = ErrorManager()
        error_manager.create_error_manager()

        assert len(error_manager._error_list) == len_of_error_list

        is_success, error_message = error_manager.add_error_to_list(
            category, code, description, severity, component
        )
        assert is_success is expected_bool
        assert error_message == error_message

        assert len(error_manager._error_list) == total_error

    @pytest.mark.parametrize(
        "error_list, output_str, output_folder_path, output_file_path",
        [
            (
                [],
                "[]",
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
        ],
    )
    def test_write_error_to_file_no_instance(
        self,
        error_list,
        output_str,
        output_folder_path,
        output_file_path,
    ):
        """
        Tests error manager writing error to file with no instance
        """
        error_manager = ErrorManager()

        # Check folder and file
        assert os.path.exists(output_folder_path) is False
        assert os.path.exists(output_file_path) is False

        # Write error to file
        is_success = error_manager.write_error_to_file()
        assert is_success is False

        # Check folder and file
        assert os.path.exists(output_folder_path) is False
        assert os.path.exists(output_file_path) is False

    @pytest.mark.parametrize(
        "error_list, output_str, output_folder_path, output_file_path",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                "",
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
        ],
    )
    def test_write_error_to_file_no_permissions(
        self,
        error_list,
        output_str,
        output_folder_path,
        output_file_path,
    ):
        """
        Tests error manager writing error to file with no permissions
        """
        error_manager = ErrorManager()
        is_success = error_manager.create_error_manager()
        assert is_success is True

        if len(error_list) > 0:
            is_success, error_message = error_manager.add_error_to_list(
                error_list[0],
                error_list[1],
                error_list[2],
                error_list[3],
                error_list[4],
            )
            assert is_success is True
            assert error_message == ""
            assert len(error_manager._error_list) == 1

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

        # Modify the folder no write permission
        subprocess.call(["chmod", "000", output_folder_path])

        # Write error to file
        is_success = error_manager.write_error_to_file()
        assert is_success is False

        # Modify the permission back to before
        subprocess.call(["chmod", "755", output_folder_path])

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

    @pytest.mark.parametrize(
        "error_list, output_str, output_folder_path, output_file_path",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                '[{"category": "SYSTEM_ERROR", "code": "Code", "description": "SomeUnsupportedData", "severity": '
                '"fatal", "component": "test_error_manager.py"}]',
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
        ],
    )
    def test_write_error_to_file_no_output_folder(
        self, error_list, output_str, output_folder_path, output_file_path
    ):
        """
        Tests error manager writing error to file with no output folder
        """
        error_manager = ErrorManager()
        is_success = error_manager.create_error_manager()
        assert is_success is True

        if len(error_list) > 0:
            is_success, error_message = error_manager.add_error_to_list(
                error_list[0],
                error_list[1],
                error_list[2],
                error_list[3],
                error_list[4],
            )
            assert is_success is True
            assert error_message == ""
            assert len(error_manager._error_list) == 1

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

        # Remove folder
        try:
            shutil.rmtree(output_folder_path)
        except FileNotFoundError:
            pass

        # Write error to file
        is_success = error_manager.write_error_to_file()
        assert is_success is False

        # Check folder and file
        assert os.path.exists(output_folder_path) is False
        assert os.path.exists(output_file_path) is False

    @pytest.mark.parametrize(
        "error_list, output_str, output_folder_path, output_file_path",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                '[{"category": "SYSTEM_ERROR", "code": "Code", "description": "SomeUnsupportedData", "severity": '
                '"fatal", "component": "test_error_manager.py"}]',
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
        ],
    )
    def test_write_error_to_file_file_exists(
        self,
        error_list,
        output_str,
        output_folder_path,
        output_file_path,
    ):
        """
        Tests error manager writing error to file with existing file
        """
        error_manager = ErrorManager()
        is_success = error_manager.create_error_manager()
        assert is_success is True

        if len(error_list) > 0:
            is_success, error_message = error_manager.add_error_to_list(
                error_list[0],
                error_list[1],
                error_list[2],
                error_list[3],
                error_list[4],
            )
            assert is_success is True
            assert error_message == ""
            assert len(error_manager._error_list) == 1

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

        # Write the file to make it exists
        fd = os.open(output_file_path, os.O_RDWR | os.O_CREAT)
        line = str.encode("ThisIsATestLine")
        os.write(fd, line)
        os.close(fd)
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is True

        # Write error to file
        is_success = error_manager.write_error_to_file()
        assert is_success is True

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is True

        # Validate the data in the file
        file = open(output_file_path, "r")
        lines = file.readlines()
        file.close()
        assert len(lines) == 1
        assert lines[0] == output_str

    @pytest.mark.parametrize(
        "error_list, output_str, output_folder_path, output_file_path",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                '[{"category": "SYSTEM_ERROR", "code": "Code", "description": "SomeUnsupportedData", "severity": '
                '"fatal", "component": "test_error_manager.py"}]',
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
            (
                [],
                "[]",
                f"{pytest.running_dir}" + "errors",
                f"{pytest.running_dir}" + "errors/error_file.json",
            ),
        ],
    )
    def test_write_error_to_file(
        self,
        error_list,
        output_str,
        output_folder_path,
        output_file_path,
    ):
        """
        Tests error manager writing error to file
        """
        error_manager = ErrorManager()
        is_success = error_manager.create_error_manager()
        assert is_success is True

        if len(error_list) > 0:
            is_success, error_message = error_manager.add_error_to_list(
                error_list[0],
                error_list[1],
                error_list[2],
                error_list[3],
                error_list[4],
            )
            assert is_success is True
            assert error_message == ""
            assert len(error_manager._error_list) == 1

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is False

        # Write error to file
        is_success = error_manager.write_error_to_file()
        assert is_success is True

        # Check folder and file
        assert os.path.exists(output_folder_path) is True
        assert os.path.exists(output_file_path) is True

        # Validate the data in the file
        file = open(output_file_path, "r")
        lines = file.readlines()
        file.close()
        assert len(lines) == 1
        assert lines[0] == output_str

    @pytest.mark.parametrize(
        "defined_error_name, output_file_path",
        [
            ("", ""),
        ],
    )
    def test_get_error_filepath_no_instance(self, defined_error_name, output_file_path):
        """
        Tests error manager getting error filepath with no instance
        """
        error_manager = ErrorManager()
        filepath = error_manager.get_error_filepath()
        assert filepath == output_file_path

    @pytest.mark.parametrize(
        "defined_error_name, output_file_path",
        [
            ("", f"{pytest.running_dir}" + "errors/error_file.json"),
            (
                "my_error_file",
                f"{pytest.running_dir}" + "errors/my_error_file.json",
            ),
        ],
    )
    def test_get_error_filepath(self, defined_error_name, output_file_path):
        """
        Tests error manager getting error filepath
        """
        error_manager = ErrorManager()
        is_success = error_manager.create_error_manager(defined_error_name)
        assert is_success is True

        filepath = error_manager.get_error_filepath()
        assert filepath == output_file_path

    @pytest.mark.parametrize(
        "error_list, output_str",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                "",
            )
        ],
    )
    def test_get_errors_as_json_string_no_instance(self, error_list, output_str):
        """
        Tests error manager getting errors with no instance
        """
        error_manager = ErrorManager()

        is_success, _ = error_manager.add_error_to_list(
            error_list[0],
            error_list[1],
            error_list[2],
            error_list[3],
            error_list[4],
        )
        assert is_success is False

        json_string = error_manager.get_errors_as_json_string()
        assert json_string == output_str

    @pytest.mark.parametrize(
        "error_list, output_str",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                '[{"category": "SYSTEM_ERROR", "code": "Code", "description": "SomeUnsupportedData", '
                '"severity": "fatal", "component": "test_error_manager.py"}]',
            ),
            ([], "[]"),
        ],
    )
    def test_get_errors_as_json_string(self, error_list, output_str):
        """
        Tests error manager getting errors as json string
        """
        error_manager = ErrorManager()
        is_success = error_manager.create_error_manager()
        assert is_success is True

        if len(error_list) >= 5:
            is_success, error_message = error_manager.add_error_to_list(
                error_list[0],
                error_list[1],
                error_list[2],
                error_list[3],
                error_list[4],
            )
            assert is_success is True
            assert error_message == ""

        else:
            pass  # ignore

        json_string = error_manager.get_errors_as_json_string()
        assert json_string == output_str

    @pytest.mark.parametrize(
        "error_list, error_output",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                [],
            )
        ],
    )
    def test_get_error_list_no_instance(self, error_list, error_output):
        """
        Tests error manager getting error list with no instance
        """
        error_manager = ErrorManager()
        error_list = error_manager.get_error_list()
        assert len(error_list) == len(error_output)
        if len(error_list) > 0:
            assert type(error_list[0]) == error_output[0]["type"]
            assert error_list[0].category == error_output[0]["category"]
            assert error_list[0].code == error_output[0]["code"]
            assert error_list[0].description == error_output[0]["description"]
            assert error_list[0].severity == error_output[0]["severity"]
            assert error_list[0].component == error_output[0]["component"]

    @pytest.mark.parametrize(
        "error_list, error_output",
        [
            (
                [
                    "SYS",
                    "Code",
                    "SomeUnsupportedData",
                    "Fatal",
                    "test_error_manager.py",
                ],
                [
                    {
                        "type": Error,
                        "category": ErrorCategory.SYSTEM_ERROR,
                        "code": "Code",
                        "description": "SomeUnsupportedData",
                        "severity": ErrorSeverity.FATAL,
                        "component": "test_error_manager.py",
                    }
                ],
            ),
            (
                [],
                [],
            ),
        ],
    )
    def test_get_error_list(self, error_list, error_output):
        """
        Tests error manager getting error list
        """
        error_manager = ErrorManager()
        is_success = error_manager.create_error_manager()
        assert is_success is True

        if len(error_list) >= 5:
            is_success, error_message = error_manager.add_error_to_list(
                error_list[0],
                error_list[1],
                error_list[2],
                error_list[3],
                error_list[4],
            )
            assert is_success is True
            assert error_message == ""

        else:
            pass  # ignore

        error_list = error_manager.get_error_list()
        assert len(error_list) == len(error_output)
        if len(error_list) > 0:
            assert type(error_list[0]) == error_output[0]["type"]
            assert error_list[0].category == error_output[0]["category"]
            assert error_list[0].code == error_output[0]["code"]
            assert error_list[0].description == error_output[0]["description"]
            assert error_list[0].severity == error_output[0]["severity"]
            assert error_list[0].component == error_output[0]["component"]
