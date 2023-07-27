# Introduction 

In this step-by-step tutorial, we will walk you through how you can test your AI Model and generate a report that aligns with the AI Verify Testing Framework.

If you do not have the input files ready on hand, you can use these sample files for this tutorial:

|       | Description |   | 
| ----------- | ----------- | ----------- |
| AI Model     | This is a binary classification model that is trained on mock credit risk dataset. `sample_bc_credit_sklearn_linear.LogisticRegression.sav` | [**Download Here**](https://github.com/IMDA-BTG/aiverify/blob/main/examples/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav?raw=true)|
| Test Dataset    | This is a sample tabular dataset which we will be using as the testing dataset, ground truth dataset, and background dataset. `sample_bc_credit_data.sav` | [**Download Here**](https://github.com/IMDA-BTG/aiverify/blob/main/examples/data/sample_bc_credit_data.sav?raw=true) |

These sample files are based on a mock *Credit Risk* use case. We train a binary classification model to predict whether an applicant will default the loan using mock data.

If you have not setup and run AI Verify, [follow this guide](../../getting-started/docker-setup.md). Then, **start AI Verify** ([http://localhost:3000/home](http://localhost:3000/home))