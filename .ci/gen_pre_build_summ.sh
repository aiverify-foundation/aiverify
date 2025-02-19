#!/bin/bash

# Generate summary status of pre-build checks
# Note: this script must be run using source

# Function to generate code coverage summary status
read_coverage() {
  covPct=$(jq '.totals.percent_covered' "$1-cov.json")
  covPctRounded=$(printf "%.0f" "$covPct")
  message="Coverage percentage: $covPctRounded"
  export COVERAGE_SUMMARY="$message"
  if (( covPctRounded < 70 )); then
    RED='\033[0;31m'
    echo -e "${RED}${message}"
    return 1
  else
    GREEN='\033[0;92m'
    echo -e "${GREEN}${message}"
    return 0
  fi
}

# Function to generate unit test summary status
read_test() {
  testJson=$(jq '.report.summary' "$1-test-report.json")
  testPassed=$(echo "$testJson" | jq '.passed // 0')
  testFailed=$(echo "$testJson" | jq '.failed // 0')
  message="Unit tests passed: $testPassed, failed: $testFailed"
  export UNITTEST_SUMMARY="$message"
  if [ "$testFailed" -ne 0 ]; then
    RED='\033[0;31m'
    echo -e "${RED}${message}"
    return 1
  else
    GREEN='\033[0;92m'
    echo -e "${GREEN}${message}"
    return 0
  fi
}

# Function to generate code quality summary status
read_lint() {
  last_line=$(tail -n 1 "$1-flake8-report.txt")
  message="Lint errors: $last_line"
  export LINT_SUMMARY="$message"
  if [ "$last_line" -ne 0 ]; then
    RED='\033[0;31m'
    echo -e "${RED}${message}"
    return 1
  else
    GREEN='\033[0;92m'
    echo -e "${GREEN}${message}"
    return 0
  fi
}

# Function to generate dependency vulnerability summary status
read_dependency() {
  content=$(<"$1-pip-audit-count.txt")
  if [[ $content == *"No known vulnerabilities found"* ]]; then
    numVul=0
  else
    numVul=$(grep -oP 'Found \K\d+' "$1-pip-audit-count.txt")
  fi
  message="Dependency vulnerabilities found: $numVul"
  export DEPENDENCY_SUMMARY="$message"
  if [ "$numVul" -ne 0 ]; then
    RED='\033[0;31m'
    echo -e "${RED}${message}"
    return 1
  else
    GREEN='\033[0;92m'
    echo -e "${GREEN}${message}"
    return 0
  fi
}

# Function to generate dependency license risk summary status
read_license() {
  strong_copyleft=("GPL" "AGPL" "EUPL" "CCDL" "EPL" "OSL" "CPL")
  weak_copyleft=("LGPL" "MPL" "CC-BY-SA")
  #copyleftLic=("GPL" "LGPL" "MPL" "AGPL" "EUPL" "CCDL" "EPL" "CC-BY-SA" "OSL" "CPL")
  numCopyleftLicStrong=0
  if [ -f "$1-licenses-found.md" ]; then
    while IFS= read -r line; do
      for lic in "${strong_copyleft[@]}"; do
        if [[ $line == *"$lic"* ]]; then
          ((numCopyleftLicStrong++))
          break
        fi
      done
    done < "$1-licenses-found.md"
  fi
  numCopyleftLicWeak=0
  if [ -f "$1-licenses-found.md" ]; then
    while IFS= read -r line; do
      for lic in "${weak_copyleft[@]}"; do
        if [[ $line == *"$lic"* ]]; then
          ((numCopyleftLicWeak++))
          break
        fi
      done
    done < "$1-licenses-found.md"
  fi
  message="Copyleft licenses found: strong=$numCopyleftLicStrong weak=$numCopyleftLicWeak"
  export LICENSE_SUMMARY="$message"
  if [ "$numCopyleftLicStrong" -ne 0 ] || [ "$numCopyleftLicWeak" -ne 0 ]; then
    RED='\033[0;31m'
    echo -e "${RED}${message}"
    return 1
  else
    GREEN='\033[0;92m'
    echo -e "${GREEN}${message}"
    return 0
  fi
}

# Main function to determine which summary to generate
gen_summary() {
  if [[ $# -eq 0 ]]; then
    echo "No summaryToGen provided"
    exit 1
  fi

  summaryToGen=$1
  module=${2:-aiverify_test_engine}

  case $summaryToGen in
    "coverage")
      read_coverage "$module"
      ;;
    "test")
      read_test "$module"
      ;;
    "lint")
      read_lint "$module"
      ;;
    "dependency")
      read_dependency "$module"
      ;;
    "license")
      read_license "$module"
      ;;
    *)
      echo "Unknown summary type: $summaryToGen"
      exit 1
      ;;
  esac
}

# Execute the main function
gen_summary "$@"