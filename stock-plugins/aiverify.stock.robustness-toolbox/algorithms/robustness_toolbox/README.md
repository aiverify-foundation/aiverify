# Algorithm - Robustness Toolbox

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Run Plugin in local
#### Execute the below bash script in the project root
```
#!/bin/bash

# setup virtual environment
cd aiverify/stock-plugins/
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate

# execute plugin

cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms
# install test-engine-core 
pip install -e .'[dev]'

python -m robustness_toolbox --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --plugin_argument_values "{\"key\":\"value\"}"

```
--  Note : replace assets path with the actual absolute path

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms
pytest .
```
