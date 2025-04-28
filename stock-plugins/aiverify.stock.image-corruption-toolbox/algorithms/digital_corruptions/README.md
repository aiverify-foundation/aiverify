# Algorithm - Digital Corruptions

## Description

- Robustness plugin with digital corruptions

## License

- Licensed under Apache Software License 2.0

## Developers

- AI Verify

## Installation

Each test algorithm can now be installed via pip and run individually.

```sh
pip install aiverify-digital-corruptions
```

## Example Usage

Run the following bash script to execute the plugin

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"

python -m aiverify_digital_corruptions \
  --data_path $root_path/data/raw_fashion_image_10 \
  --model_path $root_path/pipeline/sample_fashion_mnist_sklearn \
  --model_type CLASSIFICATION \
  --ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --file_name_label file_name \
  --set_seed 10
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder.

## Including Specific Corruptions

### Usage

By default, **all** corruption functions are applied. You can use the `--corruptions` flag to specify which functions to run.

```sh
--corruptions [FUNCTION_NAME ...]
```

### Options

- `all` -> Runs all digital corruption functions (default)
- `brightness_down`
- `brightness_up`
- `contrast_down`
- `contrast_up`
- `saturate_down`
- `saturate_up`
- `random_perspective`
- `jpeg_compression`

### Example: Applying only Random Perspective and JPEG Compression corruptions

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"

python -m aiverify_digital_corruptions \
  --data_path $root_path/data/raw_fashion_image_10 \
  --model_path $root_path/pipeline/sample_fashion_mnist_sklearn \
  --model_type CLASSIFICATION \
  --ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --file_name_label file_name \
  --set_seed 10
  --corruptions random_perspective jpeg_compression
```

## Customizing Parameters

To fine-tune the corruption parameters, use the [Digital Corruption Playground Notebook](./playground.ipynb). This notebook allows you to:

✅ Visualize the effects of different corruption functions.

✅ Experiment with different parameter values.

✅ Apply custom values in the CLI using flags like:

```sh
#!/bin/bash

root_path="<PATH_TO_FOLDER>/aiverify/stock-plugins/user_defined_files"

python -m aiverify_digital_corruptions \
  --data_path $root_path/data/raw_fashion_image_10 \
  --model_path $root_path/pipeline/sample_fashion_mnist_sklearn \
  --model_type CLASSIFICATION \
  --ground_truth_path $root_path/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --file_name_label file_name \
  --set_seed 10
  --brightness_down_factor 0.1 0.2 0.3
```

## PyTorch support

To use a custom PyTorch model with this plugin, follow the steps below:

1. **Install PyTorch**

   Ensure you have installed a PyTorch version compatible with your model. Visit the [PyTorch website](https://pytorch.org/get-started/locally/) for installation instructions.

2. **Specify Model Path**

   Use the `--model_path` command-line argument to specify the path to a **folder** containing:

   - The model class definition (e.g., `model.py`).
   - The model weights file (e.g., `model_weights.pt`).

3. **Implement a `predict` Function**

   Your model class must implement a `predict` function. This function should:

   - Accept a batch of image file paths as input.
   - Return a batch of predictions.

   For reference, see the sample implementation in `user_defined_files/pipeline/sample_fashion_mnist_pytorch`.

### Example Directory Structure

```bash
<model_path>/
├── model.py             # Contains the model class definition
├── model_weights.pt     # Contains the trained model weights
```

### Example `predict` Function

```python
# model.py
from typing import Iterable

import numpy as np
import torch
from PIL import Image
from torchvision import transforms


class CustomModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        # Define your model architecture here
        ...

    def forward(self, x):
        # Define the forward pass
        ...

    def predict(self, image_paths: Iterable[str]) -> np.ndarray:
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            ...,
            transforms.ToTensor(),
        ])
        images = [Image.open(path).convert("RGB") for path in image_paths]
        image_tensors = torch.stack([transform(image) for image in images])

        self.eval()
        with torch.no_grad():
            predictions = self(image_tensors).argmax(dim=1).detach().cpu().numpy()
        return predictions
```

By following these steps, you can integrate your custom PyTorch model into the corruption plugin.

## Develop plugin locally

Execute the below bash script in the project root

```sh
#!/bin/bash

# setup virtual environment
python -m venv .venv
source .venv/bin/activate

# install plugin
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
pip install .

python -m aiverify_digital_corruptions --data_path  <data_path> --model_path <model_path> --model_type CLASSIFICATION --ground_truth_path <ground_truth_path> --ground_truth <str> --file_name_label <str> --set_seed <int>
```

### Build Plugin

```sh
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
hatch build
```

### Tests

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
pytest .
```

## Run using Docker

In the aiverify root directory, run the below command to build the docker image

```sh
docker build -t aiverify-digital-corruptions -f stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/Dockerfile .
```

Run the below bash script to run the algorithm

```sh
#!/bin/bash
docker run \
  -v $(pwd)/stock-plugins/user_defined_files:/input \
  -v $(pwd)/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/output:/app/aiverify/output \
  aiverify-digital-corruptions \
  --data_path /input/data/raw_fashion_image_10 \
  --model_path /input/pipeline/sample_fashion_mnist_sklearn \
  --model_type CLASSIFICATION \
  --ground_truth_path /input/data/pickle_pandas_fashion_mnist_annotated_labels_10.sav \
  --ground_truth label \
  --file_name_label file_name \
  --set_seed 10
```

If the algorithm runs successfully, the results of the test will be saved in an `output` folder in the algorithm directory.

### Tests

Run the following steps to execute the unit and integration tests inside the `tests/` folder

```sh
docker run --entrypoint python3 aiverify-digital-corruptions -m pytest .
```
