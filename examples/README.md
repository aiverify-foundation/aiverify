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
| AI Model     | sample_bc_credit_sklearn_linear.LogisticRegression.sav |
| Test Dataset | sample_bc_credit_data.sav |
| Ground Truth File  | sample_bc_credit_data.sav |
| Ground Truth | default |
| Sensitive Feature | gender, race |

#### Pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | binary_classification_tabular_credit_loan | 
| Test Dataset | sample_bc_pipeline_credit_data.sav |
| Ground Truth File  | sample_bc_pipeline_credit_ytest_data.sav |
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
| AI Model     | sample_mc_toxic_sklearn_linear.LogisticRegression.sav |
| Test Dataset | sample_mc_toxic_data.sav |
| Ground Truth File  | sample_mc_toxic_data.sav |
| Ground Truth | toxic |
| Sensitive Feature | gender, race |

#### Pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | multiclass_classification_tabular_toxic_classification | 
| Test Dataset | sample_mc_pipeline_toxic_data.sav |
| Ground Truth File  | sample_mc_pipeline_toxic_ytest_data.sav |
| Ground Truth | toxic |
| Sensitive Feature | gender, race |

## Regression
Use Case: To predict how much a donor will donate

Output: 
- Donation amount

### Non-pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | sample_reg_donation_sklearn_linear.LogisticRegression.sav |
| Test Dataset | sample_reg_donation_data.sav |
| Ground Truth File  | sample_reg_donation_data.sav |
| Ground Truth | donation |
| Sensitive Feature | gender, race |

#### Pipeline

|       | File | 
| ----------- | ----------- |
| AI Model     | regression_tabular_donation | 
| Test Dataset | sample_reg_pipeline_data.sav |
| Ground Truth File  | sample_reg_pipeline_ytest_data.sav |
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