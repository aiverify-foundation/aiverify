import logging
from pathlib import Path

import pytest
from aiverify_test_engine.plugins.algorithm_manager import AlgorithmManager
from aiverify_test_engine.plugins.data_manager import DataManager
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.model_mode_type import ModelModeType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.model_manager import ModelManager
from aiverify_test_engine.plugins.pipeline_manager import PipelineManager
from aiverify_test_engine.plugins.plugins_manager import PluginManager


class RandomData:
    _data = None
    _plugin_type = DataPluginType.DELIMITER

    def __init__(self):
        pass

    def Plugin(self, data=None):
        if data is not None:
            self._data = data
        return self

    def is_supported(self):
        return False

    def get_plugin_type(self):
        return PluginType.DATA

    def get_data_plugin_type(self):
        return self._plugin_type

    def convert_to_dict(self):
        return {"data_path": "tests/data/test_colon.csv", "delimiter_type": ","}


class Serializer:
    _to_deserialize = None
    Plugin = None

    def __init__(self, to_deserialize):
        self._to_deserialize = to_deserialize
        self.Plugin = self

    def deserialize_data(self, data_file):
        if self._to_deserialize:
            return "123"
        else:
            raise RuntimeError("Error")


class TestCollectionPluginsManager:
    pytest.random_data = RandomData()
    pytest.serializer = Serializer(True)
    pytest.my_logger = logging.getLogger("example_logger")

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        PluginManager._logger = None
        PluginManager._plugins = {
            plugin_type.name: dict() for plugin_type in PluginType
        }

        # Perform tests
        yield

        # Reset
        PluginManager._logger = None
        PluginManager._plugins = {
            plugin_type.name: dict() for plugin_type in PluginType
        }

    @pytest.mark.parametrize(
        "logger, expected_response",
        [
            (pytest.my_logger, pytest.my_logger),
            (None, None),
            ("None", None),
            (123, None),
            ([], None),
            ({}, None),
        ],
    )
    def test_set_logger(self, logger, expected_response):
        """
        Tests set logger
        """
        assert PluginManager._logger is None
        PluginManager.set_logger(logger)
        assert PluginManager._logger == expected_response

    @pytest.mark.parametrize(
        "discover_folder, plugin_type, module_name, tag_name, expected_result",
        [
            ("tests/data/folderofcsv", None, None, None, False),
            ("tests/data/folderofimage", None, None, None, False),
            ("tests/data/folderofsav", None, None, None, False),
            ("tests/data/mixedfolder", None, None, None, False),
            ("tests/importmodules/", "SERIALIZER", "example_serializer", None, True),
            (
                "tests/importmodules/",
                "SERIALIZER",
                "example_serializer",
                "delimiter",
                True,
            ),
            ("", None, None, None, False),
            (None, None, None, None, False),
            ("None", None, None, None, False),
            ([], None, None, None, False),
            ({}, None, None, None, False),
        ],
    )
    def test_import_python_modules(
        self, discover_folder, plugin_type, module_name, tag_name, expected_result
    ):
        """
        Tests that it can import the python modules
        """
        PluginManager.discover(discover_folder, tag_name)
        if expected_result:
            if tag_name:
                assert PluginManager._plugins[plugin_type][tag_name]
            else:
                assert PluginManager._plugins[plugin_type][module_name]

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.DATA,
                {"filename": "tests/other_import_modules/example_data.py"},
                (pytest.random_data, pytest.serializer, ""),
            ),
            (
                None,
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_data_with_valid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            DataManager,
            "read_data",
            return_value=(True, pytest.random_data, pytest.serializer, ""),
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.DATA,
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error loading dataset(file): "
                    "tests/other_import_modules/example_data.py (MockResponse)",
                ),
            ),
        ],
    )
    def test_get_instance_data_with_invalid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            DataManager,
            "read_data",
            return_value=(False, None, None, "MockResponse"),
        )
        with pytest.raises(RuntimeError) as exc_info:
            PluginManager.discover("tests/other_import_modules/")
            PluginManager.get_instance(plugin_type, **kwargs)
        assert str(exc_info.value) == expected_result[2]

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                None,
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {"filename": "tests/other_import_modules/example_data.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_data_with_invalid_response_1(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            DataManager, "read_data", return_value=(False, None, None, "MockResponse")
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.MODEL,
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (pytest.random_data, pytest.serializer, ""),
            ),
            (
                None,
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_model_with_valid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            ModelManager,
            "read_model_file",
            return_value=(True, pytest.random_data, pytest.serializer, ""),
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.MODEL,
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error loading model(file): "
                    "tests/other_import_modules/example_model.py (MockResponse)",
                ),
            ),
            (
                PluginType.MODEL,
                {
                    "mode": ModelModeType.API,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error loading model(api): {} | {} (There was an error getting model format with api schema (unsupported))",  # noqa: E501
                ),
            ),
        ],
    )
    def test_get_instance_model_with_invalid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            ModelManager,
            "read_model_file",
            return_value=(False, None, None, "MockResponse"),
        )
        with pytest.raises(RuntimeError) as exc_info:
            PluginManager.discover("tests/other_import_modules/")
            PluginManager.get_instance(plugin_type, **kwargs)
        assert str(exc_info.value) == expected_result[2]

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                None,
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {
                    "mode": ModelModeType.UPLOAD,
                    "filename": "tests/other_import_modules/example_model.py",
                },
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_model_with_invalid_response_1(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            ModelManager,
            "read_model_file",
            return_value=(False, None, None, "MockResponse"),
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.PIPELINE,
                {"pipeline_path": "tests/other_import_modules/example_pipeline.py"},
                (pytest.random_data, pytest.serializer, ""),
            ),
            (
                None,
                {"pipeline_path": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {"pipeline_path": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {"pipeline_path": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {"pipeline_path": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {"pipeline_path": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_pipeline_with_valid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            PipelineManager,
            "read_pipeline_path",
            return_value=(True, pytest.random_data, pytest.serializer, ""),
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.PIPELINE,
                {"pipeline_path": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error loading pipeline(file): "
                    "tests/other_import_modules/example_pipeline.py (MockResponse)",
                ),
            ),
        ],
    )
    def test_get_instance_pipeline_with_invalid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            PipelineManager,
            "read_pipeline_path",
            return_value=(False, None, None, "MockResponse"),
        )
        with pytest.raises(RuntimeError) as exc_info:
            PluginManager.discover("tests/other_import_modules/")
            PluginManager.get_instance(plugin_type, **kwargs)
        assert str(exc_info.value) == expected_result[2]

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                None,
                {"filename": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {"filename": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {"filename": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {"filename": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {"filename": "tests/other_import_modules/example_pipeline.py"},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_pipeline_with_invalid_response_1(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            PipelineManager,
            "read_pipeline_path",
            return_value=(False, None, None, "MockResponse"),
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.ALGORITHM,
                {},
                (pytest.random_data, None, ""),
            ),
            (
                None,
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_algorithm_with_valid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            AlgorithmManager,
            "get_algorithm",
            return_value=(True, pytest.random_data, ""),
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                PluginType.ALGORITHM,
                {},
                (
                    None,
                    None,
                    "There was an error loading algorithm: MockResponse",
                ),
            ),
        ],
    )
    def test_get_instance_algorithm_with_invalid_response(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            AlgorithmManager,
            "get_algorithm",
            return_value=(False, None, "MockResponse"),
        )
        with pytest.raises(RuntimeError) as exc_info:
            PluginManager.discover("tests/other_import_modules/")
            PluginManager.get_instance(plugin_type, **kwargs)
        assert str(exc_info.value) == expected_result[2]

    @pytest.mark.parametrize(
        "plugin_type, kwargs, expected_result",
        [
            (
                None,
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                "None",
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: None",
                ),
            ),
            (
                [],
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: []",
                ),
            ),
            (
                {},
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: {}",
                ),
            ),
            (
                123,
                {},
                (
                    None,
                    None,
                    "There was an error getting instance due to an invalid plugin type: 123",
                ),
            ),
        ],
    )
    def test_get_instance_algorithm_with_invalid_response_1(
        self, mocker, plugin_type, kwargs, expected_result
    ):
        mocker.patch.object(
            AlgorithmManager,
            "get_algorithm",
            return_value=(False, None, None, "MockResponse"),
        )
        PluginManager.discover("tests/other_import_modules/")

        output = PluginManager.get_instance(plugin_type, **kwargs)
        assert output == expected_result

    def test_get_printable_plugins_with_no_plugins(self):
        """
        Tests that it can print plugins information when there are no plugins
        """
        assert (
            PluginManager.get_printable_plugins()
            == "{'DATA': {}, 'MODEL': {}, 'SERIALIZER': {}, 'ALGORITHM': {}, 'PIPELINE': {}}"
        )

    def test_get_printable_plugins(self):
        """
        Tests that it can print plugins information
        """
        data_path = str(Path.cwd() / "tests/other_import_modules/example_data.py")
        model_path = str(Path.cwd() / "tests/other_import_modules/example_model.py")
        serializer_path = str(Path.cwd() / "tests/importmodules/example_serializer.py")
        algorithm_path = str(Path.cwd() / "tests/other_import_modules/example_algo.py")
        pipeline_path = str(
            Path.cwd() / "tests/other_import_modules/example_pipeline.py"
        )

        PluginManager.discover("tests/importmodules/")
        PluginManager.discover("tests/other_import_modules/")
        PluginManager.discover("tests/pipeline/")
        assert (
            PluginManager.get_printable_plugins()
            == "{'DATA': {'example_data': <module 'example_data' from '"
            + data_path
            + "'>}, 'MODEL': {'example_model': <module 'example_model' from '"
            + model_path
            + "'>}, 'SERIALIZER': {'example_serializer': <module 'example_serializer' from '"
            + serializer_path
            + "'>}, 'ALGORITHM': {'example_algo': <module 'example_algo' from '"
            + algorithm_path
            + "'>}, 'PIPELINE': {'example_pipeline': <module 'example_pipeline' from '"
            + pipeline_path
            + "'>}}"
        )

    def test_is_plugin_exists(self):
        """
        Tests that it can get whether the plugin exists
        """
        assert (
            PluginManager.is_plugin_exists(PluginType.SERIALIZER, "example_serializer")
            is False
        )
        PluginManager.discover("tests/importmodules/")
        PluginManager.discover("tests/other_import_modules/")
        PluginManager.discover("tests/pipeline/")
        assert (
            PluginManager.is_plugin_exists(PluginType.SERIALIZER, "example_serializer")
            is True
        )
        assert PluginManager.is_plugin_exists(PluginType.MODEL, "example_model") is True
        assert PluginManager.is_plugin_exists(PluginType.DATA, "example_data") is True
        assert (
            PluginManager.is_plugin_exists(PluginType.ALGORITHM, "example_algo") is True
        )

    def test_remove_plugin_with_no_plugins(self):
        """
        Tests that it can remove plugin when there are no plugins available
        """
        assert (
            PluginManager.is_plugin_exists(PluginType.SERIALIZER, "example_serializer")
            is False
        )
        PluginManager.remove_plugin(PluginType.SERIALIZER, "example_serializer")
        assert (
            PluginManager.is_plugin_exists(PluginType.SERIALIZER, "example_serializer")
            is False
        )

    def test_remove_plugin(self):
        """
        Tests that it can remove plugin
        """
        PluginManager.discover("tests/importmodules/")
        PluginManager.discover("tests/other_import_modules/")
        assert (
            PluginManager.is_plugin_exists(PluginType.SERIALIZER, "example_serializer")
            is True
        )
        PluginManager.remove_plugin(PluginType.SERIALIZER, "example_serializer")
        assert (
            PluginManager.is_plugin_exists(PluginType.SERIALIZER, "example_serializer")
            is False
        )

    def test_remove_plugin_wrong_plugin_type(self):
        """
        Tests that it can remove plugin when it is wrong plugin type
        """
        PluginManager.discover("tests/importmodules/")
        PluginManager.discover("tests/other_import_modules/")
        PluginManager.is_plugin_exists(PluginType.MODEL, "example_serializer")
        assert PluginManager.is_plugin_exists(PluginType.MODEL, "example_model") is True
