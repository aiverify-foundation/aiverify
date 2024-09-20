# Algorithm - Robustness Toolbox

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

cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox
# install test-engine-core 
pip install -e .'[dev]'

python -m aiverify_robustness_toolbox --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --annotated_ground_truth_path <str> --file_name_label <str>

```
#### Example : 
```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_robustness_toolbox \
  --data_path $root_path/data/sample_bc_pipeline_credit_data.sav \
  --model_path $root_path/pipeline/bc_tabular_credit \
  --ground_truth_path $root_path/data/sample_bc_pipeline_credit_ytest_data.sav \
  --ground_truth default \
  --model_type CLASSIFICATION \
  --run_pipeline \
  --annotated_ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --file_name_label file_name
```

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox
pytest .
```