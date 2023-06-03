import copy
import pickle

import numpy as np
import pandas as pd
import pytest
from pandas import DataFrame
from test_engine_core.plugins.enums.data_plugin_type import DataPluginType
from test_engine_core.plugins.enums.plugin_type import PluginType

from src.pandasdata.pandasdata import Plugin


class TestCollectionPandasData:
    arr_random = np.random.randint(low=2, high=10, size=(2, 3))
    pytest.data = pd.DataFrame(arr_random, columns=["A", "B", "C"], index=["a", "b"])
    pytest.different_rows_data = copy.copy(pytest.data)
    pytest.different_rows_data.drop('A', axis=1)
    pytest.data1 = pickle.load(open("tests/pandasdata/pickle_no_labels.sav", "rb"))
    pytest.data2 = pickle.load(open("tests/pandasdata/pickle_pandas_one_column_blank_header.sav", "rb"))

    @pytest.mark.parametrize(
        "data, expected_name, expected_description, expected_version",
        [
            (
                    pytest.data,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
            ),
            (
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
            ),
            (
                    "None",
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
            ),
            (
                    "",
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
            ),
            (
                    [],
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
            ),
            (
                    {},
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
            ),
            (
                    "1234",
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
            ),
        ],
    )
    def test_get_metadata(self, data, expected_name, expected_description, expected_version):
        new_plugin = Plugin(data)

        metadata = new_plugin.get_metadata()
        assert metadata.name == expected_name
        assert metadata.description == expected_description
        assert metadata.version == expected_version

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    PluginType.DATA,
            ),
            (
                    None,
                    PluginType.DATA,
            ),
            (
                    "None",
                    PluginType.DATA,
            ),
            (
                    "",
                    PluginType.DATA,
            ),
            (
                    [],
                    PluginType.DATA,
            ),
            (
                    {},
                    PluginType.DATA,
            ),
            (
                    "1234",
                    PluginType.DATA,
            ),
        ],
    )
    def test_get_plugin_type(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_plugin_type() is expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    DataPluginType.PANDAS,
            ),
            (
                    None,
                    DataPluginType.PANDAS,
            ),
            (
                    "None",
                    DataPluginType.PANDAS,
            ),
            (
                    "",
                    DataPluginType.PANDAS,
            ),
            (
                    [],
                    DataPluginType.PANDAS,
            ),
            (
                    {},
                    DataPluginType.PANDAS,
            ),
            (
                    "1234",
                    DataPluginType.PANDAS,
            ),
        ],
    )
    def test_get_data_plugin_type(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_data_plugin_type() == expected_output

    @pytest.mark.parametrize(
        "data, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_data_plugin_type",
        [
            (
                    pytest.data,
                    pytest.data,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    None,
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    "None",
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    "",
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    [],
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    {},
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    "1234",
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
        ],
    )
    def test_init(
            self,
            data,
            expected_data,
            expected_name,
            expected_description,
            expected_version,
            expected_plugin_type,
            expected_data_plugin_type,
    ):
        new_plugin = Plugin(data)
        if expected_data is None:
            assert new_plugin._data is expected_data
        else:
            assert new_plugin._data.equals(expected_data)
        assert new_plugin._name == expected_name
        assert new_plugin._description == expected_description
        assert new_plugin._version == expected_version
        assert new_plugin._metadata.name == expected_name
        assert new_plugin._metadata.description == expected_description
        assert new_plugin._metadata.version == expected_version
        assert new_plugin._plugin_type is expected_plugin_type
        assert new_plugin._data_plugin_type is expected_data_plugin_type

    @pytest.mark.parametrize(
        "data, expected_data, expected_name, expected_description, "
        "expected_version, expected_plugin_type, expected_data_plugin_type",
        [
            (
                    pytest.data,
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    None,
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    "None",
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    "",
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    [],
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    {},
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
            (
                    "1234",
                    None,
                    "pandasdata",
                    "pandasdata supports detecting pandas data",
                    "0.9.0",
                    PluginType.DATA,
                    DataPluginType.PANDAS,
            ),
        ],
    )
    def test_init_no_initialize(self, data, expected_data, expected_name, expected_description,
                                expected_version, expected_plugin_type, expected_data_plugin_type):
        if expected_data is None:
            assert Plugin._data is expected_data
        else:
            assert Plugin._data.equals(expected_data)
        assert Plugin._name == expected_name
        assert Plugin._description == expected_description
        assert Plugin._version == expected_version
        assert Plugin._metadata.name == expected_name
        assert Plugin._metadata.description == expected_description
        assert Plugin._metadata.version == expected_version
        assert Plugin._plugin_type is expected_plugin_type
        assert Plugin._data_plugin_type is expected_data_plugin_type

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
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
    def test_setup(self, data, expected_output):
        new_plugin = Plugin(data)
        is_success, error_message = new_plugin.setup()
        assert is_success == expected_output[0]
        assert error_message == expected_output[1]

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    pytest.data,
            ),
            (
                    "None",
                    None,
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
                    None,
            ),
        ],
    )
    def test_get_data(self, data, expected_output):
        new_plugin = Plugin(data)
        if expected_output is None:
            assert new_plugin.get_data() is expected_output
        else:
            assert new_plugin.get_data().equals(expected_output)

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    pytest.data,
            ),
            (
                    "None",
                    None,
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
                    None,
            ),
        ],
    )
    def test_set_data(self, data, expected_output):
        new_plugin = Plugin(None)
        new_plugin.set_data(data)
        if expected_output is None:
            assert new_plugin._data == expected_output
        else:
            assert new_plugin._data.equals(expected_output)

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
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
    def test_is_supported(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.is_supported() == expected_output

    @pytest.mark.parametrize(
        "data, ground_truth, expected_output",
        [
            (
                    pytest.data,
                    "A",
                    True,
            ),
            (
                    "None",
                    "A",
                    False,
            ),
            (
                    "",
                    "A",
                    False,
            ),
            (
                    [],
                    "A",
                    False,
            ),
            (
                    {},
                    "A",
                    False,
            ),
            (
                    "1234",
                    "A",
                    False,
            ),
            # Not found ground truth
            (
                    pytest.data,
                    "Z",
                    False,
            ),
            (
                    "None",
                    "Z",
                    False,
            ),
            (
                    "",
                    "Z",
                    False,
            ),
            (
                    [],
                    "Z",
                    False,
            ),
            (
                    {},
                    "Z",
                    False,
            ),
            (
                    1234,
                    "Z",
                    False,
            ),
            # Invalid ground truth cases
            (
                    pytest.data,
                    None,
                    False,
            ),
            (
                    pytest.data,
                    "None",
                    False,
            ),
            (
                    pytest.data,
                    [],
                    False,
            ),
            (
                    pytest.data,
                    {},
                    False,
            ),
            (
                    pytest.data,
                    1234,
                    False,
            ),
        ],
    )
    def test_keep_ground_truth(self, data, ground_truth, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.keep_ground_truth(ground_truth) == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    {'A': 'int64', 'B': 'int64', 'C': 'int64'},
            ),
            (
                    "None",
                    {},
            ),
            (
                    "",
                    {},
            ),
            (
                    [],
                    {},
            ),
            (
                    {},
                    {},
            ),
            (
                    1234,
                    {},
            ),
        ],
    )
    def test_read_labels(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.read_labels() == expected_output

    @pytest.mark.parametrize(
        "data, ground_truth, expected_output",
        [
            (
                    pytest.data,
                    "A",
                    copy.copy(pytest.data).drop("A", axis=1),
            ),
            (
                    "None",
                    "A",
                    None,
            ),
            (
                    "",
                    "A",
                    None,
            ),
            (
                    [],
                    "A",
                    None,
            ),
            (
                    {},
                    "A",
                    None,
            ),
            (
                    1234,
                    "A",
                    None,
            ),
            # Not found ground truth
            (
                    pytest.data,
                    "Z",
                    pytest.data,
            ),
            (
                    "None",
                    "Z",
                    None,
            ),
            (
                    "",
                    "Z",
                    None,
            ),
            (
                    [],
                    "Z",
                    None,
            ),
            (
                    {},
                    "Z",
                    None,
            ),
            (
                    1234,
                    "Z",
                    None,
            ),
            # Invalid ground truth cases
            (
                    pytest.data,
                    None,
                    pytest.data,
            ),
            (
                    pytest.data,
                    "None",
                    pytest.data,
            ),
            (
                    pytest.data,
                    [],
                    pytest.data,
            ),
            (
                    pytest.data,
                    {},
                    pytest.data,
            ),
            (
                    pytest.data,
                    1234,
                    pytest.data,
            ),
        ],
    )
    def test_remove_ground_truth(self, data, ground_truth, expected_output):
        new_plugin = Plugin(data)
        new_plugin.remove_ground_truth(ground_truth)
        if expected_output is None:
            assert new_plugin._data is expected_output
        else:
            assert new_plugin._data.equals(expected_output)

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    (True, ""),
            ),
            (
                    pytest.data1,
                    (False, "The data has missing column labels."),
            ),
            (
                    pytest.data2,
                    (False, "The data has missing column labels."),
            ),
            (
                    "None",
                    (False, "The inputs do not meet the validation rules."),
            ),
            (
                    "",
                    (False, "The inputs do not meet the validation rules."),
            ),
            (
                    [],
                    (False, "The inputs do not meet the validation rules."),
            ),
            (
                    {},
                    (False, "The inputs do not meet the validation rules."),
            ),
            (
                    1234,
                    (False, "The inputs do not meet the validation rules."),
            ),
        ],
    )
    def test_validate(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.validate() == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    (pytest.data.shape[0], pytest.data.shape[1]),
            ),
            (
                    "None",
                    None,
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
                    1234,
                    None,
            ),
        ],
    )
    def test_get_shape(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.get_shape() == expected_output

    @pytest.mark.parametrize(
        "data, expected_output",
        [
            (
                    pytest.data,
                    None,
            ),
            (
                    "None",
                    None,
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
                    1234,
                    None,
            ),
        ],
    )
    def test_convert_to_dict(self, data, expected_output):
        new_plugin = Plugin(data)
        assert new_plugin.convert_to_dict() == expected_output

    @pytest.mark.parametrize(
        "data_path, delimiter_char, expected_output",
        [
            (
                    "/home/ubuntu/my_csv.csv",
                    ":",
                    None
            ),
            (
                    "src/delimiterdata/user_defined_files/sv_colon.txt",
                    ":",
                    pd.DataFrame([["Alex", 30, "M"], ["Belle", 29, "F"], ["Chansey", 50, "F"]],
                                 columns=["Name", "Age", "Gender"], index=[0, 1, 2])
            ),
            (
                    None,
                    ":",
                    None
            ),
            (
                    "None",
                    ":",
                    None
            ),
            (
                    [],
                    ":",
                    None
            ),
            (
                    {},
                    ":",
                    None
            ),
            (
                    1234,
                    ":",
                    None
            ),
        ],
    )
    def test_read_csv_as_df(self, data_path, delimiter_char, expected_output):
        new_plugin = Plugin(None)
        if expected_output is None:
            assert new_plugin.read_csv_as_df(data_path, delimiter_char) is expected_output
        else:
            assert new_plugin.read_csv_as_df(data_path, delimiter_char).equals(expected_output)

    @pytest.mark.parametrize(
        "image_paths, column_name, expected_output",
        [
            (
                    ["/home/ubuntu/my_image.png"],
                    "my_column_name",
                    DataFrame(["/home/ubuntu/my_image.png"], columns=["my_column_name"])
            ),
            (
                    None,
                    "my_column_name",
                    None
            ),
            (
                    "None",
                    "my_column_name",
                    None
            ),
            (
                    [],
                    "my_column_name",
                    DataFrame([], columns=["my_column_name"])
            ),
            (
                    {},
                    "my_column_name",
                    None
            ),
            (
                    1234,
                    "my_column_name",
                    None
            ),
            (
                    ["/home/ubuntu/my_image.png"],
                    None,
                    None
            ),
            (
                    ["/home/ubuntu/my_image.png"],
                    "None",
                    DataFrame(["/home/ubuntu/my_image.png"], columns=["None"])
            ),
            (
                    ["/home/ubuntu/my_image.png"],
                    "",
                    None
            ),
            (
                    ["/home/ubuntu/my_image.png"],
                    {},
                    None
            ),
            (
                    ["/home/ubuntu/my_image.png"],
                    [],
                    None
            ),
            (
                    ["/home/ubuntu/my_image.png"],
                    123,
                    None
            ),
        ],
    )
    def test_read_image_as_df(self, image_paths, column_name, expected_output):
        new_plugin = Plugin(None)
        if expected_output is None:
            assert new_plugin.read_image_as_df(image_paths, column_name) is expected_output
        else:
            assert new_plugin.read_image_as_df(image_paths, column_name).equals(expected_output)
