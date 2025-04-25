import logging
from pathlib import Path, PurePath
from typing import Dict, List, Tuple, Union

import numpy as np
from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.utils.json_utils import (
    load_schema_file,
    remove_numpy_formats,
    validate_json,
)
from aiverify_test_engine.utils.simple_progress import SimpleProgress
from scipy.stats.mstats import mquantiles


# =====================================================================================
# NOTE:
# 1. Check that you have installed the aiverify_test_engine latest package.
# 2. Check that you have run tests/install_core_plugins_requirements.sh to install all the
#    requirements required by the core plugins (serializers, data, models).
#    Alternatively, you may install the plugins that you require by installing the
#    requirements individually.
# 3. Do not modify the class name, else the plugin cannot be read by the system.
# =====================================================================================
class Plugin(IAlgorithm):
    """
    The Plugin(Partial Dependence Plot) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name: str = "Partial Dependence Plot"
    _description: str = (
        "A Partial Dependence Plot (PDP) explains how each feature and its feature value contribute "
        "to the predictions."
    )
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.ALGORITHM
    _requires_ground_truth: bool = True
    _supported_algorithm_model_type: List = [
        ModelType.CLASSIFICATION,
        ModelType.REGRESSION,
    ]

    @staticmethod
    def get_metadata() -> PluginMetadata:
        """
        A method to return the metadata for this plugin

        Returns:
            PluginMetadata: Metadata of this plugin
        """
        return Plugin._metadata

    @staticmethod
    def get_plugin_type() -> PluginType:
        """
        A method to return the type for this plugin

        Returns:
            PluginType: Type of this plugin
        """
        return Plugin._plugin_type

    def __init__(
        self,
        data_instance_and_serializer: Tuple[IData, ISerializer],
        model_instance_and_serializer: Tuple[IModel, ISerializer],
        ground_truth_instance_and_serializer: Tuple[IData, ISerializer],
        initial_data_instance: Union[IData, None],
        initial_model_instance: Union[IModel, IPipeline, None],
        **kwargs,
    ):
        self._initial_data_instance = initial_data_instance
        self._initial_model_instance = initial_model_instance

        # Look for kwargs values for log_instance, progress_callback and base path
        self._logger = kwargs.get("logger", None)
        self._progress_inst = SimpleProgress(1, 0, kwargs.get("progress_callback", None))

        # Check if data and model are tuples and if the tuples contain 2 items
        if not isinstance(data_instance_and_serializer, Tuple) or len(data_instance_and_serializer) != 2:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed data validation: {data_instance_and_serializer}",
            )
            raise RuntimeError("The algorithm has failed data validation")

        if not isinstance(model_instance_and_serializer, Tuple) or len(model_instance_and_serializer) != 2:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed model validation: {model_instance_and_serializer}",
            )
            raise RuntimeError("The algorithm has failed model validation")

        self._data_instance = data_instance_and_serializer[0]
        self._model_instance = model_instance_and_serializer[0]
        self._model_type = kwargs.get("model_type")

        if Plugin._requires_ground_truth:
            # Check if ground truth instance is tuple and if the tuple contains 2 items
            if (
                not isinstance(ground_truth_instance_and_serializer, Tuple)
                or len(ground_truth_instance_and_serializer) != 2
            ):
                self.add_to_log(
                    logging.ERROR,
                    f"The algorithm has failed ground truth data validation: \
                        {ground_truth_instance_and_serializer}",
                )
                raise RuntimeError("The algorithm has failed ground truth data validation")
            self._requires_ground_truth = True
            self._ground_truth_instance = ground_truth_instance_and_serializer[0]
            self._ground_truth_serializer = ground_truth_instance_and_serializer[1]
            self._ground_truth = kwargs.get("ground_truth")

        else:
            self._ground_truth_instance = None
            self._ground_truth = ""

        self._base_path = kwargs.get("project_base_path", Path().absolute())

        # Other variables
        self._data = None
        self._results = {"results": [0]}

        # Perform setup for this plug-in
        self.setup()

        # Algorithm input schema defined in input.schema.json
        # By defining the input schema, it allows the front-end to know what algorithm input params is
        # required by this plugin. This allows this algorithm plug-in to receive the arguments values it requires.
        current_file_dir = Path(__file__).parent
        self._input_schema = load_schema_file(str(current_file_dir / "input.schema.json"))

        # Algorithm output schema defined in output.schema.json
        # By defining the output schema, this plug-in validates the result with the output schema.
        # This allows the result to be validated against the schema before passing it to the front-end for display.
        self._output_schema = load_schema_file(str(current_file_dir / "output.schema.json"))

        # Retrieve the input parameters defined in the input schema and store them
        self._input_arguments = dict()
        for key in self._input_schema.get("properties").keys():
            self._input_arguments.update({key: kwargs.get(key)})

        # Perform validation on input argument schema
        if not validate_json(self._input_arguments, self._input_schema):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed input schema validation. \
                    The input must adhere to the schema in input.schema.json: {self._input_arguments}",
            )
            raise RuntimeError(
                "The algorithm has failed input schema validation. \
                The input must adhere to the schema in input.schema.json"
            )

    def add_to_log(self, log_level: int, log_message: str) -> None:
        """
        A helper method to log messages to store events occurred

        Args:
            log_level (int): The logging level
            log_message (str): The logging message
        """
        if self._logger is not None:
            if not isinstance(log_level, int) or not isinstance(log_message, str):
                raise RuntimeError("The algorithm has invalid log level or message.")
        if self._logger is not None:
            if log_level is logging.DEBUG:
                self._logger.debug(log_message)
            elif log_level is logging.INFO:
                self._logger.info(log_message)
            elif log_level is logging.WARNING:
                self._logger.warning(log_message)
            elif log_level is logging.ERROR:
                self._logger.error(log_message)
            elif log_level is logging.CRITICAL:
                self._logger.critical(log_message)
            else:
                pass  # Invalid log level
        else:
            pass  # No log instance

    def setup(self) -> None:
        """
        A method to perform setup for this algorithm plugin
        """
        # Perform validation on logger
        if self._logger:
            if not isinstance(self._logger, logging.Logger):
                raise RuntimeError("The algorithm has failed to set up logger. The logger type is invalid")

        # Perform validation on model type
        if self._model_type not in Plugin._supported_algorithm_model_type:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed validation for model type: {self._model_type}",
            )
            raise RuntimeError("The algorithm has failed validation for model type")

        # Perform validation on data instance
        if not isinstance(self._data_instance, IData):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed data validation: {self._data_instance}",
            )
            raise RuntimeError("The algorithm has failed data validation")

        # Perform validation on model instance
        if not isinstance(self._model_instance, IModel) and not isinstance(self._model_instance, IPipeline):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed model validation: {self._model_instance}",
            )
            raise RuntimeError("The algorithm has failed model validation")

        # Perform validation on ground truth instance
        if self._requires_ground_truth:
            if not isinstance(self._ground_truth_instance, IData):
                self.add_to_log(
                    logging.ERROR,
                    f"The algorithm has failed ground truth data validation: {self._ground_truth_instance}",
                )
                raise RuntimeError("The algorithm has failed ground truth data validation")

            # Perform validation on ground truth header
            if not isinstance(self._ground_truth, str):
                self.add_to_log(
                    logging.ERROR,
                    "The algorithm has failed ground truth header validation. \
                    Header must be in String and must be present in the dataset: {self._ground_truth}",
                )
                raise RuntimeError(
                    "The algorithm has failed ground truth header validation. \
                    Header must be in String and must be present in the dataset"
                )

        # Perform validation on progress_inst
        if self._progress_inst:
            if not isinstance(self._progress_inst, SimpleProgress):
                raise RuntimeError("The algorithm has failed validation for the progress bar")

        # Perform validation on project_base_path
        if not isinstance(self._base_path, PurePath):
            self.add_to_log(
                logging.ERROR,
                "The algorithm has failed validation for the project path. \
                Ensure that the project path is a valid path: {self._base_path}",
            )
            raise RuntimeError(
                "The algorithm has failed validation for the project path. \
                Ensure that the project path is a valid path"
            )

        # Perform validation on metadata
        if not isinstance(self._metadata, PluginMetadata):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed validation for its metadata: {Plugin._metadata}",
            )
            raise RuntimeError("The algorithm has failed validation for its metadata")

        # Perform validation on plugin type
        if not isinstance(self._plugin_type, PluginType):
            self.add_to_log(
                logging.ERROR,
                "The algorithm has failed validation for its plugin type. \
                Ensure that PluginType is PluginType.ALGORITHM: {Plugin._plugin_type}",
            )
            raise RuntimeError(
                "The algorithm has failed validation for its plugin type. \
                Ensure that PluginType is PluginType.ALGORITHM"
            )

        # Perform logging
        self.add_to_log(logging.INFO, "Setup completed")

    def get_progress(self) -> int:
        """
        A method to return the current progress for this plugin

        Returns:
            int: Completion Progress
        """
        return self._progress_inst.get_progress()

    def get_results(self) -> Dict:
        """
        A method to return generated results for this plugin

        Returns:
            Dict: The results to be returned for display
        """
        return self._results

    def generate(self) -> None:
        """
        A method to generate the algorithm results with the provided data, model, ground truth information.
        """
        # Retrieve data information
        self._data = self._data_instance.get_data()
        # Perform pdp explanation
        try:
            self._explain_pdp()
        except Exception:
            import traceback

            traceback.print_exc()

        # Update progress (For 100% completion)
        self._progress_inst.update(1)

    def _explain_pdp(self) -> None:
        """
        A helper method to explain feature effect using pdp
        """
        if self._data_instance.get_data_plugin_type() is DataPluginType.PANDAS:
            # Declarations
            output_results = dict()

            # Extract required arguments values
            # target = self._input_arguments["target_feature_name"]
            percentiles = [0.01, 0.99]
            grid_resolution = 25

            # Remove ground_truth target value from the data
            data_no_ground_truth = self._data.drop([self._ground_truth], axis=1, errors="ignore").copy()

            # Get the data, features, and targets
            data_no_ground_truth_np = data_no_ground_truth.to_numpy()
            data_features = list(data_no_ground_truth.columns)
            data_ground_truth_np = self._ground_truth_instance.get_data()[self._ground_truth].transpose().to_numpy()
            targets = np.unique(data_ground_truth_np)

            # Compute pdp grid values
            grid_values = self._compute_pdp_grid(data_no_ground_truth_np, data_features, percentiles, grid_resolution)

            dict_items_labels = self._data_instance.read_labels().items()
            # Update the progress total value
            self._progress_inst.add_total(len(grid_values))
            for index, value in grid_values.items():
                mean_pdp = self._compute_pdp(data_no_ground_truth_np, index, dict_items_labels, value)
                feature = data_features[index]
                # Convert results based on target classes.
                output_results[feature] = dict()
                target_index = 0

                if mean_pdp.ndim == 1:
                    two_dim_mean_pdp = np.expand_dims(mean_pdp, axis=0)
                else:
                    two_dim_mean_pdp = mean_pdp

                for target in targets:
                    output_results[feature][target] = (
                        value,
                        two_dim_mean_pdp[:, target_index],
                    )
                    target_index += 1

                # Update the progress
                self._progress_inst.update(1)

            # Format the output results
            output_results = self._format_result(output_results)

            # Assign the output results
            self._results = output_results

        else:
            self.add_to_log(
                logging.ERROR,
                f"Invalid data plugin type - {self._data_instance.get_data_plugin_type()}",
            )
            raise RuntimeError(f"Invalid data plugin type - {self._data_instance.get_data_plugin_type()}")

    def _compute_pdp(
        self,
        data: np.ndarray,
        idx: int,
        data_labels: List,
        grid_values: Union[np.ndarray, List],
    ) -> np.ndarray:
        """
        A helper method to compute the pdp for the given column

        Args:
            data (np.ndarray): Input data
            idx (int): Index value
            data_labels (List): List of data labels
            grid_values (Union[np.ndarray, List]): Grid values

        Returns:
            np.ndarray: The computed result of pdp
        """
        data_copy = data.copy()
        baselines = list()

        for i, y in enumerate(grid_values):
            data_copy[:, idx] = y
            baselines.append(self._model_instance.predict(data_copy, data_labels))

        baselines = np.swapaxes(np.array(baselines), 0, 1)
        mean_value = np.mean(baselines, axis=0)

        return mean_value

    def _compute_pdp_grid(self, data: np.ndarray, features: List, percentiles: List, grid_resolution: int) -> Dict:
        """
        A helper method to compute pdp grid values

        Args:
            data (np.ndarray): Input Data
            features (List): List of features
            percentiles (List): Percentiles value
            grid_resolution (int): Grid Resolution

        Raises:
            RuntimeError: Raise exception when percentiles are not sequence of 2
            RuntimeError: Raise exception when percentiles values are not within 0 and 1
            RuntimeError: Raise exception when percentile[0] is >= percentile[1]
            RuntimeError: Raise exception when GridResolution is <= 1
            RuntimeError: Raise Exception when percentiles are too closed

        Returns:
            Dict: The computed pdp grid result
        """
        # Perform conditional checks
        if len(percentiles) != 2:
            self.add_to_log(logging.ERROR, "'percentiles' must be a sequence of 2 elements.")
            raise RuntimeError("'percentiles' must be a sequence of 2 elements.")

        if not all(0 <= x <= 1 for x in percentiles):
            self.add_to_log(logging.ERROR, "'percentiles' values must be in [0, 1].")
            raise RuntimeError("'percentiles' values must be in [0, 1].")

        if percentiles[0] >= percentiles[1]:
            self.add_to_log(
                logging.ERROR,
                f"percentiles[0] {percentiles[0]} must be strictly less than percentiles[1] {percentiles[1]}.",
            )
            raise RuntimeError(
                f"percentiles[0] {percentiles[0]} must be strictly less than percentiles[1] {percentiles[1]}."
            )

        if grid_resolution <= 1:
            self.add_to_log(logging.ERROR, "GridResolution must be > 1")
            raise RuntimeError("GridResolution must be > 1")

        grid_values = dict()
        for feature in features:
            idx = features.index(feature)
            uniques = np.unique(data[:, idx])

            # Usually categorical value will not have lots of unique values
            # hence, we can take the list directly
            if uniques.shape[0] <= grid_resolution:
                tmp_grid_values = sorted(np.unique(data[:, idx]))
            else:
                emp_percentiles = mquantiles(data[:, idx], prob=percentiles, axis=0)
                if np.allclose(emp_percentiles[0], emp_percentiles[1]):
                    self.add_to_log(
                        logging.ERROR,
                        f"Percentiles are too closed: {emp_percentiles}. " f"Please change percentile value.",
                    )
                    raise RuntimeError(
                        f"Percentiles are too closed: {emp_percentiles}. " f"Please change percentile value."
                    )
                else:
                    tmp_grid_values = np.linspace(
                        emp_percentiles[0],
                        emp_percentiles[1],
                        num=grid_resolution,
                        endpoint=True,
                    )

            # Update value
            grid_values.update({idx: tmp_grid_values})

        return grid_values

    def _format_result(self, results: Dict) -> Dict:
        """
        A helper method to format the results to match output schema

        Args:
            results (Dict): Results to be formatted

        Returns:
            Dict: The formatted result
        """
        output_dict = dict()

        # Get the feature names
        output_dict.update({"feature_names": list(results.keys())})

        # Get the output classes
        output_classes = list()
        for value in results.values():
            for value_key in value.keys():
                output_classes.append(str(value_key))
            break
        output_dict.update({"output_classes": output_classes})

        # Get the results
        results_array = list()
        for key, value in results.items():
            target_value_array = list()
            for target_key, target_value in value.items():
                target_feature_array = list()
                feature_value_list, mean_pdp_value_list = target_value
                feature_value_list = remove_numpy_formats(feature_value_list)
                mean_pdp_value_list = remove_numpy_formats(mean_pdp_value_list)
                for feature_value, mean_pdp_value in zip(feature_value_list, mean_pdp_value_list):
                    target_feature_array.append({"feature_value": feature_value, "pdp_value": mean_pdp_value})
                target_value_array.append(target_feature_array)
            results_array.append(target_value_array)

        # Update output dictionary
        output_dict.update({"results": results_array})
        return output_dict
