import os
import sys
from pathlib import Path
from typing import Tuple, Union

import numpy as np

os.environ["LC_ALL"] = "en_US.UTF-8"
from rpy2 import robjects

from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.plugins_manager import PluginManager
from test_engine_core.utils.time import time_class_method


# =====================================================================================
# NOTE: Do not modify this file unless you know what you are doing.
# =====================================================================================
class PluginTest:
    """
    The PluginTest class specifies methods in supporting testing for the plugin.
    """

    def __init__(self, serializer_path: str, discover_path: Path):
        # Other variables
        self._base_path: Path = discover_path

        # Store the input arguments as private vars
        self._serializer_path: str = str(self._base_path / serializer_path)

        # Default for instances
        self._serializer_instance: Union[None, ISerializer] = None

    @time_class_method
    def run(self) -> None:
        """
        A function to run the plugin test with the provided arguments.
        """
        try:
            error_count = 0
            error_message = ""

            # Load all the core plugins and the serializer plugin
            PluginManager.discover(str(self._base_path))
            plugin_object = PluginManager._plugins[PluginType.SERIALIZER.name][
                "rdsserializer"
            ]
            self._serializer_instance = plugin_object.Plugin()

            # Run different tests on the serializer instance
            test_methods = [
                self._validate_plugin_exists,
                self._validate_metadata,
                self._validate_serializer_supported,
            ]

            for method in test_methods:
                tmp_count, tmp_error_msg = method()
                error_count += tmp_count
                error_message += tmp_error_msg

            if error_count > 0:
                print(f"Errors found while running tests. {error_message}")
                sys.exit(-1)
            else:
                print("No errors found. Test completed successfully.")
                sys.exit(0)

        except Exception as error:
            # Print and exit with error
            print(f"Exception found while running tests. {str(error)}")
            sys.exit(-1)

    def _validate_plugin_exists(self) -> Tuple[int, str]:
        """
        A helper method to validate whether the plugin exists

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""
        if PluginManager.is_plugin_exists(
            PluginType.SERIALIZER, "rdsserializer"
        ):
            # Serializer is found
            pass
        else:
            # Serializer is not found
            error_count += 1
            error_message += "Serializer plugin not found;"

        return error_count, error_message

    def _validate_metadata(self) -> Tuple[int, str]:
        """
        A helper method to validate metadata

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        metadata = self._serializer_instance.get_metadata()
        if (
            metadata.name == "rdsserializer"
            and metadata.description
            == "rdsserializer supports deserializing R Data Serialization"
            and metadata.version == "0.9.0"
        ):
            # Metadata is correct
            pass
        else:
            # Metadata is incorrect
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_serializer_supported(self):
        """
        A helper method to validate serializer supported

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        # try:
        model_name = "mytestmodel.rds"

        robjects.r(f"""
data <- data.frame(input = rnorm(100, mean = 0, sd = 1), output = rnorm(100, mean = 0, sd = 1))
model <- lm(output ~ input, data = data)
saveRDS(model, "{model_name}")"""
                   )

        model = robjects.r['readRDS'](model_name)
        reconstructed_model = self._serializer_instance.deserialize_data(model_name)

        # Prepare data for inference (adjust this part based on your data)
        input_data = [1.0, 2.0, 3.0, 4.0]
        predictions = self.model_inference(input_data, model)
        reconstructed_predictions = self.model_inference(input_data, reconstructed_model)

        np.testing.assert_allclose(
            predictions, reconstructed_predictions
        )

        # except Exception:
        #     # Serializer not supported
        #     error_count += 1
        #     error_message += "Deserialized data does not match expected data;"

        return error_count, error_message

    @staticmethod
    def model_inference(input_data, model):
        new_data = robjects.DataFrame({'input': robjects.FloatVector(input_data)})
        # Set the 'new_data' as an environment variable
        robjects.r.assign("new_data", new_data)
        # Perform inference
        predictions = robjects.r['predict'](model, newdata=robjects.r['new_data'])
        # Convert the R results to a Python object
        return np.array(robjects.conversion.rpy2py(predictions))
