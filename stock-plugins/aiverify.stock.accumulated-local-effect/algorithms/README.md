# Algorithm - Accumulated Local Effect

## Description
* Performs ALE Discrete and ALE Continuous computation

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Develop plugin locally
#### Execute the below bash script in the project root
```
#!/bin/bash

# setup virtual environment
python -m venv .venv
source .venv/bin/activate

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms

# install test-engine-core 
pip install -e .'[dev]'
python -m accumulated_local_effect --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline

```
--  Note : replace assets path with the actual absolute path

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms
pytest .
```
