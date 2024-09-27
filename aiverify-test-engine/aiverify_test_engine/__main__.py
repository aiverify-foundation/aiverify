"""
Allow test engine core to be executable through `python3 -m aiverify_test_engine`.
"""

from aiverify_test_engine import version_msg


def main() -> None:
    """
    Print the version of test engine core
    """
    print(version_msg())


if __name__ == "__main__":  # pragma: no cover
    main()
