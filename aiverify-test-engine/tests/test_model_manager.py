import logging

import pytest
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.model_manager import ModelManager


class RandomModel:
    _model = None
    _plugin_type = ModelPluginType.XGBOOST

    def __init__(self):
        pass

    def Plugin(self, model=None):
        if model is not None:
            self._model = model
        return self

    def is_supported(self):
        return False

    def get_plugin_type(self):
        return PluginType.MODEL

    def get_model_plugin_type(self):
        return self._plugin_type


class Model:
    _model = None
    _plugin_type = ModelPluginType.XGBOOST

    def __init__(self):
        pass

    def Plugin(self, model=None):
        if model is not None:
            self._model = model
        return self

    def is_supported(self):
        return isinstance(self._model, str)

    def get_plugin_type(self):
        return PluginType.MODEL

    def get_model_plugin_type(self):
        return self._plugin_type

    def get_model_algorithm(self):
        return "model_algorithm"


class Serializer:
    _to_deserialize = None
    _to_error = None
    Plugin = None

    def __init__(self, to_deserialize, to_error):
        self._to_deserialize = to_deserialize
        self._to_error = to_error
        self.Plugin = self

    def deserialize_data(self, data_file):
        if self._to_error:
            raise RuntimeError("Error")

        if self._to_deserialize:
            return "123"
        else:
            return None


class TestCollectionModelManager:
    pytest.model_instance = Model()
    pytest.serializer = Serializer(True, False)
    pytest.error_serializer = Serializer(False, True)
    pytest.no_serializer = Serializer(False, False)
    pytest.random_model = RandomModel()
    pytest.my_logger = logging.getLogger("example_logger")

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        ModelManager._logger = None

        # Perform tests
        yield

        # Reset
        ModelManager._logger = None

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
        assert ModelManager._logger is None
        ModelManager.set_logger(logger)
        assert ModelManager._logger == expected_response

    @pytest.mark.parametrize(
        "model_file, model_plugins, serializer_plugins, expected_output",
        [
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (True, pytest.model_instance, pytest.serializer, ""),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.no_serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing the model: tests/model/test_model.sav",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.error_serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing the model: tests/model/test_model.sav",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.random_model,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting model format (unsupported): <class 'str'>",
                ),
            ),
            # Tests model file
            (
                None,
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: None, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "None",
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    True,
                    pytest.model_instance,
                    pytest.serializer,
                    "",
                ),
            ),
            (
                123,
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: 123, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                [],
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: [], {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                {},
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: {}, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test model plugins
            (
                "tests/model/test_model.sav",
                {},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting model format (unsupported): <class 'str'>",
                ),
            ),
            (
                "tests/model/test_model.sav",
                [],
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, [], {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/model/test_model.sav",
                None,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/model/test_model.sav",
                "None",
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/model/test_model.sav",
                123,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, 123, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test model serializers
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                {},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing the model: tests/model/test_model.sav",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                [],
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, []",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                123,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, 123",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                None,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, None",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                "None",
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, None",
                ),
            ),
        ],
    )
    def test_read_model_file_no_logger(
        self, model_file, model_plugins, serializer_plugins, expected_output
    ):
        """
        Tests reading model file with no logger
        """
        response = ModelManager.read_model_file(
            model_file, model_plugins, serializer_plugins
        )
        assert response == expected_output

    @pytest.mark.parametrize(
        "model_file, model_plugins, serializer_plugins, expected_output",
        [
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (True, pytest.model_instance, pytest.serializer, ""),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.no_serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing the model: tests/model/test_model.sav",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.random_model,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting model format (unsupported): <class 'str'>",
                ),
            ),
            # Tests model file
            (
                None,
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: None, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "None",
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    True,
                    pytest.model_instance,
                    pytest.serializer,
                    "",
                ),
            ),
            (
                123,
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: 123, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                [],
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: [], {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                {},
                {
                    "model": pytest.model_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: {}, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test model plugins
            (
                "tests/model/test_model.sav",
                {},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting model format (unsupported): <class 'str'>",
                ),
            ),
            (
                "tests/model/test_model.sav",
                [],
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, [], {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/model/test_model.sav",
                None,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/model/test_model.sav",
                "None",
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/model/test_model.sav",
                123,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/model/test_model.sav, 123, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test model serializers
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                {},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing the model: tests/model/test_model.sav",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                [],
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, []",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                123,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, 123",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                None,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, None",
                ),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "model": pytest.model_instance,
                },
                "None",
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/model/test_model.sav, {'model': "
                    + f"{pytest.model_instance}"
                    + "}, None",
                ),
            ),
        ],
    )
    def test_read_model_file(
        self, model_file, model_plugins, serializer_plugins, expected_output
    ):
        """
        Tests reading model file with logger
        """
        ModelManager.set_logger(pytest.my_logger)
        response = ModelManager.read_model_file(
            model_file, model_plugins, serializer_plugins
        )
        assert response == expected_output
