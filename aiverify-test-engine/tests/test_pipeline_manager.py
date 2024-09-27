import logging

import pytest
from aiverify_test_engine.plugins.enums.pipeline_plugin_type import PipelinePluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.pipeline_manager import PipelineManager


class RandomPipeline:
    _pipeline = None
    _plugin_type = PipelinePluginType.SKLEARN

    def __init__(self):
        pass

    def Plugin(self, pipeline=None):
        if pipeline is not None:
            self._pipeline = pipeline
        return self

    def is_supported(self):
        return False

    def get_plugin_type(self):
        return PluginType.PIPELINE

    def get_pipeline_plugin_type(self):
        return self._plugin_type


class Pipeline:
    _pipeline = None
    _plugin_type = PipelinePluginType.SKLEARN

    def __init__(self):
        pass

    def Plugin(self, pipeline=None):
        if pipeline is not None:
            self._pipeline = pipeline
        return self

    def is_supported(self):
        return isinstance(self._pipeline, str)

    def get_plugin_type(self):
        return PluginType.PIPELINE

    def get_pipeline_plugin_type(self):
        return self._plugin_type

    def get_pipeline_algorithm(self):
        return "pipeline_algorithm"


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


class TestCollectionPipelineManager:
    pytest.pipeline_instance = Pipeline()
    pytest.serializer = Serializer(True, False)
    pytest.error_serializer = Serializer(False, True)
    pytest.no_serializer = Serializer(False, False)
    pytest.random_pipeline = RandomPipeline()
    pytest.my_logger = logging.getLogger("example_logger")

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        PipelineManager._logger = None

        # Perform tests
        yield

        # Reset
        PipelineManager._logger = None

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
        assert PipelineManager._logger is None
        PipelineManager.set_logger(logger)
        assert PipelineManager._logger == expected_response

    @pytest.mark.parametrize(
        "pipeline_folder, pipeline_plugins, serializer_plugins, expected_output",
        [
            # Working set
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (True, pytest.pipeline_instance, pytest.serializer, ""),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error getting pipeline files in the folder",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.no_serializer},
                (
                    False,
                    None,
                    None,
                    (
                        "There was an error deserializing the pipeline: "
                        "tests/pipeline/sample_bc_credit_sklearn_linear.Pipeline.sav"
                    ),
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.random_pipeline,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting pipeline format (unsupported): <class 'str'>",
                ),
            ),
            # Tests pipeline file
            (
                None,
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: None, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "None",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error getting pipeline files in the folder",
                ),
            ),
            (
                123,
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: 123, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                [],
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: [], {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                {},
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: {}, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test pipeline plugins
            (
                "tests/pipeline",
                {},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting pipeline format (unsupported): <class 'str'>",
                ),
            ),
            (
                "tests/pipeline",
                [],
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, [], {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/pipeline",
                None,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/pipeline",
                "None",
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/pipeline",
                123,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, 123, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test pipeline serializers
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {},
                (
                    False,
                    None,
                    None,
                    (
                        "There was an error deserializing the pipeline: "
                        "tests/pipeline/sample_bc_credit_sklearn_linear.Pipeline.sav"
                    ),
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                [],
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, []",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                123,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, 123",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                None,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, None",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                "None",
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, None",
                ),
            ),
        ],
    )
    def test_read_pipeline_path_no_logger(
        self, pipeline_folder, pipeline_plugins, serializer_plugins, expected_output
    ):
        """
        Tests reading pipeline path with logger
        """
        response = PipelineManager.read_pipeline_path(
            pipeline_folder, pipeline_plugins, serializer_plugins
        )
        assert response == expected_output

    @pytest.mark.parametrize(
        "pipeline_folder, pipeline_plugins, serializer_plugins, expected_output",
        [
            # Working set
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (True, pytest.pipeline_instance, pytest.serializer, ""),
            ),
            (
                "tests/model/test_model.sav",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error getting pipeline files in the folder",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.no_serializer},
                (
                    False,
                    None,
                    None,
                    (
                        "There was an error deserializing the pipeline: "
                        "tests/pipeline/sample_bc_credit_sklearn_linear.Pipeline.sav"
                    ),
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.random_pipeline,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting pipeline format (unsupported): <class 'str'>",
                ),
            ),
            # Tests pipeline file
            (
                None,
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: None, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "None",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error getting pipeline files in the folder",
                ),
            ),
            (
                123,
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: 123, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                [],
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: [], {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                {},
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: {}, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test pipeline plugins
            (
                "tests/pipeline",
                {},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting pipeline format (unsupported): <class 'str'>",
                ),
            ),
            (
                "tests/pipeline",
                [],
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, [], {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/pipeline",
                None,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/pipeline",
                "None",
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, None, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            (
                "tests/pipeline",
                123,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, 123, {'serializer1': "
                    + f"{pytest.serializer}"
                    + "}",
                ),
            ),
            # Test pipeline serializers
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                {},
                (
                    False,
                    None,
                    None,
                    (
                        "There was an error deserializing the pipeline: "
                        "tests/pipeline/sample_bc_credit_sklearn_linear.Pipeline.sav"
                    ),
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                [],
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, []",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                123,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, 123",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                None,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, None",
                ),
            ),
            (
                "tests/pipeline",
                {
                    "pipeline_path": pytest.pipeline_instance,
                },
                "None",
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/pipeline, {'pipeline_path': "
                    + f"{pytest.pipeline_instance}"
                    + "}, None",
                ),
            ),
        ],
    )
    def test_read_pipeline_path(
        self, pipeline_folder, pipeline_plugins, serializer_plugins, expected_output
    ):
        """
        Tests reading pipeline path with logger
        """
        PipelineManager.set_logger(pytest.my_logger)
        response = PipelineManager.read_pipeline_path(
            pipeline_folder, pipeline_plugins, serializer_plugins
        )
        assert response == expected_output
