import logging
from pathlib import Path
from typing import Any, Dict, Tuple

import pytest
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.data_manager import DataManager
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.enums.serializer_plugin_type import (
    SerializerPluginType,
)
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


class RandomPluginTypeData:
    _data = None
    _plugin_type = [
        DataPluginType.DELIMITER,
        DataPluginType.IMAGE,
        DataPluginType.PANDAS,
    ]
    _plugin_counter = 0

    def __init__(self):
        pass

    def Plugin(self, data=None):
        if data is not None:
            self._data = data
        return self

    def is_supported(self):
        return True

    def get_plugin_type(self):
        return PluginType.DATA

    def get_data_plugin_type(self):
        output = self._plugin_type[self._plugin_counter]
        self._plugin_counter += 1

        # reset counter
        if self._plugin_counter >= len(self._plugin_type):
            self._plugin_counter = 0

        return output

    def convert_to_dict(self):
        return {"data_path": "tests/data/test_colon.csv", "delimiter_type": ","}


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


class PandasData(IData):
    _data = None
    _plugin_type = DataPluginType.PANDAS

    def __init__(self):
        pass

    def Plugin(self, data=None):
        if data is not None:
            self._data = data
        return self

    @staticmethod
    def get_data_plugin_type() -> DataPluginType:
        return PandasData._plugin_type

    @staticmethod
    def get_metadata() -> PluginMetadata:
        pass

    @staticmethod
    def get_plugin_type():
        return PluginType.DATA

    def setup(self) -> Tuple[bool, str]:
        pass

    def get_data(self) -> Any:
        return self._data

    def set_data(self, data: Any) -> None:
        self._data = data

    def is_supported(self):
        if isinstance(self._data, PandasData):
            return True

        elif isinstance(self._data, str):
            new_data = Path(self._data)
            if (
                new_data.suffix == ".png"
                or new_data.suffix == ".jpg"
                or new_data.suffix == ".csv"
            ):
                return False
            else:
                return True

        else:
            return False

    def keep_ground_truth(self, ground_truth: str) -> bool:
        pass

    def read_labels(self) -> Dict:
        pass

    def remove_ground_truth(self, ground_truth: str) -> None:
        pass

    def validate(self) -> Tuple[bool, str]:
        pass

    def get_shape(self) -> Tuple[int, int]:
        pass

    def convert_to_dict(self) -> Dict:
        pass

    def read_csv_as_df(self, data_path, delimiter_type):
        return pytest.pandas_data

    def read_image_as_df(self, data_path, column_name):
        return pytest.pandas_data


class ImageData:
    _data = None
    _plugin_type = DataPluginType.IMAGE

    def __init__(self):
        pass

    def Plugin(self, data=None):
        if data is not None:
            self._data = data
        return self

    def is_supported(self):
        if isinstance(self._data, ImageData):
            return True

        elif isinstance(self._data, str):
            new_data = Path(self._data)
            if new_data.suffix == ".png" or new_data.suffix == ".jpg":
                return True
            else:
                return False

        else:
            return False

    def get_plugin_type(self):
        return PluginType.DATA

    def get_data_plugin_type(self):
        return self._plugin_type

    def convert_to_dict(self):
        pass


class DelimiterData:
    _data = None
    _plugin_type = DataPluginType.DELIMITER

    def __init__(self):
        pass

    def Plugin(self, data=None):
        if data is not None:
            self._data = data
        return self

    def is_supported(self):
        if isinstance(self._data, DelimiterData):
            return True

        elif isinstance(self._data, str):
            new_data = Path(self._data)
            if new_data.suffix == ".csv":
                return True
            else:
                return False

        else:
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

    def __init__(self, to_deserialize, to_error):
        self._to_deserialize = to_deserialize
        self._to_error = to_error
        self.Plugin = self

    def deserialize_data(self, data_file):
        if self._to_error:
            raise RuntimeError("Error")

        if self._to_deserialize:
            return data_file
        else:
            return None

    def get_serializer_plugin_type(self):
        return SerializerPluginType.PICKLE


class TestCollectionDataManager:
    pytest.pandas_data = PandasData()
    pytest.image_data = ImageData()
    pytest.dem_data = DelimiterData()
    pytest.random_data = RandomData()
    pytest.random_plugin_data = RandomPluginTypeData()
    pytest.serializer = Serializer(True, False)
    pytest.no_serializer = Serializer(False, False)
    pytest.error_serializer = Serializer(False, True)
    pytest.my_logger = logging.getLogger("example_logger")

    @pytest.fixture(autouse=True)
    def init(self):
        # Reset
        DataManager._logger = None

        # Perform tests
        yield

        # Reset
        DataManager._logger = None

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
        assert DataManager._logger is None
        DataManager.set_logger(logger)
        assert DataManager._logger == expected_response

    @pytest.mark.parametrize(
        "data_file, data_plugins, serializer_plugins, expected_output",
        [
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/folderofcsv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/folderofsav",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofimage",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/mixedfolder",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"demdata": pytest.dem_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofcsv",
                {"demdata": pytest.dem_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofimage",
                {"imagedata": pytest.image_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofsav",
                {"imagedata": pytest.image_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            # Different data
            (
                "tests/data/test_colon.csv",
                {"data": pytest.dem_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting data instance (unsupported format): "
                    "['tests/data/test_colon.csv']",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.random_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            # Different serializer
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.no_serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing dataset: tests/data/test_colon.csv",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.error_serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing dataset: tests/data/test_colon.csv",
                ),
            ),
            # data file
            (
                None,
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: None, {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "None",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (False, None, None, "There are no data instances found"),
            ),
            (
                {},
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: {}, {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                [],
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: [], {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                123,
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: 123, {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            # data plugins
            (
                "tests/data/test_colon.csv",
                None,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, None, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                "None",
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, None, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                [],
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, [], {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                123,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, 123, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            # serializer plugins
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                None,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, None",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                "None",
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, None",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing dataset: tests/data/test_colon.csv",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                [],
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, []",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                123,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, 123",
                ),
            ),
        ],
    )
    def test_read_data_no_logger(
        self, data_file, data_plugins, serializer_plugins, expected_output
    ):
        """
        Tests reading data file with no logger
        """
        response = DataManager.read_data(data_file, data_plugins, serializer_plugins)
        assert response == expected_output

    @pytest.mark.parametrize(
        "data_mock_response, data_file, data_plugins, serializer_plugins, expected_output",
        [
            (
                [
                    "tests/data/mixedfolder/3.png",
                    "tests/data/mixedfolder/7.png",
                    "tests/data/mixedfolder/pickle2.sav",
                    "tests/data/mixedfolder/pickle1.sav",
                    "tests/data/mixedfolder/2.png",
                    "tests/data/mixedfolder/1.png",
                    "tests/data/mixedfolder/pickle.sav",
                ],
                "tests/data/mixedfolder",
                {"data": pytest.random_plugin_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting data instance (unsupported format): "
                    "['tests/data/mixedfolder/3.png', 'tests/data/mixedfolder/7.png', "
                    "'tests/data/mixedfolder/pickle2.sav', 'tests/data/mixedfolder/pickle1.sav', "
                    "'tests/data/mixedfolder/2.png', 'tests/data/mixedfolder/1.png', "
                    "'tests/data/mixedfolder/pickle.sav']",
                ),
            ),
            (
                [
                    "tests/data/folderofimage/3.png",
                    "tests/data/folderofimage/7.png",
                    "tests/data/folderofimage/2.png",
                    "tests/data/folderofimage/1.png",
                ],
                "tests/data/folderofimage",
                {"imagedata": pytest.image_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting data instance (unsupported format): "
                    "['tests/data/folderofimage/3.png', "
                    "'tests/data/folderofimage/7.png', "
                    "'tests/data/folderofimage/2.png', "
                    "'tests/data/folderofimage/1.png']",
                ),
            ),
        ],
    )
    def test_read_data_no_logger_with_fixed_file_positions(
        self,
        mocker,
        data_mock_response,
        data_file,
        data_plugins,
        serializer_plugins,
        expected_output,
    ):
        """
        Tests reading data file with no logger
        """
        mocker.patch.object(
            DataManager,
            "_get_file_paths",
            return_value=data_mock_response,
        )
        response = DataManager.read_data(data_file, data_plugins, serializer_plugins)
        assert response == expected_output

    @pytest.mark.parametrize(
        "data_file, data_plugins, serializer_plugins, expected_output",
        [
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/folderofcsv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/folderofsav",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofimage",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/mixedfolder",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"demdata": pytest.dem_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofcsv",
                {"demdata": pytest.dem_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofimage",
                {"imagedata": pytest.image_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            (
                "tests/data/folderofsav",
                {"imagedata": pytest.image_data, "pandasdata": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (True, pytest.pandas_data, pytest.serializer, ""),
            ),
            # Different data
            (
                "tests/data/test_colon.csv",
                {"data": pytest.dem_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting data instance (unsupported format): "
                    "['tests/data/test_colon.csv']",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.random_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            # Different serializer
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.no_serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing dataset: tests/data/test_colon.csv",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.error_serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing dataset: tests/data/test_colon.csv",
                ),
            ),
            # data file
            (
                None,
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: None, {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "None",
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (False, None, None, "There are no data instances found"),
            ),
            (
                {},
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: {}, {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                [],
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: [], {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                123,
                {"data": pytest.pandas_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: 123, {'data': "
                    + str(pytest.pandas_data)
                    + "}, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            # data plugins
            (
                "tests/data/test_colon.csv",
                None,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, None, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                "None",
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, None, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error identifying dataset: <class 'str'>",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                [],
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, [], {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                123,
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: "
                    "tests/data/test_colon.csv, 123, {'serializer1': "
                    + str(pytest.serializer)
                    + "}",
                ),
            ),
            # serializer plugins
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                None,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, None",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                "None",
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, None",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                {},
                (
                    False,
                    None,
                    None,
                    "There was an error deserializing dataset: tests/data/test_colon.csv",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                [],
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, []",
                ),
            ),
            (
                "tests/data/test_colon.csv",
                {"data": pytest.pandas_data},
                123,
                (
                    False,
                    None,
                    None,
                    "There was an error validating the input parameters: tests/data/test_colon.csv, {'data': "
                    + str(pytest.pandas_data)
                    + "}, 123",
                ),
            ),
        ],
    )
    def test_read_data_logger(
        self, data_file, data_plugins, serializer_plugins, expected_output
    ):
        """
        Tests reading data file with logger
        """
        DataManager.set_logger(pytest.my_logger)
        response = DataManager.read_data(data_file, data_plugins, serializer_plugins)
        assert response == expected_output

    @pytest.mark.parametrize(
        "data_mock_response, data_file, data_plugins, serializer_plugins, expected_output",
        [
            (
                [
                    "tests/data/mixedfolder/3.png",
                    "tests/data/mixedfolder/7.png",
                    "tests/data/mixedfolder/pickle2.sav",
                    "tests/data/mixedfolder/pickle1.sav",
                    "tests/data/mixedfolder/2.png",
                    "tests/data/mixedfolder/1.png",
                    "tests/data/mixedfolder/pickle.sav",
                ],
                "tests/data/mixedfolder",
                {"data": pytest.random_plugin_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting data instance (unsupported format): "
                    "['tests/data/mixedfolder/3.png', 'tests/data/mixedfolder/7.png', "
                    "'tests/data/mixedfolder/pickle2.sav', 'tests/data/mixedfolder/pickle1.sav', "
                    "'tests/data/mixedfolder/2.png', 'tests/data/mixedfolder/1.png', "
                    "'tests/data/mixedfolder/pickle.sav']",
                ),
            ),
            (
                [
                    "tests/data/folderofimage/3.png",
                    "tests/data/folderofimage/7.png",
                    "tests/data/folderofimage/2.png",
                    "tests/data/folderofimage/1.png",
                ],
                "tests/data/folderofimage",
                {"imagedata": pytest.image_data},
                {"serializer1": pytest.serializer},
                (
                    False,
                    None,
                    pytest.serializer,
                    "There was an error getting data instance (unsupported format): "
                    "['tests/data/folderofimage/3.png', "
                    "'tests/data/folderofimage/7.png', "
                    "'tests/data/folderofimage/2.png', "
                    "'tests/data/folderofimage/1.png']",
                ),
            ),
        ],
    )
    def test_read_data_logger_with_fixed_file_positions(
        self,
        mocker,
        data_mock_response,
        data_file,
        data_plugins,
        serializer_plugins,
        expected_output,
    ):
        """
        Tests reading data file with logger
        """
        mocker.patch.object(
            DataManager,
            "_get_file_paths",
            return_value=data_mock_response,
        )
        DataManager.set_logger(pytest.my_logger)
        response = DataManager.read_data(data_file, data_plugins, serializer_plugins)
        assert response == expected_output
