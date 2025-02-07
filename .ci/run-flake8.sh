#!/bin/bash
source_dir=${1:aiverify_test_engine}

echo "#############################################################################"
echo "###                                                                       ###"
echo "###                          CODE QUALITY ANALYSIS                        ###"
echo "###                                                                       ###"
echo "#############################################################################"

set +e
flake8 --count  $source_dir > flake8-report.txt
cat flake8-report.txt
exit_code=$?

if [ $exit_code -ne 0 ]; then
  exit $exit_code
fi