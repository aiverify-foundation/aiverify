import importlib
import json
import logging
from pathlib import Path

import pytest
from aiverify_fairness_metrics_toolbox_for_classification.algo import Plugin
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from aiverify_test_engine.utils.json_utils import remove_numpy_formats
from aiverify_test_engine.utils.simple_progress import SimpleProgress


def test_discover_plugin():
    PluginManager.discover(str(Path(importlib.util.find_spec("aiverify_test_engine").origin).parent.resolve()))


# Variables for testing
valid_data_path = str("../../../user_defined_files/data/sample_bc_credit_data.sav")
valid_model_path = str("../../../user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav")
valid_ground_truth_path = str("../../../user_defined_files//data/sample_bc_credit_data.sav")

test_string = "data_str"
test_int = 1
test_float = 3.142
test_negative_value = -123
test_list = ["data_str"]
test_dict = {"data_str": "data_str"}
test_tuple = ("data_str", "data_str")
test_none = None


class ObjectTest:
    def __init__(self):
        test_discover_plugin()
        (
            data_instance,
            data_serializer_instance,
            data_error_message,
        ) = PluginManager.get_instance(PluginType.DATA, **{"filename": valid_data_path})

        (
            model_instance,
            model_serializer_instance,
            model_error_message,
        ) = PluginManager.get_instance(PluginType.MODEL, **{"filename": valid_model_path})

        (
            ground_truth_instance,
            ground_truth_serializer_instance,
            data_error_message,
        ) = PluginManager.get_instance(PluginType.DATA, **{"filename": valid_ground_truth_path})

        ground_truth = "default"
        model_type = ModelType.CLASSIFICATION
        input_args = {
            "sensitive_feature": ["gender"],
            "annotated_labels_path": valid_ground_truth_path,
            "file_name_label": "image_directory",
        }
        expected_exception = RuntimeError
        expected_exception_msg = "The algorithm has failed data validation"
        logger_instance = logging.getLogger("PluginTestLogger")
        logger_instance.setLevel(logging.DEBUG)

        input_args["ground_truth"] = ground_truth
        input_args["model_type"] = model_type
        input_args["logger"] = logger_instance
        input_args["project_base_path"] = Path().absolute()

        self._data_instance_and_serializer = (data_instance, data_serializer_instance)
        self._model_instance_and_serializer = (
            model_instance,
            model_serializer_instance,
        )
        self._ground_truth_instance_and_serializer = (
            ground_truth_instance,
            ground_truth_serializer_instance,
        )
        self._ground_truth = ground_truth
        self._model_type = model_type
        self._input_args = input_args
        self._expected_exception = expected_exception
        self._expected_exception_msg = expected_exception_msg


@pytest.fixture
def get_logger_instance(request):
    log_instance = logging.getLogger("TestLogger")
    log_level = logging.getLevelName(request.param)
    log_instance.setLevel(log_level)

    yield log_instance


@pytest.fixture
def get_data_instance_and_serializer(request):
    test_discover_plugin()
    (
        data_instance,
        data_serializer_instance,
        data_error_message,
    ) = PluginManager.get_instance(PluginType.DATA, **{"filename": request.param})
    yield (data_instance, data_serializer_instance)


@pytest.fixture
def get_data_instance_and_serializer_without_ground_truth(request):
    test_discover_plugin()
    (
        data_instance,
        data_serializer_instance,
        data_error_message,
    ) = PluginManager.get_instance(PluginType.DATA, **{"filename": request.param})
    test_object = ObjectTest()
    data_instance.remove_ground_truth(test_object._ground_truth)
    yield (data_instance, data_serializer_instance)


@pytest.fixture
def get_invalid_data_instance(request):
    test_discover_plugin()
    with pytest.raises(Exception) as excinfo:
        (
            data_instance,
            data_serializer_instance,
            data_error_message,
        ) = PluginManager.get_instance(PluginType.DATA, **{"filename": request.param})
    return excinfo


@pytest.fixture
def get_model_instance_and_serializer(request):
    test_discover_plugin()
    (
        model_instance,
        model_serializer_instance,
        model_error_message,
    ) = PluginManager.get_instance(PluginType.MODEL, **{"filename": request.param})
    yield (model_instance, model_serializer_instance)


@pytest.fixture
def get_invalid_model_instance(request):
    test_discover_plugin()
    with pytest.raises(RuntimeError) as excinfo:
        (
            model_instance,
            model_serializer_instance,
            model_error_message,
        ) = PluginManager.get_instance(PluginType.MODEL, **{"filename": request.param})
    return excinfo


@pytest.fixture
def get_ground_truth_instance_and_serializer(request):
    test_discover_plugin()
    (
        ground_truth_instance,
        ground_truth_serializer_instance,
        data_error_message,
    ) = PluginManager.get_instance(PluginType.DATA, **{"filename": request.param})
    return (ground_truth_instance, ground_truth_serializer_instance)


def test_create_plugin_instance_with_all_valid_input():
    test_object = ObjectTest()
    test_plugin = Plugin(
        test_object._data_instance_and_serializer,
        test_object._model_instance_and_serializer,
        test_object._ground_truth_instance_and_serializer,
        test_object._data_instance_and_serializer[0],
        test_object._model_instance_and_serializer[0],
        **test_object._input_args,
    )

    assert isinstance(test_plugin._data_instance, IData)
    assert isinstance(test_plugin._model_instance, IModel)
    assert isinstance(test_plugin._ground_truth_instance, IData)
    assert isinstance(test_plugin._logger, logging.Logger)
    assert isinstance(test_plugin._progress_inst, SimpleProgress)


@pytest.mark.parametrize(
    "invalid_data_instance_type",
    [test_string, test_int, test_float, test_list, test_dict, test_tuple, test_none],
)
def test_init_plugin_instance_with_invalid_data_instance_type(
    invalid_data_instance_type,
):
    test_object = ObjectTest()
    expected_exception_msg = "The algorithm has failed data validation"
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            (invalid_data_instance_type, test_object._data_instance_and_serializer[1]),
            test_object._model_instance_and_serializer,
            test_object._ground_truth_instance_and_serializer,
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize(
    "invalid_model_instance_type",
    [test_string, test_int, test_float, test_list, test_dict, test_tuple, test_none],
)
def test_init_plugin_instance_with_invalid_model_instance_type(
    invalid_model_instance_type,
):
    test_object = ObjectTest()
    expected_exception_msg = "The algorithm has failed model validation"
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            test_object._data_instance_and_serializer,
            (
                invalid_model_instance_type,
                test_object._model_instance_and_serializer[1],
            ),
            test_object._ground_truth_instance_and_serializer,
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize(
    "invalid_ground_truth_instance_type",
    [test_string, test_int, test_float, test_list, test_dict, test_tuple, test_none],
)
def test_init_plugin_instance_with_invalid_ground_truth_instance_type(
    invalid_ground_truth_instance_type,
):
    test_object = ObjectTest()
    expected_exception_msg = "The algorithm has failed ground truth data validation"
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            test_object._data_instance_and_serializer,
            test_object._model_instance_and_serializer,
            (
                invalid_ground_truth_instance_type,
                test_object._ground_truth_instance_and_serializer[1],
            ),
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize("ground_truth", [test_int, test_float, test_list, test_dict, test_tuple])
def test_init_plugin_instance_with_invalid_ground_truth_type(ground_truth):
    test_object = ObjectTest()
    test_object._input_args["ground_truth"] = ground_truth
    expected_exception_msg = "The algorithm has failed ground truth header validation."
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            test_object._data_instance_and_serializer,
            test_object._model_instance_and_serializer,
            test_object._ground_truth_instance_and_serializer,
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize("ground_truth", [test_none])
def test_init_plugin_instance_with_none_ground_truth_type(ground_truth):
    test_object = ObjectTest()
    test_object._input_args["ground_truth"] = ground_truth
    expected_exception_msg = "The algorithm has failed ground truth header validation."
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            test_object._data_instance_and_serializer,
            test_object._model_instance_and_serializer,
            test_object._ground_truth_instance_and_serializer,
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize(
    "get_data_instance_and_serializer, get_model_instance_and_serializer, get_ground_truth_instance_and_serializer",
    [(valid_data_path, valid_model_path, valid_ground_truth_path)],
    indirect=[
        "get_data_instance_and_serializer",
        "get_model_instance_and_serializer",
        "get_ground_truth_instance_and_serializer",
    ],
)
def test_init_plugin_instance_with_missing_ground_truth(
    get_data_instance_and_serializer,
    get_model_instance_and_serializer,
    get_ground_truth_instance_and_serializer,
):
    data_instance_and_serializer = get_data_instance_and_serializer
    model_instance_and_serializer = get_model_instance_and_serializer
    ground_truth_instance_and_serializer = get_ground_truth_instance_and_serializer
    model_type = ModelType.CLASSIFICATION
    input_args = {}
    expected_exception = RuntimeError
    expected_exception_msg = "The algorithm has failed ground truth header validation."
    logger_instance = logging.getLogger("PluginTestLogger")
    logger_instance.setLevel(logging.DEBUG)

    input_args["model_type"] = model_type
    input_args["logger"] = logger_instance

    with pytest.raises(expected_exception) as excinfo:
        Plugin(
            data_instance_and_serializer,
            model_instance_and_serializer,
            ground_truth_instance_and_serializer,
            data_instance_and_serializer[0],
            model_instance_and_serializer[0],
            **input_args,
        )
    assert excinfo.type == expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize(
    "invalid_model_type",
    [
        test_string,
        test_int,
        test_float,
        test_list,
        test_dict,
        test_tuple,
        test_none,
        ModelType.REGRESSION,
    ],
)
def test_setup_plugin_instance_with_invalid_model_type(invalid_model_type):
    test_object = ObjectTest()
    test_object._input_args["model_type"] = invalid_model_type
    expected_exception_msg = "The algorithm has failed validation for model type"
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            test_object._data_instance_and_serializer,
            test_object._model_instance_and_serializer,
            test_object._ground_truth_instance_and_serializer,
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize(
    "invalid_logger_type",
    [test_string, test_int, test_float, test_list, test_dict, test_tuple],
)
def test_setup_plugin_instance_with_invalid_logger_type(invalid_logger_type):
    test_object = ObjectTest()
    test_object._input_args["logger"] = invalid_logger_type
    expected_exception_msg = "The algorithm has failed to set up logger. The logger type is invalid"
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            test_object._data_instance_and_serializer,
            test_object._model_instance_and_serializer,
            test_object._ground_truth_instance_and_serializer,
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize(
    "log_info",
    [
        ("data_str", "data_str"),
        ("data_str", logging.DEBUG),
        ("data_str", "data_str"),
        (logging.DEBUG, 123),
        (-3.142, -3.142),
        (["data_str"], ["data_str"]),
        ({"data_str": "data_str"}, {"data_str": "data_str"}),
        (("data_str", "data_str")),
        (None, None),
    ],
)
def test_setup_plugin_instance_with_invalid_log_level_and_message(log_info):
    test_object = ObjectTest()
    expected_exception_msg = "invalid log level or message"
    test_plugin = Plugin(
        test_object._data_instance_and_serializer,
        test_object._model_instance_and_serializer,
        test_object._ground_truth_instance_and_serializer,
        test_object._data_instance_and_serializer[0],
        test_object._model_instance_and_serializer[0],
        **test_object._input_args,
    )
    with pytest.raises(test_object._expected_exception) as excinfo:
        test_plugin.add_to_log(log_info[0], log_info[1])
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


@pytest.mark.parametrize(
    "invalid_project_base_path",
    [test_string, test_int, test_float, test_list, test_dict, test_tuple],
)
def test_init_plugin_instance_with_invalid_project_base_path(invalid_project_base_path):
    test_object = ObjectTest()
    test_object._input_args["project_base_path"] = invalid_project_base_path
    expected_exception_msg = "The algorithm has failed validation for the project path."
    with pytest.raises(test_object._expected_exception) as excinfo:
        Plugin(
            test_object._data_instance_and_serializer,
            test_object._model_instance_and_serializer,
            test_object._ground_truth_instance_and_serializer,
            test_object._data_instance_and_serializer[0],
            test_object._model_instance_and_serializer[0],
            **test_object._input_args,
        )
    assert excinfo.type == test_object._expected_exception
    assert expected_exception_msg in str(excinfo)


def test_plugin_valid_get_metadata():
    test_object = ObjectTest()
    test_plugin = Plugin(
        test_object._data_instance_and_serializer,
        test_object._model_instance_and_serializer,
        test_object._ground_truth_instance_and_serializer,
        test_object._data_instance_and_serializer[0],
        test_object._model_instance_and_serializer[0],
        **test_object._input_args,
    )
    assert isinstance(test_plugin.get_metadata(), PluginMetadata)


def test_plugin_valid_get_plugin_type():
    test_object = ObjectTest()
    test_plugin = Plugin(
        test_object._data_instance_and_serializer,
        test_object._model_instance_and_serializer,
        test_object._ground_truth_instance_and_serializer,
        test_object._data_instance_and_serializer[0],
        test_object._model_instance_and_serializer[0],
        **test_object._input_args,
    )
    assert isinstance(test_plugin.get_plugin_type(), PluginType)


@pytest.mark.parametrize(
    "get_data_instance_and_serializer_without_ground_truth",
    [(valid_data_path)],
    indirect=["get_data_instance_and_serializer_without_ground_truth"],
)
def test_valid_run(get_data_instance_and_serializer_without_ground_truth):
    test_object = ObjectTest()
    test_object._ground_truth_instance_and_serializer[0].keep_ground_truth(test_object._ground_truth)

    test_plugin = Plugin(
        get_data_instance_and_serializer_without_ground_truth,
        test_object._model_instance_and_serializer,
        test_object._ground_truth_instance_and_serializer,
        test_object._data_instance_and_serializer[0],
        test_object._model_instance_and_serializer[0],
        **test_object._input_args,
    )
    test_plugin.generate()
    results = remove_numpy_formats(test_plugin.get_results())

    # Load sample JSON file to assert results
    f = open(str(Path(__file__).parent / "sample_output.json"))
    sample_data = json.load(f)
    f.close()

    assert results == sample_data
