# Algorithm - Fairness Metrics Toolbox for Classification

## Description
* The Fairness Metrics Toolbox (FMT) for Classification contains a list of fairness metrics to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for classification models.

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
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/
# install test-engine-core 
pip install -e '.[dev]'

python -m aiverify_fairness_metrics_toolbox_for_classification --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --sensitive_features_list <list[str]> --annotated_labels_path <annotated_file_path> --file_name_label <str>

```
#### Example : 
```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_fairness_metrics_toolbox_for_classification \
  --data_path $root_path/data/sample_mc_pipeline_toxic_data.sav \
  --model_path $root_path/pipeline/mc_tabular_toxic \
  --ground_truth_path $root_path/data/sample_mc_pipeline_toxic_ytest_data.sav \
  --ground_truth toxic \
  --model_type CLASSIFICATION \
  --run_pipeline \
  --sensitive_features_list gender
```

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/
pytest .
```
