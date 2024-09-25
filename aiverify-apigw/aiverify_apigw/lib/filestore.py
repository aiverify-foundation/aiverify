import os
import io
import re
import hashlib
import shutil
from pathlib import Path, PurePath
from urllib.parse import urljoin

from .s3 import MyS3
from .logging import logger


s3 = None


class InvalidFileStore(Exception):
    """Raised when base file path is invalid or access denied"""
    pass


class FileStoreError(Exception):
    """Raised on general file path error"""
    pass


class InvalidFilename(Exception):
    """Raised when the filename is invalid"""
    pass


def sanitize_filename(filename: str) -> str:
    if not filename[0].isalnum():
        raise InvalidFilename("The first character of the filename must be alphanumeric.")

    # Use regex to replace invalid characters
    sanitized = re.sub(r'[^a-zA-Z0-9.]', '', filename)
    return sanitized


def get_base_data_dir() -> Path | str:
    try:
        mydir = None
        if "APIGW_DATA_DIR" in os.environ:
            data_dir = os.environ["APIGW_DATA_DIR"]
            if data_dir.startswith("s3://"):
                global s3
                s3 = MyS3(data_dir)
                mydir = s3.base_prefix
                logger.info(f"Using S3 data path: {s3.s3_uri}")
            else:
                mydir = Path(os.environ["APIGW_DATA_DIR"])
        else:
            mydir = Path(__file__).parent.parent.parent.joinpath(
                "data").resolve()
        # create directories if no exists
        if isinstance(mydir, Path):
            logger.info(f"Using local data path: {mydir}")
            mydir.mkdir(parents=True, exist_ok=True)
            mydir.joinpath("asset").mkdir(parents=True, exist_ok=True)
        return mydir
    except Exception as e:
        logger.error(f"Unable to access data directory: {e}")
        s3 = None
        raise InvalidFileStore


base_data_dir = get_base_data_dir()
base_plugin_dir = base_data_dir.joinpath("plugin") if isinstance(
    base_data_dir, Path) else urljoin(base_data_dir, "plugin/")
base_artifacts_dir = base_data_dir.joinpath("artifacts") if isinstance(
    base_data_dir, Path) else urljoin(base_data_dir, "artifacts/")


def is_s3(path: Path | str) -> bool:
    if isinstance(path, Path):
        return False
    elif path.startswith("s3://") and s3 is not None:
        return True
    else:
        raise InvalidFileStore(f"Invalid path: {path}")


def check_valid_filename(filename: str):
    return PurePath(filename).stem.isalnum


def append_filename(filename: str, append_name: str) -> str:
    fpath = PurePath(filename)
    return fpath.stem + append_name + fpath.suffix


def get_suffix(filename: str) -> str:
    return PurePath(filename).suffix.lower()


def get_stem(filename: str) -> str:
    return PurePath(filename).stem


def get_file_digest(contents: io.BytesIO):
    contents.seek(0)
    return hashlib.file_digest(contents, "sha256").digest()

# def absolute_plugin_base_path(source: str) -> Path | str:
#     if isinstance(base_plugin_dir, Path):
#         return base_plugin_dir.joinpath(source).resolve()
#     else:
#         return urljoin(base_plugin_dir, source)
#         # return source

# def relative_plugin_base_path(source: str) -> Path | str:
#     logger.debug(f"relative_asset_path: {source}")
#     if isinstance(base_plugin_dir, Path):
#         return Path(source).relative_to(base_plugin_dir)
#     else:
#         # relpath = urljoin(base_plugin_dir, source)
#         relpath = source
#         if not relpath.startswith(base_plugin_dir):
#             raise FileStoreError("Invalid upload filepath")
#         return relpath[len(base_plugin_dir):]


def get_plugin_folder(gid: str) -> Path | str:
    """Return the plugin folder path

    Args:
        gid (str): Plugin GID

    Returns:
        Path | str: path to plugin directory.
    """
    if isinstance(base_plugin_dir, Path):
        return base_plugin_dir.joinpath(gid)
    else:
        return urljoin(base_plugin_dir, f"{gid}/")


def get_plugin_component_folder(gid: str, component_type: str) -> Path | str:
    plugin_path = get_plugin_folder(gid)
    if isinstance(plugin_path, Path):
        return plugin_path.joinpath(component_type)
    else:
        return urljoin(plugin_path, f"{component_type}/")


def save_plugin(gid: str, source_dir: Path):
    folder = get_plugin_folder(gid)
    logger.debug(f"Copy plugin folder from {source_dir} to {folder}")
    if isinstance(folder, Path):
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source_dir, folder, dirs_exist_ok=True)
    elif s3 is not None:
        # folder is s3 prefix
        if s3.check_s3_prefix_exists(folder):
            s3.delete_objects_under_prefix(folder)  # if prefix exists, delete
        s3.upload_directory_to_s3(source_dir, folder)


def delete_plugin(gid: str):
    folder = get_plugin_folder(gid)

    try:
        if isinstance(folder, Path):
            if not folder.exists() or not folder.is_dir():
                logger.warn(
                    f"Asset {gid} path not found or not directory")
                return
            shutil.rmtree(folder, ignore_errors=True)
        elif s3 is not None:
            # List objects within the specified prefix
            s3.delete_objects_under_prefix(folder)

    except Exception as e:
        logger.warn(f"Unable to delete folder {folder}: {e}")


def delete_all_plugins():
    try:
        if isinstance(base_plugin_dir, Path):
            if not base_plugin_dir.exists() or not base_plugin_dir.is_dir():
                return
            shutil.rmtree(base_plugin_dir, ignore_errors=True)
        elif s3 is not None:
            # List objects within the specified prefix
            s3.delete_objects_under_prefix(base_plugin_dir)

    except Exception as e:
        logger.warn(f"Unable to delete folder {base_plugin_dir}: {e}")


def get_artifacts_folder(test_result_id: str):
    if isinstance(base_artifacts_dir, Path):
        folder = base_artifacts_dir.joinpath(test_result_id)
        if not folder.exists():
            folder.mkdir(parents=True, exist_ok=True)
        return folder
    else:
        return urljoin(base_artifacts_dir, f"{test_result_id}/")


def save_artifact(test_result_id: str, filename: str, data: bytes):
    filename = sanitize_filename(filename)
    folder = get_artifacts_folder(test_result_id)
    if isinstance(folder, Path):
        filepath = folder.joinpath(filename)
        with open(filepath, "wb") as fp:
            fp.write(data)
        return filepath
    elif s3 is not None:
        key = urljoin(folder, filename)
        s3.put_object(key, data)
        return key


def get_artifact(test_result_id: str, filename: str):
    filename = sanitize_filename(filename)
    folder = get_artifacts_folder(test_result_id)
    if isinstance(folder, Path):
        filepath = folder.joinpath(filename)
        with open(filepath, "rb") as fp:
            data = fp.read()
        return data
    elif s3 is not None:
        key = urljoin(folder, filename)
        data = s3.get_object(key)
        return data
