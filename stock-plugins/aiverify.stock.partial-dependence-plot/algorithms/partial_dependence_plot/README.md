# Algorithm - Partial Dependence Plot

## Description
* A Partial Dependence Plot (PDP) explains how each feature and its feature value contribute to the predictions.

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify


## Develop plugin locally
#### Execute the below bash script in the project root
```
#!/bin/bash

# setup virtual environment
python3 -m venv .venv
source .venv/bin/activate

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/
# install aiverify-test-engine 
pip install -e '.[dev]'

python -m aiverify_partial_dependence_plot --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline

```
#### Example : 
```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_partial_dependence_plot \
  --data_path $root_path/data/sample_bc_credit_data.sav \
  --model_path $root_path/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav \
  --ground_truth_path $root_path/data/sample_bc_credit_data.sav \
  --ground_truth default \
  --model_type REGRESSION \
  --no-run_pipeline
```

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/
pytest .
```
