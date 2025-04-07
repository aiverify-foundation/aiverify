# Algorithm - Accumulated Local Effect

## Description

- Performs ALE Discrete and ALE Continuous computation

## License

- Licensed under Apache Software License 2.0

## Developers:

- AI Verify

## Installation

Each test algorithm can now be installed via pip and run individually.

```sh
pip install aiverify-accumulated-local-effect
```

## Example Usage:

Run the following bash script to execute the plugin

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_accumulated_local_effect \
    --data_path  $root_path/data/sample_bc_credit_data.sav \
    --model_path $root_path/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav \
    --ground_truth_path $root_path/data/sample_bc_credit_data.sav \
    --ground_truth default \
    --model_type CLASSIFICATION
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder.

## Develop plugin locally

Assuming `aiverify-test-engine` has already been installed in the virtual environment, run the following bash script to install the plugin and execute a test:

```sh
#!/bin/bash

# setup virtual environment
python -m venv .venv
source .venv/bin/activate

# install plugin
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/
pip install .

python -m aiverify_accumulated_local_effect --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline
```

## Build Plugin

```sh
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/
hatch build
```

## Tests

### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
cd aiverify/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/
pytest .
```

## Run using Docker

In the aiverify root directory, run the below command to build the docker image

```sh
docker build -t aiverify-accumulated-local-effect -f stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/Dockerfile .
```

Run the below bash script to run the algorithm

```sh
#!/bin/bash
docker run \
    -v $(pwd)/stock-plugins/user_defined_files:/input \
    -v $(pwd)/stock-plugins/aiverify.stock.accumulated-local-effect/algorithms/accumulated_local_effect/output:/app/aiverify/output \
    aiverify-accumulated-local-effect \
    --data_path /input/data/sample_bc_credit_data.sav \
    --model_path /input/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav \
    --ground_truth_path /input/data/sample_bc_credit_data.sav \
    --ground_truth default \
    --model_type CLASSIFICATION
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder in the algorithm directory.

## Tests

### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
docker run --entrypoint python3 aiverify-accumulated-local-effect -m pytest .
```
