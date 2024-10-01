import json
from pathlib import Path
from typing import List, Tuple

from aiverify_test_engine.logging.enums.error_category_type import ErrorCategory
from aiverify_test_engine.logging.enums.error_severity_type import ErrorSeverity
from aiverify_test_engine.logging.error import Error
from aiverify_test_engine.utils.json_utils import scan_for_single_quotes
from aiverify_test_engine.utils.validate_checks import is_empty_string


class ErrorManager:
    """
    The ErrorManager class comprises methods to create new error managers and store errors created while in operation
    """

    def __init__(self):
        """
        Initialisation of ErrorManager
        """
        self._name: str = "error_file"
        self._filepath: str = ""
        self._error_list: List = list()
        self._default_folder: str = "errors"
        self._is_create_successful = False

    def create_error_manager(self, error_name: str = "") -> bool:
        """
        A method to create the error manager by creating error directory, setting the error name and the filepath

        Args:
            error_name (str, optional): error name will also be used for error file name. Defaults to "".

        Returns:
            bool: True if creating error manager is successful
        """
        try:
            if not Path.exists(Path(self._default_folder)):
                Path.mkdir(Path(self._default_folder))

            # Initialize the class variables with error object
            if error_name is None:
                file_name_with_log_name = self._name + ".json"
            else:
                error_name_stripped = str(error_name).strip()
                if error_name_stripped == "":
                    file_name_with_log_name = self._name + ".json"
                else:
                    self._name = error_name_stripped
                    file_name_with_log_name = self._name + ".json"

            self._filepath = (
                (Path(self._default_folder) / Path(file_name_with_log_name))
                .absolute()
                .as_posix()
            )

            # Set create error manager is successful
            self._is_create_successful = True

            return True
        except PermissionError:
            return False
        except FileNotFoundError:
            return False

    def add_error_to_list(
        self,
        category: str,
        code: str,
        description: str,
        severity: str,
        component: str,
    ) -> Tuple[bool, str]:
        """
        A method to create an Error object with the given inputs and append to the error list.

        Args:
            category (str): error category
            code (str): error code
            description (str): error description
            severity (str): error severity
            component (str): error component

        Raises:
            RuntimeError: invalid argument because of invalid description, code or component

        Returns:
            Tuple[bool, str]: Returns True if success, False if failed with error messages
        """
        # Verify that setup is completed
        if not self._is_create_successful:
            print(
                "There was an error adding errors to the list due to the incomplete setup of ErrorManager"
            )
            return (
                False,
                "There was an error adding errors to the list due to the incomplete setup of ErrorManager",
            )

        else:
            # Try to get error info from enum
            try:
                if (
                    is_empty_string(description)
                    or is_empty_string(code)
                    or is_empty_string(component)
                ):
                    raise RuntimeError(
                        "There was an error trying to get description, code or component "
                        "while attempting to add the errors to list. "
                        "Found invalid values or it is empty"
                    )

                category = self._get_error_category(category)
                severity = self._get_error_severity(severity)

            except RuntimeError as error:
                print(f"A runtime error has occurred: {str(error)}")
                return (
                    False,
                    f"A runtime error has occurred: {str(error)}",
                )

            else:
                # Create error object
                description = scan_for_single_quotes(description)
                code = scan_for_single_quotes(code)
                component = scan_for_single_quotes(component)
                error = Error(category, code, description, severity, component)

                # append this object to the list
                self._error_list.append(error)
                return True, ""

    def write_error_to_file(self) -> bool:
        """
        A method to write error into the error file

        Returns:
            bool: True if error is written to the file successfully
        """
        # Verify that setup is completed
        if not self._is_create_successful:
            return False

        else:
            try:
                file = open(self._filepath, "w")
                file.write(self.get_errors_as_json_string())
                file.close()
                return True
            except PermissionError:
                return False
            except FileNotFoundError:
                return False

    def get_error_filepath(self) -> str:
        """
        A method to be called by other modules to get the current error path

        Returns:
            str: error filepath
        """
        # Verify that setup is completed
        if not self._is_create_successful:
            return ""

        else:
            return self._filepath

    def get_errors_as_json_string(self) -> str:
        """
        A method to return a json string of errors

        Returns:
            str: json string of errors
        """
        if not self._is_create_successful:
            return ""

        else:
            json_list = list()
            for error in self._error_list:
                json_list.append(error.get_dict())
            return json.dumps(json_list)

    def get_error_list(self) -> List:
        """
        A method to return the list of errors

        Returns:
            List: Returns the error list with errors or an empty list if not created successful
        """
        if not self._is_create_successful:
            return list()

        else:
            return self._error_list

    def _get_error_category(self, category: str) -> ErrorCategory:
        """
        A helper method to convert the input error category str to enum

        Args:
            category (str): error category

        Raises:
            RuntimeError: invalid category where category is not found in enum

        Returns:
            ErrorCategory: enum value for the given category
        """
        if category == "SYS":
            return ErrorCategory.SYSTEM_ERROR
        elif category == "ALG":
            return ErrorCategory.ALGORITHM_ERROR
        elif category == "INP":
            return ErrorCategory.INPUT_ERROR
        elif category == "DAT":
            return ErrorCategory.DATA_OR_MODEL_ERROR
        elif category == "CON":
            return ErrorCategory.CONNECTION_ERROR
        elif category == "PLG":
            return ErrorCategory.PLUGIN_ERROR
        else:
            raise RuntimeError(
                f"There was an error getting the error category (Unsupported): {category}"
            )

    def _get_error_severity(self, severity: str) -> ErrorSeverity:
        """
        A helper method to convert the input error severity str to enum

        Args:
            severity (str): error severity

        Raises:
            RuntimeError: invalid severity where severity is not found in enum

        Returns:
            ErrorSeverity: enum value for the given severity
        """
        if severity == "Fatal":
            return ErrorSeverity.FATAL
        elif severity == "Critical":
            return ErrorSeverity.CRITICAL
        elif severity == "Warning":
            return ErrorSeverity.WARNING
        else:
            raise RuntimeError(
                f"There was an error getting the error severity (Unsupported): {severity}"
            )
