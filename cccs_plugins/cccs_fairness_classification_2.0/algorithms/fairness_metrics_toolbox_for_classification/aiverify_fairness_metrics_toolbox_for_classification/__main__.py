"""
Allow aiverify_fairness_metrics_toolbox_for_classification to be executable through
`python3 -m aiverify_fairness_metrics_toolbox_for_classification`
"""

import sys
from importlib.metadata import version
from pathlib import Path

from aiverify_fairness_metrics_toolbox_for_classification.plugin_init import run


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
    Return the aiverify_fairness_metrics_toolbox_for_classification version, location and Python powering it.
    """
    python_version = sys.version
    location = Path(__file__).resolve().parent.parent

    return f"Fairness toolbox metrics for classification - \
        {version('aiverify_fairness_metrics_toolbox_for_classification')} \
            from {location} (Python {python_version})"


if __name__ == "__main__":
    main()
