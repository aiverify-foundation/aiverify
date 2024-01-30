"""
Main package for Test Engine App.
"""
__version__ = "0.10.0"

import os
import sys


def version_msg():
    """
    Return the test engine version, location and Python powering it.
    """
    python_version = sys.version
    location = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return f"Test Engine PyPI - {__version__} from {location} (Python {python_version})"
