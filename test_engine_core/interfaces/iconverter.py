from abc import abstractmethod
from typing import Any, List


class IConverter:
    """
    The IConverter interface specifies methods for different conversion to dataframe
    """

    @staticmethod
    @abstractmethod
    def read_csv_as_df(self, data_path: str, delimiter_type: str) -> Any:
        pass

    @staticmethod
    @abstractmethod
    def read_image_as_df(self, image_paths: List, column_name: str) -> Any:
        pass
