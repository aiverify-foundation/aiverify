import pytest
import os
import zipfile
from unittest.mock import patch
from pathlib import Path
from aiverify_test_engine_worker.lib.filecache import (
    FileCache,
    get_base_data_dir,
    InvalidFileCache,
    FileCacheError,
)

# Fixture to mock environment variables


@pytest.fixture
def mock_env_vars(mocker):
    return mocker.patch.dict(os.environ, {"TEWORKER_DATA_DIR": "/tmp/data"})


# Fixture to mock the base data directory
@pytest.fixture
def mock_base_data_dir(tmp_path):
    return tmp_path / "data"


# Fixture to create a FileCache instance
@pytest.fixture
def file_cache(mock_base_data_dir):
    return FileCache(subdir_name="test_cache")


# Test get_base_data_dir function
class TestGetBaseDataDir:
    def test_with_env_var(self, mock_env_vars):
        result = get_base_data_dir()
        assert result == Path("/tmp/data")

    def test_without_env_var(self, tmp_path):
        with patch.dict(os.environ, {}, clear=True):
            result = get_base_data_dir()
        expected_path = Path(
            __file__).parent.parent.parent.joinpath("data").resolve()
        assert result == expected_path

    def test_mkdir_error(self):
        with patch.dict(os.environ, {"TEWORKER_DATA_DIR": f"/invalid"}, clear=True):
            with patch("pathlib.Path.mkdir", side_effect=Exception("Permission denied")):
                with pytest.raises(InvalidFileCache):
                    get_base_data_dir()


# Test FileCache initialization
class TestFileCacheInitialization:
    def test_initialization(self, file_cache):
        assert file_cache.subdir_name == "test_cache"
        assert file_cache.subdir.exists()


# Test get_cache_paths method
class TestGetCachePaths:
    def test_get_cache_paths(self, file_cache):
        cache_path, hash_path = file_cache.get_cache_paths("test_file")
        assert cache_path == file_cache.subdir / "test_file"
        assert hash_path == file_cache.subdir / "test_file.hash"


# Test get_cached method
class TestGetCached:
    def test_without_hash(self, file_cache):
        # Create a dummy file in the cache
        (file_cache.subdir / "test_file").touch()
        result = file_cache.get_cached("test_file", hash=None)
        assert result == file_cache.subdir / "test_file"

    def test_with_hash(self, file_cache):
        # Create a dummy file and hash file in the cache
        (file_cache.subdir / "test_file").touch()
        (file_cache.subdir / "test_file.hash").write_text("abc123")
        result = file_cache.get_cached("test_file", hash="abc123")
        assert result == file_cache.subdir / "test_file"

    def test_with_invalid_hash(self, file_cache):
        # Create a dummy file and hash file in the cache
        (file_cache.subdir / "test_file").touch()
        (file_cache.subdir / "test_file.hash").write_text("abc123")
        result = file_cache.get_cached("test_file", hash="wrong_hash")
        assert result is None


# Test delete_cache method
class TestDeleteCache:
    def test_delete_cache(self, file_cache):
        # Create dummy files in the cache
        (file_cache.subdir / "test_file").touch()
        (file_cache.subdir / "test_file.hash").touch()
        file_cache.delete_cache("test_file")
        assert not (file_cache.subdir / "test_file").exists()
        assert not (file_cache.subdir / "test_file.hash").exists()


# Test store_cache method
class TestStoreCache:
    def test_store_cache_file(self, file_cache, tmp_path):
        # Create a dummy source file
        source_file = tmp_path / "source_file.txt"
        source_file.write_text("test content")
        result = file_cache.store_cache(
            source_file, "test_file", file_hash=None)
        assert result == file_cache.subdir / "test_file"
        assert (file_cache.subdir / "test_file").exists()
        assert (file_cache.subdir / "test_file.hash").exists()

    def test_store_cache_zip(self, file_cache, tmp_path):
        # Create a dummy zip file
        source_zip = tmp_path / "source_file.zip"
        with zipfile.ZipFile(source_zip, "w") as zipf:
            zipf.writestr("file1.txt", "test content")
        result = file_cache.store_cache(
            source_zip, "test_file", file_hash=None)
        assert result == file_cache.subdir / "test_file"
        assert (file_cache.subdir / "test_file").exists()
        assert (file_cache.subdir / "test_file.hash").exists()

    def test_store_cache_error_invalid_source(self, file_cache):
        with pytest.raises(FileCacheError):
            file_cache.store_cache(Path("/invalid/path"),
                                   "test_file", file_hash=None)
