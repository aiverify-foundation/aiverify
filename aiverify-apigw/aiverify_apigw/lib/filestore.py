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
import json
from typing import Any

from .s3 import MyS3
from .logging import logger
from .file_utils import compute_file_hash


s3 = None


class InvalidFileStore(Exception):
    """Raised when base file path is invalid or access denied"""

    pass


class FileStoreError(Exception):
    """Raised on general file path error"""

    pass


def check_relative_to_base(base_path: Path | str, filepath: str) -> bool:
    print(f"check_relative_to_base: {base_path} -> {filepath}")
    if isinstance(base_path, Path):
        filepath = Path(filepath)
        full_path = base_path / filepath
        return full_path.is_relative_to(base_path)
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
base_models_dir = (
    base_data_dir.joinpath("models") if isinstance(base_data_dir, Path) else urljoin(base_data_dir, "models/")
)
base_dataset_dir = (
    base_data_dir.joinpath("datasets") if isinstance(base_data_dir, Path) else urljoin(base_data_dir, "datasets/")
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


def get_plugin_mdx_bundles_folder(gid: str) -> Path | str:
    plugin_path = get_plugin_folder(gid)
    if isinstance(plugin_path, Path):
        return plugin_path.joinpath("mdx_bundles")
    else:
        return urljoin(plugin_path, "mdx_bundles/")


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


def save_mdx_bundles(gid: str, source_dir: Path):
    # source_bundles_path = source_dir.joinpath("mdx_bundles")
    bundler_folder = get_plugin_mdx_bundles_folder(gid)
    if isinstance(bundler_folder, Path):
        shutil.copytree(source_dir, bundler_folder, dirs_exist_ok=True)
    elif s3 is not None:
        if s3.check_s3_prefix_exists(bundler_folder):
            s3.delete_objects_under_prefix(bundler_folder)  # if prefix exists, delete
        # s3.upload_directory_to_s3(source_dir, folder)
        s3.upload_directory_to_s3(source_dir, bundler_folder)


def save_plugin_algorithm(gid: str, cid: str, source_dir: Path):
    folder = get_plugin_component_folder(gid, "algorithms")
    logger.debug(f"Save algorithm {cid} folder from {source_dir} to {folder}")
    zip_filename = f"{cid}.zip"
    hash_filename = f"{cid}.hash"
    return _save_plugin(source_dir, folder, zip_filename, hash_filename)


def save_plugin_widgets(gid: str, source_dir: Path):
    # folder = get_plugin_component_folder(gid, "widgets")
    folder = get_plugin_folder(gid)
    logger.debug(f"Save widgets folder from {source_dir} to {folder}")
    zip_filename = "widgets.zip"
    hash_filename = "widgets.hash"
    return _save_plugin(source_dir, folder, zip_filename, hash_filename)


def save_plugin_inputs(gid: str, source_dir: Path):
    # folder = get_plugin_component_folder(gid, "inputs")
    folder = get_plugin_folder(gid)
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


def get_plugin_widgets_zip(gid: str) -> bytes:
    folder = get_plugin_folder(gid)
    zip_filename = "widgets.zip"
    return _get_zip(folder, zip_filename)


def get_plugin_mdx_bundle(gid: str, cid: str, summary: bool = False) -> Any:
    bundle_folder = get_plugin_mdx_bundles_folder(gid)
    filename = f"{cid}.summary.bundle.json" if summary else f"{cid}.bundle.json"
    if isinstance(bundle_folder, Path):
        bundle_path = bundle_folder.joinpath(filename)
        if not bundle_path.exists():
            raise FileNotFoundError("Bundle not found")
        with open(bundle_path, "rb") as fp:
            return json.load(fp)
    elif s3 is not None:
        bundle_key = urljoin(bundle_folder, filename)
        if not s3.check_s3_object_exists(bundle_key):
            raise FileNotFoundError("Bundle not found")
        # s3.upload_directory_to_s3(source_dir, folder)
        obj = s3.get_object(bundle_key)
        return json.loads(obj)


def get_plugin_inputs_zip(gid: str) -> bytes:
    folder = get_plugin_folder(gid)
    zip_filename = "inputs.zip"
    return _get_zip(folder, zip_filename)


def delete_plugin(gid: str):
    folder = get_plugin_folder(gid)

    try:
        if isinstance(folder, Path):
            if not folder.exists() or not folder.is_dir():
                logger.warning(f"Asset {gid} path not found or not directory")
                return
            shutil.rmtree(folder, ignore_errors=True)
        elif s3 is not None:
            # List objects within the specified prefix
            s3.delete_objects_under_prefix(folder)

    except Exception as e:
        logger.warning(f"Unable to delete folder {folder}: {e}")


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
        logger.warning(f"Unable to delete folder {base_plugin_dir}: {e}")


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


def get_model_path(filename: str, subfolder: str | None=None):
    if isinstance(base_models_dir, Path):
        folder = base_models_dir.joinpath(subfolder) if subfolder else base_models_dir
        if not folder.exists():
            folder.mkdir(parents=True, exist_ok=True)
        return folder.joinpath(filename)
    else:
        folder = urljoin(base_models_dir, f"{subfolder}/") if subfolder else base_models_dir
        return urljoin(folder, filename)


def save_test_model(source_path: Path) -> str:
    target_path = get_model_path(source_path.name)
    logger.debug(f"Save test model from {source_path} to {target_path}")

    if source_path.is_dir():
        # for folders, zip the content as well
        (zip_content, filehash) = zip_folder(source_path)
        zip_filename = f"{source_path.name}.zip"
        hash_filename = f"{source_path.name}.hash"
        if isinstance(target_path, Path):
            shutil.copytree(source_path, target_path, dirs_exist_ok=True)
            with open(target_path.parent.joinpath(zip_filename), "wb") as fp:
                fp.write(zip_content.read())
            with open(target_path.parent.joinpath(hash_filename), "w") as fp:
                fp.write(filehash)
        elif s3 is not None:
            s3.upload_directory_to_s3(source_path, target_path)
            s3.put_object(zip_filename, zip_content)
            s3.put_object(hash_filename, filehash)
        return filehash
    else:
        filehash = compute_file_hash(source_path)
        if isinstance(target_path, Path):
            shutil.copy(source_path, target_path)
        elif s3 is not None:
            s3.upload_file(source_path.as_posix(), target_path)
        return filehash


def get_test_model(filename: str):
    model_path = get_model_path(filename)
    if not check_relative_to_base(base_models_dir, filename):
        raise FileStoreError(f"Invalid filename {filename}")
    if isinstance(model_path, Path):
        if not model_path.exists():
            raise FileNotFoundError(f"File {filename} is not found")
        if model_path.is_file():
            with open(model_path, "rb") as fp:
                data = fp.read()
            return data
        else:
            # check for zip
            zip_path = model_path.parent.joinpath(f"{model_path.name}.zip")
            if zip_path.exists():
                with open(zip_path, "rb") as fp:
                    data = fp.read()
                return data
            else:
                raise FileNotFoundError(f"File {filename} is not found")
    elif s3 is not None:
        if s3.check_s3_object_exists(model_path):
            return s3.get_object(model_path)
        elif s3.check_s3_prefix_exists(model_path):
            return s3.get_object(f"{model_path}.zip")
        else:
            raise FileNotFoundError(f"File {filename} is not found")


def delete_test_model(filename: str):
    model_path = get_model_path(filename)
    if not check_relative_to_base(base_models_dir, filename):
        raise FileStoreError(f"Invalid filename {filename}")
    if isinstance(model_path, Path):
        if not model_path.exists():
            return
        if model_path.is_dir():
            shutil.rmtree(model_path, ignore_errors=True)
            model_path.parent.joinpath(f"{model_path.name}.zip").unlink(missing_ok=True)
            model_path.parent.joinpath(f"{model_path}.hash").unlink(missing_ok=True)
        else:
            model_path.unlink()
    elif s3 is not None:
        if s3.check_s3_prefix_exists(model_path):
            s3.delete_objects_under_prefix(model_path)
            s3.delete_object(f"{model_path}.zip")
            s3.delete_object(f"{model_path}.hash")
        if s3.check_s3_object_exists(model_path):
            s3.delete_object(model_path)


def get_dataset_path(filename: str, subfolder: str | None=None):
    if isinstance(base_dataset_dir, Path):
        folder = base_dataset_dir.joinpath(subfolder) if subfolder else base_dataset_dir
        if not folder.exists():
            folder.mkdir(parents=True, exist_ok=True)
        return folder.joinpath(filename)
    else:
        folder = urljoin(base_dataset_dir, f"{subfolder}/") if subfolder else base_dataset_dir
        return urljoin(folder, filename)


def save_test_dataset(source_path: Path) -> str:
    target_path = get_dataset_path(source_path.name)
    logger.debug(f"Save test dataset from {source_path} to {target_path}")

    if source_path.is_dir():
        # for folders, zip the content as well
        (zip_content, filehash) = zip_folder(source_path)
        zip_filename = f"{source_path.name}.zip"
        hash_filename = f"{source_path.name}.hash"
        if isinstance(target_path, Path):
            shutil.copytree(source_path, target_path, dirs_exist_ok=True)
            with open(target_path.parent.joinpath(zip_filename), "wb") as fp:
                fp.write(zip_content.read())
            with open(target_path.parent.joinpath(hash_filename), "w") as fp:
                fp.write(filehash)
        elif s3 is not None:
            s3.upload_directory_to_s3(source_path, target_path)
            s3.put_object(zip_filename, zip_content)
            s3.put_object(hash_filename, filehash)
        return filehash
    else:
        filehash = compute_file_hash(source_path)
        if isinstance(target_path, Path):
            shutil.copy(source_path, target_path)
        elif s3 is not None:
            s3.upload_file(source_path.as_posix(), target_path)
        return filehash
    

def get_test_dataset(filename: str):
    dataset_path = get_dataset_path(filename)
    if not check_relative_to_base(base_dataset_dir, filename):
        raise FileStoreError(f"Invalid filename {filename}")
    if isinstance(dataset_path, Path):
        if not dataset_path.exists():
            raise FileNotFoundError(f"File {filename} is not found")
        if dataset_path.is_file():
            with open(dataset_path, "rb") as fp:
                data = fp.read()
            return data
        else:
            # check for zip
            zip_path = dataset_path.parent.joinpath(f"{dataset_path.name}.zip")
            if zip_path.exists():
                with open(zip_path, "rb") as fp:
                    data = fp.read()
                return data
            else:
                raise FileNotFoundError(f"File {filename} is not found")
    elif s3 is not None:
        if s3.check_s3_object_exists(dataset_path):
            return s3.get_object(dataset_path)
        elif s3.check_s3_prefix_exists(dataset_path):
            return s3.get_object(f"{dataset_path}.zip")
        else:
            raise FileNotFoundError(f"File {filename} is not found")


def delete_test_dataset(filename: str):
    dataset_path = get_dataset_path(filename)
    if not check_relative_to_base(base_dataset_dir, filename):
        raise FileStoreError(f"Invalid filename {filename}")
    if isinstance(dataset_path, Path):
        if not dataset_path.exists():
            return
        if dataset_path.is_dir():
            shutil.rmtree(dataset_path, ignore_errors=True)
            dataset_path.parent.joinpath(f"{dataset_path.name}.zip").unlink(missing_ok=True)
            dataset_path.parent.joinpath(f"{dataset_path}.hash").unlink(missing_ok=True)
        else:
            dataset_path.unlink()
    elif s3 is not None:
        if s3.check_s3_prefix_exists(dataset_path):
            s3.delete_objects_under_prefix(dataset_path)
            s3.delete_object(f"{dataset_path}.zip")
            s3.delete_object(f"{dataset_path}.hash")
        if s3.check_s3_object_exists(dataset_path):
            s3.delete_object(dataset_path)