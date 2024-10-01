import hashlib
from pathlib import Path
from urllib.parse import urlparse

import requests


def is_url(data_path: str) -> bool:
    """
    Check if the data_path is a URL.

    Args:
        data_path (str): The data file/folder path or URL.

    Returns:
        bool: True if the data_path is a URL, False otherwise.
    """
    try:
        result = urlparse(data_path)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False


def get_absolute_path(data_path: str) -> str:
    """
    Get the absolute path of the data_path.

    Args:
        data_path (str): The data file/folder path or URL.

    Returns:
        str: The absolute path of the data_path.
    """
    if is_url(data_path):
        return data_path
    return Path(data_path).resolve().as_uri()


def download_from_url(url: str, cache_dir: str = ".cache/aiverify/") -> str:
    """
    Download a file from the given URL and save it to a cache directory,
    using the original filename and appending a content hash for caching purposes.

    Args:
        url (str): The URL of the file to download.
        cache_dir (str): Directory to cache the downloaded files. Defaults to ".cache/aiverify/".

    Returns:
        str: The path to the downloaded file.
    """
    cache_dir_path = Path(cache_dir)
    cache_dir_path.mkdir(parents=True, exist_ok=True)

    # Extract the original file name and extension from the URL
    parsed_url = urlparse(url)
    original_filename = Path(parsed_url.path).name
    name, ext = Path(original_filename).stem, Path(original_filename).suffix

    # Download the file content
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to download file: HTTP {response.status_code}")

    # Create the cache filename with the format "name.contenthash.ext"
    content_hash = hashlib.md5(response.content).hexdigest()
    cached_file_name = f"{name}.{content_hash}{ext}"
    cached_file_path = cache_dir_path / cached_file_name

    # Save the file if not already cached
    if not cached_file_path.exists():
        cached_file_path.write_bytes(response.content)

    return str(cached_file_path)
