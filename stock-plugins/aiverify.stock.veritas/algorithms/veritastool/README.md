# Veritas Toolkit

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/main/icon/veritas_logo_new.png" ></p>


The purpose of this toolkit is to facilitate the adoption of Veritas Methodology on Fairness & Transparency Assessment and spur industry development. It will also
benefit customers by improving the fairness and transparency of financial services delivered by AIDA systems.

  
## Installation

The easiest way to install veritastool is to download it from [`PyPI`](https://pypi.org/project/veritastool/). It's going to install the library itself and its prerequisites as well. It is suggested to create virtual environment with requirements.txt file first.

```python
pip install veritastool
```

Then, you will be able to import the library and use its functionalities. Before we do that, we can run a test function on our sample datasets to see if our codes are performing as expected.

```python
from veritastool.util.utility import test_function_cs
test_function_cs()
```
Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/test_evaluate_cs.png" width="800" height="100"></p>

### Initialization ##

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
# NOTE: Assume current working directory is the root folder of the cloned veritastool repository
file = "./veritastool/examples/data/credit_score_dict.pickle"
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
###  API functions ###

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

** Note: Replace {Balanced Accuracy} with the respective given metrics. 

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

Generates model artifact file in JSON format. This function also runs all the API functions if it hasn't already been run.

```python
cre_sco_obj.compile()
```
Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/compile_2.png" width="529" height="209"></p>

**Model Artifact**

A JSON file that stores all the results from all the APIs.

Output:

<p align="center"><img src="https://raw.githubusercontent.com/mas-veritas2/veritastool/master/icon/json_2.png" width="456" height="494"></p>

## Examples

You may refer to our example notebooks below to see how the toolkit can be applied:

| Filename                                                                                                                                                        | Description                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`CS_Demo.ipynb`](https://github.com/mas-veritas2/veritastool/blob/master/veritastool/examples/CS_demo.ipynb)                                                   | Tutorial notebook to diagnose a credit scoring model for predicting customers' loan repayment.                                                               |
| [`CM_Demo.ipynb`](https://github.com/mas-veritas2/veritastool/blob/master/veritastool/examples/customer_marketing_example/CM_demo.ipynb)                        | Tutorial notebook to diagnose a customer marketing uplift model for selecting existing customers for a marketing call to increase the sales of loan product. |
| [`BaseClassification_demo.ipynb`](https://github.com/mas-veritas2/veritastool/blob/master/veritastool/examples/BaseClassification_demo.ipynb)                   | Tutorial notebook for a multi-class propensity model                                                                                                         |
| [`BaseRegression_demo.ipynb`](https://github.com/mas-veritas2/veritastool/blob/master/veritastool/examples/BaseRegression_demo.ipynb)                           | Tutorial notebook for a prediciton of a continuous target variable                                                                                           |
| [`PUW_demo.ipynb`](https://github.com/mas-veritas2/veritastool/blob/master/veritastool/examples/PUW_demo.ipynb)                                                 | Tutorial notebook for a binary classification model to predict whether to award insurance policy by assessing risk                                           |
| [`NewUseCaseCreation_demo.ipynb`](https://github.com/mas-veritas2/veritastool/blob/master/veritastool/examples/NewUseCaseCreation_demo.ipynb)                   | Tutorial notebook to create a new use case note-book and add custom metrics                                                                                  |
| [`nonPythonModel_customMetric_demo.ipynb`](https://github.com/mas-veritas2/veritastool/blob/master/veritastool/examples/nonPythonModel_customMetric_demo.ipynb) | Tutorial notebook to diagnose a credit scoring model by LibSVM (non-Python) with custom metric.                                                              |

## License

Veritas Toolkit is licensed under the Apache License, Version 2.0 - see [`LICENSE`](https://raw.githubusercontent.com/mas-veritas2/veritastool/master/license.txt) for more details. 


