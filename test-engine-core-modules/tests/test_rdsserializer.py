import pytest
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.enums.serializer_plugin_type import SerializerPluginType

from src.rdsserializer.rdsserializer import Plugin


class TestCollectionRDSSerializer:
    @pytest.mark.parametrize(
        "expected_name, expected_description, expected_version",
        [
            (
                    "rdsserializer",
                    "rdsserializer supports deserializing R Data Serialization",
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
                    "src/rdsserializer/user_defined_files/teststring.rds",
                    'HELLOWORLD'
            )
        ],
    )
    def test_deserialize_data(self, data_path, expected_output):
        output = Plugin.deserialize_data(data_path)[0]
        assert output == expected_output

    @pytest.mark.parametrize(
        "data_path, expected_error_message",
        [
            (
                    "1234.csv",
                    'Error in gzfile(file, "rb") : cannot open the connection\n'
            ),
            (
                    None,
                    "Conversion 'py2rpy' not defined for objects of type '<class 'NoneType'>'"
            ),
            (
                    "None",
                    'Error in gzfile(file, "rb") : cannot open the connection\n'
            ),
            (
                    {},
                    "Conversion 'py2rpy' not defined for objects of type '<class 'dict'>'"
            ),
            (
                    [],
                    "Error in (function (file, refhook = NULL)  : bad 'file' argument\n"
            ),
            (
                    1234,
                    "Error in (function (file, refhook = NULL)  : bad 'file' argument\n"
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
                    SerializerPluginType.RDS
            ),
        ],
    )
    def test_get_serializer_plugin_type(self, expected_output):
        assert Plugin.get_serializer_plugin_type() is expected_output
