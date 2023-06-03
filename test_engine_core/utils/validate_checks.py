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
