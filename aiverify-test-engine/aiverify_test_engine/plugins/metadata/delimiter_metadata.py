from typing import Any, Tuple, Union

from aiverify_test_engine.plugins.enums.delimiter_type import DelimiterType
from aiverify_test_engine.utils.validate_checks import is_empty_string


class DelimiterMetadata:
    """
    The DelimiterMetadata class comprises information on Delimiter
    """

    _data: Union[Any, None] = None
    _delimiter_type: Tuple[DelimiterType, str] = (None, None)
    _csv_file_path: str = ""

    def __init__(
        self,
        data: Any,
        delimiter_type: Tuple[DelimiterType, str],
        csv_file_path: str = "",
    ):
        self._data = data

        if (
            delimiter_type is not None
            and isinstance(delimiter_type, tuple)
            and delimiter_type[0] is not None
            and delimiter_type[1] is not None
            and isinstance(delimiter_type[0], DelimiterType)
            and isinstance(delimiter_type[1], str)
        ):
            self._delimiter_type = delimiter_type

        if not is_empty_string(csv_file_path) and isinstance(csv_file_path, str):
            self._csv_file_path = csv_file_path

    def get_data(self) -> Any:
        """
        A method to return data value

        Returns:
             Any: the delimited data that is read from the file
        """
        return self._data

    def get_delimiter_char(self) -> str:
        """
        A method to return delimiter character

        Returns:
            str: the delimiter character that the data is being delimited by
        """
        return self._delimiter_type[1]

    def get_delimiter_type(self) -> DelimiterType:
        """
        A method to return delimiter type

        Returns:
            DelimiterType: the delimiter type that the data is being delimited by
        """
        return self._delimiter_type[0]

    def get_data_path(self) -> str:
        """
        A method to return the file path of the CSV file path

        Returns:
            str: the CSV file path
        """
        return self._csv_file_path
