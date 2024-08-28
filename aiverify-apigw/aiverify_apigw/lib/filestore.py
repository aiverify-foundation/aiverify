from hmac import digest
from math import e
import os
import io
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
        logger.error("Unable to access data directory")
        s3 = None
        raise InvalidFileStore


base_data_dir = get_base_data_dir()
base_plugin_dir = base_data_dir.joinpath("plugin") if isinstance(
    base_data_dir, Path) else urljoin(base_data_dir, "plugin/")


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


# def save_plugin(contents: io.BytesIO, asset_id: str, filename: str, overwrite: bool = False):
#     """Compute file hash and use as filename

#     Args:
#         contents (io.BytesIO): file contents
#         asset_id (str): asset_id
#         filename (str): filename
#         overwrite (bool, optional): set True to overwrite existing file. Defaults to False.

#     Raises:
#         InvalidFileStore

#     Returns:
#         UploadResponse

#     """
#     contents.seek(0)
#     asset_path = get_asset_path(asset_id, filename)

#     if isinstance(asset_path, Path):
#         if not overwrite and asset_path.exists():
#             # raise FileStoreError(f"Local file already exists")
#             return UploadResponse(asset_path=asset_path, asset_id=asset_id, is_duplicate=True)
#         with open(asset_path, 'wb') as f:
#             f.write(contents.getbuffer())
#     elif s3 is not None:
#         if not overwrite and s3.check_s3_object_exists(asset_path):
#             raise FileStoreError("S3 object already exists")
#         s3.put_object(key=asset_path, body=contents)
#     else:
#         raise InvalidFileStore

#     return UploadResponse(asset_path=asset_path, asset_id=asset_id, is_duplicate=False)


# def delete_asset(asset_id: str):
#     folder = get_plugin_folder(asset_id)

#     try:
#         if isinstance(folder, Path):
#             if not folder.exists() or not folder.is_dir():
#                 logger.warn(
#                     f"Asset {asset_id} path not found or not directory")
#                 return
#             shutil.rmtree(folder, ignore_errors=True)
#         elif s3 is not None:
#             # List objects within the specified prefix
#             obj_keys = s3.list_object_keys(folder)
#             for key in obj_keys:
#                 s3.delete_object(key)

#     except Exception as e:
#         logger.warn(f"Unable to delete folder {folder}: {e}")


# def get_asset(asset_id: str, filename: str):
#     """Get asset

#     Args:
#         asset_id (str): asset ID
#         filename (str): filename of asset

#     Raises:
#         InvalidFileStore

#     Returns:
#         asset content or None
#     """
#     file_path = get_asset_path(asset_id, filename)
#     try:
#         if isinstance(file_path, Path):
#             with open(file_path, "rb") as file:
#                 content = file.read()
#                 return content
#         elif s3 is not None:
#             return s3.get_object(key=file_path)
#         else:
#             raise InvalidFileStore
#     except:
#         return None
