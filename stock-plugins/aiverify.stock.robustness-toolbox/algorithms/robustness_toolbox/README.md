# Algorithm - Robustness Toolbox

## License

- Licensed under Apache Software License 2.0

## Developers:

- AI Verify

## Installation

Each test algorithm can now be installed via pip and run individually.

```sh
pip install aiverify-robustness-toolbox
```

## Example Usage:

The robustness plugin supports testing of tabular and image data.

Run the following bash script to execute the plugin on tabular data:

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_robustness_toolbox \
  --data_path $root_path/data/sample_bc_pipeline_credit_data.sav \
  --model_path $root_path/pipeline/bc_tabular_credit \
  --ground_truth_path $root_path/data/sample_bc_pipeline_credit_ytest_data.sav \
  --ground_truth default \
  --model_type CLASSIFICATION \
  --run_pipeline
```

Run the following bash script to execute the plugin on image data:

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_robustness_toolbox \
  --data_path $root_path/data/raw_fashion_image_10/0.png \
  --model_path $root_path/pipeline/mc_image_fashion \
  --ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --model_type CLASSIFICATION \
  --run_pipeline \
  --annotated_ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --file_name_label file_name
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder.

## Develop plugin locally

Assuming `aiverify-test-engine` has already been installed in the virtual environment, run the following bash script to install the plugin and execute a test:

```sh
#!/bin/bash

# setup virtual environment
python3 -m venv .venv
source .venv/bin/activate

# install plugin
cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox
pip install .

python -m aiverify_robustness_toolbox --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --annotated_ground_truth_path <str> --file_name_label <str>
```

## Build Plugin

```sh
cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox
hatch build
```

## Tests

### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
cd aiverify/stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox
pytest .
```

## Run using Docker

In the aiverify root directory, run the below command to build the docker image

```sh
docker build -t aiverify-robustness-toolbox -f stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox/Dockerfile .
```

Run the below bash script to run the algorithm

```sh
#!/bin/bash
docker run \
  -v $(pwd)/stock-plugins/user_defined_files:/input \
  -v $(pwd)/stock-plugins/aiverify.stock.robustness-toolbox/algorithms/robustness_toolbox/output:/app/aiverify/output \
  aiverify-robustness-toolbox \
  --data_path /input/data/raw_fashion_image_10 \
  --model_path /input/pipeline/mc_image_fashion \
  --ground_truth_path /input/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --model_type CLASSIFICATION \
  --run_pipeline \
  --annotated_ground_truth_path /input/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --file_name_label file_name
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder in the algorithm directory.

## Tests

### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
docker run --entrypoint python3 aiverify-robustness-toolbox -m pytest .
```
