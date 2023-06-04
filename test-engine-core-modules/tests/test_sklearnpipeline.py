import pickle

import numpy as np
import pytest
from src.sklearnpipeline.sklearnpipeline import Plugin
from test_engine_core.plugins.enums.pipeline_plugin_type import PipelinePluginType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager


class TestCollectionSklearnPipeline:
    PluginManager.discover("src")

    pipeline_instance, _, _ = PluginManager.get_instance(
        PluginType.PIPELINE,
        **{"pipeline_path": "src/sklearnpipeline/user_defined_files/"}
    )
    pytest.pipeline = pipeline_instance.get_pipeline()

    @pytest.mark.parametrize(
        "pipeline, expected_name, expected_description, expected_version",
        [
            (
                pytest.pipeline,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
            ),
            (
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
            ),
            (
                "None",
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
            ),
            (
                "",
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
            ),
            (
                [],
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
            ),
            (
                {},
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
            ),
            (
                1234,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
            ),
        ],
    )
    def test_get_metadata(
        self, pipeline, expected_name, expected_description, expected_version
    ):
        new_pipeline = Plugin(pipeline)
        metadata = new_pipeline.get_metadata()
        assert metadata.name == expected_name
        assert metadata.description == expected_description
        assert metadata.version == expected_version

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (pytest.pipeline, PluginType.PIPELINE),
            (
                None,
                PluginType.PIPELINE,
            ),
            (
                "None",
                PluginType.PIPELINE,
            ),
            (
                "",
                PluginType.PIPELINE,
            ),
            (
                [],
                PluginType.PIPELINE,
            ),
            (
                {},
                PluginType.PIPELINE,
            ),
            (
                "1234",
                PluginType.PIPELINE,
            ),
        ],
    )
    def test_get_plugin_type(self, pipeline, expected_output):
        new_pipeline = Plugin(pipeline)
        assert new_pipeline.get_plugin_type() is expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (pytest.pipeline, PipelinePluginType.SKLEARN),
            (None, PipelinePluginType.SKLEARN),
            ("None", PipelinePluginType.SKLEARN),
            (
                "",
                PipelinePluginType.SKLEARN,
            ),
            (
                [],
                PipelinePluginType.SKLEARN,
            ),
            (
                {},
                PipelinePluginType.SKLEARN,
            ),
            (
                "1234",
                PipelinePluginType.SKLEARN,
            ),
        ],
    )
    def test_get_pipeline_plugin_type(self, pipeline, expected_output):
        new_pipeline = Plugin(pipeline)
        assert new_pipeline.get_pipeline_plugin_type() is expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_pipeline_plugin_type",
        [
            (
                pytest.pipeline,
                pytest.pipeline,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                None,
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                "None",
                "None",
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                "",
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                [],
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                {},
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                "1234",
                "1234",
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
        ],
    )
    def test_init(
        self,
        pipeline,
        expected_data,
        expected_name,
        expected_description,
        expected_version,
        expected_plugin_type,
        expected_pipeline_plugin_type,
    ):
        new_pipeline = Plugin(pipeline)
        assert new_pipeline._pipeline == expected_data
        assert new_pipeline._name == expected_name
        assert new_pipeline._description == expected_description
        assert new_pipeline._version == expected_version
        assert new_pipeline._metadata.name == expected_name
        assert new_pipeline._metadata.description == expected_description
        assert new_pipeline._metadata.version == expected_version
        assert new_pipeline._plugin_type is expected_plugin_type
        assert new_pipeline._pipeline_plugin_type is expected_pipeline_plugin_type

    @pytest.mark.parametrize(
        "pipeline, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_pipeline_plugin_type",
        [
            (
                pytest.pipeline,
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                None,
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                "None",
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                "",
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                [],
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                {},
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
            (
                "1234",
                None,
                "sklearnpipeline",
                "sklearnpipeline supports detecting sklearn pipeline",
                "0.9.0",
                PluginType.PIPELINE,
                PipelinePluginType.SKLEARN,
            ),
        ],
    )
    def test_init_no_initialize(
        self,
        pipeline,
        expected_data,
        expected_name,
        expected_description,
        expected_version,
        expected_plugin_type,
        expected_pipeline_plugin_type,
    ):
        assert Plugin._pipeline == expected_data
        assert Plugin._name == expected_name
        assert Plugin._description == expected_description
        assert Plugin._version == expected_version
        assert Plugin._metadata.name == expected_name
        assert Plugin._metadata.description == expected_description
        assert Plugin._metadata.version == expected_version
        assert Plugin._plugin_type is expected_plugin_type
        assert Plugin._pipeline_plugin_type is expected_pipeline_plugin_type

    def test_cleanup(self):
        new_plugin = Plugin(pytest.pipeline)
        new_plugin.cleanup()

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (pytest.pipeline, (True, "")),
            (
                None,
                (True, ""),
            ),
            (
                "None",
                (True, ""),
            ),
            (
                "",
                (True, ""),
            ),
            (
                [],
                (True, ""),
            ),
            (
                {},
                (True, ""),
            ),
            (
                "1234",
                (True, ""),
            ),
        ],
    )
    def test_setup(self, pipeline, expected_output):
        new_plugin = Plugin(pipeline)
        is_success, error_message = new_plugin.setup()
        assert is_success == expected_output[0]
        assert error_message == expected_output[1]

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (
                pytest.pipeline,
                pytest.pipeline,
            ),
            (
                "None",
                "None",
            ),
            (
                "",
                None,
            ),
            (
                [],
                None,
            ),
            (
                {},
                None,
            ),
            (
                "1234",
                "1234",
            ),
        ],
    )
    def test_get_pipeline(self, pipeline, expected_output):
        new_plugin = Plugin(pipeline)
        assert new_plugin.get_pipeline() == expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (pytest.pipeline, "sklearn.pipeline.Pipeline"),
            (
                None,
                "",
            ),
            (
                "None",
                "",
            ),
            (
                "",
                "",
            ),
            (
                [],
                "",
            ),
            (
                {},
                "",
            ),
            (
                "1234",
                "",
            ),
        ],
    )
    def test_get_pipeline_algorithm(self, pipeline, expected_output):
        new_plugin = Plugin(pipeline)
        new_plugin.is_supported()
        assert new_plugin.get_pipeline_algorithm() == expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (
                pytest.pipeline,
                pytest.pipeline,
            ),
            (
                "None",
                "None",
            ),
            (
                "",
                "",
            ),
            (
                [],
                [],
            ),
            (
                {},
                {},
            ),
            (
                "1234",
                "1234",
            ),
        ],
    )
    def test_set_pipeline(self, pipeline, expected_output):
        new_plugin = Plugin(None)
        new_plugin.set_pipeline(pipeline)
        assert new_plugin._pipeline == expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (
                pytest.pipeline,
                True,
            ),
            (
                "None",
                False,
            ),
            (
                "",
                False,
            ),
            (
                [],
                False,
            ),
            (
                {},
                False,
            ),
            (
                "1234",
                False,
            ),
        ],
    )
    def test_is_supported(self, pipeline, expected_output):
        new_plugin = Plugin(pipeline)
        assert new_plugin.is_supported() == expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (pytest.pipeline, np.array([1] * 5)),
        ],
    )
    def test_predict(self, pipeline, expected_output):
        new_plugin = Plugin(pipeline)
        new_plugin.is_supported()
        object_file = pickle.load(open("tests/pipeline/pipeline_testing.sav", "rb"))
        output = new_plugin.predict(object_file.head())
        assert (output == expected_output).all()

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (
                "None",
                "'str' object has no attribute 'predict'",
            ),
            (
                "",
                "'NoneType' object has no attribute 'predict'",
            ),
            (
                [],
                "'NoneType' object has no attribute 'predict'",
            ),
            (
                {},
                "'NoneType' object has no attribute 'predict'",
            ),
            (
                "1234",
                "'str' object has no attribute 'predict'",
            ),
        ],
    )
    def test_predict_with_exception(self, pipeline, expected_output):
        with pytest.raises(Exception) as exc_info:
            new_plugin = Plugin(pipeline)
            new_plugin.is_supported()
            object_file = pickle.load(open("tests/pipeline/pipeline_testing.sav", "rb"))
            output = new_plugin.predict(object_file.head())
            assert (output == expected_output).all()
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (
                pytest.pipeline,
                np.array(
                    [
                        [0.49962825, 0.50037175],
                        [0.49649935, 0.50350065],
                        [0.31346175, 0.68653825],
                        [0.40607656, 0.59392344],
                        [0.44515895, 0.55484105],
                    ]
                ),
            ),
        ],
    )
    def test_predict_proba(self, pipeline, expected_output):
        new_plugin = Plugin(pipeline)
        new_plugin.is_supported()
        object_file = pickle.load(open("tests/pipeline/pipeline_testing.sav", "rb"))
        output = new_plugin.predict_proba(object_file.head())
        assert np.isclose(output, expected_output).all()

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (
                "None",
                "'str' object has no attribute 'predict_proba'",
            ),
            (
                "",
                "'NoneType' object has no attribute 'predict_proba'",
            ),
            (
                [],
                "'NoneType' object has no attribute 'predict_proba'",
            ),
            (
                {},
                "'NoneType' object has no attribute 'predict_proba'",
            ),
            (
                "1234",
                "'str' object has no attribute 'predict_proba'",
            ),
        ],
    )
    def test_predict_proba_with_exception(self, pipeline, expected_output):
        with pytest.raises(Exception) as exc_info:
            new_plugin = Plugin(pipeline)
            new_plugin.is_supported()
            object_file = pickle.load(open("tests/pipeline/pipeline_testing.sav", "rb"))
            output = new_plugin.predict_proba(object_file.head())
            assert (output == expected_output).all()
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (pytest.pipeline, 0.2),
        ],
    )
    def test_score(self, pipeline, expected_output):
        new_plugin = Plugin(pipeline)
        new_plugin.is_supported()
        object_file = pickle.load(open("tests/pipeline/pipeline_testing.sav", "rb"))
        output = new_plugin.score(object_file.head(), [1, 2, 3, 4, 5])
        assert output == expected_output

    @pytest.mark.parametrize(
        "pipeline, expected_output",
        [
            (
                None,
                "'NoneType' object has no attribute 'score'",
            ),
            (
                "None",
                "'str' object has no attribute 'score'",
            ),
            (
                "",
                "'NoneType' object has no attribute 'score'",
            ),
            (
                [],
                "'NoneType' object has no attribute 'score'",
            ),
            (
                {},
                "'NoneType' object has no attribute 'score'",
            ),
            (
                "1234",
                "'str' object has no attribute 'score'",
            ),
        ],
    )
    def test_score_with_exception(self, pipeline, expected_output):
        with pytest.raises(Exception) as exc_info:
            new_plugin = Plugin(pipeline)
            new_plugin.is_supported()
            object_file = pickle.load(open("tests/pipeline/pipeline_testing.sav", "rb"))
            output = new_plugin.score(object_file.head(), [1, 2, 3, 4, 5])
            assert output == expected_output
        assert str(exc_info.value) == expected_output
