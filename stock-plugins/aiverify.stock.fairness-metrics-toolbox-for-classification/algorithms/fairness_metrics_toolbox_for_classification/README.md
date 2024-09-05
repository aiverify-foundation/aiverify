# Algorithm - fairness-metrics-toolbox-for-classification

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

# Install dev dependencies
cd aiverify/
pip install -r dev-requirements.txt

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/
# install test-engine-core 
pip install -e .'[dev]'

python -m aiverify_fairness_metrics_toolbox_for_classification --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --sensitive_features_list <list[str]> --annotated_labels_path <annotated_file_path> --file_name_label <str>

```
--  Note : replace assets path with the actual absolute path

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
