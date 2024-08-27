"""
Allow accumulated_local_effect to be executable through `python3 -m accumulated_local_effect`.
"""

__version__ = "0.1.0"

import os
import sys

# import sys
# from pathlib import Path

# # Add the parent directory to sys.path
# sys.path.append(str(Path(__file__).resolve().parent.parent))

from .plugin_init import run

def main() -> None:
    """
    Print the version of test engine core
    """
    print("*"*20)
    print(version_msg())
    print("*"*20)
    
    # invoke algorithm
    run()


def version_msg():
    """
    Return the accumulated_local_effect version, location and Python powering it.
    """
    python_version = sys.version
    location = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return f"Accumulated Local Effect - {__version__} from {location} (Python {python_version})"

if __name__ == "__main__":
    main()
