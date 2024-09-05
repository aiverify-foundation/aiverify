import tempfile
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


def download_from_url(url: str) -> str:
    """
    Download a file from the given URL and save it to a temporary location.

    Args:
        url (str): The URL of the file to download.

    Returns:
        str: The path to the downloaded file.
    """
    response = requests.get(url)
    if response.status_code == 200:
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.write(response.content)
        temp_file.close()
        return temp_file.name
    else:
        raise Exception(f"Failed to download file: HTTP {response.status_code}")
