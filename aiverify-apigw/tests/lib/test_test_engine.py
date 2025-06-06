import pytest
from pathlib import Path
from aiverify_apigw.lib.test_engine import TestEngineValidator, TestEngineValidatorException
from aiverify_test_engine.plugins.plugins_manager import IModel, IPipeline, IData
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_plugins_manager():
    """Fixture to mock the `init_engine` method and return a mock plugins_manager."""
    mock_plugins_manager = MagicMock()
    mock_plugins_manager.IModel = IModel
    mock_plugins_manager.IPipeline = IPipeline
    mock_plugins_manager.IData = IData
    mock_plugins_manager.PluginManager = MagicMock()
    TestEngineValidator.engine_initialized = True
    TestEngineValidator.plugins_manager = mock_plugins_manager

    # Patch the `init_engine` method to return the mock_plugins_manager
    with patch.object(TestEngineValidator, "init_engine") as mock:
        mock.return_value = mock_plugins_manager
        yield mock_plugins_manager


class TestEngineValidatorTest:
    def test_init_engine_success(self):
        TestEngineValidator.plugins_manager = None
        with patch("aiverify_apigw.lib.test_engine._lazy_import") as mock_lazy_import:
            mock_plugins_manager = MagicMock()
            mock_plugins_manager.PluginManager = MagicMock()
            mock_lazy_import.return_value = mock_plugins_manager
            plugins_manager = TestEngineValidator.init_engine()
            mock_lazy_import.assert_called_once()
            assert plugins_manager is not None
            assert TestEngineValidator.engine_initialized is True
            mock_plugins_manager.PluginManager.discover.assert_called_once()

    def test_init_engine_failure(self):
        TestEngineValidator.plugins_manager = None
        with patch("aiverify_apigw.lib.test_engine._lazy_import") as mock_lazy_import:
            mock_lazy_import.side_effect = RuntimeError("Unable to load aiverify_test_engine module")
            with pytest.raises(RuntimeError):
                TestEngineValidator.init_engine()
                mock_lazy_import.assert_called_once()


class TestEngineValidatorValidateModelTest:
    def test_validate_model_success(self, mock_plugins_manager):
        model_path = Path("test_model_path")
        model = MagicMock(spec=IModel)
        mock_plugins_manager.PluginManager.get_instance.return_value = (model, MagicMock(), "")
        model.setup.return_value = (True, "")
        TestEngineValidator.validate_model(model_path)
        mock_plugins_manager.PluginManager.get_instance.assert_called_once()
        model.setup.assert_called_once()
        model.cleanup.assert_called_once()

    def test_validate_model_pipeline_success(self, mock_plugins_manager):
        model_path = Path("test_model_path")
        model = MagicMock(spec=IPipeline)
        mock_plugins_manager.PluginManager.get_instance.return_value = (model, MagicMock(), "")
        model.setup.return_value = (True, "")
        TestEngineValidator.validate_model(model_path, True)
        mock_plugins_manager.PluginManager.get_instance.assert_called_once()
        model.setup.assert_called_once()
        model.cleanup.assert_called_once()

    def test_validate_model_failure_invalid_instance(self, mock_plugins_manager):
        model_path = Path("test_model_path")
        model = MagicMock(spec=IModel)
        mock_plugins_manager.PluginManager.get_instance.return_value = (model, MagicMock(), "")
        model.setup.return_value = (False, "setup failed")
        with pytest.raises(TestEngineValidatorException):
            TestEngineValidator.validate_model(model_path)

    def test_validate_model_failure_invalid_format(self, mock_plugins_manager):
        model_path = Path("test_model_path")
        mock_plugins_manager.PluginManager.get_instance.return_value = (MagicMock(), MagicMock(), "")
        with pytest.raises(TestEngineValidatorException):
            TestEngineValidator.validate_model(model_path)


class TestEngineValidatorValidateDatasetTest:
    def test_validate_dataset_success(self, mock_plugins_manager):
        model_path = Path("test_dataset_path")
        data = MagicMock(spec=IData)
        mock_plugins_manager.PluginManager.get_instance.return_value = (data, MagicMock(), "")
        data.setup.return_value = (True, "")
        data.validate.return_value = (True, "")
        data.read_labels.return_value = {"col1": "int", "col2": "str"}
        data.get_shape.return_value = (10, 2)
        data.get_data_plugin_type.return_value = MagicMock()
        result = TestEngineValidator.validate_dataset(model_path)
        assert result is not None
        data.setup.assert_called_once()
        data.validate.assert_called_once()

    def test_validate_dataset_failure_invalid_instance(self, mock_plugins_manager):
        model_path = Path("test_dataset_path")
        data = MagicMock(spec=IData)
        mock_plugins_manager.PluginManager.get_instance.return_value = (data, MagicMock(), "")
        data.setup.return_value = (False, "setup failed")
        with pytest.raises(TestEngineValidatorException):
            TestEngineValidator.validate_dataset(model_path)

    def test_validate_dataset_failure_invalid_format(self, mock_plugins_manager):
        model_path = Path("test_dataset_path")
        mock_plugins_manager.PluginManager.get_instance.return_value = (MagicMock(), MagicMock(), "")
        with pytest.raises(TestEngineValidatorException):
            TestEngineValidator.validate_dataset(model_path)
