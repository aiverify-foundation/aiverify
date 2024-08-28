#!/bin/bash

# create venv for ci
python3 -m venv ci-venv
source ci-venv/bin/activate

# install dependencies
pip install -r requirements.txt -q

# license check
pip install pip-licenses -q
pip-licenses --format markdown --output-file licenses-found.md
pip uninstall pip-licenses prettytable wcwidth -y -q

# dependency check
pip install pip-audit -q
pip uninstall setuptools -y -q
set +e
pip-audit --format markdown --desc on --output pip-audit-report.md &> pip-audit-count.txt
exit_code=$?
echo
echo "Dependency Check"
pip-audit --format markdown --desc on
echo
echo "License Check"
cat licenses-found.md
pip install mdtree -q

if [ -f pip-audit-report.md ]; then
  mdtree pip-audit-report.md > pip-audit-report.html
fi
mdtree licenses-found.md > license-report.html

# Create badges
pip install anybadge -q
python3 ci/createBadges.py dependency
python3 ci/createBadges.py license

deactivate
rm -rf ci-venv

set -e
if [ $exit_code -ne 0 ]; then
  echo "pip-audit failed, exiting..."
  exit $exit_code
fi
