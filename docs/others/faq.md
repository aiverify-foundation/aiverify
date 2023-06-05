## Installation

| Installation                                 |                                                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Does the toolkit run in Jupyter notebooks?   | No, the toolkit is a standalone toolkit. Users can use the user interface provided to run the testing workflow.                  |
| Does the toolkit run on Apple’s M1/M2 chips? | No, testing is currently not supported on Apple’s M1/M2 chips as they do not support the Tensorflow library used by the toolkit. |

## Models

| Models                                               |                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What is the list of models supported by the toolkit? | Currently, the Upload AI Model method supports limited binary classification and regression models trained by algorithms found in scikit-learn, Tensorflow, XGBoost and LightGBM.                                                                                                                                 |
| How should I prepare the model to be uploaded?       | Answer to question                                                                                                                                                                                                                                                                                                |
| Is there any limit to the model file size?           | The maximum size for uploading of the model file and test dataset file is **2 GB** each.<br/> It is recommended to use a smaller test dataset (i.e., smaller than 2GB) as a large file may take significantly longer to complete. The time taken to run the test will also be affected by the number of features. |

## Datasets

| Datasets                                                      |                                                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does the toolkit support categorical values in string format? | The toolkit currently does not support columns with categorical values in string format. The toolkit requires these columns to be encoded to numeric values before running any technical tests. |
| What pandas version is currently supported by the toolkit?    | The toolkit is able to support pandas version 1.3.5. Currently, with the latest pandas version 1.4.3, the toolkit is unable to unpickle and read files for testing.                             |
| Can the toolkit support .csv or .xlsx inputs?                 | Answer to question                                                                                                                                                                              |
| How should I prepare the dataset to be uploaded?              | Answer to question                                                                                                                                                                              |
| What is considered a good input size for the test data?       | Answer to question                                                                                                                                                                              |

## Results & Reports

| Results & Reports                                            |                    |
| ------------------------------------------------------------ | ------------------ |
| How to view files from the downloaded test results and logs? | Answer to question |
