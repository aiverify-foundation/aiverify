import json
import logging
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Union

import semantic_version
from multidict import MultiDictProxy
from test_engine_app.app_logger import AppLogger
from test_engine_core.utils.json_utils import load_schema_file, validate_json
from test_engine_core.utils.validate_checks import is_empty_string


class RequirementsChecks:
    _logger: Union[AppLogger, None] = None
    _validation_schema_folder: str = ""
    _validation_schema_file: str = ""

    def __init__(self, query: MultiDictProxy):
        self._query: MultiDictProxy = query

    @staticmethod
    def set_logger(logger: AppLogger) -> None:
        """
        A method to set up the logger instance for logging

        Args:
            logger (AppLogger): The logger instance

        """
        RequirementsChecks._logger = logger

    @staticmethod
    def set_validation_folder(validation_schema_folder: str):
        """
        A method to set up the validation folder for schema validation

        Args:
            validation_schema_folder (str): The validation schema folder
        """
        # Update the validation schema folder and the file information
        RequirementsChecks._validation_schema_folder = validation_schema_folder
        RequirementsChecks._validation_schema_file = str(
            Path(validation_schema_folder)
            / "test_engine_requirements_check_response_schema.json"
        )

    def is_packages_supported(self) -> List:
        """
        A method to check if the input schema is correct and packages version requirement can
        be supported in current host environment

        Returns:
            List: List of requirements results
        """
        results = list()

        # Perform input variables check
        AppLogger.add_to_log(
            RequirementsChecks._logger,
            logging.INFO,
            "The system worker is validating the requirements inputs",
        )
        is_success, error_message = self.validate_inputs()
        if not is_success:
            AppLogger.add_to_log(
                RequirementsChecks._logger,
                logging.ERROR,
                error_message,
            )
            AppLogger.add_error_to_log(
                RequirementsChecks._logger,
                "SYS",
                "FSYSx00134",
                error_message,
                "Fatal",
                "requirements_checks.py",
            )
            return results

        # Getting the installed packages using pip list
        is_success, installed_packages, error_message = self._get_installed_packages()
        if not is_success:
            AppLogger.add_to_log(
                RequirementsChecks._logger,
                logging.ERROR,
                error_message,
            )
            AppLogger.add_error_to_log(
                RequirementsChecks._logger,
                "SYS",
                "FSYSx00134",
                error_message,
                "Fatal",
                "requirements_checks.py",
            )
            return results

        # Check that the package version are supported and add to the list
        requirements = self._query.getall("requirement")
        for requirement in requirements:
            try:
                is_success, error_message = self._is_package_supported(
                    requirement, installed_packages
                )
                package_result = {
                    "requirement": requirement,
                    "result": is_success,
                    "errors": error_message,
                }
            except Exception as error:
                package_result = {
                    "requirement": requirement,
                    "result": False,
                    "errors": f"An unknown exception is caught: {error}",
                }

            # Validate against the output schema
            is_validated, error_message = self._validate_output_schema(package_result)
            if is_validated:
                results.append(package_result)
            else:
                error_message = (
                    f"There is an error validating the result for {requirement}"
                )
                AppLogger.add_to_log(
                    RequirementsChecks._logger,
                    logging.ERROR,
                    error_message,
                )
                AppLogger.add_error_to_log(
                    RequirementsChecks._logger,
                    "SYS",
                    "FSYSx00134",
                    error_message,
                    "Fatal",
                    "requirements_checks.py",
                )
                return list()

        # Returns the list of requirements result
        return results

    def extract_package_name_and_version(
        self, requirement: str
    ) -> Tuple[bool, Union[None, str], Union[None, str], str]:
        """
        A method to extract the name and version of package from the package version requirement

        Args:
            requirement (str): package version requirements

        Returns:
            Tuple[bool, Union[None, str], Union[None, str], str]: Returns a tuple that contains bool
            indicating whether the call is successful.
            If the call is successful, it will include the package name and package version and no error message
            If the call is not successful, it will have no package name and version and include the error message
        """
        list_of_token_symbol = ["=", ">", "<"]

        token_found = False
        list_of_position = []

        # find the position where the name of package ends
        for token in list_of_token_symbol:
            position_of_token = requirement.find(token)
            if position_of_token > 0:
                token_found = True
                list_of_position.append(position_of_token)

        if token_found:
            min_position = min(list_of_position)
            # extract the name of package
            package_name = requirement[0:min_position]
            package_name_stripped = package_name.strip().lower()
            # extract the version of package
            package_version = requirement[min_position:]
            for token in list_of_token_symbol:
                package_version = package_version.replace(token, "")
            package_version_stripped = package_version.strip()
            return True, package_name_stripped, package_version_stripped, ""

        else:
            return (
                False,
                None,
                None,
                "Unable to determine the package name and versions",
            )

    def validate_inputs(self) -> Tuple[bool, str]:
        """
        A method to read the message arguments, and perform validation

        Returns:
            Tuple[bool, str]: Returns True or False with the relevant error message
        """
        try:
            requirements = self._query.getall("requirement")
            for requirement in requirements:
                if is_empty_string(requirement):
                    return False, "The inputs do not meet the validation rules"
            return True, ""

        except KeyError:
            return False, "The inputs do not meet the validation rules"

    def _is_package_supported(
        self, requirement: str, installed_packages: List
    ) -> Tuple[bool, str]:
        """
        A helper method to check if the package version requirement can be supported in
        current host environment

        Args:
            requirement (str): specifying package and the version requirement e.g.:'numpy>=1.2.3, <2.0.0'
            installed_packages (List): the installed packages using pip list on the system.

        Returns:
            Tuple[bool, str]: Returns bool indicating whether the package is supported and the error message if
            the call is unsuccessful.
        """
        # Extract the package name and versions
        (
            is_extraction_success,
            extracted_package_name,
            extracted_package_version,
            extraction_error_message,
        ) = self.extract_package_name_and_version(requirement)
        if not is_extraction_success:
            AppLogger.add_to_log(
                RequirementsChecks._logger,
                logging.ERROR,
                extraction_error_message,
            )
            AppLogger.add_error_to_log(
                RequirementsChecks._logger,
                "SYS",
                "FSYSx00134",
                extraction_error_message,
                "Fatal",
                "requirements_checks.py",
            )
            return is_extraction_success, extraction_error_message

        # Extract the installed package version
        (
            is_installed_success,
            installed_package_version,
            installed_error_message,
        ) = self._get_installed_package_version(
            extracted_package_name, installed_packages
        )
        if not is_installed_success:
            AppLogger.add_to_log(
                RequirementsChecks._logger,
                logging.ERROR,
                installed_error_message,
            )
            AppLogger.add_error_to_log(
                RequirementsChecks._logger,
                "SYS",
                "FSYSx00134",
                installed_error_message,
                "Fatal",
                "requirements_checks.py",
            )
            return (
                is_installed_success,
                "The host environment does not have the package installed",
            )

        try:
            # check compatibility
            extracted_package_version = extracted_package_version.replace(" ", "")

            # coerce the install package version incase its just 0.41, with coerce it will be fixed to 0.41.0
            temp_extracted_version = semantic_version.Version.coerce(
                extracted_package_version
            )
            temp_installed_version = semantic_version.Version.coerce(
                installed_package_version
            )

            # Perform matching of extracted package version to match with installed package version
            if temp_extracted_version == temp_installed_version:
                return True, ""
            else:
                return False, "The package version is not compatible"

        except ValueError as value_error:
            return (
                False,
                f"There is an error checking package version compatibility: {value_error}",
            )

    def _get_installed_package_version(
        self, package_name: str, installed_packages: List
    ) -> Tuple[bool, Union[None, str], str]:
        """
        A helper method to find the installed package in the pip list and retrieve the version

        Args:
            package_name (str): The package name
            installed_packages (List): The installed packages obtained through pip list

        Returns:
            Tuple[bool, Union[None, str], str]: Returns a tuple containing bool indicating whether call is successful.
             If the call is successful, the installed package version and empty string.
             If the call is unsuccessful, it will be None with an error message.
        """
        for package_info in installed_packages:
            if package_name == package_info["name"].lower():
                return True, package_info["version"], ""
        return False, None, "Unable to get package version"

    def _get_installed_packages(self) -> Tuple[bool, Union[None, List], str]:
        """
        A helper method to get the installed packages on the host environment

        Returns:
            Tuple[bool, Union[None, List], str]: Returns a tuple containing bool
            indicating whether the call is successful.
            If the call is successful, it will return a list of packages obtained through pip list.
            If the call is unsuccessful, it will return None with an error message
        """
        try:
            result = subprocess.check_output(
                [sys.executable, "-m", "pip", "list", "--format", "json"]
            )
            return True, json.loads(result), ""

        except json.JSONDecodeError as error:
            error_msg = str(error)
            return False, None, error_msg

    def _validate_output_schema(self, output: Dict) -> Tuple[bool, str]:
        """
        A helper method to validate the output against the output schema

        Args:
            output (Dict): The output value to be returned

        Returns:
            Tuple[bool, str]: Returns a bool indicating if the output is validated.
            If the output is validated, it will return True and no error message
            If the output has error validating, it will return False and indicating the error message
        """
        try:
            # Load the validation schema and JSON str
            self._validation_schema = load_schema_file(self._validation_schema_file)

            # Perform JSON Validation on the schema.
            return validate_json(output, self._validation_schema), ""

        except Exception as error:
            return False, str(error)
