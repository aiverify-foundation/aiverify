# test_plugin_store.py

import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch, mock_open
from aiverify_apigw.lib.plugin_store import PluginStore, PluginStoreException
from aiverify_apigw.models import PluginModel, AlgorithmModel, PluginComponentModel


@pytest.fixture(scope="module", autouse=True)
def session_local(SessionLocal):
    """patch SessionLocal with my test SessionLocal"""
    with patch("aiverify_apigw.lib.plugin_store.SessionLocal", SessionLocal) as session:
        yield session


class TestPluginStoreDeleteAllPlugins:
    """Test cases for PluginStore.delete_all_plugins method."""

    @patch("aiverify_apigw.lib.filestore.delete_plugin")
    def test_delete_plugin(self, mock_delete_plugin, db_session, mock_plugins):
        """Test delete_plugin method to ensure it deletes one plugin from DB."""
        plugin = mock_plugins[0]
        initial_count = db_session.query(PluginModel).count()
        assert initial_count == len(mock_plugins)
        initial_count = db_session.query(PluginComponentModel).count()
        assert initial_count > 0
        initial_count = db_session.query(AlgorithmModel).count()
        assert initial_count > 0

        PluginStore.delete_plugin(plugin.gid)

        new_count = db_session.query(PluginModel).count()
        assert new_count == len(mock_plugins) - 1
        # make sure algorithms also delete, as part of cascade delete
        new_count = db_session.query(PluginComponentModel).count()
        assert new_count == len(mock_plugins[1].algorithms)
        new_count = db_session.query(AlgorithmModel).count()
        assert new_count == len(mock_plugins[1].algorithms)

    @patch("aiverify_apigw.lib.filestore.delete_all_plugins")
    def test_delete_all_plugins(self, mock_delete_all_plugins, db_session, mock_plugins):
        """Test delete_all_plugins method to ensure it deletes plugins from DB."""
        initial_count = db_session.query(PluginModel).count()
        assert initial_count == len(mock_plugins)
        initial_count = db_session.query(PluginComponentModel).count()
        assert initial_count > 0
        initial_count = db_session.query(AlgorithmModel).count()
        assert initial_count > 0

        PluginStore.delete_all_plugins()

        new_count = db_session.query(PluginModel).count()
        assert new_count == 0
        new_count = db_session.query(PluginComponentModel).count()
        assert new_count == 0
        # make sure algorithms also delete, as part of cascade delete
        new_count = db_session.query(AlgorithmModel).count()
        assert new_count == 0


class TestPluginStoreScanStockPlugins:
    """Test cases for PluginStore.scan_stock_plugins method."""

    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_plugin_directory")
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.scan_plugin_directory")
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.delete_all_plugins")
    def test_scan_stock_plugins(self, mock_delete_all_plugins, mock_scan_plugin_directory, mock_validate_plugin_directory):
        """Test scanning stock plugins to ensure plugins are validated and scanned."""
        from pathlib import Path
        mock_plugin_dir = MagicMock()
        mock_plugin_dir.is_dir.return_value = True

        with patch.object(Path, 'iterdir', return_value=[mock_plugin_dir]):
            PluginStore.scan_stock_plugins()

        mock_delete_all_plugins.assert_called_once()
        mock_validate_plugin_directory.assert_called_once_with(mock_plugin_dir)
        mock_scan_plugin_directory.assert_called_once_with(mock_plugin_dir)


class TestPluginStoreCheckPluginRegistry:
    """Test cases for PluginStore.check_plugin_registry method."""

    @patch("aiverify_apigw.lib.plugin_store.PluginStore.scan_stock_plugins")
    def test_check_plugin_registry_empty(self, mock_scan_stock_plugins):
        """Test check_plugin_registry when registry is empty, should trigger scan_stock_plugins."""
        PluginStore.check_plugin_registry()
        mock_scan_stock_plugins.assert_called_once()

    @patch("aiverify_apigw.lib.plugin_store.PluginStore.scan_stock_plugins")
    def test_check_plugin_registry_non_empty(self, mock_scan_stock_plugins, mock_plugins):
        """Test check_plugin_registry when registry is not empty, should not trigger scan_stock_plugins."""
        PluginStore.check_plugin_registry()
        mock_scan_stock_plugins.assert_not_called()


class TestPluginStoreReadRequirements:
    """Test cases for PluginStore.read_requirements method."""

    @patch.object(Path, "exists", return_value=True)
    def test_read_requirements_existing_file(self, mock_exists):
        """Test reading a requirements file that exists and returns list of dependencies."""
        mock_path = Path("requirements.txt")
        requirements_content = "package1\npackage2\n"

        with patch("builtins.open", mock_open(read_data=requirements_content)):
            result = PluginStore.read_requirements(mock_path)
            assert result == ["package1", "package2"]

    def test_read_requirements_non_existent_file(self):
        from pathlib import Path
        """Test reading a requirements file that does not exist, should return None."""
        mock_path = Path("non_existent.txt")

        result = PluginStore.read_requirements(mock_path)
        assert result is None


class TestPluginStoreScanPluginDirectory:
    """Test cases for PluginStore.scan_plugin_directory method."""

    @pytest.fixture
    def mock_plugin_path(self):
        from ..mocks.mock_plugin_path import create_mock_plugin_path
        folder = create_mock_plugin_path()
        return folder

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate")
    @patch("aiverify_apigw.lib.plugin_store.fs_save_plugin")
    def test_scan_plugin_directory_valid(self, mock_save_plugin, mock_read_and_validate, mock_plugin_path):
        """Test scanning a valid plugin directory, should read and validate successfully."""
        # TODO: add tests for algo scans
        from typing import Any
        import json

        mock_algo = mock_plugin_path.mock_data.algorithms[0]

        def read_and_validate_side_effect(path: Path, schema: Any):
            match path.name:
                case 'plugin.meta.json':
                    return json.loads(mock_plugin_path.mock_data.meta.decode('utf-8'))
                case 'input.schema.json':
                    return json.loads(mock_algo.input_schema.decode('utf-8'))
                case 'output.schema.json':
                    return json.loads(mock_algo.output_schema.decode('utf-8'))
                case _:
                    return None

        mock_read_and_validate.side_effect = read_and_validate_side_effect
        PluginStore.scan_plugin_directory(mock_plugin_path)
        mock_save_plugin.assert_called_once_with(mock_plugin_path.mock_data.gid, mock_plugin_path)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate")
    def test_scan_plugin_directory_invalid(self, mock_read_and_validate):
        """Test scanning a plugin directory with invalid metadata, should do nothing."""
        mock_read_and_validate.return_value = None
        mock_folder = Path("invalid_plugin_folder")
        result = PluginStore.scan_plugin_directory(mock_folder)
        assert result is None


class TestPluginStoreValidatePluginDirectory:
    """Test cases for PluginStore.validate_plugin_directory method."""

    @pytest.fixture
    def mock_plugin_path(self):
        from ..mocks.mock_plugin_path import create_mock_plugin_path
        folder = create_mock_plugin_path()
        return folder

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate")
    def test_validate_plugin_directory_valid(self, mock_read_and_validate, mock_plugin_path):
        """Test validating a valid plugin directory, should return PluginMeta."""
        from typing import Any
        import json
        from aiverify_apigw.schemas import PluginMeta

        def read_and_validate_side_effect(path: Path, schema: Any):
            match path.name:
                case 'plugin.meta.json':
                    return json.loads(mock_plugin_path.mock_data.meta.decode('utf-8'))
                case _:
                    return None

        mock_read_and_validate.side_effect = read_and_validate_side_effect

        result = PluginStore.validate_plugin_directory(mock_plugin_path)
        assert isinstance(result, PluginMeta)

    def test_validate_plugin_directory_invalid(self):
        """Test validating an invalid plugin directory, should raise PluginStoreException."""
        mock_folder = Path("invalid_plugin_folder")

        with pytest.raises(PluginStoreException):
            PluginStore.validate_plugin_directory(mock_folder)
