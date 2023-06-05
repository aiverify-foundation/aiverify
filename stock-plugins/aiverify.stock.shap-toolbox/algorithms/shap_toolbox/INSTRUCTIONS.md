# Instructions on Creating Your Algorithm Plugin


## Requirements 

There are some dependencies required for the algorithm plugin. Developers will need the following libraries downloaded and installed:
- Python 3 version >= 3.10  
- Cookiecutter (a Python library to create the algorithm project from our template). Install Cookiecutter using <b>pip</b> or <b>pip3</b>:
   ```
   pip3 install cookiecutter
   ```    
- jq (to read JSON config files). Install jq:
   ```
   apt-get install jq
   ```    

## Setting Up 
- Setting up your algorithm plugin
   1. Create the algorithm project from cookiecutter:
   ```
   cookiecutter </path to cookiecutter root directory>
   ```
   2. When creating the algorithm project, there will be some questions asked to help with the creation of the project:
   ![alt text](./../instructions_images/Algo_cookiecutter_setup.png)
   - author: Name or organisation name of the algorithm developer
   - plugin_name: Derived from what the algorithm does (i.e. an algorithm to measure the fairness by metrics can be named Fairness Metrics Toolbox)
   - project_slug: 
   - plugin_version: If this is a new algorithm, the version should be 0.1.0. If it is an improved version of an existing algorithm, the version should be adjusted accordingly. Refer to [Understanding Versioning](https://cpl.thalesgroup.com/software-monetization/software-versioning-basics) for more information
   - plugin_description: A simple description on what the algorithm is
   - license:
   - algo_model_support: The models supported by the algorithm
   - require_ground_truth: Whether or not the algorithm has ground truth in the dataset
  
      The fields above can be changed in the algorithm project so it is fine to omit some of these fields first.

- Cloning and installing required custom libraries
  1. In the root directory of the algorithm project, run the install_script.sh to clone and install the required libraries:
   ```
   ./install_script.sh
   ```
  2. More information on the libraries can be found in the [Glossary](#glossary). 

## Coding the Plugin 

In the project created, the developer will need to modify the following files:
1. _plugin_name_.py
2. input.schema.json
3. output.schema.json
4. _plugin_name_.meta.json
5. requirements.txt

---
### _plugin_name_.py - Plugin File
This file is the heart of the algorithm plugin where the magic happens.

There are `TODO` that require the developer to modify:
1. Update the plugin description. 
   1. The following points should be considered when writing the plugin description:
      1. Document the purpose of this plugin.
      2. What does this plugin do in general? 
      3. Are there any limitations for this plugin?
      4. Are there anything else that future developers should note or understand?
      
2. Update the input JSON schema in `input.schema.JSON` [here](#inputschemaJSON---input-schema-JSON-file). 
   
3. Update the output JSON schema in `output.schema.JSON` [here](#outputschemaJSON---output-schema-JSON-file). 
   
4. Insert your algorithm logic in the `generate` function.

5. When the results are generated, assign the results to `self._results`. The results will be validated against  `output.schema.json`. 

---
### input.schema.json - Input Schema JSON File
This JSON schema file defines what is required from the developer for the plugin to work.

For example, the algorithm may require the following input:
1. target feature name: Str with default value of empty string
2. percentiles: Array of two values
```json
{
  "target_feature_name": "MyTargetFeature",
  "percentiles": [0.2, 0.8]
}
```

* Note: the JSON above can be copied and assigned to `plugin_argument_values` in `__main__.py`. 

Using the input above as example, the input JSON would be:
```json
{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/input.schema.json",
    "title": "Algorithm Plugin Input Arguments",
    "description": "A schema for algorithm plugin input arguments",
    "type": "object",
    "required": [
        "target_feature_name",
        "percentiles"
    ],
    "properties": {
        "target_feature_name": {
            "title": "Target Feature Name",
            "description": "Target Feature Name (e.g. Interest_Rate)",
            "type": "string"
        },
        "percentiles": {
            "title": "Cut-off percentiles",
            "description": "Cut-off percentiles (e.g. [0.01, 0.99])",
            "type": "array",
            "minItems": 2,
            "maxItems": 2,
            "items": {
                "type": "number"
            }
        }
    }
}
```
Refer to the following links for more information on writing and validating JSON schema files:
1. [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/index.html)
2. [JSON Schema Validator](https://www.jsonschemavalidator.net/)

---
### output.schema.json - Output Schema JSON File
This JSON schema file defines the expected output from the plugin algorithm if it is working as intended.

For example, the algorithm would return some values in array:
```json
{
  "results": [1.0, 2.0]
}
```

Using the output above as example, the output JSON would be:
```json
{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/output.schema.json",
    "title": "Algorithm Plugin Output Arguments",
    "description": "A schema for algorithm plugin output arguments",
    "type": "object",
    "required": [
        "results"
    ],
    "minProperties": 1,
    "properties": {
        "results": {
            "description": "Matrix of values",
            "type": "array",
            "minItems": 1,
            "items": {
               "type": "number"
            }
        }
    }
}
```
Refer to the following links for more information on writing and validating JSON schema files:
1. [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/index.html)
2. [JSON Schema Validator](https://www.jsonschemavalidator.net/)

---
### _plugin_name_.meta.json - Plugin Metadata (Searchable Tags) and Other Required Files
This metadata JSON file defines metadata information of this plugin. 

Extra python files to be included in the plugin package should be specified here as well. 

**Note**: Developers should not modify other fields other than ```tags``` and ```requiredFiles```. For ```requiredFiles```, **do not remove the existing items in the list as they are required files.**


To add searchable ```tags``` to allow users find this plugin, modify the following:
```json
"tags": []
```    
For example, the algorithm should appear if users search for the following tags: "fairness", "new algorithm"
```json
"tags": ["fairness", "new algorithm"],
```
To add extra Python files to the plugin package, add your files into the ```requiredFiles``` list:  
```json
"requiredFiles": ["__main__.py", "AUTHORS.rst", "CHANGELOG.md", "input.schema.json", "LICENSE",
    "output.schema.json", "README.md", "requirements.txt", "syntax_checker.py", "user_defined_folder", "user_main_python_file.py"]
```
In the example above, ```user_defined_folder``` and ```user_main_python_file.py``` are user-defined directory and file respectively. Note that only ```.py``` files in the user-defined directory(s) will be copied in.  

---
### requirements.txt - Plugin Packages Dependencies
Python requirements file are used to keep track of the Python modules and packages used by this plugin project.<br>
It simplifies the installation of all required modules and makes it easy to share your project with others. 
Users will install the modules listed in this requirements file and run without any issues.<br>
This file should be updated if there are changes to the required Python modules

Example of how to generate requirements.txt:
1. Using <b>pip or pip3</b> to generate requirements.txt
   ```bash
   pip freeze > requirements.txt
   ```
2. Using a python packaging and dependency management tool such as <b>Poetry</b>
   ```bash
   poetry export --without-hashes --format=requirements.txt > requirements.txt 
   ```

An example of a generated requirements.txt:
```
numpy==1.23.5 ; python_version >= "3.10" and python_version < "4.0"
scipy==1.9.3 ; python_version >= "3.10" and python_version < "4.0"
```

## Supported Model and Data Types
Before testing the algorithm, ensure that the model and data type used by the algorithm are supported. Currently, the following are supported:
- Model
  - LightGBM
  - OpenAPI
  - scikit-learn
  - TensorFlow
  - XGBoost
  
- Data
  - Pandas
  - CSV (supports colon, comma, pipe, semicolon, space and tab separated values as well)



## Testing Your Plugin
Developers will need to modify the following files or folders before testing the algorithm:
1. \_\_main\_\_.py
2. tests/user_defined_files/

---
### \_\_main\_\_.py - Entry Point to the Test Application
This special file is the entry point to the test application.

In this file, there are `TODO` that require the developer's input.
1. If the algorithm requires Ground Truth information:
   1. Define the data, model and ground truth file location and ground truth string.
      1. The test application will read the data, model, ground truth path, deserialize the data and attempt to identify its type.
      2. The test application will remove ground truth column from the data instance, and will only leave the ground truth column in the ground truth instance.
      3. The test application will return these instances which your algorithm will use and access its contents.
2. If the algorithm does not require Ground Truth information:
   1. Define the data, model file information.
      1. The test application will read the data, model, deserialize the data and attempt to identify its type.
      2. The test application will return these instances which your algorithm will use and access its contents. 
3. Define the input parameters that you have defined in the input.schema.json
   1. The test application will pass the parameters to the algorithm so that your algorithm can use and access its contents.
---
### tests/user_defined_files/ - Samples Folder
This folder allows developers to place their sample testing data, model, and ground truth files for testing.

While running the deployment script, the script will run the test application to verify that the application is running without error.

---
### Running the Test
Note: Developers may want to create virtual environment (venv) instead of installing packages in the base environment. Refer to [Python3 venv](https://docs.python.org/3/library/venv.html) for more information. 

Before packaging and deploying the algorithm, the test output from the algorithm **must** match the output defined in `output.schema.JSON`. 

To run the test application, 
1. Run the bash script ```install_core_modules_requirements.sh``` to install all the required packages from the core modules:
   ```bash
   ubuntu@ubuntu-virtual-machine:~/my_algorithm_plugin$ tests/install_core_modules_requirements.sh
   ```
   
2. Run the command within the plugin folder to run the algorithm and generate the output:
   ```bash
   ubuntu@ubuntu-virtual-machine:~/my_algorithm_plugin$ python3 .
   ```
   If the output matches the schema defined in `output.schema.JSON`, the schema of the output is correct and it is ready to be packaged and deployed. 

   If the output results are, there will be an error message:
   ```
   Failed schema validation
   ```


## Deploying the Plugin
Note: Developers need to ensure that the plugin test is completed. While deploying, the script will run the plugin to check for successful execution.
To deploy the plugin,
1. Run the bash script ```deploy_plugin.sh``` to automatically generate the zip file which can be distributed. This zip file can be read in by the A.I Verify user interface.
   ```bash
   ubuntu@ubuntu-virtual-machine:~/my_algorithm_plugin$ ./deploy_plugin.sh
   ```
2. After executing the deployment script successfully, two folders, ```dist``` and ```temp``` are being created.
3. The zip file in the ```dist``` folder can now be distributed for use.
4. The temp folder can be removed.

<br>

## Glossary

| Name                                       | Description                                                                                                                  | Requires User Modification                          |
|--------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| AUTHORS.rst                                | Authors who contributed to this project                                                                                      | Yes, if you are adding new authors                  |
| CHANGELOG.md                               | Changes for major and minor versions of this project                                                                         | Yes, if you are releasing a new major/minor version |
| deploy_plugin.sh                           | Deployment script to generate a zip file for distribution                                                                    | No                                                  |
| input.schema.json                          | Input schema of this project                                                                                                 | Yes                                                 |
| INSTRUCTIONS.md                            | Instructions on how to create your algorithm plugin and navigating the project                                               | No                                                  |
| LICENSE                                    | License for use of this project                                                                                              | Yes, if you are changing license                    |
| \_\_main\_\_.py                            | Entry point to the test application                                                                                          | Yes                                                 |
| output.schema.json                         | Output schema of this project                                                                                                | Yes                                                 |
| _project_slug_.meta.json    | Plugin metadata                                                                                                              | Yes, if you need to add searchable tags             |
| _plugin_name_.py           | Plugin main file where it holds the algorithm logic and other interfacing logic                                              | Yes                                                 |
| plugin.meta.json                           | Plugin information for Plugin Manager                                                                                        | No                                                  |
| README.md                                  | Plugin README file                                                                                                           | No                                                  |
| requirements.txt                           | Plugin package dependencies requirements file                                                                                | Yes                                                 |
| tests/                                     | The tests folder contains testing support to allow you to perform testing on your plugin                                     | No                                                  |
| tests/core_modules/                        | The core_modules folder include data, models, serializers modules that can read <br> your provided files into relevant types | No                                                  |
| tests/user_defined_files/                  | A folder for user to place their data, model files for plugin test                                                           | Yes                                                 |
| tests/install_core_modules_requirements.sh | A bash script to install all package requirements for default core modules                                                   | No                                                  |
| tests/plugin_test.py                       | A python script that performs testing on your plugin                                                                         | No                                                  |