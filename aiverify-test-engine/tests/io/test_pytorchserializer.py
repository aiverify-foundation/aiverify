import os
from pathlib import Path
from typing import Tuple, Union

import numpy as np
import torch
import pytest
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager
import torch.nn as nn


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
            "pytorchserializer"
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
        if PluginManager.is_plugin_exists(PluginType.SERIALIZER, "pytorchserializer"):
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
            metadata.name == "pytorchserializer"
            and metadata.description
            == "pytorchserializer supports deserializing pytorch data"
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
            # Define a sample PyTorch model using torch.nn.Sequential for tabular classification
            input_size = 5  # Number of features in your tabular data
            hidden_size = 10
            output_size = 3  # Number of classes for classification

            # Create the model using torch.nn.Sequential
            model = nn.Sequential(
                nn.Linear(input_size, hidden_size),
                nn.ReLU(),
                nn.Linear(hidden_size, output_size),
                nn.Softmax(dim=1),  # Softmax for classification probabilities
            )
            # Save the model
            torch.save(model, "model.pt")

            deserialized_model = self._serializer_instance.deserialize_data("model.pt")

            model_params = list(model.parameters())
            deserialized_params = list(deserialized_model.parameters())

            all_equal = True
            for i in range(len(model_params)):
                if not torch.equal(model_params[i], deserialized_params[i]):
                    all_equal = False
                    break

            if all_equal:
                print("Models have identical parameters!")
            else:
                print("Models have different parameters!")

            assert all_equal == True

            if os.path.exists("model.pt"):
                os.remove("model.pt")

        except Exception:
            error_count += 1
            error_message += "Deserialized data does not match expected data;"

        return error_count, error_message


def test_end_to_end_pytorch_serializer(plugin_test_data):
    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
