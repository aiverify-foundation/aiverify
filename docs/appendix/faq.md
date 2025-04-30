## Models

| Models    |              |
| ----------| ------------ |
| What is the list of models supported by the toolkit? | Currently, the Upload AI Model method supports limited binary classification and regression models trained by algorithms found in scikit-learn, Tensorflow, PyTorch, XGBoost and LightGBM.  |
| How should I prepare the model to be uploaded?       | Visit our How-To guides for preparation of input files: <br> [For Tabular](../detailed-guide/input-preparation/prepare-tabular.ipynb)/ [For Image](../detailed-guide/input-preparation/prepare-image.ipynb) |
| Is there any limit to the model file size?           | The maximum size for uploading of the model file and test dataset file is **4 GB** each.<br/> It is recommended to use a smaller test dataset (i.e., smaller than 4GB) as a large file may take significantly longer to complete. The time taken to run the test will also be affected by the number of features. |

## Datasets

| Datasets                                                      |                                                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does the toolkit support categorical values in string format? | The toolkit currently does not support columns with categorical values in string format. The toolkit requires these columns to be encoded to numeric values before running any technical tests. |
| What pandas version is currently supported by the toolkit?    | The toolkit currently runs Pandas v2.2.2.  |
| Can the toolkit support .csv or .xlsx inputs?                 | The toolkit supports .csv but not .xlsx. Other Delimiter-separated Values supported are: tab, semicolon, pipe, space, colon |
| How should I prepare the dataset to be uploaded?              | Visit our How-To guides for preparation of input files: <br> [For Tabular](../detailed-guide/input-preparation/prepare-tabular.ipynb)/ [For Image](../detailed-guide/input-preparation/prepare-image.ipynb)            |
| What is considered a good input size for the test data?       | Recommended number of test data points is 100, selecting a larger sample will require a longer computation time.    |

## Results & Reports

| Results & Reports                                            |                    |
| ------------------------------------------------------------ | ------------------ |
| How do I view test logs after tests have completed running? | Click to edit the project you want to view logs for. <br> In the URL, copy the ID string behind `../project/`<br> Append the ID string to the end of this URL `http://localhost:3000/reportStatus/`|


If you have any other questions or need assistance, please check the project discussions or issue tracker for existing threads. If you cannot find a resolution, feel free to create a new discussion or issue, or head over to our [contact page](https://aiverifyfoundation.sg/contact-us/?utm_source=Github&utm_medium=referral&utm_campaign=20230607_Queries_from_GitHub) if you require assistance.