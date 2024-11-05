"""
Allow robustness_toolbox to be executable through `python3 -m robustness_toolbox`.
"""

import sys
from importlib.metadata import version
from pathlib import Path

from aiverify_robustness_toolbox.plugin_init import run


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
    Return the robustness_toolbox version, location and Python powering it.
    """
    python_version = sys.version
    location = Path(__file__).resolve().parent.parent

    return f"Robustness Toolbox - {version('aiverify_robustness_toolbox')} from {location} \
        (Python {python_version})"


if __name__ == "__main__":
    main()
