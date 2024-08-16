import subprocess

import pytest

from test_engine_core.utils.validate_checks import is_empty_string, is_file, is_folder


class TestCollectionValidateChecks:
    @pytest.mark.parametrize(
        "folder_path, expected_result",
        [
            ("tests", True),
            ("tests/schemas", True),
            ("/home/", True),
            ("/tmp", True),
            ("/etc/shadow", False),
            ("None", False),
        ],
    )
    def test_is_folder(self, folder_path, expected_result):
        """
        Tests that it can detect folder
        """
        assert is_folder(folder_path) is expected_result

    def test_is_folder_no_permission(self):
        """
        Tests whether it can detect folder of no permissions
        """
        # Modify the folder no write permission
        subprocess.call(["mkdir", "new_folder"])
        subprocess.call(["chmod", "000", "new_folder"])

        assert is_folder("new_folder") is True

        # Modify the permission back to before
        subprocess.call(["chmod", "755", "new_folder"])
        subprocess.call(["rm", "-r", "new_folder"])

    @pytest.mark.parametrize(
        "file_path, expected_result",
        [
            ("tests", False),
            ("tests/schemas", False),
            ("/home/", False),
            ("/tmp", False),
            ("None", False),
        ],
    )
    def test_is_file(self, file_path, expected_result):
        """
        Tests whether it can detect file
        """
        assert is_file(file_path) is expected_result

    def test_is_file_no_permission(self):
        """
        Tests whether it can detect file of no permissions
        """
        # Modify the file no write permission
        subprocess.call(["touch", "new_file"])
        subprocess.call(["chmod", "000", "new_file"])

        assert is_file("new_file") is True

        # Modify the permission back to before
        subprocess.call(["chmod", "755", "new_file"])
        subprocess.call(["rm", "new_file"])

    @pytest.mark.parametrize(
        "string_value, expected_result",
        [
            ("text", False),
            (" spaced out text ", False),
            ("           ", True),
            ("", True),
            ("None", False),
            ("none", False),
            (None, True),
        ],
    )
    def test_is_empty_string(self, string_value, expected_result):
        """
        Tests whether it can detect empty string
        """
        assert is_empty_string(string_value) is expected_result
