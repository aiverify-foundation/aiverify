#!/bin/bash
source_dir=aiverify_test_engine

set +e
flake8 --format=html --htmldir=flake8-report --count  $source_dir > flake8-report.txt
exit_code=$?
python3 ci/createBadges.py lint

if [ $exit_code -ne 0 ]; then
  echo "flake8 failed, exiting..."
  exit $exit_code
fi