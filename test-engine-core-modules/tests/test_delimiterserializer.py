import pytest
from test_engine_core.plugins.enums.delimiter_type import DelimiterType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.enums.serializer_plugin_type import SerializerPluginType
from test_engine_core.plugins.metadata.delimiter_metadata import DelimiterMetadata

from src.delimiterserializer.delimiterserializer import Plugin


class TestCollectionDelimiterSerializer:
    @pytest.mark.parametrize(
        "expected_name, expected_description, expected_version",
        [
            (
                    "delimiterserializer",
                    "delimiterserializer supports reading data with separated values",
                    "0.9.0",
            ),
        ],
    )
    def test_get_metadata(self, expected_name, expected_description, expected_version):
        metadata = Plugin.get_metadata()
        assert metadata.name == expected_name
        assert metadata.description == expected_description
        assert metadata.version == expected_version

    @pytest.mark.parametrize(
        "expected_output",
        [
            (
                    PluginType.SERIALIZER
            ),
        ],
    )
    def test_get_plugin_type(self, expected_output):
        assert Plugin.get_plugin_type() is expected_output

    @pytest.mark.parametrize(
        "data_path, expected_output",
        [
            (
                    "src/delimiterdata/user_defined_files/sv_colon.txt",
                    DelimiterMetadata([['Name', 'Age', 'Gender'], ['Alex', '30', 'M'],
                                       ['Belle', '29', 'F'], ['Chansey', '50', 'F']],
                                      (DelimiterType.COLON, ":"),
                                      "src/delimiterdata/user_defined_files/sv_colon.txt")
            )
        ],
    )
    def test_deserialize_data(self, data_path, expected_output):
        output = Plugin.deserialize_data(data_path)
        if output is None:
            assert output is expected_output
        else:
            assert output.get_data() == expected_output.get_data()
            assert output.get_delimiter_char() == expected_output.get_delimiter_char()
            assert output.get_delimiter_type() == expected_output.get_delimiter_type()
            assert output.get_data_path() == expected_output.get_data_path()

    @pytest.mark.parametrize(
        "data_path, expected_error_message",
        [
            (
                    "1234.csv",
                    "[Errno 2] No such file or directory: '1234.csv'"
            ),
            (
                    "tests/delimiterserializer/special_delimiter.txt",
                    "The delimiter is not supported."
            ),
            (
                    None,
                    "expected str, bytes or os.PathLike object, not NoneType"
            ),
            (
                    "None",
                    "[Errno 2] No such file or directory: 'None'"
            ),
            (
                    {},
                    "expected str, bytes or os.PathLike object, not dict"
            ),
            (
                    [],
                    "expected str, bytes or os.PathLike object, not list"
            ),
            (
                    1234,
                    "[Errno 9] Bad file descriptor"
            ),
        ],
    )
    def test_deserialize_data_with_exception(self, data_path, expected_error_message):
        with pytest.raises(Exception) as exc_info:
            output = Plugin.deserialize_data(data_path)
        assert str(exc_info.value) == expected_error_message

    @pytest.mark.parametrize(
        "expected_output",
        [
            (
                    SerializerPluginType.DELIMITER
            ),
        ],
    )
    def test_get_serializer_plugin_type(self, expected_output):
        assert Plugin.get_serializer_plugin_type() is expected_output
