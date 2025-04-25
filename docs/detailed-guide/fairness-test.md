# Fairness Tests

The Fairness Metrics Toolbox (FMT) for Classification contains a list of fairness metrics to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for classification models.

## Run using Command Line Interface (CLI)

Install the test using pip:

```
pip install aiverify-fairness-metrics-toolbox-for-classification
```

Run the bash script to execute the plugin:

```
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"
python -m aiverify_fairness_metrics_toolbox_for_classification \
  --data_path $root_path/data/sample_mc_toxic_data.sav \
  --model_path $root_path/model/sample_mc_toxic_sklearn_linear.LogisticRestression.sav \
  --ground_truth_path $root_path/data/sample_mc_toxic_data.sav \
  --ground_truth toxic \
  --model_type CLASSIFICATION \
  --sensitive_features_list gender

```

Once the algorithm runs successfully, the results will be saved in an `output` folder.
Use the generated result to create a report.


## Generate report

After running the test – either via portal or command line, select
HomePage > Create New Project  > Create New Report Template

Select Fairness for Classification and drag and drop the widgets to the canvas.


![aivf2-0-fairness-template](../res/detailed-guide/fairness-template.png)


Select the following:
-	AI model: sample_bc_credit_sklearn.LogisticRegression.sav
-	Test result: fariness_toolbox_for_classification
-	User inputs: select Fairness Tree 
Click "Next".


![aivf2-0-fairness-select-model](../res/detailed-guide/fairness-select-model.png)

![aivf2-0-fairness-save](../res/detailed-guide/fairness-save.png)

Save as template or download the generated report as PDF.