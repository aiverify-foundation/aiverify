# Algorithm - Digital Corruptions

## Description
* Robustness plugin for digital corruptions

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Run Plugin in local
#### Execute the below bash script in the project root
```
#!/bin/bash

# setup virtual environment
python -m venv .venv
source .venv/bin/activate

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/

# install test-engine-core 
pip install -e '.[dev]'

python -m aiverify_digital_corruptions --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --set_seed <int> --annotated_ground_truth_path <annotated_file_path> --file_name_label <str>

```
#### Example : 
```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"

python -m aiverify_digital_corruptions \
  --data_path $root_path/data/raw_fashion_image_10 \
  --model_path $root_path/pipeline/multiclass_classification_image_mnist_fashion \
  --ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --model_type CLASSIFICATION \
  --run_pipeline \
  --annotated_ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --set_seed 10 \
  --file_name_label file_name
```

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
pytest .
```
