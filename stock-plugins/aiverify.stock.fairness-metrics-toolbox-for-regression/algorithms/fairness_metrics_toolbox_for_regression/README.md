# Algorithm - Fairness Metrics Toolbox for Regression

## Description
* The Fairness Metrics Toolbox (FMT) for Regression contains a list of fairness metrics used to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for regression models.

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
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/
# install test-engine-core 
pip install -e .'[dev]'

python -m aiverify_fairness_metrics_toolbox_for_regression --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --sensitive_features_list <list[str]>

```
#### Example : 
```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_fairness_metrics_toolbox_for_regression \
  --data_path $root_path/data/sample_reg_pipeline_data.sav \
  --model_path $root_path/pipeline \
  --ground_truth_path $root_path/data/sample_reg_pipeline_ytest_data.sav \
  --ground_truth donation \
  --model_type REGRESSION \
  --run_pipeline \
  --sensitive_features_list gender
```

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/
pytest .
```
