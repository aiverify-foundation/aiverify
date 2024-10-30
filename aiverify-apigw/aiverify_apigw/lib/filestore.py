import os
import shutil
from pathlib import Path
import urllib.parse
import hashlib
from zipfile import ZipFile

urllib.parse.uses_relative.append("s3")
urllib.parse.uses_netloc.append("s3")
from urllib.parse import urljoin
import io

from .s3 import MyS3
from .logging import logger


s3 = None


class InvalidFileStore(Exception):
    """Raised when base file path is invalid or access denied"""

    pass


class FileStoreError(Exception):
    """Raised on general file path error"""

    pass


def check_relative_to_base(base_path: Path | str, filepath: str) -> bool:
    logger.debug(f"check_relative_to_base: {base_path} -> {filepath}")
    if isinstance(base_path, Path):
        return base_path.joinpath(filepath).resolve().is_relative_to(base_path)
    else:
        # for s3 must be full url
        return urljoin(base_path, filepath).startswith(base_path)


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
            mydir = Path(__file__).parent.parent.parent.joinpath("data").resolve()
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
base_plugin_dir = (
    base_data_dir.joinpath("plugin") if isinstance(base_data_dir, Path) else urljoin(base_data_dir, "plugin/")
)
base_artifacts_dir = (
    base_data_dir.joinpath("artifacts") if isinstance(base_data_dir, Path) else urljoin(base_data_dir, "artifacts/")
)


def is_s3(path: Path | str) -> bool:
    if isinstance(path, Path):
        return False
    elif path.startswith("s3://") and s3 is not None:
        return True
    else:
        raise InvalidFileStore(f"Invalid path: {path}")


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


plugin_ignore_patten = shutil.ignore_patterns(
    ".venv",
    "venv",
    "output",
    "node_modules",
    "build",
    "temp",
    "__pycache__",
    ".pytest_cache",
    ".cache" "*.pyc",
)


def zip_folder(folder: Path) -> tuple[io.BytesIO, str]:
    """
    Generate a zip file for the path specifified.

    Args:
        folder (Path): The path of the folder to zip

    Returns:
        str: Filehash of zip file
    """

    logger.debug(f"ziping folder {folder}")

    zip_content = io.BytesIO()
    if not folder.exists() or not folder.is_dir():
        raise FileStoreError(f"Invalid directory for {folder}")

    with ZipFile(zip_content, "w") as zipf:
        for file_path in folder.rglob("**/*"):
            if file_path.is_file():
                zipf.write(file_path, file_path.relative_to(folder))
            elif file_path.is_dir():
                zipf.mkdir(file_path.relative_to(folder).as_posix())

    # Compute file hash using zip_content
    zip_content.seek(0)  # Ensure we're at the start of the BytesIO stream
    hasher = hashlib.sha256()
    while chunk := zip_content.read(8192):
        hasher.update(chunk)
    file_hash = hasher.hexdigest()
    logger.debug(f"Computed file hash: {file_hash}")

    zip_content.seek(0)
    return (zip_content, file_hash)


def _save_plugin(source: Path, target: Path | str, zip_filename: str, hash_filename: str) -> str:
    (zip_content, filehash) = zip_folder(source)
    if isinstance(target, Path):
        target.mkdir(parents=True, exist_ok=True)
        # shutil.copytree(source_dir, folder, dirs_exist_ok=True, ignore=plugin_ignore_patten)
        with open(target.joinpath(zip_filename), "wb") as fp:
            fp.write(zip_content.read())
        with open(target.joinpath(hash_filename), "w") as fp:
            fp.write(filehash)
    elif s3 is not None:
        # folder is s3 prefix
        if s3.check_s3_prefix_exists(target):
            s3.delete_objects_under_prefix(target)  # if prefix exists, delete
        # s3.upload_directory_to_s3(source_dir, folder)
        s3.put_object(urljoin(target, zip_filename), zip_content)
        s3.put_object(urljoin(target, hash_filename), filehash)
    return filehash


def save_plugin(gid: str, source_dir: Path):
    folder = get_plugin_folder(gid)
    logger.debug(f"Save plugin {gid} folder from {source_dir} to {folder}")
    zip_filename = f"{gid}.zip"
    hash_filename = f"{gid}.hash"
    return _save_plugin(source_dir, folder, zip_filename, hash_filename)


def save_plugin_algorithm(gid: str, cid: str, source_dir: Path):
    folder = get_plugin_component_folder(gid, "algorithms")
    logger.debug(f"Save algorithm {cid} folder from {source_dir} to {folder}")
    zip_filename = f"{cid}.zip"
    hash_filename = f"{cid}.hash"
    return _save_plugin(source_dir, folder, zip_filename, hash_filename)


def save_plugin_widgets(gid: str, source_dir: Path):
    folder = get_plugin_component_folder(gid, "widgets")
    logger.debug(f"Save widgets folder from {source_dir} to {folder}")
    zip_filename = "widgets.zip"
    hash_filename = "widgets.hash"
    return _save_plugin(source_dir, folder, zip_filename, hash_filename)


def save_plugin_inputs(gid: str, source_dir: Path):
    folder = get_plugin_component_folder(gid, "inputs")
    logger.debug(f"Save inputs folder from {source_dir} to {folder}")
    zip_filename = "inputs.zip"
    hash_filename = "inputs.hash"
    return _save_plugin(source_dir, folder, zip_filename, hash_filename)


def unzip_plugin(gid: str, target_dir: Path):
    folder = get_plugin_folder(gid)
    zip_filename = f"{gid}.zip"
    if isinstance(folder, Path):
        zip_path = folder.joinpath(zip_filename)
        if zip_path.exists() and zip_path.is_file():
            with ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
        else:
            raise FileStoreError(f"Zip file {zip_path} does not exist or is not a file")
    elif s3 is not None:
        zip_data = s3.get_object(urljoin(folder, zip_filename))
        with ZipFile(io.BytesIO(zip_data), 'r') as zip_ref:
            zip_ref.extractall(target_dir)


def backup_plugin(gid: str, target_dir: Path):
    folder = get_plugin_folder(gid)
    logger.debug(f"Backup plugin folder from {folder} to {target_dir}")
    if target_dir.exists():
        shutil.rmtree(target_dir)
    if isinstance(folder, Path):
        target_dir.mkdir(parents=True, exist_ok=True)
        shutil.copytree(folder, target_dir, dirs_exist_ok=True, ignore=plugin_ignore_patten)
    elif s3 is not None:
        # folder is s3 prefix
        s3.download_directory_from_s3(prefix=folder, target_directory=target_dir)


def _get_zip(folder: Path | str, zip_filename: str) -> bytes:
    if isinstance(folder, Path):
        with open(folder.joinpath(zip_filename), "rb") as fp:
            return fp.read()
    elif s3 is not None:
        data = s3.get_object(urljoin(folder, zip_filename))
        return data
    else:
        raise FileStoreError("Invalid data path configuration")


def get_plugin_zip(gid: str) -> bytes:
    folder = get_plugin_folder(gid)
    zip_filename = f"{gid}.zip"
    return _get_zip(folder, zip_filename)


def get_plugin_algorithm_zip(gid: str, cid: str) -> bytes:
    folder = get_plugin_component_folder(gid, "algorithms")
    zip_filename = f"{cid}.zip"
    return _get_zip(folder, zip_filename)


def delete_plugin(gid: str):
    folder = get_plugin_folder(gid)

    try:
        if isinstance(folder, Path):
            if not folder.exists() or not folder.is_dir():
                logger.warn(f"Asset {gid} path not found or not directory")
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
    # validate input
    if not test_result_id.isalnum():
        raise FileStoreError(f"Invalid test result id {test_result_id}")
    folder = get_artifacts_folder(test_result_id)
    if not check_relative_to_base(folder, filename):
        raise FileStoreError(f"Invalid filename {filename}")
    if isinstance(folder, Path):
        filepath = folder.joinpath(filename)
        # check for nest dir
        if not filepath.parent.exists():
            filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "wb") as fp:
            fp.write(data)
        return filepath
    elif s3 is not None:
        key = urljoin(folder, filename)
        s3.put_object(key, data)
        return key


def get_artifact(test_result_id: str, filename: str):
    if not test_result_id.isalnum():
        raise FileStoreError(f"Invalid test result id {test_result_id}")
    folder = get_artifacts_folder(test_result_id)
    if not check_relative_to_base(folder, filename):
        raise FileStoreError(f"Invalid filename {filename}")
    if isinstance(folder, Path):
        filepath = folder.joinpath(filename).resolve()
        with open(filepath, "rb") as fp:
            data = fp.read()
        return data
    elif s3 is not None:
        key = urljoin(folder, filename)
        data = s3.get_object(key)
        return data
