# Algorithm - Digital Corruptions

## License
* Licensed under Apache Software License 2.0

## Developers:
* AI Verify

## Run Plugin in local
#### Execute the below bash script in the project root
```
#!/bin/bash

# setup virtual environment
python -m venv .venv
source .venv/bin/activate

# execute plugin
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/

# install test-engine-core 
pip install -e '.[dev]'

python -m aiverify_digital_corruptions --data_path  <data_path> --model_path <model_path> --ground_truth_path <ground_truth_path> --ground_truth <str> --model_type CLASSIFICATION --run_pipeline --set_seed <int> --annotated_ground_truth_path <annotated_file_path> --file_name_label <str>

```
--  Note : replace assets path with the actual absolute path

## Build Plugin
```
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
hatch build
```
## Tests
### Pytest is used as the testing framework.
Execute the below steps to execute unit and integration tests inside tests/ folder
```
cd aiverify/stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/digital_corruptions/
pytest .
```
