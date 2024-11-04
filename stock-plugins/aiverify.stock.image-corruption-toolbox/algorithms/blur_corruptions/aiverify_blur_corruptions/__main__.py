"""
Allow aiverify_blur_corruptions to be executable through
`python3 -m aiverify_blur_corruptions`
"""

import sys
from importlib.metadata import version
from pathlib import Path

from aiverify_blur_corruptions.plugin_init import run


def main() -> None:
    """
    Print the version of test engine core
    """
    print("*" * 20)
    print(version_msg())
    print("*" * 20)
    # invoke algorithm
    run()


def version_msg():
    """
    Return the aiverify_blur_corruptions version, location and Python powering it.
    """
    python_version = sys.version
    location = Path(__file__).resolve().parent.parent

    return f"Aiverify Blur Corruptions - {version('aiverify_blur_corruptions')} from {location} \
        (Python {python_version})"


if __name__ == "__main__":
    main()
