# Algorithm - Digital Corruptions

## Description
* Robustness plugin for digital corruptions

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Installation

Each test algorithm can now be installed via pip and run individually.

```sh
pip install aiverify-digital-corruptions==2.0.0a1
```

## Example Usage:

Run the following bash script to execute the plugin

```sh
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

If the algorithm runs successfully, the results of the test will be saved in an `output` folder.

## Develop plugin locally

Execute the below bash script in the project root

```sh
#!/bin/bash

# setup virtual environment
python -m venv .venv
source .venv/bin/activate

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/

# install aiverify-test-engine 
pip install -e '.[dev]'

python -m aiverify_digital_corruptions --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --set_seed <int> --annotated_ground_truth_path <annotated_file_path> --file_name_label <str>
```

## Build Plugin
```sh
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
hatch build
```

## Tests
### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
pytest .
```

## Run using Docker
In the aiverify root directory, run the below command to build the docker image
```sh
docker build -t aiverify-digital-corruptions:v2.0.0a1 -f stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/Dockerfile . 
```

Run the below bash script to run the algorithm
```sh
#!/bin/bash
docker run \
  -v $(pwd)/stock-plugins/user_defined_files:/input \
  -v $(pwd)/output:/app/aiverify/output \
  aiverify-digital-corruptions:v2.0.0a1 \
  --data_path /input/data/raw_fashion_image_10 \
  --model_path /input/pipeline/multiclass_classification_image_mnist_fashion \
  --ground_truth_path /input/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --model_type CLASSIFICATION \
  --run_pipeline \
  --annotated_ground_truth_path /input/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --set_seed 10 \
  --file_name_label file_name
```
If the algorithm runs successfully, the results of the test will be saved in an `output` folder in the working directory.

## Tests
### Pytest is used as the testing framework.
Run the following steps to execute the unit and integration tests inside the `tests/` folder
```sh
docker run --entrypoint python3 aiverify-digital-corruptions:v2.0.0a1 -m pytest .
```
