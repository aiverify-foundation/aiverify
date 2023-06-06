The AI Verify Report Template includes components that require technical tests to be run. To run these tests, you will need to upload the *Testing Dataset*, *Ground Truth Dataset*, and *AI Model*.

** Click on ‘Choose Dataset’.**

![select-test-dataset](../../res/test-ai-model-generate-report/input-block-1.png)

If you have previously uploaded the dataset to be used, click on the row of the dataset to be used. Note that datasets marked ‘Invalid’ have invalid properties and cannot be used. Click on **‘Use Dataset’** and [Skip to Step 5.](../5-select-ground-truth-dataset)

To upload new datasets, click on **‘New Dataset +’.**

![upload-test-dataset](../../res/test-ai-model-generate-report/dataset-1.png)

**Drag and drop** the dataset file(s) onto the drop box or click to select files. A maximum of 10 files can be uploaded at once. You should also take the chance to upload the Ground Truth and Background Datasets as well. For image datasets, you can upload a folder containing the image files by clicking on ‘Upload Folder’ to select the folder to be uploaded. For more information on dataset preparation, ([See Getting Started > Preparation of Input Files](../../getting-started/preparation-of-input-files.md))

For this tutorial, we will be using the sample dataset `pickle_pandas_mock_binary_classification_credit_risk_testing.sav` [**Download Here**](https://github.com/IMDA-BTG/aiverify/blob/main/examples/data/pickle_pandas_mock_binary_classification_credit_risk_testing.sav?raw=true)

Click **‘Upload Selected Files >’**.

![upload-selected-dataset](../../res/test-ai-model-generate-report/dataset-2.png)

Once dataset validation is completed, you can view the dataset information on the right panel. If the dataset is valid, you can edit the dataset name and description by clicking on **‘Edit’**. If the dataset is invalid, refer to the error message for more information.

Click on **‘Back to all datasets’**.

![back-to-datasets](../../res/test-ai-model-generate-report/dataset-3.png)

Select the *Testing Dataset* to be used by clicking on its row, then **‘Use Dataset’**.

![use-datasets](../../res/test-ai-model-generate-report/dataset-5.png)
