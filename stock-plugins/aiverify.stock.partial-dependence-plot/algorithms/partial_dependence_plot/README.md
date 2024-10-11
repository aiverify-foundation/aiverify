# Algorithm - Partial Dependence Plot

## Description
* A Partial Dependence Plot (PDP) explains how each feature and its feature value contribute to the predictions.

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Installation

Each test algorithm can now be installed via pip and run individually.

```sh
pip install aiverify-partial-dependence-plot==2.0.0a1
```

## Example Usage:

Run the following bash script to execute the plugin

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_partial_dependence_plot \
  --data_path $root_path/data/sample_bc_credit_data.sav \
  --model_path $root_path/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav \
  --ground_truth_path $root_path/data/sample_bc_credit_data.sav \
  --ground_truth default \
  --model_type REGRESSION \
  --no-run_pipeline
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder.

## Develop plugin locally

Execute the below bash script in the project root

```sh
#!/bin/bash

# setup virtual environment
python3 -m venv .venv
source .venv/bin/activate

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/
# install aiverify-test-engine 
pip install -e '.[dev]'

python -m aiverify_partial_dependence_plot --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline
```

## Build Plugin
```sh
cd aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/
hatch build
```

## Tests
### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
cd aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/
pytest .
```

## Run using Docker
In the aiverify root directory, run the below command to build the docker image
```sh
docker build -t aiverify-partial-dependence-plot:v2.0.0a1 -f stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/Dockerfile .
```

Switch to the algorithm directory
```sh
cd stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/
```

Run the below bash script to run the algorithm
```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
docker run \
  -v $root_path:/user_defined_files \
  -v ./output:/app/aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot/output \
  aiverify-partial-dependence-plot:v2.0.0a1 \
  --data_path /user_defined_files/data/sample_bc_credit_data.sav \
  --model_path /user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav \
  --ground_truth_path /user_defined_files/data/sample_bc_credit_data.sav \
  --ground_truth default \
  --model_type REGRESSION \
  --no-run_pipeline
```
If the algorithm runs successfully, the results of the test will be saved in an `output` folder in the algorithm directory.

## Tests
### Pytest is used as the testing framework.
Run the following steps to execute the unit and integration tests inside the `tests/` folder
```sh
docker run --entrypoint python3 aiverify-partial-dependence-plot:v2.0.0a1 -m pytest .
```
