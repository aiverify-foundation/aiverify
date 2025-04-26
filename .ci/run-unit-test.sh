#!/bin/bash
trap 'echo -e "\nInterrupted. Exiting."; exit 130' INT

show_help() {
    echo "Run unit tests for all AIVerify packages with a tests/ folder."
    echo "Usage: .ci/run-unit-test.sh [-y] [-h]"
    echo "  -y    Overwrite existing .venv directory without prompting."
    echo "  -h    Show this help message and exit."
}

OVERWRITE_VENV=0

# Parse options
while getopts "yh" opt; do
    case $opt in
    y) OVERWRITE_VENV=1 ;;
    h)
        show_help
        exit 0
        ;;
    *)
        show_help
        exit 1
        ;;
    esac
done

# Discover all testable packages with a tests/ folder
packages=()
for dir in */; do
    # Discover all folders in the first level, except hidden directories
    if [[ -d "$dir" && ! "$dir" =~ ^\\. && -d "${dir}tests" ]]; then
        packages+=("${dir%/}")
    fi
    # Special handling for stock-plugins: look for */algorithms/* with tests/ folder
    if [[ "$dir" == "stock-plugins/" && -d "$dir" ]]; then
        for algo_dir in "$dir"*/algorithms/*; do
            if [ -d "$algo_dir/tests" ]; then
                packages+=("$algo_dir")
            fi
        done
    fi
done

# No package found
if [ ${#packages[@]} -eq 0 ]; then
    echo "No package with tests/ found."
    echo "Make sure to run this script from the root directory (aiverify)."
    echo "Example: .ci/run-unit-test.sh"
    exit 0
fi

# Check if .venv already exists
if [ -d ".venv" ]; then
    if [ "$OVERWRITE_VENV" -eq 1 ]; then
        rm -rf .venv
    else
        read -p ".venv already exists. Overwrite? [y/N]: " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo "Aborted by user."
            exit 0
        fi
        rm -rf .venv
    fi
fi

# Create a new virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# Install all testable packages
for pkg in "${packages[@]}"; do
    # Install the package with dev dependencies if possible
    pip install -e "$pkg[dev]"
done

# Run pytest in each package directory and track results
failed_packages=()
for pkg in "${packages[@]}"; do
    (cd "$pkg" && pytest --tb=short -p no:warnings)
    exit_code=$?
    if [ "$exit_code" -eq 1 ]; then
        failed_packages+=("$pkg")
    fi
    echo
done

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No color

# Print summary of test results
if [ ${#failed_packages[@]} -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed.${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed:${NC}"
    for pkg in "${failed_packages[@]}"; do
        echo -e "${RED} - $pkg${NC}"
    done
    exit 1
fi
