from pathlib import Path
from typing import Tuple, Union

import numpy as np
import pytest
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from tensorflow import keras


@pytest.fixture
def plugin_test_data(request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    file_path = ""
    return file_path, discover_path


class PluginTest:
    def test_plugin(self, plugin_test_data):
        file_path, discover_path = plugin_test_data
        self._base_path = discover_path
        self._serializer_path = str(self._base_path / file_path)
        self._serializer_instance: Union[None, ISerializer] = None

        PluginManager.discover(str(self._base_path))
        plugin_object = PluginManager._plugins[PluginType.SERIALIZER.name][
            "tensorflowserializer"
        ]
        self._serializer_instance = plugin_object.Plugin()

        # Run different tests
        test_methods = [
            self._validate_plugin_exists,
            self._validate_metadata,
            self._validate_serializer_supported,
        ]

        for method in test_methods:
            error_count, error_message = method()
            assert error_count == 0, f"Errors found: {error_message}"

    def _validate_plugin_exists(self) -> Tuple[int, str]:
        """
        A helper method to validate whether the plugin exists.
        """
        error_count = 0
        error_message = ""
        if PluginManager.is_plugin_exists(
            PluginType.SERIALIZER, "tensorflowserializer"
        ):
            pass
        else:
            error_count += 1
            error_message += "Serializer plugin not found;"

        return error_count, error_message

    def _validate_metadata(self) -> Tuple[int, str]:
        """
        A helper method to validate metadata.
        """
        error_count = 0
        error_message = ""

        metadata = self._serializer_instance.get_metadata()
        if (
            metadata.name == "tensorflowserializer"
            and metadata.description
            == "tensorflowserializer supports deserializing tensorflow data"
            and metadata.version == "0.9.0"
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_serializer_supported(self) -> Tuple[int, str]:
        """
        A helper method to validate serializer support.
        """
        error_count = 0
        error_message = ""

        try:
            # Train the model
            model = self._get_model()
            test_input = np.random.random((128, 32))
            test_target = np.random.random((128, 1))
            model.fit(test_input, test_target)
            model.save("mytestmodel")

            # Deserialize the model
            reconstructed_model = self._serializer_instance.deserialize_data(
                "mytestmodel"
            )
            np.testing.assert_allclose(
                model.predict(test_input), reconstructed_model.predict(test_input)
            )
        except Exception:
            error_count += 1
            error_message += "Deserialized data does not match expected data;"

        return error_count, error_message

    def _get_model(self):
        """
        A helper method to create and return a simple Keras model.
        """
        inputs = keras.Input(shape=(32,))
        outputs = keras.layers.Dense(1)(inputs)
        model = keras.Model(inputs, outputs)
        model.compile(optimizer="adam", loss="mean_squared_error")
        return model


def test_end_to_end_tensorflow_serializer(plugin_test_data):
    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
