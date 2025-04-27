# Veritas Toolkit

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/main/icon/veritas_logo_new.png" ></p>

The purpose of this toolkit is to facilitate the adoption of Veritas Methodology on Fairness & Transparency Assessment and spur industry development. It will also benefit customers by improving the fairness and transparency of financial services delivered by AIDA systems.

As a AI Verify stock-plugin, this updates the existing [Veritas Toolkit](https://github.com/mas-veritas2/veritastool) to be compatible with the AI Verify schema and plugin structure.

## License

- Licensed under Apache Software License 2.0

## Developers:

- AI Verify
- MAS Veritas
- Resaro

## Plugin Content

- Algorithms

| Name        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| Veritastool | Veritas Diagnosis tool for fairness & transparency assessment |

## Installation

The easiest way to install veritastool is to download it from [`PyPI`](https://pypi.org/project/aiverify-veritastool/). It's going to install the library itself and its prerequisites as well. It is suggested to create virtual environment with requirements.txt file first.

```sh
pip install aiverify-veritastool
```

## Migrating from the existing Veritas Toolkit

The existing Veritas Toolkit has been updated to be compatible with the AI Verify schema and plugin structure. Users with model artifact json files from the existing Veritas Toolkit can convert them to the new format using the `convert_veritas_artifact_to_aiverify` function.

```python
from aiverify_veritastool.util.aiverify import convert_veritas_artifact_to_aiverify

convert_veritas_artifact_to_aiverify(model_artifact_path="old_model_artifact_path.json", output_dir="output")
```

The test results will be saved in the output directory and can subsequently be updated into the AI Verify API gateway and platform.

## Using the Plugin in Jupyter Notebook

Similar to the existing veritastool library, the updated plugin can be used as part of a Jupyter Notebook development workflow.

You can now import the custom library that you would to use for diagnosis. In this example we will use the Credit Scoring custom library.

```python
from veritastool.model.modelwrapper import ModelWrapper
from veritastool.model.model_container import ModelContainer
from veritastool.usecases.credit_scoring import CreditScoring
```

Once the relevant use case object (CreditScoring) and model container (ModelContainer) has been imported, you can upload your contents into the container and initialize the object for diagnosis.

```python

import pickle
import numpy as np

#Load Credit Scoring Test Data
# NOTE: Assume that the stock_plugin/user_defined_files/veritas_data folder is copied to the current working directory
file = "./veritas_data/credit_score_dict.pickle"
input_file = open(file, "rb")
cs = pickle.load(input_file)

#Model Contariner Parameters
y_true = np.array(cs["y_test"])
y_pred = np.array(cs["y_pred"])
y_train = np.array(cs["y_train"])
p_grp = {'SEX': [1], 'MARRIAGE':[1]}
up_grp = {'SEX': [2], 'MARRIAGE':[2]}
x_train = cs["X_train"]
x_test = cs["X_test"]
model_name = "credit_scoring"
model_type = "classification"
y_prob = cs["y_prob"]
model_obj = LogisticRegression(C=0.1)
model_obj.fit(x_train, y_train) #fit the model as required for transparency analysis

#Create Model Container
container = ModelContainer(y_true, p_grp, model_type, model_name, y_pred, y_prob, y_train, x_train=x_train, \
                           x_test=x_test, model_object=model_obj, up_grp=up_grp)

#Create Use Case Object
cre_sco_obj= CreditScoring(model_params = [container], fair_threshold = 80, fair_concern = "eligible", \
                           fair_priority = "benefit", fair_impact = "normal", perf_metric_name="accuracy", \
                           tran_row_num = [20,40], tran_max_sample = 1000, tran_pdp_feature = ['LIMIT_BAL'], tran_max_display = 10)

```

### API functions

Below are the API functions that the user can execute to obtain the fairness and transparency diagnosis of their use cases.

**Evaluate**

The evaluate API function computes all performance and fairness metrics and renders it in a table format (default). It
also highlights the primary performance and fairness metrics (automatic if not specified by user).

```python
cre_sco_obj.evaluate()
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/evaulate_3.png" width="608" height="700"></p>

You can also toggle the widget to view your results in a interactive visualization format.

```python
cre_sco_obj.evaluate(visualize = True)
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/evaluate_2_visualize.png" width="858" height="530"></p>

**Tradeoff**

Computes trade-off between performance and fairness.

```python
cre_sco_obj.tradeoff()
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/tradeoff_2.png" width="625" height="516"></p>

\*\* Note: Replace {Balanced Accuracy} with the respective given metrics.

**Feature Importance**

Computes feature importance of protected features using leave one out analysis.

```python
cre_sco_obj.feature_importance()
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/faeture_imp_2.png" width="828" height="653"></p>

**Root Cause**

Computes the importance of variables contributing to the bias.

```python
cre_sco_obj.root_cause()
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/rootcause_2.png" width="581" height="530"></p>

**Mitigate**

User can choose methods to mitigate the bias.

```python
mitigated = cre_sco_obj.mitigate(p_var=[], method=['reweigh', 'correlation', 'threshold'])
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/mitigate_2.png" width="576" height="662"></p>

**Explain**

Runs the transparency analysis - global & local interpretability, partial dependence analysis and permutation importance

```python
#run the entire transparency analysis
cre_sco_obj.explain()
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/explain_2.png" width="624" height="1034"></p>

```python
#get the local interpretability plot for specific row index and model
cre_sco_obj.explain(local_row_num = 20)
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/local_2.png" width="514" height="464"></p>

**Compile**

Generates model artifact file output. This function also runs all the API functions if it hasn't already been run.

```python
output = cre_sco_obj.compile(save_artifact=False)
```

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/compile_2.png" width="529" height="209"></p>

**Model Artifact**

In place of the previous model artifact file, users can now generate a test output that is compatible with the AI Verify schema.

```python
from aiverify_veritastool.util.aiverify import convert_veritas_artifact_to_aiverify

output = cre_sco_obj.compile(save_artifact=False)
convert_veritas_artifact_to_aiverify(model_artifact_path=output, output_dir="output")
```

The test results will be saved in the output directory and can subsequently be updated into the AI Verify API gateway and platform.

## Examples

You may refer to our example notebooks below to see how the toolkit can be applied:

| Filename                                                                    | Description                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`CS_Demo.ipynb`](./examples/CS_demo.ipynb)                                 | Tutorial notebook to diagnose a credit scoring model for predicting customers' loan repayment.                                                               |
| [`CM_Demo.ipynb`](./examples/customer_marketing_example/CM_demo.ipynb)      | Tutorial notebook to diagnose a customer marketing uplift model for selecting existing customers for a marketing call to increase the sales of loan product. |
| [`BaseClassification_demo.ipynb`](./examples/BaseClassification_demo.ipynb) | Tutorial notebook for a multi-class propensity model                                                                                                         |
| [`BaseRegression_demo.ipynb`](./examples/BaseRegression_demo.ipynb)         | Tutorial notebook for a prediciton of a continuous target variable                                                                                           |
| [`PUW_demo.ipynb`](./examples/PUW_demo.ipynb)                               | Tutorial notebook for a binary classification model to predict whether to award insurance policy by assessing risk                                           |

## Running the plugin via CLI

Once the finalised parameters are decided, one can validate the results and generate an output that is compatible with the AI Verify platform by running the plugin via CLI. Here's an example bash script to execute the plugin via CLI:

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files/veritas_data"

aiverify_veritastool \
  --data_path $root_path/cs_X_test.pkl \
  --model_path $root_path/cs_model.pkl \
  --ground_truth_path $root_path/cs_y_test.pkl \
  --ground_truth y_test \
  --training_data_path $root_path/cs_X_train.pkl \
  --training_ground_truth_path $root_path/cs_y_train.pkl \
  --training_ground_truth y_train \
  --use_case "base_regression" \
  --privileged_groups '{"SEX": [1], "MARRIAGE": [1]}' \
  --model_type CLASSIFICATION \
  --fair_threshold 80 \
  --fair_metric "auto" \
  --fair_concern "eligible" \
  --performance_metric "accuracy" \
  --transparency_rows 20 40 \
  --transparency_max_samples 1000 \
  --transparency_features LIMIT_BAL \
  --run_pipeline
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder.

## Build Plugin

```sh
cd aiverify/stock-plugins/aiverify.stock.veritas/algorithms/veritastool
hatch build
```

## Tests

### Pytest is used as the testing framework.

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
cd aiverify/stock-plugins/aiverify.stock.veritas/algorithms/veritastool
pytest .
```

## Run using Docker

In the aiverify root directory, run the following command to build the docker image

```sh
docker build -t aiverify-veritastool -f ./stock-plugins/aiverify.stock.veritas/algorithms/veritastool/Dockerfile .
```

Modify the parameters accordingly and run the example bash script:

```sh
#!/bin/bash
docker run \
  -v $(pwd)/stock-plugins/user_defined_files:/input \
  -v $(pwd)/stock-plugins/aiverify.stock.veritas/algorithms/veritastool/output:/app/aiverify/output \
  aiverify-veritastool \
  --data_path /input/veritas_data/cs_X_test.pkl \
  --model_path /input/veritas_data/cs_model.pkl \
  --ground_truth_path /input/veritas_data/cs_y_test.pkl \
  --ground_truth y_test \
  --training_data_path /input/veritas_data/cs_X_train.pkl \
  --training_ground_truth_path /input/veritas_data/cs_y_train.pkl \
  --training_ground_truth y_train \
  --use_case "base_regression" \
  --privileged_groups '{"SEX": [1], "MARRIAGE": [1]}' \
  --model_type CLASSIFICATION \
  --fair_threshold 80 \
  --fair_metric "auto" \
  --fair_concern "eligible" \
  --performance_metric "accuracy" \
  --transparency_rows 20 40 \
  --transparency_max_samples 1000 \
  --transparency_features LIMIT_BAL \
  --run_pipeline
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder in the algorithm directory.
