#!/bin/bash

# This script builds and publishes the aiverify-test-engine package to PyPI or Test PyPI.
# Run this script from the root directory of the repository.
# Commandline arguments:
# --publish: Publish the package to PyPI or Test PyPI. Possible values: 'test-pypi', 'pypi'.
# To publish, please export the following environment variables before running this script:
# TEST_PYPI_TOKEN (publish to Test PyPI)
# PYPI_TOKEN (publish to PyPI)

# Default value for PUBLISH_PYPI
PUBLISH_PYPI="none"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --publish)
            if [[ "$2" == "test-pypi" || "$2" == "pypi" ]]; then
                PUBLISH_PYPI="$2"
                shift
            else
                echo "Invalid value for --publish. Use 'test-pypi' or 'pypi'."
                exit 1
            fi
            ;;
        *)
            echo "Unknown parameter passed: $1"
            exit 1
            ;;
    esac
    shift
done

# Directory for aiverify-test-engine
ENGINE_DIR="aiverify-test-engine"

# Check if pyproject.toml exists
if [ -f "$ENGINE_DIR/pyproject.toml" ]; then
    echo "Building package in $ENGINE_DIR"
    # Remove the dist subfolder if it exists
    [ -d "$ENGINE_DIR/dist" ] && rm -rf "$ENGINE_DIR/dist"
    # Navigate to the directory and build the package
    (cd "$ENGINE_DIR" && hatch build)
    if [ $? -eq 0 ]; then
        echo "Package built successfully in $ENGINE_DIR"
    else
        echo "Failed to build package in $ENGINE_DIR"
        exit 1
    fi
else
    echo "pyproject.toml not found in $ENGINE_DIR"
    exit 1
fi

# Publish to Test PyPI if requested
if [ "$PUBLISH_PYPI" == "test-pypi" ]; then
    echo "Publishing $ENGINE_DIR to Test PyPI"
    (cd "$ENGINE_DIR" && hatch publish -r test -u __token__ -a "$TEST_PYPI_TOKEN")
    if [ $? -ne 0 ]; then
        echo "Failed to publish $ENGINE_DIR to Test PyPI"
        exit 1
    fi
fi

# Publish to PyPI if requested
if [ "$PUBLISH_PYPI" == "pypi" ]; then
    echo "Publishing $ENGINE_DIR to PyPI"
    (cd "$ENGINE_DIR" && hatch publish -u __token__ -a "$PYPI_TOKEN")
    if [ $? -ne 0 ]; then
        echo "Failed to publish $ENGINE_DIR to PyPI"
        exit 1
    fi
fi