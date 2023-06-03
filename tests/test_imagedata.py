import pytest
from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.plugins.enums.image_type import ImageType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.metadata.image_metadata import ImageMetadata

from src.imagedata.imagedata import Plugin


class TestCollectionImageData:
    pytest.data = ImageMetadata("myPytestData", ImageType.PNG, "/home/ubuntu/csv_file.csv")

    @pytest.mark.parametrize(
        "data, expected_name, expected_description, expected_version",
        [
            (
                    pytest.data,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
            ),
            (
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
            ),
            (
                    "None",
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
            ),
            (
                    "",
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
            ),
            (
                    [],
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
            ),
            (
                    {},
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
            ),
            (
                    "1234",
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
            ),
        ],
    )
    def test_get_metadata(self, data, expected_name, expected_description, expected_version):
        new_plugin = Plugin(data)

        metadata = new_plugin.get_metadata()
        assert metadata.name == expected_name
        assert metadata.description == expected_description
        assert metadata.version == expected_version

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    PluginType.DATA,
            ),
            (
                    None,
                    PluginType.DATA,
            ),
            (
                    "None",
                    PluginType.DATA,
            ),
            (
                    "",
                    PluginType.DATA,
            ),
            (
                    [],
                    PluginType.DATA,
            ),
            (
                    {},
                    PluginType.DATA,
            ),
            (
                    "1234",
                    PluginType.DATA,
            ),
        ],
    )
    def test_get_plugin_type(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_plugin_type() == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    DataPluginType.IMAGE,
            ),
            (
                    None,
                    DataPluginType.IMAGE,
            ),
            (
                    "None",
                    DataPluginType.IMAGE,
            ),
            (
                    "",
                    DataPluginType.IMAGE,
            ),
            (
                    [],
                    DataPluginType.IMAGE,
            ),
            (
                    {},
                    DataPluginType.IMAGE,
            ),
            (
                    "1234",
                    DataPluginType.IMAGE,
            ),
        ],
    )
    def test_get_data_plugin_type(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_data_plugin_type() == expected_output

    @pytest.mark.parametrize(
        "data, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_data_plugin_type",
        [
            (
                    pytest.data,
                    pytest.data,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    None,
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    "None",
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    "",
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    [],
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    {},
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    "1234",
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
        ],
    )
    def test_init(
            self,
            data,
            expected_data,
            expected_name,
            expected_description,
            expected_version,
            expected_plugin_type,
            expected_data_plugin_type,
    ):
        new_plugin = Plugin(data)
        assert new_plugin._data == expected_data
        assert new_plugin._name == expected_name
        assert new_plugin._description == expected_description
        assert new_plugin._version == expected_version
        assert new_plugin._metadata.name == expected_name
        assert new_plugin._metadata.description == expected_description
        assert new_plugin._metadata.version == expected_version
        assert new_plugin._plugin_type is expected_plugin_type
        assert new_plugin._data_plugin_type is expected_data_plugin_type

    @pytest.mark.parametrize(
        "data, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_data_plugin_type",
        [
            (
                    pytest.data,
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    None,
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    "None",
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    "",
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    [],
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    {},
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
            (
                    "1234",
                    None,
                    "imagedata",
                    "imagedata supports data that are images",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.IMAGE,
            ),
        ],
    )
    def test_init_no_initialize(self, data, expected_data, expected_name, expected_description,
                                expected_version, expected_plugin_type, expected_data_plugin_type):
        assert Plugin._data == expected_data
        assert Plugin._name == expected_name
        assert Plugin._description == expected_description
        assert Plugin._version == expected_version
        assert Plugin._metadata.name == expected_name
        assert Plugin._metadata.description == expected_description
        assert Plugin._metadata.version == expected_version
        assert Plugin._plugin_type is expected_plugin_type
        assert Plugin._data_plugin_type is expected_data_plugin_type

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    (True, "")
            ),
            (
                    None,
                    (True, ""),
            ),
            (
                    "None",
                    (True, ""),
            ),
            (
                    "",
                    (True, ""),
            ),
            (
                    [],
                    (True, ""),
            ),
            (
                    {},
                    (True, ""),
            ),
            (
                    "1234",
                    (True, ""),
            ),
        ],
    )
    def test_setup(self, data, expected_output):
        new_plugin = Plugin(data)
        is_success, error_message = new_plugin.setup()
        assert is_success == expected_output[0]
        assert error_message == expected_output[1]

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    pytest.data,
            ),
            (
                    "None",
                    None,
            ),
            (
                    "",
                    None,
            ),
            (
                    [],
                    None,
            ),
            (
                    {},
                    None,
            ),
            (
                    "1234",
                    None,
            ),
        ],
    )
    def test_get_data(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_data() == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    ImageType.PNG
            ),
            (
                    None,
                    None,
            ),
            (
                    "None",
                    None,
            ),
            (
                    "",
                    None,
            ),
            (
                    [],
                    None,
            ),
            (
                    {},
                    None,
            ),
            (
                    "1234",
                    None,
            ),
        ],
    )
    def test_get_image_type(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_image_type() == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    pytest.data,
            ),
            (
                    "None",
                    None,
            ),
            (
                    "",
                    None,
            ),
            (
                    [],
                    None,
            ),
            (
                    {},
                    None,
            ),
            (
                    "1234",
                    None,
            ),
        ],
    )
    def test_set_data(self, data, expected_output):
        new_plugin = Plugin(None)
        new_plugin.set_data(data)
        assert new_plugin._data == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    True,
            ),
            (
                    "None",
                    False,
            ),
            (
                    "",
                    False,
            ),
            (
                    [],
                    False,
            ),
            (
                    {},
                    False,
            ),
            (
                    "1234",
                    False,
            ),
        ],
    )
    def test_is_supported(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.is_supported() == expected_output

    @pytest.mark.parametrize(
        "data, ground_truth, expected_output",
        [
            (
                    pytest.data,
                    "ground_truth",
                    None,
            ),
            (
                    "None",
                    "ground_truth",
                    None,
            ),
            (
                    "",
                    "ground_truth",
                    None,
            ),
            (
                    [],
                    "ground_truth",
                    None,
            ),
            (
                    {},
                    "ground_truth",
                    None,
            ),
            (
                    "1234",
                    "ground_truth",
                    None,
            ),
        ],
    )
    def test_keep_ground_truth(self, data, ground_truth, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.keep_ground_truth(ground_truth) == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    None,
            ),
            (
                    "None",
                    None,
            ),
            (
                    "",
                    None,
            ),
            (
                    [],
                    None,
            ),
            (
                    {},
                    None,
            ),
            (
                    1234,
                    None,
            ),
        ],
    )
    def test_read_labels(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.read_labels() == expected_output

    @pytest.mark.parametrize(
        "data, ground_truth, expected_output",
        [
            (
                    pytest.data,
                    "ground_truth",
                    None,
            ),
            (
                    "None",
                    "ground_truth",
                    None,
            ),
            (
                    "",
                    "ground_truth",
                    None,
            ),
            (
                    [],
                    "ground_truth",
                    None,
            ),
            (
                    {},
                    "ground_truth",
                    None,
            ),
            (
                    1234,
                    "ground_truth",
                    None,
            ),
        ],
    )
    def test_remove_ground_truth(self, data, ground_truth, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.remove_ground_truth(ground_truth) == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    None,
            ),
            (
                    "None",
                    None,
            ),
            (
                    "",
                    None,
            ),
            (
                    [],
                    None,
            ),
            (
                    {},
                    None,
            ),
            (
                    1234,
                    None,
            ),
        ],
    )
    def test_validate(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.validate() == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    None,
            ),
            (
                    "None",
                    None,
            ),
            (
                    "",
                    None,
            ),
            (
                    [],
                    None,
            ),
            (
                    {},
                    None,
            ),
            (
                    1234,
                    None,
            ),
        ],
    )
    def test_get_shape(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_shape() == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    None,
            ),
            (
                    "None",
                    None,
            ),
            (
                    "",
                    None,
            ),
            (
                    [],
                    None,
            ),
            (
                    {},
                    None,
            ),
            (
                    1234,
                    None,
            ),
        ],
    )
    def test_convert_to_dict(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.convert_to_dict() == expected_output
