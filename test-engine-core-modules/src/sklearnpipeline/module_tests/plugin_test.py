import sys
from pathlib import Path
from typing import Tuple, Union

from test_engine_core.interfaces.ipipeline import IPipeline
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.pipeline_plugin_type import PipelinePluginType
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

    def __init__(self, pipeline_path: str, discover_path: Path):
        # Other variables
        self._base_path: Path = discover_path

        # Store the input arguments as private vars
        self._pipeline_path: str = str(self._base_path / pipeline_path)

        # Default for instances
        self._pipeline_instance: Union[None, IPipeline] = None
        self._pipeline_serializer_instance: Union[None, ISerializer] = None

        self._expected_pipeline_algorithm = "sklearn.pipeline.Pipeline"
        self._expected_pipeline_plugin_type = PipelinePluginType.SKLEARN

    @time_class_method
    def run(self) -> None:
        """
        A function to run the plugin test with the provided arguments.
        """
        try:
            error_count = 0
            error_message = ""

            # Load all the core plugins and the pipeline plugin
            PluginManager.discover(str(self._base_path))

            # Get the pipeline instance
            (
                self._pipeline_instance,
                self._pipeline_serializer_instance,
                error_message,
            ) = PluginManager.get_instance(
                PluginType.PIPELINE, **{"pipeline_path": self._pipeline_path}
            )

            # Perform pipeline instance setup
            is_success, error_messages = self._pipeline_instance.setup()
            if not is_success:
                raise RuntimeError(
                    f"Failed to perform pipeline instance setup: {error_messages}"
                )

            # Run different tests on the pipeline instance
            test_methods = [
                self._validate_metadata,
                self._validate_plugin_type,
                self._validate_pipeline_supported,
            ]

            for method in test_methods:
                tmp_count, tmp_error_msg = method()
                error_count += tmp_count
                error_message += tmp_error_msg

            # Perform cleanup
            self._pipeline_instance.cleanup()

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

    def _validate_metadata(self) -> Tuple[int, str]:
        """
        A helper method to validate metadata

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        metadata = self._pipeline_instance.get_metadata()
        if (
            metadata.name == "sklearnpipeline"
            and metadata.description
            == "sklearnpipeline supports detecting sklearn pipeline"
            and metadata.version == "0.9.0"
        ):
            # Metadata is correct
            pass
        else:
            # Metadata is incorrect
            error_count += 1
            error_message += "Incorrect metadata;"

        return error_count, error_message

    def _validate_plugin_type(self) -> Tuple[int, str]:
        """
        A helper method to validate plugin type

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if self._pipeline_instance.get_plugin_type() is PluginType.PIPELINE:
            # PluginType is correct
            pass
        else:
            # PluginType is wrong
            error_count += 1
            error_message += "Incorrect plugin type;"

        if (
            self._pipeline_instance.get_pipeline_plugin_type()
            is self._expected_pipeline_plugin_type
        ):
            # Pipeline PluginType is correct
            pass
        else:
            # Pipeline PluginType is incorrect
            error_count += 1
            error_message += "Incorrect pipeline plugin type;"

        if (
            self._pipeline_instance.get_pipeline_algorithm()
            == self._expected_pipeline_algorithm
        ):
            # Pipeline Algorithm is correct
            pass
        else:
            # Pipeline Algorithm is incorrect
            error_count += 1
            error_message += "Incorrect pipeline algorithm;"

        return error_count, error_message

    def _validate_pipeline_supported(self) -> Tuple[int, str]:
        """
        A helper method to validate pipeline supported

        Returns:
            Tuple[int, str]: Returns error count and error messages
        """
        error_count = 0
        error_message = ""

        if self._pipeline_instance.is_supported():
            # Pipeline is supported
            pass
        else:
            # Pipeline is not supported
            error_count += 1
            error_message += "Pipeline not supported;"

        return error_count, error_message
