from pathlib import Path
from typing import Tuple
from torchvision import datasets, transforms, models

import pytest
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager


@pytest.fixture
def plugin_test_data(request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    file_path = str(test_dir / "user_defined_files/sample_pytorch_model.pt")
    expected_model_algorithm = "torch.nn.modules.container.Sequential"

    expected_model_plugin_type = ModelPluginType.PYTORCH
    return (
        file_path,
        discover_path,
        expected_model_algorithm,
        expected_model_plugin_type,
    )


class PluginTest:
    def test_model_plugin(self, plugin_test_data):
        (
            file_path,
            discover_path,
            expected_model_algorithm,
            expected_model_plugin_type,
        ) = plugin_test_data
        self._base_path = discover_path
        self._model_path = file_path
        self._expected_model_algorithm = expected_model_algorithm
        self._expected_model_plugin_type = expected_model_plugin_type

        print(f" == discover_path == ${discover_path}")
        # Load all the core plugins and the model plugin
        PluginManager.discover(str(self._base_path))

        # Get the model instance
        (
            self._model_instance,
            self._model_serializer_instance,
            error_message,
        ) = PluginManager.get_instance(
            PluginType.MODEL, **{"filename": self._model_path}
        )
        print(" == test file == ")
        print(self._model_instance, self._model_serializer_instance)

        # Perform model instance setup
        is_success, error_messages = self._model_instance.setup()
        assert is_success, f"Failed to perform model instance setup: {error_messages}"

        # Run test methods
        test_methods = [
            self._validate_metadata,
            self._validate_plugin_type,
            self._validate_model_supported,
        ]

        # Check all test methods
        for method in test_methods:
            error_count, error_message = method()
            assert (
                error_count == 0
            ), f"Errors found while running tests. {error_message}"

        # Perform cleanup
        self._model_instance.cleanup()

    def _validate_metadata(self) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        metadata = self._model_instance.get_metadata()
        if (
            metadata.name == "pytorchmodel"
            and metadata.description == "pytorchmodel supports detecting pytorch models"
            and metadata.version == "0.9.0"
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_plugin_type(self) -> Tuple[int, str]:
        error_count = 0
        error_message = ""
        print(f"get_model_algorithm : {self._model_instance.get_model_algorithm()}")

        if self._model_instance.get_plugin_type() is PluginType.MODEL:
            pass
        else:
            error_count += 1
            error_message += "Incorrect plugin type;"

        if (
            self._model_instance.get_model_plugin_type()
            is self._expected_model_plugin_type
        ):
            pass
        else:
            error_count += 1
            error_message += "Incorrect model plugin type;"

        if self._model_instance.get_model_algorithm() == self._expected_model_algorithm:
            pass
        else:
            error_count += 1
            error_message += "Incorrect model algorithm;"

        return error_count, error_message

    def _validate_model_supported(self) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        if self._model_instance.is_supported():
            pass
        else:
            error_count += 1
            error_message += "Model not supported;"

        return error_count, error_message


def test_end_to_end_model_plugin(plugin_test_data):
    model_plugin_test = PluginTest()
    model_plugin_test.test_model_plugin(plugin_test_data)
