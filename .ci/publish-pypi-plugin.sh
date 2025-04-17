#!/bin/bash

# This script builds and publishes specified stock plugins to PyPI.
# It iterates through each plugin directory, checks if it contains a pyproject.toml file,
# builds the package, and publishes it to PyPI if requested.
# Run this script from the root directory of the repository.
# Commandline arguments:
# --publish: Publish the packages to PyPI or Test PyPI. Possible values: 'test-pypi', 'pypi'.
# --plugin: Specify the plugin to build and publish. If not specified, all plugins will be built and published.
# --algo: Specify the algo to build and publish. If not specified, all algos in the specified plugin will be built and published.
#
# To publish to TestPyPI or PyPI, please export the following environment variables respectively before running this script:
# TEST_PYPI_TOKEN (publish to Test PyPI)
# PYPI_TOKEN (publish to PyPI)

# Base directory for stock plugins
BASE_DIR="stock-plugins"
# Array to store the names of successfully built packages
BUILT_PACKAGES=()

# Default values for arguments
PUBLISH_PYPI="none"
PLUGIN_NAME=""
ALGO_NAME=""

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
        --plugin)
            PLUGIN_NAME="$2"
            shift
            ;;
        --algo)
            ALGO_NAME="$2"
            shift
            ;;
        *)
            echo "Unknown parameter passed: $1"
            exit 1
            ;;
    esac
    shift
done

# Function to build package for a plugin specified in $1
# Optionally, build only the package for the algorithm specified in $2
build_package() {
    local plugin_dir=$1
    local algo_name=$2
    local algo_dir="$plugin_dir/algorithms"
    for algo_subdir in "$algo_dir"/*; do
        if [ -d "$algo_subdir" ] && [ -f "$algo_subdir/pyproject.toml" ]; then
            if [ -z "$algo_name" ] || [ "$(basename "$algo_subdir")" == "$algo_name" ]; then
                echo "Building package in $algo_subdir"
                [ -d "$algo_subdir/dist" ] && rm -rf "$algo_subdir/dist"
                (cd "$algo_subdir" && hatch build)
                if [ $? -eq 0 ]; then
                    BUILT_PACKAGES+=("$algo_subdir")
                else
                    echo "Failed to build package in $algo_subdir"
                fi
            fi
        fi
    done
}

# Build and publish specified plugin or all plugins
if [ -n "$ALGO_NAME" ]; then
    # Specific algo
    plugin_dir="$BASE_DIR/$PLUGIN_NAME"
    if [ -d "$plugin_dir" ]; then
        build_package "$plugin_dir" "$ALGO_NAME"
    else
        echo "Plugin directory $plugin_dir does not exist."
        exit 1
    fi
elif [ -n "$PLUGIN_NAME" ]; then
    # Specific plugin
    plugin_dir="$BASE_DIR/$PLUGIN_NAME"
    if [ -d "$plugin_dir" ]; then
        build_package "$plugin_dir"
    else
        echo "Plugin directory $plugin_dir does not exist."
        exit 1
    fi
else
    # All plugins
    for plugin_dir in "$BASE_DIR"/aiverify.stock.*; do
        [ -d "$plugin_dir" ] && build_package "$plugin_dir"
    done
fi

# List all the packages that were successfully built
echo "Packages built successfully:"
for package in "${BUILT_PACKAGES[@]}"; do
    echo "$package"
done

# Publish to Test PyPI if requested
if [ "$PUBLISH_PYPI" == "test-pypi" ]; then
    for package in "${BUILT_PACKAGES[@]}"; do
        echo "Publishing $package to Test PyPI"
        (cd "$package" && hatch publish -r test -u __token__ -a "$TEST_PYPI_TOKEN")
        [ $? -ne 0 ] && echo "Failed to publish $package to Test PyPI"
    done
fi

# Publish to PyPI if requested
if [ "$PUBLISH_PYPI" == "pypi" ]; then
    for package in "${BUILT_PACKAGES[@]}"; do
        echo "Publishing $package to PyPI"
        (cd "$package" && hatch publish -u __token__ -a "$PYPI_TOKEN")
        [ $? -ne 0 ] && echo "Failed to publish $package to PyPI"
    done
fi