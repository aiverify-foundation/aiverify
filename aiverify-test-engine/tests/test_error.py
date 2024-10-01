import pytest
from aiverify_test_engine.logging.enums.error_category_type import ErrorCategory
from aiverify_test_engine.logging.enums.error_severity_type import ErrorSeverity
from aiverify_test_engine.logging.error import Error


class TestCollectionError:
    @pytest.mark.parametrize(
        "category, code, description, severity, component",
        [
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
            )
        ],
    )
    def test_init_error(
        self,
        category: ErrorCategory,
        code: str,
        description: str,
        severity: ErrorSeverity,
        component: str,
    ):
        """
        Tests error initialization
        """
        error = Error(category, code, description, severity, component)
        assert error.category == category
        assert error.code == code
        assert error.description == description
        assert error.severity == severity
        assert error.component == component

    @pytest.mark.parametrize(
        "category, code, description, severity, component, error_value",
        [
            (
                None,
                "Code",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error category (Unsupported): None",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                None,
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error code (Unsupported): None",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                None,
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error description (Unsupported): None",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                "SomeUnsupportedData",
                None,
                "test_error.py",
                "There was an error setting the error severity (Unsupported): None",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                None,
                "There was an error setting the error component (Unsupported): None",
            ),
            (
                None,
                None,
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error category (Unsupported): None",
            ),
            (
                None,
                None,
                None,
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error category (Unsupported): None",
            ),
            (
                None,
                None,
                None,
                None,
                "test_error.py",
                "There was an error setting the error category (Unsupported): None",
            ),
            (
                "",
                "Code",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error category (Unsupported): ",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                "",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error code (Unsupported): ",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                "",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error description (Unsupported): ",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                "SomeUnsupportedData",
                "",
                "test_error.py",
                "There was an error setting the error severity (Unsupported): ",
            ),
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "",
                "There was an error setting the error component (Unsupported): ",
            ),
            (
                "",
                "",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error category (Unsupported): ",
            ),
            (
                "",
                "",
                "",
                ErrorSeverity.WARNING,
                "test_error.py",
                "There was an error setting the error category (Unsupported): ",
            ),
            (
                "",
                "",
                "",
                "",
                "test_error.py",
                "There was an error setting the error category (Unsupported): ",
            ),
        ],
    )
    def test_error(
        self,
        category: ErrorCategory,
        code: str,
        description: str,
        severity: ErrorSeverity,
        component: str,
        error_value: str,
    ):
        """
        Tests error initialization if none input arguments
        """
        with pytest.raises(Exception) as e_info:
            Error(category, code, description, severity, component)
        assert str(e_info.value) == error_value

    @pytest.mark.parametrize(
        "category, code, description, severity, component",
        [
            (
                ErrorCategory.ALGORITHM_ERROR,
                "Code",
                "SomeUnsupportedData",
                ErrorSeverity.WARNING,
                "test_error.py",
            )
        ],
    )
    def test_get_dict(
        self,
        category: ErrorCategory,
        code: str,
        description: str,
        severity: ErrorSeverity,
        component: str,
    ):
        """
        Tests error getting dictionary
        """
        error = Error(
            category,
            code,
            description,
            severity,
            component,
        )
        error_dict = error.get_dict()
        assert error_dict["category"] == category.name
        assert error_dict["code"] == code
        assert error_dict["description"] == description
        assert error_dict["severity"] == severity.name.lower()
        assert error_dict["component"] == component
