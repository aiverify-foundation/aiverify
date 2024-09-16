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
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/
# install test-engine-core 
pip install -e '.[dev]'

python -m aiverify_accumulated_local_effect --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline

```
#### Example : 
```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_accumulated_local_effect \
    --data_path  $root_path/data/sample_bc_credit_data.sav \
    --model_path $root_path/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav \ --ground_truth_path $root_path/data/sample_bc_credit_data.sav \
    --ground_truth default \
    --model_type CLASSIFICATION

```
## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/
pytest .
```
