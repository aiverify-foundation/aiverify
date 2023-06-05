#!/bin/bash
source_dir=test_engine_app

pytest --cov=$source_dir --cov-branch --html=test-report.html --json=test-report.json
coverage html
coverage json --pretty-print
python3 ci/createBadges.py