# AI Verify Test Engine

## Description

AI Verify Test Engine provides core interfaces, converters, data, model and plugin managers to facilitate the development of tests for AI systems. It is used as a base library for all AI Verify official stock-plugins and can be used to develop custom plugins.

## Installation

Install `aiverify-test-engine` via pip. The following table list the available install options and the optional dependencies along with the additional functionality that is supported.

| Installation Command                           | Description                                                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pip install aiverify-test-engine`             | Installs only the core functionalites. Supports tabular data formats like CSV, as well as Pandas pickle and Joblib files, and Scikit-learn models. |
| `pip install aiverify-test-engine[dev]`        | Includes additional dependencies for development. Intended for developers who want to contribute to the project.                                   |
| `pip install aiverify-test-engine[tensorflow]` | Installs optional Tensorflow and Keras dependencies.                                                                                               |
| `pip install aiverify-test-engine[pytorch]`    | Installs optional PyTorch dependencies.                                                                                                            |
| `pip install aiverify-test-engine[gbm]`        | Installs XGBoost and LightGBM packages. Supports serializing models in these formats.                                                              |
| `pip install aiverify-test-engine[all]`        | Installs the core package along with all additional non development dependencies.                                                                  |

## Developer Guide

### Local Installation

To contribute changes to the test engine code, clone the repository, navigate to the `aiverify-test-engine` folder, and install the dev version of the library:

```bash
pip install '.[dev]'
```

Here's an overview of the project folder structure and a brief description of each:

```bash
aiverify-test-engine/
├── aiverify_test_engine/   # Core library code
│   ├── interfaces/         # Core interfaces (algorithm, converter, data, model, pipeline, serializer, plugin)
│   ├── io/                 # Data and model IO related logic
│   ├── plugins/            # Manage the loading and execution of algorithm, data, model, pipeline and plugins
│   ├── utils/              # Utility functions and validators
├── tests/                  # Test cases
├── pyproject.toml          # Project configuration file
```

### Running Tests

```bash
python -m pytest tests
```

### Building the Package

```bash
hatch build
```

## License

- Licensed under Apache Software License 2.0

## Developers:

- AI Verify
