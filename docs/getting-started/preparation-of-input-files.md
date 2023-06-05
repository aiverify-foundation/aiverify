To run the technical tests, you need to prepare input fles. To find out the input files needed by a specific technical test, check out the [Plugin Documentation here](https://imda-btg.github.io/aiverify-developer-tools/).

| Input File/ Folder | Description |
| ---------- | ---- |
| AI Model or Pipeline | The prediction model to be tested. A pipeline may include both data pre-processing and the prediction model. |
| Testing Dataset | Any dataset to be used for testing. |
| Ground Truth Dataset (For tabular) | A dataset that contains the ground truth. The testing dataset can be used if it contains the ground truth. |
| Ground Truth Dataset/ Annotated Ground Truth Dataset (For image) | A dataset containing the image file names and ground truth. |
| Background Dataset | The background dataset should be representative of the dataset’s population. The testing dataset can be used if it is representative of the dataset’s population. |

All input files should be smaller than 4GB and be serialized by pickle or joblib (except for image datasets and TensorFlow models).

For reference on how the model and dataset files can be prepared, check out the sample python notebook [here](). <!-- TODO: Link -->
