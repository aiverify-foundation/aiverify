import keras.engine.sequential
import pytest
from src.tensorflowserializer.tensorflowserializer import Plugin
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.enums.serializer_plugin_type import SerializerPluginType


class TestCollectionTensorflowSerializer:
    @pytest.mark.parametrize(
        "expected_name, expected_description, expected_version",
        [
            (
                "tensorflowserializer",
                "tensorflowserializer supports deserializing tensorflow data",
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

    def test_deserialize_data(
        self,
    ):
        output = Plugin.deserialize_data(
            "src/tensorflowmodel/user_defined_files/"
            "tensorflow_tabular_sequential.sav"
        )
        assert isinstance(output, keras.engine.sequential.Sequential)

    @pytest.mark.parametrize(
        "data_path, expected_error_message",
        [
            ("1234.csv", "No file or directory found at 1234.csv"),
            (
                None,
                "Unable to load model. Filepath is not an hdf5 file (or h5py is not available) or SavedModel. "
                "Received: filepath=None",
            ),
            ("None", "No file or directory found at None"),
            (
                {},
                "Unable to load model. Filepath is not an hdf5 file (or h5py is not available) or SavedModel. "
                "Received: filepath={}",
            ),
            (
                [],
                "Unable to load model. Filepath is not an hdf5 file (or h5py is not available) or SavedModel. "
                "Received: filepath=[]",
            ),
            (
                1234,
                "Unable to load model. Filepath is not an hdf5 file (or h5py is not available) or SavedModel. "
                "Received: filepath=1234",
            ),
        ],
    )
    def test_deserialize_data_with_exception(self, data_path, expected_error_message):
        with pytest.raises(Exception) as exc_info:
            Plugin.deserialize_data(data_path)
        assert str(exc_info.value) == expected_error_message

    @pytest.mark.parametrize(
        "expected_output",
        [
            (SerializerPluginType.TENSORFLOW),
        ],
    )
    def test_get_serializer_plugin_type(self, expected_output):
        assert Plugin.get_serializer_plugin_type() is expected_output
