# AI Verify Examples

## Mock Samples

We have included mock samples in this repository. To use these examples, follow our user guide to upload them to the respective pages:

1. Upload all mock datasets in `./data` to Datasets via AI Verify user interface.
2. Upload all mock models and pipelines in `./models` and `./pipeline` to AI Models via AI Verify user interface.

**Note that all datasets (except for Fashion-MNIST dataset) are synthetically created using `numpy`.**

## Binary Classification
Use Case: To predict whether an applicant will default the loan

Output Classes:
- 0: Will not default the loan
- 1: Will default the loan

### Non-pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | binary_classification_mock_credit_risk_sklearn.linear_model._logistic.LogisticRegression.sav |
| Test Dataset | pickle_pandas_mock_binary_classification_credit_risk_testing.sav |
| Ground Truth File  | pickle_pandas_mock_binary_classification_credit_risk_testing.sav |
| Ground Truth | default |
| Sensitive Feature | gender, race |

#### Pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | binary_classification_tabular_credit_loan | 
| Test Dataset | pickle_pandas_mock_binary_classification_pipeline_credit_risk_testing.sav |
| Ground Truth File  | pickle_pandas_mock_binary_classification_pipeline_credit_risk_ytest.sav |
| Ground Truth | default |
| Sensitive Feature | gender, race |

## Multiclass Classification
Use Case: To categorise whether a datapoint into its respective toxic category

Output Classes:
- 0: Not toxic
- 1: Racism
- 2: Violence
- 3: Hatred
- 4: Identity Hate

### Non-pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | multiclass_classification_mock_toxic_classification_sklearn.linear_model._logistic.LogisticRegression.sav |
| Test Dataset | pickle_pandas_mock_multiclass_classification_toxic_classification_testing.sav |
| Ground Truth File  | pickle_pandas_mock_multiclass_classification_toxic_classification_testing.sav |
| Ground Truth | toxic |
| Sensitive Feature | gender, race |

#### Pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | multiclass_classification_tabular_toxic_classification | 
| Test Dataset | pickle_pandas_mock_multiclass_classification_pipeline_toxic_classification_testing.sav |
| Ground Truth File  | pickle_pandas_mock_multiclass_classification_pipeline_toxic_classification_ytest.sav |
| Ground Truth | toxic |
| Sensitive Feature | gender, race |

## Regression
Use Case: To predict how much a donor will donate

Output: 
- Donation amount

### Non-pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | regression_mock_donation_sklearn.linear_model._base.LinearRegression.sav |
| Test Dataset | pickle_pandas_mock_regression_donation_testing.sav |
| Ground Truth File  | pickle_pandas_mock_regression_donation_testing.sav |
| Ground Truth | donation |
| Sensitive Feature | gender, race |

#### Pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | regression_tabular_donation | 
| Test Dataset | pickle_pandas_mock_regression_pipeline_testing.sav |
| Ground Truth File  | pickle_pandas_mock_regression_pipeline_ytest.sav |
| Ground Truth | donation |
| Sensitive Feature | gender, race |


## Image - Multiclass Classification
Use Case: To classify images into their respective fashion object (e.g. shoes, clothes)

|       | File | 
| ----------- | ----------- |
| AI Model     | multiclass_classification_image_mnist_fashion | 
| Test Dataset | raw_fashion_image_10 |
| Ground Truth File  | pickle_pandas_fashion_mnist_annotated_labels_10.sav |
| Ground Truth | label |
| Sensitive Feature | None |
| Annotated File | pickle_pandas_fashion_mnist_annotated_labels_10.sav|
| Annotated Columnn | file_name |

License: The copyright for Fashion-MNIST is held by Zalando SE. Fashion-MNIST is licensed under the MIT license.