import pytest
from src.imageserializer.imageserializer import Plugin
from test_engine_core.plugins.enums.image_type import ImageType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.enums.serializer_plugin_type import SerializerPluginType
from test_engine_core.plugins.metadata.image_metadata import ImageMetadata


class TestCollectionDelimiterSerializer:
    @pytest.mark.parametrize(
        "expected_name, expected_description, expected_version",
        [
            (
                "imageserializer",
                "imageserializer supports reading images",
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
            (PluginType.SERIALIZER),
        ],
    )
    def test_get_plugin_type(self, expected_output):
        assert Plugin.get_plugin_type() is expected_output

    @pytest.mark.parametrize(
        "data_path, expected_output",
        [
            (
                "src/imagedata/user_defined_files/0.png",
                ImageMetadata(
                    None, ImageType.PNG, "src/imagedata/user_defined_files/0.png"
                ),
            )
        ],
    )
    def test_deserialize_data(self, data_path, expected_output):
        output = Plugin.deserialize_data(data_path)
        if output is None:
            assert output is expected_output
        else:
            assert output.get_data() == expected_output.get_data()
            assert output.get_type() == expected_output.get_type()
            assert output.get_path() == expected_output.get_path()

    @pytest.mark.parametrize(
        "data_path, expected_error_message",
        [
            ("1234.csv", "The image type is not supported."),
            (
                "tests/imageserializer/special_image.txt",
                "The image type is not supported.",
            ),
            (None, "expected str, bytes or os.PathLike object, not NoneType"),
            ("None", "The image type is not supported."),
            ({}, "expected str, bytes or os.PathLike object, not dict"),
            ([], "expected str, bytes or os.PathLike object, not list"),
            (1234, "expected str, bytes or os.PathLike object, not int"),
        ],
    )
    def test_deserialize_data_with_exception(self, data_path, expected_error_message):
        with pytest.raises(Exception) as exc_info:
            Plugin.deserialize_data(data_path)
        assert str(exc_info.value) == expected_error_message

    @pytest.mark.parametrize(
        "expected_output",
        [
            (SerializerPluginType.IMAGE),
        ],
    )
    def test_get_serializer_plugin_type(self, expected_output):
        assert Plugin.get_serializer_plugin_type() is expected_output
