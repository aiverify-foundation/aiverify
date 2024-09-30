from pathlib import Path
from typing import Tuple

import pytest
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.plugins_manager import PluginManager


class PluginTest:
    def test_plugin_model(self, plugin_test_data):
        (
            model_path,
            discover_path,
            expected_model_algorithm,
            expected_model_plugin_type,
        ) = plugin_test_data
        self._base_path = discover_path
        self._model_path = model_path
        self._expected_model_algorithm = expected_model_algorithm
        self._expected_model_plugin_type = expected_model_plugin_type
        self._model_instance = None
        self._model_serializer_instance = None

        try:
            error_count = 0
            error_message = ""

            # Discover and load the plugins
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
            if not is_success:
                raise RuntimeError(
                    f"Failed to perform model instance setup: {error_messages}"
                )

            # Run test methods
            test_methods = [
                self._validate_metadata,
                self._validate_plugin_type,
                self._validate_model_supported,
            ]

            # Check all test methods
            for method in test_methods:
                tmp_count, tmp_error_msg = method()
                error_count += tmp_count
                error_message += tmp_error_msg

            # Perform cleanup
            self._model_instance.cleanup()

            # Check for errors
            assert (
                error_count == 0
            ), f"Errors found while running tests. {error_message}"

        except Exception as error:
            pytest.fail(f"Exception found while running tests: {str(error)}")

    def _validate_metadata(self) -> Tuple[int, str]:
        error_count = 0
        error_message = ""

        metadata = self._model_instance.get_metadata()
        if (
            metadata.name == "sklearnmodel"
            and metadata.description == "sklearnmodel supports detecting sklearn models"
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


@pytest.mark.parametrize(
    "file_path",
    [
        str(Path(__file__).parent / "user_defined_files/pickle_scikit_lr.sav"),
        "https://github.com/aiverify-foundation/aiverify/raw/refs/heads/v2.x/aiverify-test-engine/tests/io/user_defined_files/pickle_scikit_lr.sav",  # noqa: E501
    ],
)
def test_end_to_end_plugin_model(file_path, request):
    test_dir = Path(request.module.__file__).parent
    discover_path = test_dir.parent.parent / "aiverify_test_engine/io"
    expected_model_algorithm = "sklearn.linear_model._logistic.LogisticRegression"
    expected_model_plugin_type = ModelPluginType.SKLEARN

    plugin_test_data = (
        file_path,
        discover_path,
        expected_model_algorithm,
        expected_model_plugin_type,
    )

    plugin_test = PluginTest()
    plugin_test.test_plugin_model(plugin_test_data)
