"""
Allow aiverify_veritastool to be executable through
`python3 -m aiverify_veritastool`
"""

import sys
from importlib.metadata import version
from pathlib import Path

from aiverify_veritastool.plugin_init import run


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
    Return the aiverify_veritastool version, location and Python version.
    """
    python_version = sys.version
    location = Path(__file__).resolve().parent.parent

    return f"Veritastool - {version('aiverify_veritastool')} from {location} \
            (Python {python_version})"


if __name__ == "__main__":
    main()
