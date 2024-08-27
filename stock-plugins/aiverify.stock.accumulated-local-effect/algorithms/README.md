# Algorithm - Accumulated Local Effect

## Description
* Performs ALE Discrete and ALE Continuous computation

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Run Plugin in local
#### Execute the below bash script
```
#!/bin/bash

# setup virtual environment
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate

# install test-engine-core package
cd aiverify/test-engine-core
hatch build
cd ..
pip install test-engine-core/dist/test_engine_core-0.11.0.tar.gz

# install development dependencies
cd aiverify
pip install -r dev-requirements.txt

# install plugin dependencies
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect
pip install -r requirements.txt

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms
python -m accumulated_local_effect “<data_path>,/<model_path>,<ground_truth_path>,<ground_truth>,<run_as_pipeline>,<model_type>”

```
--  Note : replace assets path with the actual absolute path

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms
poetry build
```
## Tests
### Unit Tests
```
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms
pytest .
```
### e2e Tests : Run plugin algo with mock data
```
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms
python -m tests.e2e
```