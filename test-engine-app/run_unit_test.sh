#!/bin/bash
# Clear old information
rm -r .pytest_cache htmlcov errors logs

# Run unit test
bash ci/run-test.sh