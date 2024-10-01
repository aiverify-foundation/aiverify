import glob
import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple, Union

from aiverify_test_engine.converters.data_converter import DataConverter
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.utils.log_utils import log_message
from aiverify_test_engine.utils.url_utils import download_from_url, is_url


class DataManager:
    """
    The DataManager comprises methods that focuses on reading data files
    As input files are usually serialized before written to a file, this class will perform
    de-serialisation with supported packages, and identify if the data is one of the supported formats
    """

    _logger: logging.Logger = None
    _pandas_name: str = "pandasdata"

    @staticmethod
    def set_logger(logger: logging.Logger) -> None:
        """
        A method to set up the logger instance for logging

        Args:
            logger (Logger): The logger instance
        """
        if isinstance(logger, logging.Logger):
            DataManager._logger = logger

    @staticmethod
    def read_data(
        data_path: str, data_plugins: Dict, serializer_plugins: Dict
    ) -> Tuple[bool, Union[IData, None], Union[ISerializer, None], str]:
        """
        A method to read the data file/folder path or URL and return a list of tuple consisting of
        data instance and serializer instance
        It is usually serialize by some program such as (pickle, joblib)

        Args:
            data_path (str): The data file/folder path or URL
            data_plugins (Dict): A dictionary of supported data plugins
            serializer_plugins (Dict): A dictionary of supported serializer plugins

        Returns:
            Tuple[bool, Union[IData, None], Union[ISerializer, None], str]:
            Returns a tuple consisting of a bool that indicates if it succeeds.
            If it succeeds, it will contain an object of IData, an object of ISerializer, and an empty string.
            If it fails to deserialize/identify, it will contain None objects and return the error message.
        """
        return_data_instance = None
        return_data_serializer_instance = None
        log_message(
            DataManager._logger, logging.INFO, f"Attempting to read data: {data_path}"
        )
        # Validate the inputs
        if (
            data_path is None
            or not isinstance(data_path, str)
            or data_plugins is None
            or not isinstance(data_plugins, dict)
            or serializer_plugins is None
            or not isinstance(serializer_plugins, dict)
        ):
            error_message = (
                f"There was an error validating the input parameters: {data_path}, "
                f"{data_plugins}, {serializer_plugins}"
            )
            log_message(DataManager._logger, logging.ERROR, error_message)
            return (
                False,
                return_data_instance,
                return_data_serializer_instance,
                error_message,
            )
        else:
            log_message(DataManager._logger, logging.INFO, "Data validation successful")

        if is_url(data_path):
            log_message(
                DataManager._logger,
                logging.INFO,
                f"Downloading data from URL: {data_path}",
            )
            try:
                data_path = download_from_url(data_path)
            except Exception as e:
                error_message = f"Failed to download the file from URL: {data_path}. Error: {str(e)}"
                log_message(DataManager._logger, logging.ERROR, error_message)
                return (
                    False,
                    return_data_instance,
                    return_data_serializer_instance,
                    error_message,
                )

        # Perform deserialization and identification for each found path
        data_serializer_instances = list()
        found_paths = DataManager._get_file_paths(data_path)
        current_data_plugin_type = None
        has_mixed_data_type = False

        for path in found_paths:
            log_message(
                DataManager._logger,
                logging.INFO,
                f"Attempting to deserialize data: {path}",
            )
            (
                is_success,
                data_instance,
                serializer_instance,
                error_message,
            ) = DataManager._read_data_path(path, data_plugins, serializer_plugins)
            if is_success and data_instance and serializer_instance:
                data_serializer_instances.append((data_instance, serializer_instance))

                # Check whether there are mixed data types
                if current_data_plugin_type is None:
                    current_data_plugin_type = data_instance.get_data_plugin_type()
                elif (
                    current_data_plugin_type is not data_instance.get_data_plugin_type()
                ):
                    has_mixed_data_type = True
                    current_data_plugin_type = data_instance.get_data_plugin_type()

            else:
                log_message(DataManager._logger, logging.ERROR, error_message)
                return (
                    False,
                    return_data_instance,
                    return_data_serializer_instance,
                    error_message,
                )

        # Attempt to consolidate the data instances and data serializer instances.
        # We will consolidate the images into a single data instance and data serializer instance.
        # The other types will only return the first instance
        if data_serializer_instances:
            if (
                len(data_serializer_instances) == 1
                and current_data_plugin_type is not DataPluginType.IMAGE
            ):
                return_data_instance = data_serializer_instances[0][0]
                return_data_serializer_instance = data_serializer_instances[0][1]

            else:
                # There are more than 1 data instance and data serializer instances.
                if (
                    has_mixed_data_type
                    or current_data_plugin_type is not DataPluginType.IMAGE
                ):
                    return_data_instance = data_serializer_instances[0][0]
                    return_data_serializer_instance = data_serializer_instances[0][1]
                else:
                    # Merge all the data paths and create a new dataframe
                    return_data_serializer_instance = data_serializer_instances[0][1]
                    (
                        is_success,
                        return_data_instance,
                        error_message,
                    ) = DataManager._consolidate_image_paths_to_df(
                        found_paths, data_plugins
                    )
        else:
            return (
                False,
                return_data_instance,
                return_data_serializer_instance,
                "There are no data instances found",
            )
        log_message(
            DataManager._logger,
            logging.INFO,
            f"Consolidation results: {return_data_instance} {return_data_serializer_instance}",
        )

        # Convert to Pandas if necessary
        if (
            return_data_instance
            and return_data_instance.get_data_plugin_type() is not DataPluginType.PANDAS
        ):
            log_message(
                DataManager._logger,
                logging.INFO,
                f"Performing conversion from {return_data_instance.get_data_plugin_type()} to DataPluginType.PANDAS",
            )
            (
                is_success,
                return_data_instance,
                error_message,
            ) = DataManager._convert_to_pandas(return_data_instance, data_plugins)

        # Log if there is return_data_instance found
        if return_data_instance:
            log_message(
                DataManager._logger,
                logging.INFO,
                f"Supported data format: {return_data_instance.get_data_plugin_type()}"
                f"[{return_data_serializer_instance.get_serializer_plugin_type()}]",
            )
            return True, return_data_instance, return_data_serializer_instance, ""
        else:
            log_message(
                DataManager._logger,
                logging.INFO,
                f"There was an error getting data instance (unsupported format): {found_paths}",
            )
            return (
                False,
                return_data_instance,
                return_data_serializer_instance,
                f"There was an error getting data instance (unsupported format): {found_paths}",
            )

    @staticmethod
    def _consolidate_image_paths_to_df(
        found_paths: List, data_plugins: Dict
    ) -> Tuple[bool, Union[IData, None], str]:
        """
        A helper method to create a dataframe file with all the image paths

        Args:
            found_paths (List): A list of image paths to be added to the dataframe
            data_plugins (Dict): A dictionary of supported data plugins

        Returns:
            Tuple[bool, Union[IData, None], str]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IData and returns an empty string
            If it fails, it will contain a None object and returns the error message
        """
        column_name = "image_directory"
        pandas_data_plugin = data_plugins.get(DataManager._pandas_name, None)
        if pandas_data_plugin:
            pandas_data_instance = pandas_data_plugin.Plugin()
            df_data = DataConverter.convert_image_list_to_dataframe(
                found_paths, column_name, pandas_data_instance
            )
            (
                is_success,
                data_instance,
            ) = DataManager._try_to_identify_data_format(
                data_plugins, **{"data": df_data}
            )

            return is_success, data_instance, ""
        else:
            error_message = f"There was an error finding pandas core module: {DataManager._pandas_name}"
            log_message(DataManager._logger, logging.ERROR, error_message)
            return False, None, error_message

    @staticmethod
    def _convert_to_pandas(
        data_instance: IData, data_plugins: Dict
    ) -> Tuple[bool, Union[IData, None], str]:
        """
        A helper method to create a dataframe file by converting some other non-pandas datatype to pandas.

        Args:
            data_instance (IData): An instance of IData
            data_plugins (Dict): A dictionary of supported data plugins

        Returns:
            Tuple[bool, Union[IData, None], str]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IData and returns an empty string
            If it fails, it will contain a None object and returns the error message
        """
        # If plugin type is not PANDAS, convert to Dict,
        # Create a pandas instance and pass this instance and Dict to DataConverter to convert to PANDAS
        pandas_data_plugin = data_plugins.get(DataManager._pandas_name, None)
        if pandas_data_plugin:
            pandas_data_instance = pandas_data_plugin.Plugin()
            data_dict = data_instance.convert_to_dict()
            df_data = DataConverter.convert_dict_to_dataframe(
                data_dict, data_instance.get_data_plugin_type(), pandas_data_instance
            )
            (
                is_success,
                data_instance,
            ) = DataManager._try_to_identify_data_format(
                data_plugins, **{"data": df_data}
            )

            return is_success, data_instance, ""
        else:
            error_message = f"There was an error finding pandas core module: {DataManager._pandas_name}"
            log_message(DataManager._logger, logging.ERROR, error_message)
            return False, None, error_message

    @staticmethod
    def _read_data_path(
        data_path: str, data_plugins: Dict, serializer_plugins: Dict
    ) -> Tuple[bool, Union[IData, None], Union[ISerializer, None], str]:
        """
        A helper method to read the data file path and return the data and serializer instance
        It is usually serialize by some program such as (pickle, joblib)

        Args:
            data_path (str): The data file path
            data_plugins (Dict): A dictionary of supported data plugins
            serializer_plugins (Dict): A dictionary of supported serializer plugins

        Returns:
            Tuple[bool, Union[IData, None], Union[ISerializer, None], str]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IData, and an object of ISerializer and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        # Deserialize data
        is_success, data, serializer_instance = DataManager._try_to_deserialize_data(
            data_path, serializer_plugins
        )
        if not is_success:
            error_message = f"There was an error deserializing dataset: {data_path}"
            log_message(DataManager._logger, logging.ERROR, error_message)
            return False, None, None, error_message

        # Attempt to identify the data format with the supported list.
        is_success, data_instance = DataManager._try_to_identify_data_format(
            data_plugins, **{"data": data}
        )
        if not is_success:
            error_message = f"There was an error identifying dataset: {type(data)}"
            log_message(DataManager._logger, logging.ERROR, error_message)
            return False, None, None, error_message

        return is_success, data_instance, serializer_instance, ""

    @staticmethod
    def _try_to_deserialize_data(
        data_file: str, serializer_plugins: Dict
    ) -> Tuple[bool, Any, Any]:
        """
        A helper method to deserialize the data file path and return the de-serialized data and serializer instance

        Args:
            data_file (str): The data file path
            serializer_plugins (Dict): A dictionary of supported serializer plugins

        Returns:
            Tuple[bool, Any, Any]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of Any, and an object of Any and returns an empty string
            If it fails to deserialize/identify, it will contain None objects and returns the error message
        """
        is_success = False
        data = None
        serializer = None

        # Scan through all the supported serializer
        # Check that this data is one of the supported data formats and can be deserialized
        for (
            _,
            serializer_plugin,
        ) in serializer_plugins.items():
            try:
                temp_serializer = serializer_plugin.Plugin
                data = temp_serializer.deserialize_data(data_file)
                if data is not None:
                    is_success = True
                    serializer = temp_serializer
                    break
            except Exception:
                continue

        return is_success, data, serializer

    @staticmethod
    def _try_to_identify_data_format(
        data_plugins: Dict, **kwargs
    ) -> Tuple[bool, IData]:
        """
        A helper method to identify the data and return the respective data format instance

        Args:
            data_plugins (Dict): A dictionary of supported data plugins

        Returns:
            Tuple[bool, IData]:
            Returns a tuple consisting of bool that indicates if it succeeds,
            If it succeeds, it will contain an object of IData
            If it fails to deserialize/identify, it will contain None object
        """
        is_success = False
        data_instance = None

        # Scan through all the supported data formats
        # Check that this data is one of the supported data formats
        try:
            for _, data_plugin in data_plugins.items():
                temp_data_instance = data_plugin.Plugin(**kwargs)
                if temp_data_instance.is_supported():
                    data_instance = temp_data_instance
                    is_success = True
                    break

        except Exception:
            is_success = False
            data_instance = None

        return is_success, data_instance

    @staticmethod
    def _get_file_paths(temp_path: str) -> List:
        """
        A helper method to gather all the possible files given by the input

        Args:
            temp_path (str): The data file path

        Returns:
            List: The list of possible file paths given by temp_path
        """
        paths = list()

        if Path(temp_path).is_file():
            # If single file, just append the path
            paths.append(temp_path)
        elif Path(temp_path).is_dir():
            # Get all the file paths in the directory provided
            paths = [file for file in glob.glob(f"{temp_path}/**/*", recursive=True)]
        return paths
