import re
from pathlib import Path


def is_folder(argument: str) -> bool:
    """
    A function to check if argument is a folder

    Args:
        argument (str): path to folder

    Returns:
        bool: True if argument is a folder
    """
    return Path(argument).is_dir()


def is_file(argument: str) -> bool:
    """
    A function to check if argument is a file

    Args:
        argument (str): path to file

    Returns:
        bool: True if argument is a file
    """
    return Path(argument).is_file()


def is_empty_string(argument: str) -> bool:
    """
    A function to check if argument is an empty string

    Args:
        argument (str): string to be checked

    Returns:
        bool: True if argument is an empty string
    """
    if not isinstance(argument, str) or argument is None or not argument:
        return True

    else:
        return len(argument.strip()) <= 0


def is_excluded(filename):
    """
    A function to check if a file is excluded

    Args:
        filename (str): name of the file

    Returns:
        bool: True if file is excluded
    """
    exclude_patterns = [
        r"\.DS_Store$",  # Exact match for .DS_Store
        r"__MACOSX",  # Contains __MACOSX
        r"Thumbs\.db$",  # Exact match for Thumbs.db
        r"Desktop\.ini$",  # Exact match for Desktop.ini
        r"\._.*",  # Starts with ._
        r"\.directory$",  # Exact match for .directory
        r"\.git/",  # Contains .git/
        r"\.svn/",  # Contains .svn/
        r"\.hg/",  # Contains .hg/
    ]

    for pattern in exclude_patterns:
        if re.search(pattern, filename):
            return True
    return False
