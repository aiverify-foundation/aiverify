import os
import sys

from aiverify_fairness_metrics_toolbox_for_classification.algo_init import AlgoInit
from test_engine_core.plugins.enums.model_type import ModelType

class PluginInit:
    def __init__(self):
        #need help info
        self.data_path = self.get_env_variable("DATA_PATH")
        self.model_path = self.get_env_variable("MODEL_PATH")
        self.ground_truth_path = self.get_env_variable("GROUND_TRUTH_PATH")
        self.ground_truth = self.get_env_variable("GROUND_TRUTH")
        self.run_pipeline = os.getenv("RUN_PIPELINE", "").lower() == "true"
        self.model_type = self.get_model_type("MODEL_TYPE") 
        self.core_modules_path = os.getenv("CORE_MODULES_PATH", "")
        self.sensitive_features_list = os.getenv("SENSITIVE_FEATURES_LIST", "").split("+")
        self.annotated_labels_path = os.getenv("ANNOTATED_LABELS_PATH", "")  
        self.file_name_label = os.getenv("FILE_NAME_LABEL", "")
        
    def invoke_fairness_metrics_toolbox_for_classification_plugin(self):
        # =====================================================================================
        # NOTE: Do not modify the code below
        # =====================================================================================
        # Perform Plugin Testing

        # Determine the value of run_pipeline
        if self.run_pipeline is None:
            self.run_pipeline = False  # Default to False if not provided
        else:
            self.run_pipeline = self.run_pipeline

        plugin_argument_values = {
            "sensitive_feature": self.sensitive_features_list,
            "annotated_labels_path": self.annotated_labels_path,
            "file_name_label": self.file_name_label,
        }

        print("*" * 20)
        # Debugging prints
        print(
            f"Running with the following arguments:\n"
            f"Data Path: {self.data_path}\n"
            f"Model Path: {self.model_path}\n"
            f"Ground Truth Path: {self.ground_truth_path}\n"
            f"Ground Truth: {self.ground_truth}\n"
            f"Run Pipeline: {self.run_pipeline}\n"
            f"Model Type: {self.model_type}\n"
            f"Core Modules Path: {self.core_modules_path}\n"
            f"Sensitive Features list: {self.sensitive_features_list}\n"
            f"Annotated Labels Path: {self.annotated_labels_path}\n"
            f"File Name Label: {self.file_name_label}"
        )
        print("*" * 20)

        try:
            # Create an instance of AlgoInit with defined paths and arguments and Run.
            plugin_test = AlgoInit(
                self.run_pipeline,
                self.core_modules_path,
                self.data_path,
                self.model_path,
                self.ground_truth_path,
                self.ground_truth,
                self.model_type,
                plugin_argument_values,
            )
            plugin_test.run()

        except Exception as exception:
            print(f"Exception caught while running the plugin test: {str(exception)}")

    def get_env_variable(self, name):
        value = os.getenv(name)
        if value is None:
            print(f"Error: The environment variable '{name}' is required but not set.")
            sys.exit(1)
        return value
    
    def get_model_type(self, type):
        try:
            model_type = os.getenv(type)
            model_type = ModelType[model_type]
        except KeyError:
            print(f"Invalid model type: '{model_type}'. Expected one of: {list([model.name for model in ModelType])}")
            sys.exit(1)
        return model_type
    
    def run(self):
        self.invoke_fairness_metrics_toolbox_for_classification_plugin()

# if __name__ == "__main__":
#     run()
