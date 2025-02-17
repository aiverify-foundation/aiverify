import os
from pathlib import Path
import shutil
import hashlib
import zipfile

from .logging import logger


class InvalidFileCache(Exception):
    pass


class FileCacheError(Exception):
    pass


def get_base_data_dir() -> Path:
    try:
        mydir = None
        if "TEWORKER_DATA_DIR" in os.environ:
            mydir = Path(os.environ["TEWORKER_DATA_DIR"])
        else:
            mydir = Path(__file__).parent.parent.parent.joinpath("data").resolve()
        # create directories if no exists
        if not mydir.exists():
            mydir.mkdir(parents=True, exist_ok=True)
        logger.info(f"data path: {mydir}")
        return mydir
    except Exception as e:
        logger.error(f"Unable to access data directory: {e}")
        s3 = None
        raise InvalidFileCache(e)


base_data_dir: Path = get_base_data_dir()


# base_algo_dir = get_data_subdir("algorithms")
# base_model_dir = get_data_subdir("models")
# base_dataset_dir = get_data_subdir("datasets")

class FileCache:
    def __init__(self, subdir_name: str) -> None:
        """Constructor for FileCache

        Args:
            subdir_name (str): name of data subdir
        """
        self.subdir_name = subdir_name
        subdir = base_data_dir.joinpath(subdir_name)
        if not subdir.exists():
            subdir.mkdir(parents=True, exist_ok=True)
        self.subdir = subdir

    def get_cached(self, filename: str, hash: str | None) -> Path | None:
        """Return path if exists, otherwise return None

        Args:
            filename (str): filename of file or folder to check
            hash (str | None): hash of file or folder zip

        Returns:
            Path|None: Path if exists, None if path not exists or does not match hash
        """
        cache_path = self.subdir.joinpath(filename)
        if not cache_path.exists():
            return None
        if hash:  # if have hash, check hash
            hash_filename = f"{filename}.hash"
            hash_path = self.subdir.joinpath(hash_filename)
            if not hash_path.exists():
                return None
            with open(hash_path, 'r') as f:
                stored_hash = f.read().strip()
                return None if stored_hash != hash else cache_path
        else:
            return cache_path

    def store_cache(self, source_path: Path) -> Path:
        """Store the source_path to cache. If source_path is a zip, it will be extracted.

        Args:
            source_path (Path): Source path of file to cache.

        Raises:
            FileCacheError

        Returns:
            Path: Path to cache_path
        """
        if not source_path.exists():
            raise FileCacheError(f"Source path {source_path} not found")
        if not source_path.is_file():
            raise FileCacheError(f"Source path {source_path} is not a file")
        is_zip = zipfile.is_zipfile(source_path.name)
        hasher = hashlib.sha256()
        with open(source_path, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        file_hash = hasher.hexdigest()
        filename = source_path.name
        if is_zip:
            filename = filename[:-4]
        cache_path = self.subdir.joinpath(filename)
        hash_filepath = self.subdir.joinpath(f"{filename}.hash")
        if cache_path.exists():  # delete existing path if any
            if cache_path.is_dir():
                shutil.rmtree(cache_path)
            elif cache_path.is_file():
                cache_path.unlink()
        if hash_filepath.exists():
            hash_filepath.unlink()
        if is_zip:
            with zipfile.ZipFile(source_path, 'r') as zip_ref:
                zip_ref.extractall(cache_path)
        else:
            shutil.copy2(source_path, cache_path)
        with open(hash_filepath, 'w') as f:
            f.write(file_hash)
        return cache_path
