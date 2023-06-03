"""
Allow test engine core to be executable through `python3 -m test_engine_app`.
"""
import warnings

from test_engine_app.test_engine_app import TestEngineApp


def main() -> None:
    """
    Run the test engine application
    """
    # Settings the warnings to be ignored
    warnings.filterwarnings("ignore")

    test_engine = TestEngineApp()
    test_engine.run()


if __name__ == "__main__":  # pragma: no cover
    main()
