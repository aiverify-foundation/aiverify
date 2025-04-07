# Algorithm - Fairness Metrics Toolbox for Regression

## Description

- The Fairness Metrics Toolbox (FMT) for Regression contains a list of fairness metrics used to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for regression models.

## License

- Licensed under Apache Software License 2.0

## Developers:

- AI Verify

## Installation

Each test algorithm can now be installed via pip and run individually.

```sh
pip install aiverify-fairness-metrics-toolbox-for-regression
```

## Example Usage:

Run the following bash script to execute the plugin

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_fairness_metrics_toolbox_for_regression \
  --data_path $root_path/data/sample_reg_pipeline_data.sav \
  --model_path $root_path/pipeline/regression_tabular_donation \
  --ground_truth_path $root_path/data/sample_reg_pipeline_ytest_data.sav \
  --ground_truth donation \
  --model_type REGRESSION \
  --run_pipeline \
  --sensitive_features_list gender
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
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/
pip install .

python -m aiverify_fairness_metrics_toolbox_for_regression --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type REGRESSION --run_pipeline --sensitive_features_list <list[str]>
```

## Build Plugin

```sh
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/
hatch build
```

## Tests

### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
cd aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/
pytest .
```

## Run using Docker

In the aiverify root directory, run the below command to build the docker image

```sh
docker build -t aiverify-fairness-metrics-toolbox-for-regression -f stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/Dockerfile .
```

Run the below bash script to run the algorithm

```sh
#!/bin/bash
docker run \
    -v $(pwd)/stock-plugins/user_defined_files:/input \
    -v $(pwd)/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/algorithms/fairness_metrics_toolbox_for_regression/output:/app/aiverify/output \
  aiverify-fairness-metrics-toolbox-for-regression \
  --data_path /input/data/sample_reg_pipeline_data.sav \
  --model_path /input/pipeline/regression_tabular_donation \
  --ground_truth_path /input/data/sample_reg_pipeline_ytest_data.sav \
  --ground_truth donation \
  --model_type REGRESSION \
  --run_pipeline \
  --sensitive_features_list gender
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder in the algorithm directory.

## Tests

### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
docker run --entrypoint python3 aiverify-fairness-metrics-toolbox-for-regression -m pytest .
```
