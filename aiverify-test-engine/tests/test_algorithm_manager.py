import logging

import pytest
from aiverify_test_engine.plugins.algorithm_manager import AlgorithmManager
from aiverify_test_engine.plugins.enums.plugin_type import PluginType


class Algorithm:
    __file__ = "tests/test_algorithm_manager.py"

    def __init__(self):
        pass

    def Plugin(
        self,
        data_instance,
        model_instance,
        ground_truth_instance,
        initial_data_instance,
        initial_model_instance,
        **kwargs,
    ):
        return pytest.algorithm_instance

    def get_plugin_type(self):
        return PluginType.ALGORITHM


class DataModel:
    _path = ""

    def __init__(self, input_path):
        self._path = input_path


class TestCollectionAlgorithmManager:
    pytest.data_instance = DataModel("data_instance")
    pytest.model_instance = DataModel("model_instance")
    pytest.ground_truth_instance = DataModel("ground_truth_instance")
    pytest.initial_data_instance = DataModel("initial_data_instance")
    pytest.initial_model_instance = DataModel("initial_model_instance")
    pytest.algorithm_instance = Algorithm()
    pytest.my_logger = logging.getLogger("example_logger")

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        AlgorithmManager._logger = None

        # Perform tests
        yield

        # Reset
        AlgorithmManager._logger = None

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
        assert AlgorithmManager._logger is None
        AlgorithmManager.set_logger(logger)
        assert AlgorithmManager._logger == expected_response

    @pytest.mark.parametrize(
        "algorithm_plugins, kwargs, expected_output",
        [
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            # Test the algorithm plugin path
            (
                {"algorithm1": None},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error encountered getting algorithm instance (exception): "
                    "'NoneType' object has no attribute '__file__'",
                ),
            ),
            # Test algorithm list
            (
                {},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): algorithm1",
                ),
            ),
            (
                [],
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            (
                None,
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            (
                123,
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            (
                "None",
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            # Test algorithm id
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm2",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): algorithm2",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): ",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): ",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): ",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": 123,
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'int'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": [],
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'list'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": {},
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'dict'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": None,
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'NoneType'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "None",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): None",
                ),
            ),
            # Test algorithm_arguments
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg2": "value2"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": "",
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'str'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": 123,
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'int'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": [],
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'list'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": None,
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'NoneType'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": "None",
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'str'>",
                ),
            ),
        ],
    )
    def test_get_algorithm_no_logger(self, algorithm_plugins, kwargs, expected_output):
        """
        Tests getting algorithms
        """
        output = AlgorithmManager.get_algorithm(algorithm_plugins, **kwargs)
        assert output == expected_output

    @pytest.mark.parametrize(
        "algorithm_plugins, kwargs, expected_output",
        [
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            # Test the algorithm plugin path
            (
                {"algorithm1": None},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error encountered getting algorithm instance (exception): "
                    "'NoneType' object has no attribute '__file__'",
                ),
            ),
            # Test algorithm list
            (
                {},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): algorithm1",
                ),
            ),
            (
                [],
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            (
                None,
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            (
                123,
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            (
                "None",
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error validating the input parameters",
                ),
            ),
            # Test algorithm id
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm2",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): algorithm2",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): ",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): ",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): ",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": 123,
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'int'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": [],
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'list'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": {},
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'dict'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": None,
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'NoneType'>, <class 'dict'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "None",
                    "algorithm_arguments": {"arg1": "value1"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm instance (not found): None",
                ),
            ),
            # Test algorithm_arguments
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {"arg2": "value2"},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": {},
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": "",
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'str'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    True,
                    pytest.algorithm_instance,
                    "",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": 123,
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'int'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": [],
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'list'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": None,
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'NoneType'>",
                ),
            ),
            (
                {"algorithm1": pytest.algorithm_instance},
                {
                    "algorithm_id": "algorithm1",
                    "algorithm_arguments": "None",
                    "data_instance": pytest.data_instance,
                    "ground_truth_instance": pytest.ground_truth_instance,
                    "model_instance": pytest.model_instance,
                    "initial_data_instance": pytest.initial_data_instance,
                    "initial_model_instance": pytest.initial_model_instance,
                    "project_base_path": "tests/dataconverter/",
                    "logger": pytest.my_logger,
                    "progress_callback": None,
                    "ground_truth": "feature1",
                    "model_type": "classification",
                },
                (
                    False,
                    None,
                    "There was an error getting algorithm id, algorithm arguments "
                    "(unsupported type): <class 'str'>, <class 'str'>",
                ),
            ),
        ],
    )
    def test_get_algorithm(self, algorithm_plugins, kwargs, expected_output):
        """
        Tests getting algorithms
        """
        AlgorithmManager.set_logger(pytest.my_logger)
        output = AlgorithmManager.get_algorithm(algorithm_plugins, **kwargs)
        assert output == expected_output
