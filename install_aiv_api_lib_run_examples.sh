#!/bin/bash

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Pip install Python build library
pip install build

# Build and install test-engine-core. This is required for the test engine to run
# Change the version number according to the version number in pyproject.toml
python -m build test-engine-core
pip install test-engine-core/dist/test_engine_core-0.10.0.tar.gz

# Build and install test-engine-api. This is the API library to call from and run tests
# Change the version number according to the version number in pyproject.toml
python -m build test-engine-api
pip install test-engine-api/dist/test_engine_api-0.10.0.tar.gz

# Install the dependencies for the core modules (data types, deserializers and models)
pip install -r test-engine-core-modules/requirements.txt

# Install the dependencies for the stock plugins. The find command traverses the directories of all algos 
# And installs the dependencies 
cd stock-plugins
find ./ -type f -name 'requirements.txt' -exec pip3 install -r "{}" \;

# Run the example tests
cd ..
python examples/test_engine_api_example.py