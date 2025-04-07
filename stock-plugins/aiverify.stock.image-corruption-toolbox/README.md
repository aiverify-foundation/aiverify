# Image Corruption Toolbox

## Description

This plugin tests the robustness of AI models to natural corruptions.

There are four different broad groups of corruptions that are packaged in this plugin. Each of these broad groups of corruptions also have more specific corruption functions indicated in brackets below:

- General (Gaussian, Poisson, Salt and Pepper)
- Blur (Gaussian, Glass, Defocus, Horizontal Motion, Vertical Motion, Zoom)
- Digital (Brightness Up and Down, Contrast Up and Down, Saturate Up and Down, Random Perspective, JPEG Compression)
- Environmental (Snow, Fog, Rain)

The toolbox generates corrupted images based on the uploaded test data at 5 different severity levels (default) for each corruption function. The accuracy of the model is calculated with the new corrupted datasets.

## Plugin Content

- Algorithms

| Name                    | Description                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blur Corruptions        | Algorithm that adds blur corruptions (gaussian, glass, defocus, horizontal motion, vertical motion, zoom) to images across thresholds of interests, and calculates the accuracy of the model                                          |
| Digital Corruptions     | Algorithm that adds digital corruptions (brightness up and down, contrast up and down, saturate up and down, random perspective, jpeg compression) to images across thresholds of interests, and calculates the accuracy of the model |
| Environment Corruptions | Algorithm that adds environmental corruptions (snow, fog, rain) to images across thresholds of interests, and calculates the accuracy of the model                                                                                    |
| General Corruptions     | Algorithm that adds general corruptions (gaussian, poisson, salt and pepper) to images across thresholds of interests, and calculates the accuracy of the model                                                                       |

- Widgets

| Name                                                                                                                                                           | Description                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Introduction                                                                                                                                                   | To provide an introduction to the Image Corruption Toolbox                                |
| Understanding Bar Chart                                                                                                                                        | To guide your users on reading the generated bar charts                                   |
| Bar Chart (by corruptions type)                                                                                                                                | To generate bar chart to visualise the accuracy results when blur corruptions are applied |
| <ul><li> Blur corruption samples </li><li> Digital corruption samples </li> <li> Environment corruption samples</li> <li> General corruption samples</li></ul> | To generate sample images for the different corruption types                              |
| Recommendation                                                                                                                                                 | To provide recommendations for robustness (image corruptions) testing                     |

## Using the Plugin in AI Verify

### Data Preparation

- Image dataset ([Tutorial for Preparation](https://aiverify-foundation.github.io/aiverify/getting-started/prepare-image/#1-dataset-preparation))
- Annotated Ground Truth Dataset ([Tutorial for Preparation](https://aiverify-foundation.github.io/aiverify/getting-started/prepare-image/#2-annotated-ground-truth-dataset))

### Algorithm User Input(s)

Please refer to the READMEs of the individual algorithms for more information on the specific parameters of interests.

### Sample use of the widgets

![ICT sample](images/image_corruption_v2_sample.png)
