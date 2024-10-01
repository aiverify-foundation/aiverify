from logging import Logger
from typing import Any, Dict, List

from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.utils.validate_checks import is_empty_string


class DataConverter:
    """
    The DataConverter comprises methods to convert Dict data returned from data plugins to Pandas DataFrame. The
    DataConverter will call its respective methods to process the dictionary depending on the type of the data object.
    """

    _logger: Logger = None

    @staticmethod
    def set_logger(logger: Logger) -> None:
        """
        A method to set up the logger instance for logging

        Args:
            logger (Logger): The logger instance
        """
        if isinstance(logger, Logger):
            DataConverter._logger = logger

    @staticmethod
    def convert_dict_to_dataframe(
        data_dict: Dict, plugin_type: DataPluginType, pandas_instance: IData
    ) -> Any:
        """
        A method to read in the Dict converted from a data plugin and the plugin type to call the respective
        method to convert the Dict to pandas DataFrame

        Args:
            data_dict (Dict): The Dict data returned a data plugin
            plugin_type (DataPluginType): The plugin type of the data
            pandas_instance (IData): The pandas instance created, so we can call pandas methods without importing pandas
            in aiverify-test-engine
        Returns:
            pandas.DataFrame (Any): the DataFrame of converted data_dict
        """
        if (
            data_dict is None
            or not isinstance(data_dict, dict)
            or plugin_type is None
            or not isinstance(plugin_type, DataPluginType)
            or pandas_instance is None
            or not isinstance(pandas_instance, IData)
        ):
            return None

        # Check that the plugin type is supported for conversion
        if plugin_type is DataPluginType.DELIMITER:
            return DataConverter._convert_delimiter_dict_to_dataframe(
                data_dict, pandas_instance
            )
        else:
            return None

    @staticmethod
    def _convert_delimiter_dict_to_dataframe(
        data_dict: Dict, pandas_instance: IData
    ) -> Any:
        """
        A helper method to convert a dictionary generated from DelimiterData to pandas DataFrame

        Args:
            data_dict (Dict): The data returned from DelimiterData. It should contain the data path of the CSV file
            and the delimiter type
            pandas_instance (Any): The pandas instance created, so we can call pandas methods
            without importing pandas in aiverify-test-engine

        Returns:
            pandas.DataFrame (Any): the DataFrame of converted data_dict
        """
        data_path = data_dict.get("data_path")
        delimiter_type = data_dict.get("delimiter_type")

        if (
            data_path is None
            or is_empty_string(data_path)
            or delimiter_type is None
            or is_empty_string(delimiter_type)
        ):
            return None

        else:
            df = pandas_instance.read_csv_as_df(data_path, delimiter_type)
            return df

    @staticmethod
    def convert_image_list_to_dataframe(
        data_paths: List, column_name: str, pandas_instance: IData
    ) -> Any:
        """
        A helper method to create pandas dataframe with a list of images paths

        Args:
            data_paths (List): The list of image paths.
            column_name (str): The column name of the df
            pandas_instance (IData): The pandas instance created, so we can call pandas methods without importing pandas
            in aiverify-test-engine
        Returns:
            pandas.DataFrame (Any): the DataFrame of images path with the column name
        """
        if (
            data_paths is None
            or not isinstance(data_paths, list)
            or column_name is None
            or is_empty_string(column_name)
            or pandas_instance is None
            or not isinstance(pandas_instance, IData)
        ):
            return None

        else:
            df = pandas_instance.read_image_as_df(data_paths, column_name)
            return df
