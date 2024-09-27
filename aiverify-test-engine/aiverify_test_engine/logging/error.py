from typing import Dict

from aiverify_test_engine.logging.enums.error_category_type import ErrorCategory
from aiverify_test_engine.logging.enums.error_severity_type import ErrorSeverity
from aiverify_test_engine.utils.validate_checks import is_empty_string


class Error:
    """
    The Error dataclass comprises information on the error such as category, code,
    description, severity, and component
    """

    def __init__(
        self,
        category: ErrorCategory,
        code: str,
        description: str,
        severity: ErrorSeverity,
        component: str,
    ):
        self.category = category
        self.code = code
        self.description = description
        self.severity = severity
        self.component = component

    @property
    def category(self) -> ErrorCategory:
        """
        Return property result

        Returns:
            ErrorCategory: Contains the error category
        """
        return self._category

    @property
    def code(self) -> str:
        """
        Return property result

        Returns:
            str: Contains the code value
        """
        return self._code

    @property
    def description(self) -> str:
        """
        Return property result

        Returns:
            str: Contains the error description
        """
        return self._description

    @property
    def severity(self) -> ErrorSeverity:
        """
        Return property result

        Returns:
            ErrorSeverity: Contains the error severity value
        """
        return self._severity

    @property
    def component(self) -> str:
        """
        Return property result

        Returns:
            str: Contains the component value
        """
        return self._component

    @category.setter
    def category(self, value: ErrorCategory) -> None:
        """
        Set property value

        Args:
            value (ErrorCategory): Error Category

        Raises:
            RuntimeError: Raise exception if unsupported value
        """
        if (
            value is None
            or not isinstance(value, ErrorCategory)
            or value not in ErrorCategory
        ):
            raise RuntimeError(
                f"There was an error setting the error category (Unsupported): {value}"
            )
        else:
            self._category = value

    @code.setter
    def code(self, value: str) -> None:
        """
        Set property value

        Args:
            value (str): Error Code

        Raises:
            RuntimeError: Raise exception if unsupported value
        """
        if value is None or is_empty_string(value):
            raise RuntimeError(
                f"There was an error setting the error code (Unsupported): {value}"
            )
        else:
            self._code = value

    @description.setter
    def description(self, value: str) -> None:
        """
        Set property value

        Args:
            value (str): Error Description

        Raises:
            RuntimeError: Raise exception if unsupported value
        """
        if value is None or is_empty_string(value):
            raise RuntimeError(
                f"There was an error setting the error description (Unsupported): {value}"
            )
        else:
            self._description = value

    @severity.setter
    def severity(self, value: ErrorSeverity) -> None:
        """
        Set property value

        Args:
            value (ErrorSeverity): Error Severity

        Raises:
            RuntimeError: Raise exception if unsupported value
        """
        if (
            value is None
            or not isinstance(value, ErrorSeverity)
            or value not in ErrorSeverity
        ):
            raise RuntimeError(
                f"There was an error setting the error severity (Unsupported): {value}"
            )
        else:
            self._severity = value

    @component.setter
    def component(self, value: str) -> None:
        """
        Sets property value

        Args:
            value (str): Error Component

        Raises:
            RuntimeError: Raise exception if unsupported value
        """
        if value is None or is_empty_string(value):
            raise RuntimeError(
                f"There was an error setting the error component (Unsupported): {value}"
            )
        else:
            self._component = value

    def get_dict(self) -> Dict:
        """
        A method to return the dictionary of items of Error

        Returns:
            Dict: A dictionary of required information to be sent back by redis
        """
        return {
            "category": self._category.name,
            "code": self._code,
            "description": self._description,
            "severity": self._severity.name.lower(),
            "component": self._component,
        }
