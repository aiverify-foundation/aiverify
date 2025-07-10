import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import tempfile
import json
import tomllib
from datetime import datetime
from aiverify_apigw.lib.plugin_store import PluginStore, PluginStoreException
from aiverify_apigw.models import PluginModel, AlgorithmModel, WidgetModel, InputBlockModel, TemplateModel
from aiverify_apigw.schemas import PluginMeta, AlgorithmMeta, WidgetMeta, InputBlockMeta, TemplateMeta


@pytest.fixture(autouse=False)
def override_session_local(monkeypatch, SessionLocal):
    """Override the SessionLocal in the database module."""
    monkeypatch.setattr("aiverify_apigw.lib.plugin_store.SessionLocal", SessionLocal)  # Replace `your_module` with the actual module name
    return SessionLocal


@pytest.fixture(autouse=False)
def override_session_local_mocked(monkeypatch):
    """Override the SessionLocal in the database module."""
    mock = MagicMock()
    monkeypatch.setattr("aiverify_apigw.lib.plugin_store.SessionLocal", mock)  # Replace `your_module` with the actual module name
    return mock


# Test class for delete_all_plugins
class TestDeleteAllPlugins:
    def test_delete_all_plugins_success(self, override_session_local, db_session, mock_plugins):
        """Test successful deletion of all plugins."""
        assert db_session.query(PluginModel).count() == len(mock_plugins)
        with patch("aiverify_apigw.lib.plugin_store.fs_delete_all_plugins") as mock_fs_delete_all_plugins:
            PluginStore.delete_all_plugins()
            mock_fs_delete_all_plugins.assert_called_once()
            assert db_session.query(PluginModel).count() == 0


# Test class for delete_plugin
class TestDeletePlugin:
    def test_delete_plugin_success(self, override_session_local, db_session, mock_plugins):
        """Test successful deletion of a plugin."""
        plugin = mock_plugins[0]
        assert db_session.query(PluginModel).filter(PluginModel.gid == plugin.gid).count() == 1
        with patch("aiverify_apigw.lib.plugin_store.fs_delete_plugin") as mock_fs_delete_plugin:
            PluginStore.delete_plugin(plugin.gid)
            mock_fs_delete_plugin.assert_called_once()
            assert db_session.query(PluginModel).filter(PluginModel.gid == plugin.gid).count() == 0


# Test class for scan_stock_plugins
class TestScanStockPlugins:
    def test_scan_stock_plugins_success(self, override_session_local):
        """Test successful scanning of stock plugins."""
        with patch.object(PluginStore, 'delete_all_plugins'), \
            patch.object(PluginStore, 'validate_plugin_directory'), \
            patch.object(PluginStore, 'scan_plugin_directory') as mock_scan:
            PluginStore.scan_stock_plugins()
            mock_scan.assert_called()

    def test_scan_stock_plugins_invalid_folder(self, override_session_local):
        """Test scanning of stock plugins with an invalid folder."""
        with patch.object(PluginStore, 'delete_all_plugins'), \
            patch.object(PluginStore, 'validate_plugin_directory') as mock_validate, \
            patch.object(PluginStore, 'scan_plugin_directory') as mock_scan:
            mock_validate.side_effect = PluginStoreException("Invalid plugin directory")
            PluginStore.scan_stock_plugins()
            mock_scan.assert_not_called()


# Test class for validate_plugin_directory
class TestValidatePluginDirectory:
    def test_validate_plugin_directory_success(self, mock_plugins):
        """Test successful validation of a plugin directory."""
        plugin = mock_plugins[0]
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / PluginStore.plugin_meta_filename
            meta_file.write_text(plugin.meta.decode("utf-8"))
            
            with patch.object(PluginStore, 'validate_algorithm_directory'), \
                 patch.object(PluginStore, 'validate_widget'), \
                 patch.object(PluginStore, 'validate_input_block'), \
                 patch.object(PluginStore, 'validate_template'):
                plugin_meta = PluginStore.validate_plugin_directory(temp_dir)
                assert plugin_meta.gid == plugin.gid

    def test_validate_plugin_directory_invalid_meta(self):
        """Test validation of a plugin directory with invalid metadata."""
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / PluginStore.plugin_meta_filename
            meta_file.write_text(json.dumps({"gid": "###invalid-gid"}))
            
            with pytest.raises(PluginStoreException):
                PluginStore.validate_plugin_directory(temp_dir)


# Test class for scan_algorithm_directory
class TestScanAlgorithmDirectory:

    def test_scan_algorithm_directory_success(self, override_session_local_mocked, mock_plugins):
        """Test successful scanning of an algorithm directory."""

        plugin = mock_plugins[0]
        algo = plugin.algorithms[0]
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            algo_dir = temp_dir / "algo1"
            algo_dir.mkdir()
            meta_file = algo_dir / "algo1.meta.json"
            meta_file.write_text(algo.meta.decode("utf-8"))

            mock_session = MagicMock()
            override_session_local_mocked.return_value.__enter__.return_value = mock_session
            mock_session.scalar.return_value = None

            with patch.object(PluginStore, 'read_algorithm_directory') as mock_read_algorithm_directory, \
                patch("shutil.copytree") as mock_copytree, \
                patch("aiverify_apigw.lib.plugin_store.fs_save_plugin_algorithm") as mock_fs_save_plugin_algorithm, \
                patch("aiverify_apigw.lib.plugin_store.fs_save_plugin") as mock_fs_save_plugin:
                mock_read_algorithm_directory.return_value = algo
                plugin = PluginStore.scan_algorithm_directory(algo_dir)
                assert plugin is not None
                override_session_local_mocked.assert_called_once()
                mock_session.scalar.assert_called_once()
                mock_fs_save_plugin.assert_called_once()
                mock_fs_save_plugin_algorithm.assert_called_once()
                mock_copytree.assert_called_once()

    def test_scan_algorithm_directory_invalid_meta(self):
        """Test scanning of an algorithm directory with invalid metadata."""
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            algo_dir = temp_dir / "algo1"
            algo_dir.mkdir()
            meta_file = algo_dir / "algo1.meta.json"
            meta_file.write_text(json.dumps({"gid": "##invalid##"}))
            
            with pytest.raises(PluginStoreException):
                PluginStore.scan_algorithm_directory(algo_dir)


# Test class for validate_mock_data_path
class TestValidateMockDataPath:
    def test_validate_mock_data_path_success(self):
        """Test successful validation of a mock data path."""
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            data_file = temp_dir / "mock_data.json"
            data_file.write_text(json.dumps({"key": "value"}))
            assert PluginStore.validate_mock_data_path(temp_dir, "mock_data.json") is True

    def test_validate_mock_data_path_invalid(self):
        """Test validation of an invalid mock data path."""
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            assert PluginStore.validate_mock_data_path(temp_dir, "/etc/passwd") is False


# Test class for validate_widget
class TestValidateWidget:
    def test_validate_widget_success(self, mock_plugins):
        """Test successful validation of a widget."""
        plugin = mock_plugins[0]
        widget = plugin.widgets[0]

        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / "widget.meta.json"
            meta_file.write_text(widget.meta.decode("utf-8"))
            mdx_file = temp_dir / "widget.mdx"
            mdx_file.write_text("Test MDX Content")
            script_file = temp_dir / f"{widget.cid}.mdx"
            script_file.write_text("# Hello")
            
            with patch.object(PluginStore, 'validate_mdx') as mock_validate:
                mock_validate.return_value = True
                meta, meta_json = PluginStore.validate_widget(temp_dir, meta_file)
                assert meta.cid == widget.cid

    def test_validate_widget_invalid_mdx(self, mock_plugins):
        """Test validation of a widget with invalid MDX file."""
        plugin = mock_plugins[0]
        widget = plugin.widgets[0]
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / "widget.meta.json"
            meta_file.write_text(widget.meta.decode("utf-8"))
            mdx_file = temp_dir / "widget.mdx"
            mdx_file.write_text("Test MDX Content")
            script_file = temp_dir / f"{widget.cid}.mdx"
            script_file.write_text("<invalid>")
            
            with patch.object(PluginStore, 'validate_mdx') as mock_validate:
                mock_validate.return_value = False
                with pytest.raises(PluginStoreException):
                    PluginStore.validate_widget(temp_dir, meta_file)


# Test class for validate_input_block
class TestValidateInputBlock:
    def test_validate_input_block_success(self, mock_plugins):
        """Test successful validation of an input block."""
        plugin = mock_plugins[0]
        ib = plugin.inputblocks[0]
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / "input_block.meta.json"
            meta_file.write_text(ib.meta.decode("utf-8"))
            mdx_file = temp_dir / f"{ib.cid}.mdx"
            mdx_file.write_text("Test MDX Content")
            summary_file = temp_dir / f"{ib.cid}.summary.mdx"
            summary_file.write_text("Test Summary MDX Content")
            
            with patch.object(PluginStore, 'validate_mdx') as mock_validate:
                mock_validate.return_value = True
                meta, meta_json = PluginStore.validate_input_block(temp_dir, meta_file)
                assert meta.cid == ib.cid

    def test_validate_input_block_missing_summary(self, mock_plugins):
        """Test validation of an input block with a missing summary file."""
        plugin = mock_plugins[0]
        ib = plugin.inputblocks[0]
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / "input_block.meta.json"
            meta_file.write_text(ib.meta.decode("utf-8"))
            mdx_file = temp_dir / f"{ib.cid}.mdx"
            mdx_file.write_text("Test MDX Content")
            
            with pytest.raises(PluginStoreException):
                PluginStore.validate_input_block(temp_dir, meta_file)


# Test class for validate_template
class TestValidateTemplate:
    def test_validate_template_success(self, mock_plugins):
        """Test successful validation of a template."""
        plugin = mock_plugins[0]
        template = plugin.templates[0]
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / f"{template.cid}.meta.json"
            meta_file.write_text(template.meta.decode("utf-8"))
            data_file = temp_dir / f"{template.cid}.data.json"
            data_file.write_text(template.project_data.decode("utf-8"))
            
            meta, meta_json, data, data_json = PluginStore.validate_template(temp_dir, meta_file)
            assert meta.cid == template.cid

    def test_validate_template_invalid_data(self, mock_plugins):
        """Test validation of a template with invalid data."""
        plugin = mock_plugins[0]
        template = plugin.templates[0]
        with tempfile.TemporaryDirectory() as tmpdirname:
            temp_dir = Path(tmpdirname)
            meta_file = temp_dir / f"{template.cid}.meta.json"
            meta_file.write_text(template.meta.decode("utf-8"))
            data_file = temp_dir / f"{template.cid}.data.json"
            data_file.write_text("invalid data")
            
            with pytest.raises(PluginStoreException):
                PluginStore.validate_template(temp_dir, meta_file)