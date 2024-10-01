import pytest
from aiverify_test_engine.plugins.enums.delimiter_type import DelimiterType
from aiverify_test_engine.plugins.metadata.delimiter_metadata import DelimiterMetadata


class TestCollectionDelimiterMetadata:
    @pytest.mark.parametrize(
        "data, delimiter, csv_filepath, expected_data, expected_delimiter, expected_csv_filepath",
        [
            (
                None,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                None,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                "None",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "None",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                "",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                [],
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                [],
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                {},
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                {},
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (None, "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ("None", "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ("", "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ([], "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ({}, "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, None),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, "None"),
                "tests/dataconverter/test_colon.csv",
                123,
                (DelimiterType.TAB, "None"),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, ""),
                "tests/dataconverter/test_colon.csv",
                123,
                (DelimiterType.TAB, ""),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, []),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, {}),
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                None,
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                "None",
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                "",
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                [],
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                {},
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                123,
                "tests/dataconverter/test_colon.csv",
                123,
                (None, None),
                "tests/dataconverter/test_colon.csv",
            ),
            (123, (DelimiterType.TAB, "\t"), None, 123, (DelimiterType.TAB, "\t"), ""),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "None",
                123,
                (DelimiterType.TAB, "\t"),
                "None",
            ),
            (123, (DelimiterType.TAB, "\t"), "", 123, (DelimiterType.TAB, "\t"), ""),
            (123, (DelimiterType.TAB, "\t"), [], 123, (DelimiterType.TAB, "\t"), ""),
            (123, (DelimiterType.TAB, "\t"), {}, 123, (DelimiterType.TAB, "\t"), ""),
            (123, (DelimiterType.TAB, "\t"), 123, 123, (DelimiterType.TAB, "\t"), ""),
        ],
    )
    def test_init(
        self,
        data,
        delimiter,
        csv_filepath,
        expected_data,
        expected_delimiter,
        expected_csv_filepath,
    ):
        """
        Test initialising
        """
        new_object = DelimiterMetadata(data, delimiter, csv_filepath)
        assert new_object._data == expected_data
        assert new_object._delimiter_type == expected_delimiter
        assert new_object._csv_file_path == expected_csv_filepath

    @pytest.mark.parametrize(
        "data, delimiter, csv_filepath, expected_data",
        [
            (
                None,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                None,
            ),
            (
                "None",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "None",
            ),
            (
                "",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "",
            ),
            (
                [],
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                [],
            ),
            (
                {},
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                {},
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                (None, "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                ("None", "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                ("", "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                ([], "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                ({}, "\t"),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, None),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, "None"),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, ""),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, []),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, {}),
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                None,
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                "None",
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                "",
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                [],
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                {},
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                123,
                "tests/dataconverter/test_colon.csv",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                None,
                123,
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "None",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "",
                123,
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                [],
                123,
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                {},
                123,
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                123,
                123,
            ),
        ],
    )
    def test_get_data(
        self,
        data,
        delimiter,
        csv_filepath,
        expected_data,
    ):
        """
        Test getting data
        """
        new_object = DelimiterMetadata(data, delimiter, csv_filepath)
        assert new_object.get_data() == expected_data

    @pytest.mark.parametrize(
        "data, delimiter, csv_filepath, expected_csv_filepath",
        [
            (
                None,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                "None",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                "",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                [],
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                {},
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (None, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ("None", "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ("", "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ([], "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                ({}, "\t"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, None),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, "None"),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, ""),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, []),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                (DelimiterType.TAB, {}),
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                None,
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                "None",
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                "",
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                [],
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                {},
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (
                123,
                123,
                "tests/dataconverter/test_colon.csv",
                "tests/dataconverter/test_colon.csv",
            ),
            (123, (DelimiterType.TAB, "\t"), None, ""),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "None",
                "None",
            ),
            (123, (DelimiterType.TAB, "\t"), "", ""),
            (123, (DelimiterType.TAB, "\t"), [], ""),
            (123, (DelimiterType.TAB, "\t"), {}, ""),
            (123, (DelimiterType.TAB, "\t"), 123, ""),
        ],
    )
    def test_get_data_path(
        self,
        data,
        delimiter,
        csv_filepath,
        expected_csv_filepath,
    ):
        """
        Test getting data path
        """
        new_object = DelimiterMetadata(data, delimiter, csv_filepath)
        assert new_object.get_data_path() == expected_csv_filepath

    @pytest.mark.parametrize(
        "data, delimiter, csv_filepath, expected_delimiter",
        [
            (
                None,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                "None",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                "",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                [],
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                {},
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                123,
                (None, "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ("None", "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ("", "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ([], "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ({}, "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                (DelimiterType.TAB, None),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                (DelimiterType.TAB, "None"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "None"),
            ),
            (
                123,
                (DelimiterType.TAB, ""),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, ""),
            ),
            (
                123,
                (DelimiterType.TAB, []),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                (DelimiterType.TAB, {}),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                None,
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                "None",
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                "",
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                [],
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                {},
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                123,
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (123, (DelimiterType.TAB, "\t"), None, (DelimiterType.TAB, "\t")),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "None",
                (DelimiterType.TAB, "\t"),
            ),
            (123, (DelimiterType.TAB, "\t"), "", (DelimiterType.TAB, "\t")),
            (123, (DelimiterType.TAB, "\t"), [], (DelimiterType.TAB, "\t")),
            (123, (DelimiterType.TAB, "\t"), {}, (DelimiterType.TAB, "\t")),
            (123, (DelimiterType.TAB, "\t"), 123, (DelimiterType.TAB, "\t")),
        ],
    )
    def test_get_delimiter_char(
        self,
        data,
        delimiter,
        csv_filepath,
        expected_delimiter,
    ):
        """
        Tests getting delimiter character
        """
        new_object = DelimiterMetadata(data, delimiter, csv_filepath)
        assert new_object.get_delimiter_char() == expected_delimiter[1]

    @pytest.mark.parametrize(
        "data, delimiter, csv_filepath, expected_delimiter",
        [
            (
                None,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                "None",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                "",
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                [],
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                {},
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "\t"),
            ),
            (
                123,
                (None, "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ("None", "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ("", "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ([], "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                ({}, "\t"),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                (DelimiterType.TAB, None),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                (DelimiterType.TAB, "None"),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, "None"),
            ),
            (
                123,
                (DelimiterType.TAB, ""),
                "tests/dataconverter/test_colon.csv",
                (DelimiterType.TAB, ""),
            ),
            (
                123,
                (DelimiterType.TAB, []),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                (DelimiterType.TAB, {}),
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                None,
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                "None",
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                "",
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                [],
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                {},
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (
                123,
                123,
                "tests/dataconverter/test_colon.csv",
                (None, None),
            ),
            (123, (DelimiterType.TAB, "\t"), None, (DelimiterType.TAB, "\t")),
            (
                123,
                (DelimiterType.TAB, "\t"),
                "None",
                (DelimiterType.TAB, "\t"),
            ),
            (123, (DelimiterType.TAB, "\t"), "", (DelimiterType.TAB, "\t")),
            (123, (DelimiterType.TAB, "\t"), [], (DelimiterType.TAB, "\t")),
            (123, (DelimiterType.TAB, "\t"), {}, (DelimiterType.TAB, "\t")),
            (123, (DelimiterType.TAB, "\t"), 123, (DelimiterType.TAB, "\t")),
        ],
    )
    def test_get_delimiter_type(
        self,
        data,
        delimiter,
        csv_filepath,
        expected_delimiter,
    ):
        """
        Tests getting delimiter character
        """
        new_object = DelimiterMetadata(data, delimiter, csv_filepath)
        assert new_object.get_delimiter_type() == expected_delimiter[0]

    def test_get_data_path_default_path(self):
        """
        Test getting data path default path
        """
        new_object = DelimiterMetadata(None, (DelimiterType.TAB, "\t"))
        assert new_object.get_data_path() == ""
