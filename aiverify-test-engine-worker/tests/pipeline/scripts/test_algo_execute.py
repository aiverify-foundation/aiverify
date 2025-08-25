import pytest
from unittest.mock import Mock, patch, mock_open, MagicMock
from aiverify_test_engine_worker.pipeline.scripts import algo_execute
from pathlib import Path
from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm


# Fixture to create an instance of ProcessCallback
@pytest.fixture
def process_callback():
    return algo_execute.ProcessCallback("test_run_id")


# Test for load_algorithm_class function
class TestLoadAlgorithmClass:
    @patch.object(algo_execute, "validate_algorithm")
    @patch("importlib.import_module")
    def test_load_algorithm_class_success(self, mock_import_module, mock_validate_algorithm):
        mock_validate_algorithm.return_value = (
            Path("/tmp/algorithm/algo_script.py"),
            Path("/tmp/algorithm/input_schema.json"),
            Path("/tmp/algorithm/output_schema.json"),
            Path("/tmp/algorithm/algo_meta.json")
        )
        mock_module = MagicMock(spec=IAlgorithm)
        mock_module.open = Mock()
        mock_import_module.return_value = mock_module
        with patch.object(algo_execute, "open", mock_open(read_data='{"type": "object"}')):
            result = algo_execute.load_algorithm_class(Path("/tmp/algorithm"))
            assert isinstance(result, tuple)
            assert len(result) == 5

    @patch.object(algo_execute, "validate_algorithm")
    def test_load_algorithm_class_no_plugin(self, mock_validate_algorithm):
        mock_validate_algorithm.return_value = (
            Path("/tmp/algorithm/algo_script.py"),
            Path("/tmp/algorithm/input_schema.json"),
            Path("/tmp/algorithm/output_schema.json"),
            Path("/tmp/algorithm/algo_meta.json")
        )
        with patch("importlib.import_module", side_effect=ImportError):
            with pytest.raises(ImportError):
                algo_execute.load_algorithm_class(Path("/tmp/algorithm"))


# Test for load_plugin_manager function
class TestLoadPluginManager:
    @patch("importlib.util.find_spec")
    def test_load_plugin_manager_success(self, mock_find_spec):
        mock_find_spec.return_value = Mock(
            origin="/tmp/aiverify_test_engine/__init__.py")
        result = algo_execute.load_plugin_manager()
        assert result == Path("/tmp/aiverify_test_engine")

    @patch("importlib.util.find_spec", return_value=None)
    def test_load_plugin_manager_failure(self, mock_find_spec):
        with pytest.raises(SystemExit):
            algo_execute.load_plugin_manager()
