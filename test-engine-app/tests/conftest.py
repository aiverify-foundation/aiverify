import os

import pytest


@pytest.fixture(autouse=True)
def test_setup_and_teardown():
    old_environ = dict(os.environ)
    yield

    os.environ.clear()
    os.environ.update(old_environ)
