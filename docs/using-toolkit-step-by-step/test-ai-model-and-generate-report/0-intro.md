# Introduction 

In this step-by-step tutorial, we will walk you through how you can test your AI Model and generate a report that aligns with the AI Verify Testing Framework.

If you do not have the input files ready on hand, you can use these sample files for this tutorial:

|       | Description |   | 
| ----------- | ----------- | ----------- |
| AI Model     | This is a binary classification model that is trained on mock credit risk dataset. `binary_classification_mock_credit_risk_sklearn.linear_model._logistic.LogisticRegression.sav` | [**Download Here**](https://github.com/IMDA-BTG/aiverify/blob/main/examples/model/binary_classification_mock_credit_risk_sklearn.linear_model._logistic.LogisticRegression.sav?raw=true)|
| Test Dataset    | This is a sample tabular dataset which we will be using as the testing dataset, ground truth dataset, and background dataset. `pickle_pandas_mock_binary_classification_credit_risk_testing.sav` | [**Download Here**](https://github.com/IMDA-BTG/aiverify/blob/main/examples/data/pickle_pandas_mock_binary_classification_credit_risk_testing.sav?raw=true) |

These sample files are based on a mock *Credit Risk* use case. We train a binary classification model to predict whether an applicant will default the loan using mock data.

If you have not setup and run AI Verify, [follow this guide](../../getting-started/docker-setup.md). Then, **start AI Verify** ([http://localhost:3000/home](http://localhost:3000/home))