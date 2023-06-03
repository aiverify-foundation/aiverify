import numpy as np
import pytest
from test_engine_core.plugins.enums.model_plugin_type import ModelPluginType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager

from src.lightgbmmodel.lightgbmmodel import Plugin


class TestCollectionLightGbmModel:
    PluginManager.discover("src")
    lightgbm_model, _, _ = PluginManager.get_instance(
        PluginType.MODEL, **{"filename": "src/lightgbmmodel/user_defined_files/joblib_lightgbm_lgbmclassifier.sav"})
    pytest.model = lightgbm_model.get_model()

    @pytest.mark.parametrize(
        "model, expected_name, expected_description, expected_version",
        [
            (
                    pytest.model,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
            ),
            (
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
            ),
            (
                    "None",
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
            ),
            (
                    "",
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
            ),
            (
                    [],
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
            ),
            (
                    {},
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
            ),
            (
                    1234,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
            ),
        ],
    )
    def test_get_metadata(self, model, expected_name, expected_description, expected_version):
        new_model = Plugin(model)
        metadata = new_model.get_metadata()
        assert metadata.name == expected_name
        assert metadata.description == expected_description
        assert metadata.version == expected_version

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    PluginType.MODEL
            ),
            (
                    None,
                    PluginType.MODEL,
            ),
            (
                    "None",
                    PluginType.MODEL,
            ),
            (
                    "",
                    PluginType.MODEL,
            ),
            (
                    [],
                    PluginType.MODEL,
            ),
            (
                    {},
                    PluginType.MODEL,
            ),
            (
                    "1234",
                    PluginType.MODEL,
            ),
        ],
    )
    def test_get_plugin_type(self, model, expected_output):
        new_model = Plugin(model)
        assert new_model.get_plugin_type() is expected_output

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    ModelPluginType.LIGHTGBM
            ),
            (
                    None,
                    ModelPluginType.LIGHTGBM
            ),
            (
                    "None",
                    ModelPluginType.LIGHTGBM
            ),
            (
                    "",
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    [],
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    {},
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    "1234",
                    ModelPluginType.LIGHTGBM,
            ),
        ],
    )
    def test_get_model_plugin_type(self, model, expected_output):
        new_model = Plugin(model)
        assert new_model.get_model_plugin_type() is expected_output

    @pytest.mark.parametrize(
        "model, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_model_plugin_type",
        [
            (
                    pytest.model,
                    pytest.model,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    None,
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    "None",
                    "None",
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    "",
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    [],
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    {},
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    "1234",
                    "1234",
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
        ],
    )
    def test_init(self,
                  model, expected_data, expected_name, expected_description,
                  expected_version, expected_plugin_type, expected_model_plugin_type
                  ):
        new_model = Plugin(model)
        assert new_model._model == expected_data
        assert new_model._name == expected_name
        assert new_model._description == expected_description
        assert new_model._version == expected_version
        assert new_model._metadata.name == expected_name
        assert new_model._metadata.description == expected_description
        assert new_model._metadata.version == expected_version
        assert new_model._plugin_type is expected_plugin_type
        assert new_model._model_plugin_type is expected_model_plugin_type

    @pytest.mark.parametrize(
        "model, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_model_plugin_type",
        [
            (
                    pytest.model,
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    None,
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    "None",
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    "",
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    [],
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    {},
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
            (
                    "1234",
                    None,
                    "lightgbmmodel",
                    "lightgbmmodel supports detecting lightgbm models",
                    "0.9.0",
                    PluginType.MODEL,
                    ModelPluginType.LIGHTGBM,
            ),
        ],
    )
    def test_init_no_initialize(self,
                                model, expected_data, expected_name, expected_description,
                                expected_version, expected_plugin_type, expected_model_plugin_type
                                ):
        assert Plugin._model == expected_data
        assert Plugin._name == expected_name
        assert Plugin._description == expected_description
        assert Plugin._version == expected_version
        assert Plugin._metadata.name == expected_name
        assert Plugin._metadata.description == expected_description
        assert Plugin._metadata.version == expected_version
        assert Plugin._plugin_type is expected_plugin_type
        assert Plugin._model_plugin_type is expected_model_plugin_type

    def test_cleanup(self):
        new_plugin = Plugin(pytest.model)
        new_plugin.cleanup()

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    (True, "")
            ),
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
    def test_setup(self, model, expected_output):
        new_plugin = Plugin(model)
        is_success, error_message = new_plugin.setup()
        assert is_success == expected_output[0]
        assert error_message == expected_output[1]

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    pytest.model,
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
    def test_get_model(self, model, expected_output):
        new_plugin = Plugin(model)
        assert new_plugin.get_model() == expected_output

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    "lightgbm.sklearn.LGBMClassifier"
            ),
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
    def test_get_model_algorithm(self, model, expected_output):
        new_plugin = Plugin(model)
        new_plugin.is_supported()
        assert new_plugin.get_model_algorithm() == expected_output

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
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
    def test_is_supported(self, model, expected_output):
        new_plugin = Plugin(model)
        assert new_plugin.is_supported() == expected_output

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    np.array([1, 0]),
            ),
        ],
    )
    def test_predict(self, model, expected_output):
        new_plugin = Plugin(model)
        new_plugin.is_supported()
        output = new_plugin.predict([[3, 2, 2, 2, 2], [1, 5, 2, 2, 2]])
        assert (output == expected_output).all()

    @pytest.mark.parametrize(
        "model, expected_output",
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
    def test_predict_with_exception(self, model, expected_output):
        with pytest.raises(Exception) as exc_info:
            new_plugin = Plugin(model)
            new_plugin.is_supported()
            output = new_plugin.predict([[3, 2, 2, 2, 2], [1, 5, 2, 2, 2]])
            assert (output == expected_output).all()
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    np.array([[0.33675274, 0.66324726], [0.6983471, 0.3016529]])
            ),
        ],
    )
    def test_predict_proba(self, model, expected_output):
        new_plugin = Plugin(model)
        new_plugin.is_supported()
        output = new_plugin.predict_proba([[3, 2, 2, 2, 2], [1, 5, 2, 2, 2]])
        assert np.isclose(output, expected_output).all()

    @pytest.mark.parametrize(
        "model, expected_output",
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
    def test_predict_proba_with_exception(self, model, expected_output):
        with pytest.raises(Exception) as exc_info:
            new_plugin = Plugin(model)
            new_plugin.is_supported()
            output = new_plugin.predict_proba([[3, 2, 2, 2, 2], [1, 5, 2, 2, 2]])
            assert np.isclose(output, expected_output).all()
        assert str(exc_info.value) == expected_output

    @pytest.mark.parametrize(
        "model, expected_output",
        [
            (
                    pytest.model,
                    0.0
            ),
        ],
    )
    def test_score(self, model, expected_output):
        new_plugin = Plugin(model)
        new_plugin.is_supported()
        output = new_plugin.score([[3, 2, 2, 2, 2], [1, 5, 2, 2, 2]], [10, 200])
        assert output == expected_output

    @pytest.mark.parametrize(
        "model, expected_output",
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
    def test_score_with_exception(self, model, expected_output):
        with pytest.raises(Exception) as exc_info:
            new_plugin = Plugin(model)
            new_plugin.is_supported()
            output = new_plugin.score([[3, 2, 2, 2, 2], [1, 5, 2, 2, 2]], [10, 200])
            assert output == expected_output
        assert str(exc_info.value) == expected_output
