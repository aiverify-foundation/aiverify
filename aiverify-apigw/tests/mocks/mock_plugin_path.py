from pathlib import Path
from unittest.mock import MagicMock

from aiverify_apigw.models.plugin_model import AlgorithmModel
from .mock_data_plugin import _create_mock_plugin


def _create_mock_file(filename: str):
    mock_file = MagicMock(spec=Path)
    mock_file.name = filename
    mock_file.exists.return_value = True
    mock_file.is_dir.return_value = True
    mock_file.is_file.return_value = False
    return mock_file


def _create_mock_algorithm_path(algo: AlgorithmModel):
    mock_algo = MagicMock(spec=Path)
    mock_algo.name = algo.cid
    mock_algo.exists.return_value = True
    mock_algo.is_dir.return_value = True
    mock_algo.is_file.return_value = False
    meta_filename = f"{algo.cid}.meta.json"

    def joinpath_side_effect(other: str):
        """Simulate joinpath method to return another instance."""
        if other == meta_filename:
            return _create_mock_file(meta_filename)

        match other:
            case 'input.schema.json':
                return _create_mock_file(other)
            case 'output.schema.json':
                return _create_mock_file(other)
            case 'requirements.txt':
                return _create_mock_file(other)
            case _:
                mock_file = MagicMock(spec=Path)
                mock_file.name = other
                mock_file.exists.return_value = False
                return mock_file

    mock_algo.joinpath.side_effect = joinpath_side_effect
    return mock_algo


def create_mock_plugin_path(path: str | None = None):
    """A mock class to simulate pathlib.Path plugin folder."""

    plugin_mock = MagicMock(spec=Path)
    plugin_mock.name = "fake_plugin" if path is None else path
    plugin_mock.exists.return_value = True
    plugin_mock.is_dir.return_value = True
    plugin_mock.is_file.return_value = False

    mock_data = _create_mock_plugin(num_algo=1)
    plugin_mock.mock_data = mock_data

    def joinpath_side_effect(other: str):
        """Simulate joinpath method to return another instance."""
        match other:
            case 'plugin.meta.json':
                return _create_mock_file(other)
            # case 'algorithms':
            #     # mock algorithm dir
            #     mock_dir = MagicMock(spec=Path)
            #     mock_dir.name = other
            #     mock_dir.exists.return_value = True
            #     mock_dir.is_dir.return_value = True
            #     mock_dir.is_file.return_value = False
            #     # mock algorithms
            #     mock_algo_dir = []
            #     for algo in mock_data.algorithms:
            #         mock_algo = _create_mock_algorithm_path(algo)
            #         mock_algo_dir.append(mock_algo)
            #     mock_dir.iterdir.return_value = mock_algo_dir
            #     return mock_dir
            case _:
                mock_file = MagicMock(spec=Path)
                mock_file.name = other
                mock_file.exists.return_value = False
                return mock_file

    plugin_mock.joinpath.side_effect = joinpath_side_effect

    return plugin_mock
