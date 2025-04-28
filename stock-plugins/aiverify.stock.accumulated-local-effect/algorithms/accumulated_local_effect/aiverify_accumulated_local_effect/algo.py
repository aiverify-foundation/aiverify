import logging
from collections import OrderedDict
from pathlib import Path, PurePath
from typing import Dict, List, Tuple, Union

import numpy as np
import pandas as pd
from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.utils.json_utils import load_schema_file, validate_json
from aiverify_test_engine.utils.simple_progress import SimpleProgress


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
    The Plugin(Accumulated Local Effect) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name: str = "Accumulated Local Effect"
    _description: str = "This plugin explains how each feature and its feature value contribute to the predictions."
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

        self._input_schema = load_schema_file(str(Path(__file__).parent / "input.schema.json"))

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
                raise RuntimeError(
                    "The algorithm has invalid log level or message. The log level should be a \
                    logging level(i.e. logging.DEBUG) and log message should be in String format"
                )
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

        # Perform ALE
        self._explain_ale()

        # Update progress (For 100% completion)
        self._progress_inst.update(1)

    def _compute_ale_continuous(
        self, data: pd.DataFrame, data_features: List, feature_name: str, bins: List
    ) -> pd.DataFrame:
        """
        A helper method to compute the ALE for continuous values

        Computes the difference in prediction when the value of the feature is replaced
        once with the value before and value after by sorting and dividing the values
        into interval.

        Reference heavily on:
        https://github.com/DanaJomar/PyALE/blob/3c0a47d7cf58635e7c7a940e90f2fa62e0599c8c/PyALE/_src/ALE_1D.py#L76
        Changes made to support output for multiclass

        Args:
            data (pandas.DataFrame): Data without ground truth column that can be passed ot the model for prediction
            data_features (List): Data features
            feature_name (str): Feature name
            bins (List): List of feature values at the percentile that was computed to divide

        Returns:
            pandas.DataFrame: a panda DF that contains value of the feature, the size of the sample and the
            accumulated effect around this value
        """
        # Variables
        results = dict()

        # cut the columns into bins that we have identified
        bins = np.unique(bins)
        feat_bins = pd.cut(data[feature_name], bins, include_lowest=True)

        z_lower = data.copy()
        z_higher = data.copy()
        dict_items_labels = self._data_instance.read_labels().items()

        # ALE computes the difference in the predictions of the lower interval and upper interval
        # left is the lower interval, Right is the upper interval
        z_lower[feature_name] = [bins[i] for i in feat_bins.cat.codes]
        z_higher[feature_name] = [bins[i + 1] for i in feat_bins.cat.codes]

        # with the data points replaced with the intervals
        # now we can run the predictions for both intervals
        prediction_lower_bound = self._model_instance.predict(z_lower, dict_items_labels)
        prediction_higher_bound = self._model_instance.predict(z_higher, dict_items_labels)

        prediction_lower_bound = np.array([eval(str(i)) for i in prediction_lower_bound])
        prediction_higher_bound = np.array([eval(str(i)) for i in prediction_higher_bound])

        # collect the unique bin values, so we can do a mean prediction later within the intervals
        results[feature_name] = [bins[b + 1] for b in feat_bins.cat.codes]

        if len(prediction_lower_bound.shape) == 1:
            delta_df = pd.DataFrame(
                {
                    "ale": prediction_higher_bound - prediction_lower_bound,
                    feature_name: [bins[b + 1] for b in feat_bins.cat.codes],
                }
            )
            # compute the mean and count the size of each bin
            results = delta_df.groupby([feature_name])["ale"].agg([("ale", "mean"), "size"])
            results["ale"] = results["ale"].cumsum()
            results.loc[min(bins), :] = 0

            mean_moving_average = (
                (results["ale"] + results["ale"].shift(1, fill_value=0)) / 2 * results["size"]
            ).sum() / results["size"].sum()
            results = results.sort_index().assign(ale=results["ale"] - mean_moving_average)
        else:
            # here's where we can use for multiclass
            target_class = prediction_lower_bound.shape[1]

            target_class_diff = list()
            for i in range(target_class):
                target_class_diff.append("ale_{0}".format(i))
                results["ale_{0}".format(i)] = prediction_higher_bound[:, i] - prediction_lower_bound[:, i]

            df = pd.DataFrame(results)
            df = df.groupby([feature_name])[target_class_diff].agg(["mean", "size"])

            # need to run cumulative sum based on the different output class to get the feature effect
            for target_class in target_class_diff:
                df[(target_class, "mean")] = df[(target_class, "mean")].cumsum()

            # set the min as 0
            df.loc[min(bins), :] = 0
            df = df.sort_index()

            # subtract the total average of a moving average of size 2
            for target_class in target_class_diff:
                mean_moving_average = (
                    (df[(target_class, "mean")] + df[(target_class, "mean")].shift(1, fill_value=0))
                    / 2
                    * df[(target_class, "size")]
                ).sum() / df[(target_class, "size")].sum()
                df[(target_class, "mean")] = df[(target_class, "mean")] - mean_moving_average

            # remove the size
            results = df[[(target_class, "mean") for target_class in target_class_diff]]

        return results

    def _compute_ale_discrete(self, data: pd.DataFrame, data_features: List, feature_name: str) -> pd.DataFrame:
        """
        A helper method to compute the ALE for numeric discrete feature

        Computes the difference in prediction when the value of the feature is
        replaced once with the value before and the value after, without
        dividing into interval compare to the continuous value.

        Reference heavily on PyALE:
        https://github.com/DanaJomar/PyALE/blob/3c0a47d7cf58635e7c7a940e90f2fa62e0599c8c/PyALE/_src/ALE_1D.py#L76

        Args:
            data (pandas.DataFrame): Data without ground truth column that can be passed to the model for prediction
            data_features (List): Data features
            feature_name (str): Feature name

        Returns:
            pandas.DataFrame: A pandas dataframe that contains value of the feature, the size of the sample and
            the accumulated effect around this value
        """
        # Get the list of unique feature values
        feature_values = data[feature_name].unique()
        feature_values.sort()

        # To replace the values with the feature_code, so it's easier to replace with lower and upper bound later
        feature_values_codes = {feature_values[x]: x for x in range(len(feature_values))}
        feature_codes = data[feature_name].replace(feature_values_codes).astype(int)

        feature_values_counts = data.groupby(feature_name).size()
        feature_values_props = feature_values_counts / sum(feature_values_counts)

        # Create copies of dataframe to do replacement of the value
        z_upper = data.copy()
        z_lower = data.copy()

        # we remove the last and first group for the replacement as they cannot be replaced
        data_remove_last_group = data[feature_name] != feature_values[-1]
        data_remove_first_group = data[feature_name] != feature_values[0]

        # replace X with upper bound
        z_upper.loc[data_remove_last_group, feature_name] = feature_values[feature_codes[data_remove_last_group] + 1]
        z_lower.loc[data_remove_first_group, feature_name] = feature_values[feature_codes[data_remove_first_group] - 1]

        dict_items_labels = self._data_instance.read_labels().items()

        # runs prediction on both replaced dataset
        z_upper_prediction = self._model_instance.predict(z_upper[data_remove_last_group], dict_items_labels)
        z_lower_prediction = self._model_instance.predict(z_lower[data_remove_first_group], dict_items_labels)
        z = self._model_instance.predict(data, dict_items_labels)

        z_upper_prediction = np.array([eval(str(i)) for i in z_upper_prediction])
        z_lower_prediction = np.array([eval(str(i)) for i in z_lower_prediction])
        z = np.array([eval(str(i)) for i in z])
        # calculate the mean prediction difference
        upper_diff = z_upper_prediction - z[data_remove_last_group]
        lower_diff = z[data_remove_first_group] - z_lower_prediction

        # if there is no predict probability
        # we estimate using the proportion of the size
        if len(upper_diff.shape) == 1:
            delta_df = pd.concat(
                [
                    pd.DataFrame(
                        {
                            "ale": upper_diff,
                            feature_name: feature_values[feature_codes[data_remove_last_group] + 1],
                        }
                    ),
                    pd.DataFrame(
                        {
                            "ale": lower_diff,
                            feature_name: feature_values[feature_codes[data_remove_first_group]],
                        }
                    ),
                ]
            )

            results = delta_df.groupby([feature_name]).mean()
            results["ale"] = results["ale"].cumsum()
            results.loc[feature_values[0]] = 0
            results = results.sort_index()
            results["ale"] = results["ale"] - sum(results["ale"] * feature_values_props)
            results["size"] = feature_values_counts
        else:
            target_class = upper_diff.shape[1]
            diff_cols = OrderedDict({feature_name: z_upper[feature_name][data_remove_last_group].to_numpy()})
            diff_cols.update(OrderedDict({f"delta_{i}": upper_diff[:, i] for i in range(target_class)}))
            df_a = pd.DataFrame(diff_cols)

            diff_cols = OrderedDict({feature_name: z_lower[feature_name][data_remove_first_group].to_numpy()})
            diff_cols.update(OrderedDict({f"delta_{i}": lower_diff[:, i] for i in range(target_class)}))
            df_b = pd.DataFrame(diff_cols)

            results = pd.concat([df_a, df_b])
            results = results.groupby([feature_name]).mean()
            results.loc[feature_values[0]] = 0
            results = results.loc[feature_values].cumsum()
            results["size"] = feature_values_counts

        return results

    def _explain_ale(self) -> None:
        """
        A helper method to run ALE.
        Reference heavily on PyALE:
        https://github.com/DanaJomar/PyALE/blob/3c0a47d7cf58635e7c7a940e90f2fa62e0599c8c/PyALE/_src/ALE_1D.py#L76
        """
        if self._data_instance.get_data_plugin_type() is DataPluginType.PANDAS:
            # Declarations
            output_results = list()

            # Extract required arguments values
            discrete_threshold = 25
            grid_resolution = 25

            # Remove ground_truth target value from the data
            data_no_ground_truth = self._data.copy()

            # Get data, features
            data_no_ground_truth_np = data_no_ground_truth.to_numpy()
            data_features = list(data_no_ground_truth.columns)

            # Compute ALE
            # Update the progress total value
            self._progress_inst.add_total(len(data_features))
            for index in range(len(data_features)):
                feature = data_features[index]
                unique_values = np.unique(data_no_ground_truth_np[:, index])

                if len(unique_values) < discrete_threshold:
                    # Perform ALE Discrete computation
                    results = self._compute_ale_discrete(data_no_ground_truth, data_features, feature)
                else:
                    # Perform ALE Continuous computation
                    # Generate the percentile based on the grid_resolution given by user
                    percentiles = np.linspace(0, 100, num=grid_resolution)

                    # Create bins based on the percentiles
                    bins = sorted(set(np.percentile(data_no_ground_truth_np[:, index], percentiles)))
                    results = self._compute_ale_continuous(data_no_ground_truth, data_features, feature, bins)

                # Add results to list
                output_results.append(results)

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

    def _format_result(self, results_list: List) -> Dict:
        """
        A helper method to format the results to match output schema

        Args:
            results_list (List): Results in list to be formatted to a Dict

        Returns:
            Dict: A Dict containing the formatted results
        """
        output_dict = dict({"feature_names": list(), "results": list()})

        # Store the results
        for results_dataframe in results_list:
            # Get feature values
            feature_dict = dict({"indices": results_dataframe.index.tolist()})
            if "ale" in results_dataframe.columns:
                feature_dict.update({"ale": results_dataframe["ale"].values.tolist()})
            else:
                feature_dict.update({"ale": list()})

            if "size" in results_dataframe.columns:
                feature_dict.update({"size": results_dataframe["size"].values.tolist()})
            else:
                feature_dict.update({"size": list()})

            output_dict["feature_names"].append(results_dataframe.index.name)
            output_dict["results"].append(feature_dict)

        return output_dict
