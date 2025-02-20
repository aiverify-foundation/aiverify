#!/bin/bash

# Dependency vulnerability and license risk scan

output_prefix=${1:-aiverify_test_engine}
pip_option=$2

echo "#############################################################################"
echo "###                                                                       ###"
echo "###                DEPENDENCY VULNERABILITY & LICENSE SCAN                ###"
echo "###                                                                       ###"
echo "#############################################################################"

# Create venv for ci
python3 -m venv ci-venv
source ci-venv/bin/activate

pip install --upgrade pip > /dev/null

# Install dependencies
if [ -z "$pip_option" ]; then
  pip install . > /dev/null
else
  pip install .["$pip_option"] > /dev/null
fi

# License check
echo "License check..."
pip install pip-licenses > /dev/null
pip-licenses --format markdown --output-file "${output_prefix}-licenses-found.md" > /dev/null
pip uninstall pip-licenses prettytable wcwidth -y > /dev/null

# Dependency check
echo "Dependency vulnerability check..."
pip install pip-audit > /dev/null
#pip uninstall setuptools -y > /dev/null
set +e
pip-audit --format markdown --desc on -o "${output_prefix}-pip-audit-report.md" &> "${output_prefix}-pip-audit-count.txt"
exit_code=$?
pip install mdtree > /dev/null

if [ -f "${output_prefix}-pip-audit-report.md" ]; then
  echo "============ Vulnerabilities Found ============"
  cat "${output_prefix}-pip-audit-report.md"
  mdtree "${output_prefix}-pip-audit-report.md" > "${output_prefix}-pip-audit-report.html"
else
  touch "${output_prefix}-pip-audit-report.html"
fi

if [ -f "${output_prefix}-licenses-found.md" ]; then
  strong_copyleft=("GPL" "AGPL" "EUPL" "CCDL" "EPL" "OSL" "CPL")
  weak_copyleft=("LGPL" "MPL" "CC-BY-SA")
  
  echo "============ Strong Copyleft Licenses Found ============"
  head -n 2 "${output_prefix}-licenses-found.md"
  while IFS= read -r line; do
    for lic in "${strong_copyleft[@]}"; do
      if [[ $line == *"$lic"* ]]; then
        echo "$line"
        break
      fi
    done
  done < "${output_prefix}-licenses-found.md"
  
  echo "============ Weak Copyleft Licenses Found ============"
  head -n 2 "${output_prefix}-licenses-found.md"
  while IFS= read -r line; do
    for lic in "${weak_copyleft[@]}"; do
      if [[ $line == *"$lic"* ]]; then
        echo "$line"
        break
      fi
    done
  done < "${output_prefix}-licenses-found.md"
  
  mdtree "${output_prefix}-licenses-found.md" > "${output_prefix}-license-report.html"
else
  touch "${output_prefix}-license-report.html"
fi

deactivate
rm -rf ci-venv

set -e
if [ $exit_code -ne 0 ]; then
#  echo "pip-audit failed, exiting..."
  exit $exit_code
fi
