# Getting Started
For docker (recommended), follow installation steps from [Quick start guide](./quick-start-guide.md).

<object data="../res/AIVT_2.0_quick_start_guide.pdf" type="application/pdf" width="100%" height="350px">
  <p>Unable to display PDF, <a href="../res/AIVT_2.0_quick_start_guide.pdf">click here to download it</a>.</p>
</object>


Refer to [detailed installation guide](./detailed-guide/installation-using-kubernetes.md) if you choose to use Kubernetes.

Open [http://localhost:3000](http://localhost:3000)

![aivf2-0](./res/getting-started/aiverify-home.png)

For generating reports, there are 4 steps needed:

1. Upload Dataset
2. Upload model
3. Run tests and save results
4. Generate report

##Upload Dataset

[Download `sample_bc_credit_data.sav` from this folder](https://github.com/aiverify-foundation/aiverify/tree/e2a0099bf51837e516ef09ca7115cbcbd5d8896c/stock-plugins/aiverify.stock.shap-toolbox/algorithms/shap_toolbox/tests/user_defined_files/data) to your local file system. To prepare data for your own use case [follow the detailed guide here](./detailed-guide/).

From Homepage, click on "Manage"
![aivf2-0-manage](./res/getting-started/manage.png)

Click on "Data"

![aivf2-0-manage-data](./res/getting-started/manage-data.png)

Click on "Upload Dataset"

![aivf2-0-manage-data-upload](./res/getting-started/manage-data-upload.png)

Drag & Drop the dataset or choose from your local file system.

![aivf2-0-manage-data-upload-file](./res/getting-started/manage-data-upload-file.png)

Click on “Confirm Dataset” to upload the dataset onto the portal.

![aivf2-0-manage-data-confirm](./res/getting-started/manage-data-confirm.png)



##Upload model
[Download `sample_bc_credit_sklearn_linear.LogisticRegression.sav` from this folder](https://github.com/aiverify-foundation/aiverify/tree/e2a0099bf51837e516ef09ca7115cbcbd5d8896c/stock-plugins/aiverify.stock.shap-toolbox/algorithms/shap_toolbox/tests/user_defined_files/model) to your local file system. To prepare model for your own use case [follow the detailed guide here](./detailed-guide/)).


From Homepage, click on “Manage”

![aivf2-0-manage](./res/getting-started/manage.png)

Click on "Models"

![aivf2-0-manage-models](./res/getting-started/manage-models.png)

Click on "Upload Model"

![aivf2-0-manage-models-upload](./res/getting-started/manage-models-upload.png)

Click on "Upload AI Model"”" – if you have one model file or choose "Upload Pipeline" to choose with data processing pipeline.


![aivf2-0-manage-models-upload-model](./res/getting-started/manage-models-upload-model.png)

Choose the model file from local file system, select model type (Regression/Classification) based on your use case and click on "Upload File(s)"

![aivf2-0-manage-models-upload-model-files](./res/getting-started/manage-data-model-upload-files.png)

You will receive a confirmation after model file is uploaded successfully onto the portal.

![aivf2-0-model-success](./res/getting-started/model-success.png)


##Run tests and save results

If you want to run an "Explainability" test - example Accumulated Local Effects (ALE), 

From Homepage, click on “Manage”

![aivf2-0-manage](./res/getting-started/manage.png)

Click on "Test Results"

![aivf2-0-manage-test](./res/getting-started/manage-test.png)

Click on "Run New Tests"

![aivf2-0-manage-test-run](./res/getting-started/manage-test-run.png)


Select 

-	Algorithm => aiverify_accumulated_local_effect
-	Model => sample_bc_credit_sklearn_linear.LogisticRegression.sav (saved in previous step)
-	Test Dataset => sample_bc_credit_data.sav (saved in previous step)

![aivf2-0-manage-test-run-new](./res/getting-started/manage-test-run-new.png)

Click on "Run Test"

![aivf2-0-manage-test-success](./res/getting-started/manage-test-success.png)

You will have the result of the test saved that can be used during report generation.

## Generate Report

Click on "Create New Project"

![aivf2-0-create-project](./res/getting-started/create-project.png)

Fill in the project name, description, report title and company name.

![aivf2-0-create-project-new](./res/getting-started/create-project-new.png)

Select "Create New Report Template"

![aivf2-0-create-project-new-template](./res/getting-started/create-project-new-template.png)

Under "Accumulated Local Effects" section drag and drop the widgets into the canvas.

![aivf2-0-create-report-ale](./res/getting-started/create-report-ale.png)

Note that this highlights a "Test" icon on the right – indicating the results of the test is needed for generating the report. Click "Next". 

Choose the model and test results saved earlier and click "Next".

![aivf2-0-report-select-model](./res/getting-started/report-select-model.png)

This would generate a new report with selected sections.

![aivf2-0-generate-report-save](./res/getting-started/generate-report-save.png)

You can either save this as a template or export as a PDF based on your needs.