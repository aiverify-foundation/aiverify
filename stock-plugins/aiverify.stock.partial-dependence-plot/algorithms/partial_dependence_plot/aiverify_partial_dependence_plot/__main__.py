"""
Allow aiverify_partial_dependence_plot to be executable through
`python3 -m aiverify_partial_dependence_plot`
"""

import sys
from importlib.metadata import version
from pathlib import Path

from aiverify_partial_dependence_plot.plugin_init import run


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
    Return the aiverify_partial_dependence_plot version, location and Python powering it.
    """
    python_version = sys.version
    location = Path(__file__).resolve().parent.parent

    return f"Partial dependence plot - {version('aiverify_partial_dependence_plot')} from {location} \
            (Python {python_version})"


if __name__ == "__main__":
    main()
