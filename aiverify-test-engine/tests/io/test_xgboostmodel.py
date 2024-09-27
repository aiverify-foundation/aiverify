from pathlib import Path
from typing import Tuple, Union

import pytest
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager


@pytest.fixture
def plugin_test_data(request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    file_path = str(test_dir / "user_defined_files/joblib_xgboost_lr.sav")
    expected_model_algorithm = "xgboost.core.Booster"
    expected_model_plugin_type = ModelPluginType.XGBOOST
    return (
        file_path,
        discover_path,
        expected_model_algorithm,
        expected_model_plugin_type,
    )


class PluginTest:
    def test_plugin(self, plugin_test_data):
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
        self._model_instance: Union[None, IModel] = None
        self._model_serializer_instance: Union[None, ISerializer] = None

        # Discover and load the plugin
        PluginManager.discover(str(self._base_path))

        # Get the model instance
        (
            self._model_instance,
            self._model_serializer_instance,
            error_message,
        ) = PluginManager.get_instance(
            PluginType.MODEL, **{"filename": self._model_path}
        )

        # Perform model instance setup
        is_success, error_messages = self._model_instance.setup()
        assert is_success, f"Failed to perform model instance setup: {error_messages}"

        # Run the different tests
        test_methods = [
            self._validate_metadata,
            self._validate_plugin_type,
            self._validate_model_supported,
        ]

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
            metadata.name == "xgboostmodel"
            and metadata.description == "xgboostmodel supports detecting xgboost models"
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


def test_end_to_end_model_plugin_test(plugin_test_data):
    plugin_test = PluginTest()
    plugin_test.test_plugin(plugin_test_data)
