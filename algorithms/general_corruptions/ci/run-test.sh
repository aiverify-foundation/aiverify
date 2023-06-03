#!/bin/bash
source_dir=.

set +e
python3 -m pytest --cov=$source_dir --cov-branch --html=test-report.html --json=test-report.json
exit_code=$?
coverage html
coverage json --pretty-print
python3 ci/createBadges.py test
python3 ci/createBadges.py coverage
set -e
if [ $exit_code -ne 0 ]; then
  echo "pytest failed, exiting..."
  exit $exit_code
fi
