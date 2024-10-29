import pytest
import json
import io
from unittest.mock import patch, MagicMock
from aiverify_apigw.models.plugin_model import PluginModel

# from aiverify_apigw.routers.plugin_router import PluginStore


class TestReadTestResults:
    def test_read_plugins(self, test_client, mock_plugins):
        response = test_client.get("/plugin/")
        assert response.status_code == 200
        json_response = response.json()
        assert len(json_response) == len(mock_plugins)
        for i in range(len(json_response)):
            assert json_response[i]["gid"] == mock_plugins[i].gid
            assert json_response[i]["name"] == mock_plugins[i].name


class TestReadPlugin:
    def test_read_plugin_found(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        response = test_client.get(f"/plugin/{plugin.gid}")
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["gid"] == plugin.gid

    def test_read_plugin_not_found(self, test_client):
        response = test_client.get("/plugin/invalid_gid")
        assert response.status_code == 404
        assert response.json() == {"detail": "Plugin not found"}


class TestDeletePlugin:
    def test_delete_stock_plugin_error(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        response = test_client.delete(f"/plugin/{plugin.gid}")
        assert response.status_code == 400

    @patch("aiverify_apigw.routers.plugin_router.PluginStore.delete_plugin", return_value=None)
    def test_delete_non_stock_plugin_success(self, mock_delete_plugin, test_client, mock_non_stock_plugins):
        plugin = mock_non_stock_plugins[0]
        response = test_client.delete(f"/plugin/{plugin.gid}")
        assert response.status_code == 200
        assert response.json() == {"message": "Plugin deleted successfully"}
        mock_delete_plugin.assert_called_with(plugin.gid)

    def test_delete_plugin_not_found(self, test_client):
        response = test_client.delete("/plugin/invalid_gid")
        assert response.status_code == 404
        assert response.json() == {"detail": "Plugin not found"}


class TestUploadPlugin:
    @pytest.fixture
    def mock_upload_zipfile(self):
        import zipfile

        """Fixture to return a mocked UploadFile for a valid zip."""
        # file_list = file_list or [result_filename]
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED, False) as zip_file:
            zip_file.writestr("plugin.meta.json", b"Mock meta")
        return zip_buffer

    @patch("aiverify_apigw.routers.plugin_router.backup_plugin")
    @patch("aiverify_apigw.routers.plugin_router.PluginStore")
    def test_upload_plugin_success(
        self, mock_plugin_store, mock_backup_plugin, mock_plugin_meta, test_client, mock_upload_zipfile
    ):
        meta = mock_plugin_meta
        meta_dict = mock_plugin_meta.model_dump()
        model = PluginModel(**meta_dict, meta=json.dumps(meta_dict).encode("utf-8"), is_stock=False)
        mock_plugin_store.validate_plugin_directory = MagicMock(return_value=meta)
        mock_plugin_store.scan_plugin_directory = MagicMock(return_value=model)

        mock_upload_zipfile.seek(0)
        file = {"file": ("test.zip", mock_upload_zipfile.read(), "application/zip")}
        response = test_client.post("/plugin/upload", files=file)

        assert response.status_code == 200

    def test_upload_plugin_invalid_format(self, test_client):
        # content_buffer = io.BytesIO()
        file = {"file": ("test.invalid", b"Test Content", "text/plain")}
        response = test_client.post("/plugin/upload", files=file)
        assert response.status_code == 400
        assert response.json() == {"detail": "Invalid file format. Only .zip files are allowed."}


class TestDownloadPlugin:
    @patch("aiverify_apigw.routers.plugin_router.get_plugin_zip")
    def test_download_plugin_success(self, mock_zip, test_client, mock_plugins):
        plugin = mock_plugins[0]
        # zip_buffer = MagicMock()
        # zip_buffer.read = MagicMock(return_value=b"Test Plugin")
        mock_zip.return_value = b"Test Plugin"
        response = test_client.get(f"/plugin/download/{plugin.gid}")
        assert response.status_code == 200

    def test_download_plugin_not_found(self, test_client):
        # mock_db_session.scalar.return_value = None
        response = test_client.get("/plugin/download/invalid_gid")
        assert response.status_code == 404
        # assert response.json() == {"detail": "Plugin not found"}


class TestDownloadPluginAlgorithm:
    @patch("aiverify_apigw.routers.plugin_router.get_plugin_algorithm_zip")
    def test_download_plugin_algorithm_success(self, mock_zip, test_client, mock_plugins):
        plugin = mock_plugins[0]
        algo = plugin.algorithms[0]
        # zip_buffer = MagicMock()
        # zip_buffer.read = MagicMock(return_value=b"Test Plugin")
        mock_zip.return_value = b"Test Algorithm"
        response = test_client.get(f"/plugin/algorithm/{plugin.gid}/{algo.cid}")
        assert response.status_code == 200

    def test_download_plugin_algorithm_not_found(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        # mock_db_session.scalar.return_value = None
        response = test_client.get(f"/plugin/algorithm/{plugin.gid}/invalid_algo")
        assert response.status_code == 404
