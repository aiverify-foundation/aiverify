import logging
from typing import Any, Dict, Tuple

import pytest
from aiverify_test_engine.converters.data_converter import DataConverter
from aiverify_test_engine.interfaces.iconverter import IConverter
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


class PandasInstance(IData, IConverter):
    def __init__(self) -> None:
        pass

    @staticmethod
    def get_metadata() -> PluginMetadata:
        pass

    @staticmethod
    def get_plugin_type() -> PluginType:
        pass

    @staticmethod
    def get_data_plugin_type() -> DataPluginType:
        pass

    def setup(self) -> Tuple[bool, str]:
        pass

    def get_data(self) -> Any:
        pass

    def set_data(self, data: Any) -> None:
        pass

    def is_supported(self) -> bool:
        pass

    def keep_ground_truth(self, ground_truth: str) -> bool:
        pass

    def read_labels(self) -> Dict:
        pass

    def remove_ground_truth(self, ground_truth: str) -> None:
        pass

    def validate(self) -> Tuple[bool, str]:
        pass

    def get_shape(self) -> Tuple[int, int]:
        pass

    def convert_to_dict(self) -> Dict:
        pass

    def read_csv_as_df(self, data_path, delimiter_type):
        return data_path, delimiter_type

    def read_image_as_df(self, image_paths, column_name):
        return image_paths, column_name


class TestCollectionDataConverter:
    pytest.my_logger = logging.getLogger("example_logger")
    pytest.my_dataframe = PandasInstance()

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        DataConverter._logger = None

        # Perform tests
        yield

        # Reset
        DataConverter._logger = None

    @pytest.mark.parametrize(
        "logger, expected_response",
        [
            (pytest.my_logger, pytest.my_logger),
            (None, None),
            ("None", None),
            (123, None),
            ([], None),
            ({}, None),
        ],
    )
    def test_set_logger(self, logger, expected_response):
        """
        Tests set logger
        """
        assert DataConverter._logger is None
        DataConverter.set_logger(logger)
        assert DataConverter._logger == expected_response

    @pytest.mark.parametrize(
        "data, plugin_type, pandas_instance, expected_response",
        [
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                ("tests/dataconverter/test_colon.csv", ":"),
            ),
            # Test data_path
            (
                {"data_path": None, "delimiter_type": ":"},
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            (
                {"data_path": "None", "delimiter_type": ":"},
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                ("None", ":"),
            ),
            (
                {"data_path": 123, "delimiter_type": ":"},
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            (
                {"data_path": [], "delimiter_type": ":"},
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            (
                {"data_path": {}, "delimiter_type": ":"},
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            # Test delimiter type
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": None,
                },
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": "None",
                },
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                ("tests/dataconverter/test_colon.csv", "None"),
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": 123,
                },
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": [],
                },
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": {},
                },
                DataPluginType.DELIMITER,
                pytest.my_dataframe,
                None,
            ),
            # Test DataPluginType
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                DataPluginType.PANDAS,
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                None,
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                "None",
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                [],
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                {},
                pytest.my_dataframe,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                123,
                pytest.my_dataframe,
                None,
            ),
            # Test pandas_instance
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                DataPluginType.DELIMITER,
                None,
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                DataPluginType.DELIMITER,
                "None",
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                DataPluginType.DELIMITER,
                [],
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                DataPluginType.DELIMITER,
                {},
                None,
            ),
            (
                {
                    "data_path": "tests/dataconverter/test_colon.csv",
                    "delimiter_type": ":",
                },
                DataPluginType.DELIMITER,
                123,
                None,
            ),
        ],
    )
    def test_convert_dict_to_dataframe(
        self, data, plugin_type, pandas_instance, expected_response
    ):
        """
        Tests converting dictionary to dataframe
        """
        assert (
            DataConverter.convert_dict_to_dataframe(data, plugin_type, pandas_instance)
            == expected_response
        )

    @pytest.mark.parametrize(
        "data_paths, column_name, pandas_instance, expected_response",
        [
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                "my_column",
                pytest.my_dataframe,
                (["tests/dataconverter/test_colon.csv"], "my_column"),
            ),
            # Test datapaths
            (
                None,
                "my_column",
                pytest.my_dataframe,
                None,
            ),
            (
                "None",
                "my_column",
                pytest.my_dataframe,
                None,
            ),
            (
                [],
                "my_column",
                pytest.my_dataframe,
                ([], "my_column"),
            ),
            (
                {},
                "my_column",
                pytest.my_dataframe,
                None,
            ),
            (
                123,
                "my_column",
                pytest.my_dataframe,
                None,
            ),
            # Test column name
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                None,
                pytest.my_dataframe,
                None,
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                "None",
                pytest.my_dataframe,
                (["tests/dataconverter/test_colon.csv"], "None"),
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                [],
                pytest.my_dataframe,
                None,
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                {},
                pytest.my_dataframe,
                None,
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                123,
                pytest.my_dataframe,
                None,
            ),
            # Test pandas instance
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                "my_column",
                None,
                None,
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                "my_column",
                "None",
                None,
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                "my_column",
                [],
                None,
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                "my_column",
                {},
                None,
            ),
            (
                [
                    "tests/dataconverter/test_colon.csv",
                ],
                "my_column",
                123,
                None,
            ),
        ],
    )
    def test_convert_image_list_to_dataframe(
        self, data_paths, column_name, pandas_instance, expected_response
    ):
        """
        Tests converting image list to dataframe
        """
        assert (
            DataConverter.convert_image_list_to_dataframe(
                data_paths, column_name, pandas_instance
            )
            == expected_response
        )
