# Robustness Toolbox

## Description
This plugin generates a perturbed dataset using boundary attack algorithm on the test dataset. 

Boundary Attack is an attack that starts by adding a large amount of noise to a data point intentionally to cause a model it misclassified by the model. This plugin uses Salt-and-pepper noise to create the large amount of noise. Then, it will reduce the amount of noise added while maintaining misclassification. This algorithm does not depend on the underlying model's architecture or parameters.

This algorithm is developed for image dataset but can also be used to create noise on tabular dataset. However, it is to note that testing on tabular dataset may warrant caution when interpreting the results as this is not well-tested.

## Plugin Content
- Algorithms
  
| Name               | Description                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Robustness Toolbox | This algorithm generates a perturbed dataset using boundary attack algorithm on the test dataset |


- Widgets

| Name                     | Description                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Description (Summary)    | To provide introduction, interpretation and recommendations for robustness testing                                    |
| Bar Chart (Accuracy)     | To generate and display a bar chart of the orignal and perturbed dataset with interpretation of the results                    |
| Description (Technical)  | To provide introduction, bar chart, interpretation and recommendations for robustness testing with technical details                                                |

## Using the Plugin in AI Verify
### Data Preparation
This plugin was mainly designed for image datasets, but can also be used on tabular datasets.

For images:
- Image dataset ([Tutorial for Preparation](https://aiverify-foundation.github.io/aiverify/getting-started/prepare-image/#1-dataset-preparation))
- Annotated Ground Truth Dataset ([Tutorial for Preparation](https://aiverify-foundation.github.io/aiverify/getting-started/prepare-image/#2-annotated-ground-truth-dataset))

For tabular:
- Tabular dataset ([Tutorial for Preparation](https://aiverify-foundation.github.io/aiverify/getting-started/prepare-tabular/))

### Algorithm User Input(s)

| Input Field                               | Description                                                                                                                                                             |   Type   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| Annotated ground truth path               | **For image datasets:** An uploaded dataset containing image file names and the corresponding ground truth label </br> **For tabular datasets:** Select the ground truth dataset | `string` |
| Name of column containing image file name | **For image datasets:** Key in the name of the column containing the file names in the annotated ground truth dataset </br> **For tabular datasets:** Key in `NA`                                                                            | `string` |

### Sample use of the widgets

![ICT sample](images/robustness_toolbox_sample.png)
