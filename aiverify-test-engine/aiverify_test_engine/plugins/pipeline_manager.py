import logging
import os
import shutil
import zipfile
from typing import Any, Dict, Tuple, Union

from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.utils.import_modules import (
    get_non_python_files,
    import_python_modules,
    discover_pipeline,
)
from aiverify_test_engine.utils.log_utils import log_message
from aiverify_test_engine.utils.url_utils import download_from_url, is_url
from aiverify_test_engine.utils.zipfile_utils import extract_zipfile


class PipelineManager:
    """
    The PipelineManager comprises methods that focuses on reading pipeline files
    As input files are usually serialized before written to a file, this class will perform
    de-serialisation with supported packages, and identify if the pipeline is one of the supported formats
    """

    _logger: logging.Logger = None

    @staticmethod
    def set_logger(logger: logging.Logger) -> None:
        """
        A method to set up the logger instance for logging

        Args:
            logger (Logger): The logger instance
        """
        if isinstance(logger, logging.Logger):
            PipelineManager._logger = logger

    @staticmethod
    def read_pipeline_path(
        pipeline_path: str, pipeline_plugins: Dict, serializer_plugins: Dict
    ) -> Tuple[bool, Union[IPipeline, None], Union[ISerializer, None], str]:
        """
        A method to read the pipeline path and return the pipeline instance and serializer instance
        It supports both pipeline files and folders

        Args:
            pipeline_path (str): The pipeline path (can be a file, folder path, ZIP archive or URL)
            pipeline_plugins (Dict): A dictionary of supported pipeline plugins
            serializer_plugins (Dict): A dictionary of supported serializer plugins

        Returns:
            Tuple[bool, Union[IPipeline, None], Union[ISerializer, None], str]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IPipeline,
            and an object of ISerializer and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        return_pipeline_instance = None
        return_pipeline_serializer_instance = None
        log_message(
            PipelineManager._logger,
            logging.INFO,
            f"Attempting to read pipeline: {pipeline_path}",
        )

        # Validate the inputs
        if (
            pipeline_path is None
            or not isinstance(pipeline_path, str)
            or pipeline_plugins is None
            or not isinstance(pipeline_plugins, dict)
            or serializer_plugins is None
            or not isinstance(serializer_plugins, dict)
        ):
            # Failed to deserialize pipeline path and perform logging
            error_message = (
                f"There was an error validating the input parameters: {pipeline_path}, "
                f"{pipeline_plugins}, {serializer_plugins}"
            )
            log_message(PipelineManager._logger, logging.ERROR, error_message)
            return (
                False,
                return_pipeline_instance,
                return_pipeline_serializer_instance,
                error_message,
            )
        else:
            log_message(
                PipelineManager._logger, logging.INFO, "Pipeline validation successful"
            )

        if is_url(pipeline_path):
            log_message(
                PipelineManager._logger,
                logging.INFO,
                f"Downloading pipeline from URL: {pipeline_path}",
            )
            try:
                pipeline_path = download_from_url(pipeline_path)
            except Exception as e:
                error_message = f"Failed to download the pipeline from URL: {pipeline_path}. Error: {str(e)}"
                log_message(PipelineManager._logger, logging.ERROR, error_message)
                return (
                    False,
                    return_pipeline_instance,
                    return_pipeline_serializer_instance,
                    error_message,
                )

        # Check if the pipeline_path is a compressed file (e.g., zip)
        temp_dir = None
        if zipfile.is_zipfile(pipeline_path):
            log_message(
                PipelineManager._logger,
                logging.INFO,
                f"Detected a ZIP archive: {pipeline_path}",
            )

            success, extracted_path, error_message, temp_dir = extract_zipfile(
                pipeline_path
            )
            if not success:
                log_message(PipelineManager._logger, logging.ERROR, error_message)
                return (
                    False,
                    return_pipeline_instance,
                    return_pipeline_serializer_instance,
                    error_message,
                )

            pipeline_path = extracted_path

        # Check if the pipeline_path is a file
        if os.path.isfile(pipeline_path):
            log_message(
                PipelineManager._logger,
                logging.INFO,
                f"Detected a pipeline file: {pipeline_path}",
            )
            (
                is_success,
                pipeline,
                return_pipeline_serializer_instance,
            ) = PipelineManager._try_to_deserialize_pipeline(
                pipeline_path, serializer_plugins
            )

            if not is_success:
                error_message = f"There was an error deserializing the pipeline file: {pipeline_path}"
                log_message(PipelineManager._logger, logging.ERROR, error_message)
                return (
                    False,
                    return_pipeline_instance,
                    return_pipeline_serializer_instance,
                    error_message,
                )
        else:
            # Pipeline needs to import accompanying class and load it up.
            # Pipeline path will be in folder, and we will need to import the python modules first,
            # then find out which is the pipeline file to be deserialized and used.
            non_python_files = get_non_python_files(pipeline_path)
            if non_python_files:
                log_message(
                    PipelineManager._logger,
                    logging.INFO,
                    f"Found these non-python files: {non_python_files}",
                )
                pipeline_file = list(non_python_files.values())[0]
                
                import_python_modules(pipeline_path)
                
                # Attempt to deserialize the pipeline with the supported serializer.
                log_message(
                    PipelineManager._logger,
                    logging.INFO,
                    f"Attempting to deserialize pipeline: {pipeline_file}",
                )
                (
                    is_success,
                    pipeline,
                    return_pipeline_serializer_instance,
                ) = PipelineManager._try_to_deserialize_pipeline(
                    pipeline_file, serializer_plugins
                )
                
                if not is_success:
                    # Failed to deserialize pipeline file
                    error_message = (
                        f"There was an error deserializing the pipeline: {pipeline_file}"
                    )
                    log_message(PipelineManager._logger, logging.ERROR, error_message)
                    return (
                        False,
                        return_pipeline_instance,
                        return_pipeline_serializer_instance,
                        error_message,
                    )
                    
                    # Attempt to identify the pipeline format with the supported list.
                log_message(
                    PipelineManager._logger,
                    logging.INFO,
                    f"Attempting to identify pipeline format: {type(pipeline)}",
                )
                (
                    is_success,
                    return_pipeline_instance,
                ) = PipelineManager._try_to_identify_pipeline_format(
                    pipeline_plugins, **{"pipeline": pipeline}
                )
                if is_success:
                    error_message = ""
                    log_message(
                        PipelineManager._logger,
                        logging.INFO,
                        f"Supported pipeline format: {type(pipeline)}, "
                        f"{return_pipeline_instance.get_pipeline_plugin_type()}"
                        f"[{return_pipeline_instance.get_pipeline_algorithm()}]",
                    )
                else:
                    # Failed to get pipeline format
                    return_pipeline_instance = None
                    error_message = f"There was an error getting pipeline format (unsupported): {type(pipeline)}"
                    log_message(PipelineManager._logger, logging.ERROR, error_message)
            
            else:
                # API or Custom pipeline
                is_success, pipeline_cls = discover_pipeline(pipeline_path)  
                
                try:
                    return_pipeline_instance = pipeline_cls()
                except Exception as e:
                    print(f"Failed to instantiate pipeline_cls: {e}")
                    
                return_pipeline_serializer_instance = None 
                
                if is_success:
                    error_message = ""
                    log_message(
                        PipelineManager._logger,
                        logging.INFO,
                        f"Supported pipeline format: Custom API",
                    )
                else:
                    # Failed to get pipeline format
                    return_pipeline_instance = None
                    error_message = f"There was an error getting custom pipeline format"
                    log_message(PipelineManager._logger, logging.ERROR, error_message)       

        if temp_dir:
            shutil.rmtree(temp_dir)

        return (
            is_success,
            return_pipeline_instance,
            return_pipeline_serializer_instance,
            error_message,
        )

    @staticmethod
    def _try_to_deserialize_pipeline(
        pipeline_file: str, serializer_plugins: Dict
    ) -> Tuple[bool, Any, Any]:
        """
        A helper method to deserialize the pipeline file path and return the de-serialized pipeline
        and serializer instance

        Args:
            pipeline_file (str): The pipeline file path
            serializer_plugins (Dict): A dictionary of supported serializer plugins

        Returns:
            Tuple[bool, Any, Any]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of Any, and an object of Any and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        is_success = False
        pipeline = None
        serializer = None

        # Scan through all the supported serializer
        # Check that this pipeline is one of the supported pipeline formats and can be deserialized
        for (
            _,
            serializer_plugin,
        ) in serializer_plugins.items():
            try:
                temp_serializer = serializer_plugin.Plugin
                pipeline = temp_serializer.deserialize_data(pipeline_file)
                if pipeline is not None:
                    is_success = True
                    serializer = temp_serializer
                    break
            except Exception:
                continue

        return is_success, pipeline, serializer

    @staticmethod
    def _try_to_identify_pipeline_format(
        pipeline_plugins: Dict, **kwargs
    ) -> Tuple[bool, IPipeline]:
        """
        A helper method to read the pipeline and return the respective pipeline format instance

        Args:
            pipeline_plugins (Dict): The dictionary of detected pipeline plugins

        Returns:
            Tuple[bool, IPipeline]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IPipeline
            If it fails to deserialize/identify, it will contain None object
        """
        is_success = False
        pipeline_instance = None

        # Scan through all the supported pipeline formats
        # Check that this pipeline is one of the supported pipeline formats
        try:
            for _, pipeline_plugin in pipeline_plugins.items():
                pipeline_instance = pipeline_plugin.Plugin(**kwargs)
                if pipeline_instance.is_supported():
                    is_success = True
                    break

        except Exception:
            is_success = False
            pipeline_instance = None

        return is_success, pipeline_instance
