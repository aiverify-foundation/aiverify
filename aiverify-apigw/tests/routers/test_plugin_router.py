import pytest
import json
import io
from unittest.mock import patch, MagicMock
from aiverify_apigw.models.plugin_model import PluginModel

# from aiverify_apigw.routers.plugin_router import PluginStore


@pytest.fixture(scope="function")
def mock_plugins_no_widgets_inputblocks(db_session):
    from ..mocks.mock_data_plugin import _create_mock_plugin
    from aiverify_apigw.models import (
        PluginModel,
        AlgorithmModel,
        WidgetModel,
        InputBlockModel,
        TemplateModel,
        PluginComponentModel,
    )

    db_session.query(PluginModel).delete()
    plugin = _create_mock_plugin(num_algo=None, num_widgets=0, num_input_blocks=0)
    db_session.add(plugin)
    db_session.commit()
    yield plugin
    db_session.query(PluginModel).delete()
    db_session.query(AlgorithmModel).delete()
    db_session.query(WidgetModel).delete()
    db_session.query(InputBlockModel).delete()
    db_session.query(TemplateModel).delete()
    db_session.query(PluginComponentModel).delete()
    db_session.commit()


class TestReadTestResults:
    def test_read_plugins(self, test_client, mock_plugins):
        response = test_client.get("/plugins/")
        assert response.status_code == 200
        json_response = response.json()
        assert len(json_response) == len(mock_plugins)
        for i in range(len(json_response)):
            assert json_response[i]["gid"] == mock_plugins[i].gid
            assert json_response[i]["name"] == mock_plugins[i].name


class TestReadPlugin:
    def test_read_plugin_found(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        response = test_client.get(f"/plugins/{plugin.gid}")
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["gid"] == plugin.gid

    def test_read_plugin_not_found(self, test_client):
        response = test_client.get("/plugins/invalid_gid")
        assert response.status_code == 404
        assert response.json() == {"detail": "Plugin not found"}


class TestDeletePlugin:
    def test_delete_stock_plugin_error(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        response = test_client.delete(f"/plugins/{plugin.gid}")
        assert response.status_code == 400

    @patch("aiverify_apigw.routers.plugin_router.PluginStore.delete_plugin", return_value=None)
    def test_delete_non_stock_plugin_success(self, mock_delete_plugin, test_client, mock_non_stock_plugins):
        plugin = mock_non_stock_plugins[0]
        response = test_client.delete(f"/plugins/{plugin.gid}")
        assert response.status_code == 200
        assert response.json() == {"message": "Plugin deleted successfully"}
        mock_delete_plugin.assert_called_with(plugin.gid)

    def test_delete_plugin_not_found(self, test_client):
        response = test_client.delete("/plugins/invalid_gid")
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
        response = test_client.post("/plugins/upload", files=file)

        assert response.status_code == 200

    def test_upload_plugin_invalid_format(self, test_client):
        # content_buffer = io.BytesIO()
        file = {"file": ("test.invalid", b"Test Content", "text/plain")}
        response = test_client.post("/plugins/upload", files=file)
        assert response.status_code == 400
        assert response.json() == {"detail": "Invalid file format. Only .zip files are allowed."}


class TestDownloadPlugin:
    @patch("aiverify_apigw.routers.plugin_router.get_plugin_zip")
    def test_download_plugin_success(self, mock_zip, test_client, mock_plugins):
        plugin = mock_plugins[0]
        # zip_buffer = MagicMock()
        # zip_buffer.read = MagicMock(return_value=b"Test Plugin")
        mock_zip.return_value = b"Test Plugin"
        response = test_client.get(f"/plugins/download/{plugin.gid}")
        assert response.status_code == 200

    def test_download_plugin_not_found(self, test_client):
        # mock_db_session.scalar.return_value = None
        response = test_client.get("/plugins/download/invalid_gid")
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
        response = test_client.get(f"/plugins/{plugin.gid}/algorithms/{algo.cid}")
        assert response.status_code == 200

    def test_download_plugin_algorithm_not_found(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        # mock_db_session.scalar.return_value = None
        response = test_client.get(f"/plugins/algorithms/{plugin.gid}/invalid_algo")
        assert response.status_code == 404


# Test class for GET /{gid}/widgets
class TestDownloadPluginWidgets:

    @patch("aiverify_apigw.routers.plugin_router.get_plugin_widgets_zip", autospec=True)
    @patch("aiverify_apigw.routers.plugin_router.sanitize_filename", autospec=True)
    def test_download_plugin_widgets_success(self, mock_sanitize_filename, mock_get_plugin_widgets_zip, test_client, mock_plugins):
        """Test successfully downloading a plugin's widget zip."""

        plugin = mock_plugins[0]

        # Mock sanitize_filename and get_plugin_widgets_zip
        gid = plugin.gid
        mock_content = b"Mock zip content"
        mock_sanitize_filename.return_value = gid
        mock_get_plugin_widgets_zip.return_value = mock_content

        response = test_client.get(f"/plugins/{gid}/widgets")

        # Assertions
        assert response.status_code == 200
        assert response.headers["Content-Disposition"] == f"attachment; filename=\"{gid}_widgets.zip\""
        assert response.headers["Content-Type"] == "application/zip"
        assert response.content == mock_content

        # Ensure mocks were called
        mock_sanitize_filename.assert_called_once_with(gid)
        mock_get_plugin_widgets_zip.assert_called_once_with(gid)

    def test_download_plugin_widgets_plugin_not_found(self, test_client):
        """Test when the plugin is not found."""

        # Perform the GET request
        gid = "nonexistent_plugin"
        response = test_client.get(f"/plugins/{gid}/widgets")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Plugin not found"

    def test_download_plugin_widgets_no_widgets(self, test_client, db_session, mock_plugins_no_widgets_inputblocks):
        """Test when the plugin has no widgets."""

        plugin = mock_plugins_no_widgets_inputblocks
        gid = plugin.gid

        response = test_client.get(f"/plugins/{gid}/widgets")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Plugin does not have any widgets"

    @patch("aiverify_apigw.routers.plugin_router.get_plugin_widgets_zip", autospec=True)
    def test_download_plugin_widgets_internal_error(self, mock_get_plugin_widgets_zip, test_client, mock_plugins):
        """Test internal server error when generating the zip."""

        # Simulate an internal error in get_plugin_widgets_zip
        exception_error_msg = "Internal server error"
        mock_get_plugin_widgets_zip.side_effect = Exception(exception_error_msg)

        # Perform the GET request
        response = test_client.get(f"/plugins/{mock_plugins[0].gid}/widgets")

        # Assertions
        assert response.status_code == 500
        assert response.json()["detail"] == exception_error_msg


class TestDownloadPluginInputBlocks:

    @patch("aiverify_apigw.routers.plugin_router.get_plugin_inputs_zip", autospec=True)
    @patch("aiverify_apigw.routers.plugin_router.sanitize_filename", autospec=True)
    def test_download_plugin_input_blocks_success(self, mock_sanitize_filename, mock_get_plugin_inputs_zip, test_client, mock_plugins):
        """Test successfully downloading a plugin's widget zip."""

        plugin = mock_plugins[0]

        # Mock sanitize_filename and get_plugin_widgets_zip
        gid = plugin.gid
        mock_content = b"Mock zip content"
        mock_sanitize_filename.return_value = gid
        mock_get_plugin_inputs_zip.return_value = mock_content

        response = test_client.get(f"/plugins/{gid}/input_blocks")

        # Assertions
        assert response.status_code == 200
        assert response.headers["Content-Disposition"] == f"attachment; filename=\"{gid}_input_blocks.zip\""
        assert response.headers["Content-Type"] == "application/zip"
        assert response.content == mock_content

        # Ensure mocks were called
        mock_sanitize_filename.assert_called_once_with(gid)
        mock_get_plugin_inputs_zip.assert_called_once_with(gid)

    def test_download_plugin_input_blocks_plugin_not_found(self, test_client):
        """Test when the plugin is not found."""

        # Perform the GET request
        gid = "nonexistent_plugin"
        response = test_client.get(f"/plugins/{gid}/input_blocks")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Plugin not found"

    def test_download_plugin_input_blocks_empty(self, test_client, db_session, mock_plugins_no_widgets_inputblocks):
        """Test when the plugin has no input blocks."""

        plugin = mock_plugins_no_widgets_inputblocks
        gid = plugin.gid

        response = test_client.get(f"/plugins/{gid}/input_blocks")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Plugin does not have any input blocks"

    @patch("aiverify_apigw.routers.plugin_router.get_plugin_inputs_zip", autospec=True)
    def test_download_plugin_widgets_internal_error(self, mock_get_plugin_inputs_zip, test_client, mock_plugins):
        """Test internal server error when generating the zip."""

        # Simulate an internal error in get_plugin_widgets_zip
        exception_error_msg = "Internal server error"
        mock_get_plugin_inputs_zip.side_effect = Exception(exception_error_msg)

        # Perform the GET request
        response = test_client.get(f"/plugins/{mock_plugins[0].gid}/input_blocks")

        # Assertions
        assert response.status_code == 500
        assert response.json()["detail"] == exception_error_msg


class TestDownloadPluginBundle:
    @patch("aiverify_apigw.routers.plugin_router.get_plugin_mdx_bundle", autospec=True)
    def test_download_plugin_bundle_widget(self, mock_get_plugin_mdx_bundle, test_client, mock_plugins):
        """Test successful download of a widget bundle."""
        
        # Mock the bundle data
        mock_bundle = {"code": "mock_code", "frontmatter": "mock_frontmatter"}
        mock_get_plugin_mdx_bundle.return_value = mock_bundle

        # Perform the GET request
        plugin = mock_plugins[0]
        widget = plugin.widgets[0]
        gid = plugin.gid
        cid = f"widget:{widget.cid}"
        response = test_client.get(f"/plugins/{gid}/bundle/{cid}")

        # Assertions
        assert response.status_code == 200
        assert response.json() == mock_bundle
        mock_get_plugin_mdx_bundle.assert_called_once_with(gid, cid)

    @patch("aiverify_apigw.routers.plugin_router.get_plugin_mdx_bundle", autospec=True)
    def test_download_plugin_bundle_input_block(self, mock_get_plugin_mdx_bundle, test_client, mock_plugins):
        """Test successful download of an input block bundle."""
        
        # Mock the bundle data
        mock_bundle = {"code": "mock_code", "frontmatter": "mock_frontmatter"}
        mock_get_plugin_mdx_bundle.return_value = mock_bundle

        # Perform the GET request
        plugin = mock_plugins[0]
        ib = plugin.inputblocks[0]
        gid = plugin.gid
        cid = f"inputblock:{ib.cid}"
        response = test_client.get(f"/plugins/{gid}/bundle/{cid}")

        # Assertions
        assert response.status_code == 200
        assert response.json() == mock_bundle
        mock_get_plugin_mdx_bundle.assert_called_once_with(gid, cid)

    def test_download_plugin_bundle_not_found(self, test_client):
        """Test when the plugin or bundle is not found."""

        # Perform the GET request
        gid = "nonexistent_plugin"
        cid = "nonexistent_cid"
        response = test_client.get(f"/plugins/{gid}/bundle/{cid}")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Plugin not found"

    @patch("aiverify_apigw.routers.plugin_router.get_plugin_mdx_bundle", autospec=True)
    def test_download_plugin_bundle_internal_error(self, mock_get_plugin_mdx_bundle, test_client, mock_plugins):
        """Test internal server error when generating the bundle."""

        # Simulate an internal error in get_plugin_mdx_bundle
        exception_error_msg = "Internal server error"
        mock_get_plugin_mdx_bundle.side_effect = Exception(exception_error_msg)

        # Perform the GET request
        plugin = mock_plugins[0]
        widget = plugin.widgets[0]
        gid = plugin.gid
        cid = f"widget:{widget.cid}"
        response = test_client.get(f"/plugins/{gid}/bundle/{cid}")

        # Assertions
        assert response.status_code == 500
        assert response.json()["detail"] == exception_error_msg


class TestDownloadPluginSummary:
    @patch("aiverify_apigw.routers.plugin_router.get_plugin_mdx_bundle", autospec=True)
    def test_download_plugin_summary_success(self, mock_get_plugin_mdx_bundle, test_client, mock_plugins):
        """Test successful download of a plugin summary."""
        
        # Mock the bundle data
        mock_bundle = {"code": "mock_code", "frontmatter": "mock_frontmatter"}
        mock_get_plugin_mdx_bundle.return_value = mock_bundle

        # Perform the GET request
        plugin = mock_plugins[0]
        widget = plugin.widgets[0]
        gid = plugin.gid
        cid = f"widget:{widget.cid}"
        response = test_client.get(f"/plugins/{gid}/summary/{cid}")

        # Assertions
        assert response.status_code == 200
        assert response.json() == mock_bundle
        mock_get_plugin_mdx_bundle.assert_called_once_with(gid, cid, summary=True)

    def test_download_plugin_summary_not_found(self, test_client):
        """Test when the plugin or summary is not found."""

        # Perform the GET request
        gid = "nonexistent_plugin"
        cid = "nonexistent_cid"
        response = test_client.get(f"/plugins/{gid}/summary/{cid}")

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "Plugin not found"

    @patch("aiverify_apigw.routers.plugin_router.get_plugin_mdx_bundle", autospec=True)
    def test_download_plugin_summary_internal_error(self, mock_get_plugin_mdx_bundle, test_client, mock_plugins):
        """Test internal server error when generating the summary."""

        # Simulate an internal error in get_plugin_mdx_bundle
        exception_error_msg = "Internal server error"
        mock_get_plugin_mdx_bundle.side_effect = Exception(exception_error_msg)

        # Perform the GET request
        plugin = mock_plugins[0]
        widget = plugin.widgets[0]
        gid = plugin.gid
        cid = f"widget:{widget.cid}"
        response = test_client.get(f"/plugins/{gid}/summary/{cid}")

        # Assertions
        assert response.status_code == 500
        assert response.json()["detail"] == exception_error_msg

