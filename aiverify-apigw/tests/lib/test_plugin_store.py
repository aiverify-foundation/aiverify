# test_plugin_store.py

import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch, mock_open
from aiverify_apigw.lib.plugin_store import PluginStore, PluginStoreException
from aiverify_apigw.models import PluginModel, AlgorithmModel, WidgetModel, InputBlockModel, TemplateModel, ProjectTemplateModel
from aiverify_apigw.schemas import WidgetMeta, InputBlockMeta, TemplateMeta, ProjectTemplateMeta
from aiverify_apigw.lib.schemas_utils import widget_schema, input_block_schema, template_schema, template_data_schema
from sqlalchemy import select


@pytest.fixture(scope="module", autouse=True)
def session_local(SessionLocal):
    """patch SessionLocal with my test SessionLocal"""
    with patch("aiverify_apigw.lib.plugin_store.SessionLocal", SessionLocal) as session:
        yield session


@pytest.fixture(scope="function")
def mock_algo_dir():
    """Fixture to create a mocked algorithm directory."""
    algo_dir = MagicMock(spec=Path)
    algo_dir.name = "test_algo"
    return algo_dir


@pytest.fixture(scope="function")
def mock_pyproject_path(mock_algo_dir):
    """Fixture to mock the pyproject.toml path."""
    pyproject_path = mock_algo_dir.joinpath("pyproject.toml")
    pyproject_path.exists.return_value = True
    return pyproject_path


class TestPluginStoreDeleteAllPlugins:
    """Test cases for PluginStore.delete_all_plugins method."""

    @patch("aiverify_apigw.lib.filestore.delete_plugin")
    def test_delete_plugin(self, mock_delete_plugin, db_session, mock_plugins):
        """Test delete_plugin method to ensure it deletes one plugin from DB."""
        plugin = mock_plugins[0]
        initial_count = db_session.query(PluginModel).count()
        assert initial_count == len(mock_plugins)
        assert db_session.query(AlgorithmModel).count() > 0
        assert db_session.query(WidgetModel).count() > 0
        assert db_session.query(InputBlockModel).count() > 0
        assert db_session.query(TemplateModel).count() > 0
        assert db_session.query(ProjectTemplateModel).count() > 0

        PluginStore.delete_plugin(plugin.gid)

        new_count = db_session.query(PluginModel).count()
        assert new_count == len(mock_plugins) - 1
        # make sure algorithms also delete, as part of cascade delete
        assert db_session.query(AlgorithmModel).count() == len(mock_plugins[1].algorithms)
        assert db_session.query(WidgetModel).count() == len(mock_plugins[1].widgets)
        assert db_session.query(InputBlockModel).count() == len(mock_plugins[1].inputblocks)
        assert db_session.query(TemplateModel).count() == len(mock_plugins[1].templates)
        assert db_session.query(ProjectTemplateModel).count() == len(mock_plugins[1].project_templates)

    @patch("aiverify_apigw.lib.plugin_store.fs_delete_all_plugins")
    def test_delete_all_plugins(self, mock_delete_all_plugins, db_session, mock_plugins, mock_project_template):
        """Test delete_all_plugins method to ensure it deletes plugins from DB."""
        initial_count = db_session.query(PluginModel).count()
        assert initial_count == len(mock_plugins)
        assert db_session.query(WidgetModel).count() > 0
        assert db_session.query(AlgorithmModel).count() > 0
        assert db_session.query(WidgetModel).count() > 0
        assert db_session.query(InputBlockModel).count() > 0
        assert db_session.query(TemplateModel).count() > 0
        assert db_session.query(ProjectTemplateModel).count() > 0

        PluginStore.delete_all_plugins()

        mock_delete_all_plugins.assert_called_once()

        assert db_session.query(PluginModel).count() == 0
        assert db_session.query(WidgetModel).count() == 0
        # make sure components also delete, as part of cascade delete
        assert db_session.query(AlgorithmModel).count() == 0
        assert db_session.query(WidgetModel).count() == 0
        assert db_session.query(InputBlockModel).count() == 0
        assert db_session.query(TemplateModel).count() == 0
        # make sure templates not linked to any project is not deleted
        assert db_session.query(ProjectTemplateModel).count() == 1
        stmt = select(ProjectTemplateModel).where(ProjectTemplateModel.id == mock_project_template.id)
        result = db_session.execute(stmt).scalar_one_or_none()
        assert result is not None
        assert result.id == mock_project_template.id


class TestPluginStoreScanStockPlugins:
    """Test cases for PluginStore.scan_stock_plugins method."""

    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_plugin_directory")
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.scan_plugin_directory")
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.delete_all_plugins")
    def test_scan_stock_plugins(
        self, mock_delete_all_plugins, mock_scan_plugin_directory, mock_validate_plugin_directory
    ):
        """Test scanning stock plugins to ensure plugins are validated and scanned."""
        from pathlib import Path

        mock_plugin_dir = MagicMock()
        mock_plugin_dir.is_dir.return_value = True

        with patch.object(Path, "iterdir", return_value=[mock_plugin_dir]):
            PluginStore.scan_stock_plugins()

        mock_delete_all_plugins.assert_called_once()
        mock_validate_plugin_directory.assert_called_once_with(mock_plugin_dir)
        mock_scan_plugin_directory.assert_called_once()


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


class TestReadAlgorithmDirectory:
    @pytest.fixture(scope="function")
    def mock_meta_path(self, mock_algo_dir):
        """Fixture to mock the meta.json path."""
        meta_path = mock_algo_dir.joinpath(f"{mock_algo_dir.name}.meta.json")
        meta_path.exists.return_value = True
        return meta_path

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.validate_python_script", autospec=True)
    def test_read_algorithm_directory_success(
        self, mock_validate_python_script, mock_read_and_validate, mock_algo_dir, mock_meta_path
    ):
        """Test successfully reading an algorithm directory."""
        from aiverify_apigw.lib.schemas_utils import algorithm_schema
        from ..mocks.mock_plugin_meta import create_mock_algorithm_meta

        mock_meta = create_mock_algorithm_meta()
        gid = mock_meta.gid
        mock_read_and_validate.return_value = mock_meta.model_dump()
        mock_validate_python_script.return_value = True
        # mock_json_load.side_effect = [
        #     {"input": "schema"},
        #     {"output": "schema"},
        # ]

        with patch("builtins.open", mock_open(read_data="{}")) as mock_file:
            # print(f"result.mode_type == {mock_meta.modelType}")
            result = PluginStore.read_algorithm_directory(mock_algo_dir, gid=gid)

            # MockAlgorithmModel.assert_called_once()
            assert isinstance(result, AlgorithmModel)
            assert result.cid == mock_meta.cid
            assert result.gid == gid
            assert result.require_ground_truth == mock_meta.requireGroundTruth

            mock_read_and_validate.assert_called_once_with(mock_meta_path, algorithm_schema)
            mock_validate_python_script.assert_called_once()

    def test_read_algorithm_directory_missing_meta_and_pyproject(self, mock_algo_dir):
        """Test handling missing meta.json and pyproject.toml."""
        meta_path = mock_algo_dir.joinpath(f"{mock_algo_dir.name}.meta.json")
        pyproject_path = mock_algo_dir.joinpath("pyproject.toml")
        meta_path.exists.return_value = False
        pyproject_path.exists.return_value = False

        result = PluginStore.read_algorithm_directory(mock_algo_dir, gid="plugin1")
        assert result is None

    @patch("aiverify_apigw.lib.plugin_store.tomllib.load", autospec=True)
    def test_read_algorithm_directory_invalid_pyproject(self, mock_tomllib_load, mock_algo_dir, mock_pyproject_path):
        """Test handling invalid pyproject.toml."""
        mock_pyproject_path.exists.return_value = True
        mock_tomllib_load.return_value = {}

        result = PluginStore.read_algorithm_directory(mock_algo_dir, gid="plugin1")
        assert result is None

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    def test_read_algorithm_directory_invalid_meta(self, mock_read_and_validate, mock_algo_dir, mock_meta_path):
        """Test handling invalid meta.json."""
        mock_read_and_validate.return_value = None  # Simulate invalid meta.json

        result = PluginStore.read_algorithm_directory(mock_algo_dir, gid="plugin1")
        assert result is None

    @patch("builtins.open", mock_open(read_data="{}"))
    def test_read_algorithm_directory_missing_input_output_schema(self, mock_algo_dir):
        """Test missing input and output schemas."""
        input_schema_path = mock_algo_dir.joinpath("input.schema.json")
        output_schema_path = mock_algo_dir.joinpath("output.schema.json")
        input_schema_path.exists.return_value = False
        output_schema_path.exists.return_value = False

        result = PluginStore.read_algorithm_directory(mock_algo_dir, gid="plugin1")
        assert result is None

    @patch("aiverify_apigw.lib.plugin_store.validate_python_script", autospec=True)
    def test_read_algorithm_directory_invalid_script(self, mock_validate_python_script, mock_algo_dir):
        """Test handling invalid script."""
        mock_validate_python_script.return_value = False

        result = PluginStore.read_algorithm_directory(mock_algo_dir, gid="plugin1")
        assert result is None


class TestScanAlgorithmDirectory:

    @patch("aiverify_apigw.lib.plugin_store.PluginStore.read_algorithm_directory", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.fs_save_plugin", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.fs_save_plugin_algorithm", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.unzip_plugin", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.shutil.copytree", autospec=True)
    def test_scan_algorithm_directory_success(
        self,
        mock_copytree,
        mock_unzip_plugin,
        mock_fs_save_plugin_algorithm,
        mock_fs_save_plugin,
        mock_read_algorithm_directory,
        mock_algo_dir,
    ):
        """Test successfully scanning an algorithm directory."""
        from sqlalchemy.orm import Session
        from ..mocks.mock_data_plugin import _create_mock_plugin
        # db_session.expunge_all()

        # plugin = mock_plugins[0]
        # algo = plugin.algorithms[0]
        plugin = _create_mock_plugin(num_algo=1, num_widgets=0, num_input_blocks=0, num_templates=0)
        algo = plugin.algorithms[0]

        # Mock the read_algorithm_directory to return a valid algorithm model
        mock_read_algorithm_directory.return_value = algo

        # Mock the session and query results
        with patch("aiverify_apigw.lib.plugin_store.SessionLocal", autospec=True) as mock_session:
            session_instance = MagicMock(spec=Session)
            session_instance.scalar.return_value = plugin
            mock_session.return_value.__enter__.return_value = session_instance

            # Mock fs_save_plugin and fs_save_plugin_algorithm return values
            mock_fs_save_plugin.return_value = "mock_zip_hash"
            mock_fs_save_plugin_algorithm.return_value = "mock_algo_zip_hash"

            # Call the method
            result = PluginStore.scan_algorithm_directory(mock_algo_dir)

            # Assertions
            assert result == plugin
            mock_read_algorithm_directory.assert_called_once_with(mock_algo_dir)
            mock_fs_save_plugin.assert_called_once()
            mock_fs_save_plugin_algorithm.assert_called_once()
            mock_copytree.assert_called_once()
            mock_unzip_plugin.assert_called_once()
            session_instance.commit.assert_called_once()

    @patch("aiverify_apigw.lib.plugin_store.PluginStore.read_algorithm_directory", autospec=True)
    def test_scan_algorithm_directory_invalid_algorithm(self, mock_read_algorithm_directory, mock_algo_dir):
        """Test scanning an invalid algorithm directory."""
        # Mock the read_algorithm_directory to return None
        mock_read_algorithm_directory.return_value = None

        # Expect a PluginStoreException
        with pytest.raises(Exception, match="Invalid plugin zip file."):
            PluginStore.scan_algorithm_directory(mock_algo_dir)

        mock_read_algorithm_directory.assert_called_once_with(mock_algo_dir)


class TestPluginStoreScanPluginDirectory:
    """Test cases for PluginStore.scan_plugin_directory method."""

    @pytest.fixture
    def mock_plugin_path(self):
        from ..mocks.mock_plugin_path import create_mock_plugin_path

        folder = create_mock_plugin_path()
        return folder

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate")
    @patch("aiverify_apigw.lib.plugin_store.fs_save_plugin", return_value="fake_hash")
    def test_scan_plugin_directory_valid(self, mock_save_plugin, mock_read_and_validate, mock_plugin_path):
        """Test scanning a valid plugin directory, should read and validate successfully."""
        # TODO: add tests for algo scans
        from typing import Any
        import json
        import tempfile

        mock_algo = mock_plugin_path.mock_data.algorithms[0]

        def read_and_validate_side_effect(path: Path, schema: Any):
            match path.name:
                case "plugin.meta.json":
                    return json.loads(mock_plugin_path.mock_data.meta.decode("utf-8"))
                case "input.schema.json":
                    return json.loads(mock_algo.input_schema.decode("utf-8"))
                case "output.schema.json":
                    return json.loads(mock_algo.output_schema.decode("utf-8"))
                case _:
                    return None

        mock_read_and_validate.side_effect = read_and_validate_side_effect
        with tempfile.TemporaryDirectory() as tmpdirname:
            PluginStore.scan_plugin_directory(mock_plugin_path, Path(tmpdirname))
        mock_save_plugin.assert_called_once_with(mock_plugin_path.mock_data.gid, mock_plugin_path)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate")
    def test_scan_plugin_directory_invalid(self, mock_read_and_validate):
        """Test scanning a plugin directory with invalid metadata, should do nothing."""
        import tempfile
        mock_read_and_validate.return_value = None
        mock_folder = Path("invalid_plugin_folder")
        with tempfile.TemporaryDirectory() as tmpdirname:
            result = PluginStore.scan_plugin_directory(mock_folder, Path(tmpdirname))
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
                case "plugin.meta.json":
                    return json.loads(mock_plugin_path.mock_data.meta.decode("utf-8"))
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


class TestValidateMdx:
    @pytest.fixture
    def mock_mdx_script(self):
        """Fixture to mock the MDX script path."""
        mock_path = MagicMock(spec=Path)
        mock_path.name = "test_script.mdx"
        mock_path.resolve.return_value = Path("/mock/path/test_script.mdx")
        return mock_path

    @pytest.fixture
    def mock_output_file(self):
        """Fixture to mock the output file path."""
        mock_path = MagicMock(spec=Path)
        mock_path.as_posix.return_value = "/mock/path/output.json"
        return mock_path

    @patch("aiverify_apigw.lib.plugin_store.subprocess.run", autospec=True)
    def test_validate_mdx_success(self, mock_subprocess_run, mock_mdx_script, mock_output_file):
        """Test successful validation of an MDX script."""
        # Mock subprocess.run to simulate a successful process
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_subprocess_run.return_value = mock_proc

        result = PluginStore.validate_mdx(mock_mdx_script, output_file=mock_output_file)

        # Assertions
        assert result is True
        mock_subprocess_run.assert_called_once_with(
            [
                PluginStore.npx,
                "tsx",
                PluginStore.validate_script_path,
                mock_mdx_script.resolve().as_posix(),
                mock_output_file.as_posix(),
            ],
            capture_output=True,
            cwd=PluginStore.node_folder,
        )

    @patch("aiverify_apigw.lib.plugin_store.subprocess.run", autospec=True)
    def test_validate_mdx_invalid_script(self, mock_subprocess_run, mock_mdx_script):
        """Test handling of an invalid MDX script."""
        # Mock subprocess.run to simulate a failed process
        mock_proc = MagicMock()
        mock_proc.returncode = -1
        mock_proc.stderr = b"Invalid MDX script"
        mock_subprocess_run.return_value = mock_proc

        result = PluginStore.validate_mdx(mock_mdx_script)

        # Assertions
        assert result is False
        mock_subprocess_run.assert_called_once_with(
            [
                PluginStore.npx,
                "tsx",
                PluginStore.validate_script_path,
                mock_mdx_script.resolve().as_posix(),
            ],
            capture_output=True,
            cwd=PluginStore.node_folder,
        )

    @patch("aiverify_apigw.lib.plugin_store.subprocess.run", side_effect=Exception("Subprocess error"), autospec=True)
    def test_validate_mdx_exception(self, mock_subprocess_run, mock_mdx_script):
        """Test handling of exceptions during validation."""
        result = PluginStore.validate_mdx(mock_mdx_script)

        # Assertions
        assert result is False
        mock_subprocess_run.assert_called_once_with(
            [
                PluginStore.npx,
                "tsx",
                PluginStore.validate_script_path,
                mock_mdx_script.resolve().as_posix(),
            ],
            capture_output=True,
            cwd=PluginStore.node_folder,
        )


class TestValidateWidget:
    @pytest.fixture
    def mock_widget_path(self):
        """Fixture to mock the widget path."""
        widget_path = MagicMock(spec=Path)
        widget_path.joinpath.return_value.exists.return_value = True
        return widget_path

    @pytest.fixture
    def mock_meta_path(self):
        """Fixture to mock the meta path."""
        meta_path = MagicMock(spec=Path)
        meta_path.name = "widget.meta.json"
        return meta_path

    @pytest.fixture
    def mock_folder(self):
        """Fixture to mock the optional folder path."""
        folder = MagicMock(spec=Path)
        folder.joinpath.return_value = MagicMock(spec=Path)
        return folder

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.WidgetMeta.model_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_mdx", autospec=True)
    def test_validate_widget_success(
        self, mock_validate_mdx, mock_model_validate, mock_read_and_validate, mock_widget_path, mock_meta_path, mock_folder
    ):
        """Test successful widget validation."""
        # Mock the behavior of read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_widget"}
        mock_meta = MagicMock(spec=WidgetMeta)
        mock_meta.cid = "test_widget"
        mock_model_validate.return_value = mock_meta

        # Mock validate_mdx to return True
        mock_validate_mdx.return_value = True

        # Call the method
        result = PluginStore.validate_widget(mock_widget_path, mock_meta_path, mock_folder)

        # Assertions
        assert result[0] == mock_meta
        assert result[1] == {"cid": "test_widget"}
        mock_read_and_validate.assert_called_once_with(mock_meta_path, widget_schema)
        mock_model_validate.assert_called_once_with({"cid": "test_widget"})
        mock_validate_mdx.assert_called_once()

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    def test_validate_widget_invalid_meta(self, mock_read_and_validate, mock_widget_path, mock_meta_path, mock_folder):
        """Test handling invalid meta.json."""
        # Mock read_and_validate to return None
        mock_read_and_validate.return_value = None

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="widget.meta.json is invalid"):
            PluginStore.validate_widget(mock_widget_path, mock_meta_path, mock_folder)

        mock_read_and_validate.assert_called_once_with(mock_meta_path, widget_schema)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.WidgetMeta.model_validate", autospec=True)
    def test_validate_widget_missing_mdx(self, mock_model_validate, mock_read_and_validate, mock_widget_path, mock_meta_path, mock_folder):
        """Test handling missing MDX file."""
        # Mock the behavior of read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_widget"}
        mock_meta = MagicMock(spec=WidgetMeta)
        mock_meta.cid = "test_widget"
        mock_model_validate.return_value = mock_meta

        # Mock the widget_path to simulate missing MDX file
        mock_widget_path.joinpath.return_value.exists.return_value = False

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="widget test_widget is missing MDX file"):
            PluginStore.validate_widget(mock_widget_path, mock_meta_path, mock_folder)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.WidgetMeta.model_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_mdx", autospec=True)
    def test_validate_widget_invalid_mdx(
        self, mock_validate_mdx, mock_model_validate, mock_read_and_validate, mock_widget_path, mock_meta_path, mock_folder
    ):
        """Test handling invalid MDX validation."""
        # Mock the behavior of read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_widget"}
        mock_meta = MagicMock(spec=WidgetMeta)
        mock_meta.cid = "test_widget"
        mock_model_validate.return_value = mock_meta

        # Mock validate_mdx to return False
        mock_validate_mdx.return_value = False

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="Invalid widget"):
            PluginStore.validate_widget(mock_widget_path, mock_meta_path, mock_folder)

        mock_read_and_validate.assert_called_once_with(mock_meta_path, widget_schema)
        mock_model_validate.assert_called_once_with({"cid": "test_widget"})
        mock_validate_mdx.assert_called_once()


class TestValidateInputBlock:
    @pytest.fixture
    def mock_input_block_path(self):
        """Fixture to mock the input block path."""
        input_block_path = MagicMock(spec=Path)
        input_block_path.joinpath.return_value.exists.return_value = True
        return input_block_path

    @pytest.fixture
    def mock_meta_path(self):
        """Fixture to mock the meta path."""
        meta_path = MagicMock(spec=Path)
        meta_path.name = "input_block.meta.json"
        return meta_path

    @pytest.fixture
    def mock_folder(self):
        """Fixture to mock the optional folder path."""
        folder = MagicMock(spec=Path)
        folder.joinpath.return_value = MagicMock(spec=Path)
        return folder

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.InputBlockMeta.model_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_mdx", autospec=True)
    def test_validate_input_block_success(
        self, mock_validate_mdx, mock_model_validate, mock_read_and_validate, mock_input_block_path, mock_meta_path, mock_folder
    ):
        """Test successful input block validation."""
        # Mock read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_input_block"}
        mock_meta = MagicMock(spec=InputBlockMeta)
        mock_meta.cid = "test_input_block"
        mock_model_validate.return_value = mock_meta

        # Mock validate_mdx to return True
        mock_validate_mdx.return_value = True

        # Call the method
        result = PluginStore.validate_input_block(mock_input_block_path, mock_meta_path, mock_folder)

        # Assertions
        assert result[0] == mock_meta
        assert result[1] == {"cid": "test_input_block"}
        mock_read_and_validate.assert_called_once_with(mock_meta_path, input_block_schema)
        mock_model_validate.assert_called_once_with({"cid": "test_input_block"})
        assert mock_validate_mdx.call_count == 2

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    def test_validate_input_block_invalid_meta(self, mock_read_and_validate, mock_input_block_path, mock_meta_path):
        """Test handling invalid meta.json."""
        # Mock read_and_validate to return None
        mock_read_and_validate.return_value = None

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="input_block.meta.json is invalid"):
            PluginStore.validate_input_block(mock_input_block_path, mock_meta_path)

        mock_read_and_validate.assert_called_once_with(mock_meta_path, input_block_schema)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.InputBlockMeta.model_validate", autospec=True)
    def test_validate_input_block_missing_mdx(self, mock_model_validate, mock_read_and_validate, mock_input_block_path, mock_meta_path):
        """Test handling missing MDX file."""
        # Mock read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_input_block"}
        mock_meta = MagicMock(spec=InputBlockMeta)
        mock_meta.cid = "test_input_block"
        mock_model_validate.return_value = mock_meta

        # Mock the input_block_path to simulate missing MDX file
        mock_input_block_path.joinpath.return_value.exists.return_value = False

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="Input Block test_input_block is missing MDX file"):
            PluginStore.validate_input_block(mock_input_block_path, mock_meta_path)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.InputBlockMeta.model_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_mdx", autospec=True)
    def test_validate_input_block_invalid_mdx(
        self, mock_validate_mdx, mock_model_validate, mock_read_and_validate, mock_input_block_path, mock_meta_path, mock_folder
    ):
        """Test handling invalid MDX validation."""
        # Mock read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_input_block"}
        mock_meta = MagicMock(spec=InputBlockMeta)
        mock_meta.cid = "test_input_block"
        mock_model_validate.return_value = mock_meta

        # Mock validate_mdx to return False
        mock_validate_mdx.side_effect = [False, True]

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="Invalid input block"):
            PluginStore.validate_input_block(mock_input_block_path, mock_meta_path, mock_folder)

        mock_read_and_validate.assert_called_once_with(mock_meta_path, input_block_schema)
        mock_model_validate.assert_called_once_with({"cid": "test_input_block"})
        mock_validate_mdx.assert_called_once()

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.InputBlockMeta.model_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_mdx", autospec=True)
    def test_validate_input_block_missing_summary(self, mock_validate_mdx, mock_model_validate, mock_read_and_validate, mock_input_block_path, mock_meta_path):
        """Test handling missing summary MDX file."""
        # Mock read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_input_block"}
        mock_meta = MagicMock(spec=InputBlockMeta)
        mock_meta.cid = "test_input_block"
        mock_model_validate.return_value = mock_meta

        # Mock validate_mdx to return True
        mock_validate_mdx.return_value = True

        # Mock the input_block_path to simulate missing summary MDX file
        mock_input_block_path.joinpath.return_value.exists.side_effect = [True, False]

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="Input Block test_input_block is missing summary file"):
            PluginStore.validate_input_block(mock_input_block_path, mock_meta_path)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.InputBlockMeta.model_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.PluginStore.validate_mdx", autospec=True)
    def test_validate_input_block_invalid_summary_mdx(
        self, mock_validate_mdx, mock_model_validate, mock_read_and_validate, mock_input_block_path, mock_meta_path, mock_folder
    ):
        """Test handling invalid summary MDX validation."""
        # Mock read_and_validate and model_validate
        mock_read_and_validate.return_value = {"cid": "test_input_block"}
        mock_meta = MagicMock(spec=InputBlockMeta)
        mock_meta.cid = "test_input_block"
        mock_model_validate.return_value = mock_meta

        # Mock validate_mdx to return False for summary validation
        mock_validate_mdx.side_effect = [True, False]

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="Invalid input block summary"):
            PluginStore.validate_input_block(mock_input_block_path, mock_meta_path, mock_folder)

        mock_read_and_validate.assert_called_once_with(mock_meta_path, input_block_schema)
        mock_model_validate.assert_called_once_with({"cid": "test_input_block"})
        assert mock_validate_mdx.call_count == 2


class TestValidateTemplate:
    @pytest.fixture
    def mock_template_path(self):
        """Fixture to mock the template path."""
        template_path = MagicMock(spec=Path)
        template_path.joinpath.return_value.exists.return_value = True
        return template_path

    @pytest.fixture
    def mock_meta_path(self):
        """Fixture to mock the meta path."""
        meta_path = MagicMock(spec=Path)
        meta_path.name = "template.meta.json"
        return meta_path

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.TemplateMeta.model_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.ProjectTemplateMeta.model_validate", autospec=True)
    def test_validate_template_success(
        self, mock_project_template_validate, mock_template_validate, mock_read_and_validate, mock_template_path, mock_meta_path
    ):
        """Test successful template validation."""
        # Mock read_and_validate for meta and data
        mock_read_and_validate.side_effect = [
            {"cid": "test_template"},  # Meta JSON
            {"key": "value"},          # Data JSON
        ]

        # Mock TemplateMeta and ProjectTemplateMeta validation
        mock_meta = MagicMock(spec=TemplateMeta)
        mock_meta.cid = "test_template"
        mock_template_validate.return_value = mock_meta

        mock_project_meta = MagicMock(spec=ProjectTemplateMeta)
        mock_project_template_validate.return_value = mock_project_meta

        # Call the method
        result = PluginStore.validate_template(mock_template_path, mock_meta_path)

        # Assertions
        assert result[0] == mock_meta
        assert result[1] == {"cid": "test_template"}
        assert result[2] == mock_project_meta
        assert result[3] == {"key": "value"}

        # Verify method calls
        mock_read_and_validate.assert_any_call(mock_meta_path, template_schema)
        mock_read_and_validate.assert_any_call(mock_template_path.joinpath(
            f"{mock_meta.cid}.data.json"), template_data_schema)
        mock_template_validate.assert_called_once_with({"cid": "test_template"})
        mock_project_template_validate.assert_called_once_with({"key": "value"})

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    def test_validate_template_invalid_meta(self, mock_read_and_validate, mock_template_path, mock_meta_path):
        """Test handling invalid meta.json."""
        # Mock read_and_validate to return None for meta
        mock_read_and_validate.return_value = None

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="template.meta.json is invalid"):
            PluginStore.validate_template(mock_template_path, mock_meta_path)

        mock_read_and_validate.assert_called_once_with(mock_meta_path, template_schema)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.TemplateMeta.model_validate", autospec=True)
    def test_validate_template_missing_data_file(self, mock_template_validate, mock_read_and_validate, mock_template_path, mock_meta_path):
        """Test handling missing data file."""
        # Mock read_and_validate for meta and data
        mock_read_and_validate.side_effect = [
            {"cid": "test_template"},  # Meta JSON
            {"key": "value"},          # Data JSON
        ]

        # Mock TemplateMeta and ProjectTemplateMeta validation
        mock_meta = MagicMock(spec=TemplateMeta)
        mock_meta.cid = "test_template"
        mock_template_validate.return_value = mock_meta

        # Mock the template_path to simulate a missing data file
        mock_template_path.joinpath.return_value.exists.return_value = False

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match="Template test_template is missing data file"):
            PluginStore.validate_template(mock_template_path, mock_meta_path)

    @patch("aiverify_apigw.lib.plugin_store.read_and_validate", autospec=True)
    @patch("aiverify_apigw.lib.plugin_store.TemplateMeta.model_validate", autospec=True)
    def test_validate_template_invalid_data(
        self, mock_template_validate, mock_read_and_validate, mock_template_path, mock_meta_path
    ):
        """Test handling invalid data.json content."""
        # Mock read_and_validate for meta and data
        mock_read_and_validate.side_effect = [
            {"cid": "test_template"},  # Meta JSON
            None,                      # Invalid Data JSON
        ]

        # Mock TemplateMeta and ProjectTemplateMeta validation
        mock_meta = MagicMock(spec=TemplateMeta)
        mock_meta.cid = "test_template"
        mock_template_validate.return_value = mock_meta
        mock_template_path.joinpath.return_value.exists.return_value = False
        mock_template_path.joinpath.return_value.name = f"{mock_meta.cid}.data.json"

        # Expect a PluginStoreException
        with pytest.raises(PluginStoreException, match=f"Template {mock_meta.cid} is missing data file"):
            PluginStore.validate_template(mock_template_path, mock_meta_path)
