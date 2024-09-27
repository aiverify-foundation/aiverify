# Algorithm - SHAP Toolbox

## Description
* SHAP (SHapley Additive exPlanations) is a game theoretic approach to explain the output of any machine learning model. It connects optimal credit allocation with local explanations using the classic Shapley values from game theory and their related extensions (see papers for details and citations).

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
cd aiverify/stock-plugins/aiverify.stock.shap-toolbox/algorithms/shap_toolbox/
# install aiverify-test-engine 
pip install -e '.[dev]'

python -m aiverify_shap_toolbox --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --background_path <background_path> --background_samples <number> --data_samples <number> --explain_type <str>

```
#### Example : 
```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_shap_toolbox \
    --data_path  $root_path/data/sample_bc_credit_data.sav \
    --model_path $root_path/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav \ 
    --ground_truth_path $root_path/data/sample_bc_credit_data.sav \
    --ground_truth default \
    --model_type CLASSIFICATION \
    --no-run_pipeline \
    --background_path $root_path/data/sample_bc_credit_data.sav \
    --background_samples 25 \
    --data_samples 25 \
    --explain_type global

```
## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.shap-toolbox/algorithms/shap_toolbox/
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.shap-toolbox/algorithms/shap_toolbox/
pytest .
```