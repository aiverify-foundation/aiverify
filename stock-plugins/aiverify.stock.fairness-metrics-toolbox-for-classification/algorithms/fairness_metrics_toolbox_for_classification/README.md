# Algorithm - Fairness Metrics Toolbox for Classification

## Description
* The Fairness Metrics Toolbox (FMT) for Classification contains a list of fairness metrics to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for classification models.

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Installation

Each test algorithm can now be installed via pip and run individually.

```sh
pip install aiverify-fairness-metrics-toolbox-for-classification==2.0.0a1
```

## Example Usage:

Run the below bash script to execute the plugin
```sh
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

If the algorithm runs successfully, the results of the test will be saved in an `output` folder.

## Develop plugin locally

Execute the bash script below in the project root
```sh
#!/bin/bash

# setup virtual environment
python3 -m venv .venv
source .venv/bin/activate

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/
# install aiverify-test-engine 
pip install -e '.[dev]'

python -m aiverify_fairness_metrics_toolbox_for_classification --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --sensitive_features_list <list[str]> --annotated_labels_path <annotated_file_path> --file_name_label <str>
```

## Build Plugin
```sh
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/
hatch build
```

## Tests
### Pytest is used as the testing framework.
Run the following steps to execute the unit and integration tests inside the `tests/` folder
```sh
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/
pytest .
```
