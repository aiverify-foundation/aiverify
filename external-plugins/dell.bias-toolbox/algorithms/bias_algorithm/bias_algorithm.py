import logging
from pathlib import Path, PurePath
from typing import Dict, List, Tuple, Union

import numpy as np
import pandas as pd
from scipy import stats
from test_engine_core.interfaces.ialgorithm import IAlgorithm
from test_engine_core.interfaces.idata import IData
from test_engine_core.interfaces.imodel import IModel
from test_engine_core.interfaces.ipipeline import IPipeline
from test_engine_core.interfaces.iserializer import ISerializer
from test_engine_core.plugins.enums.model_type import ModelType
from test_engine_core.plugins.enums.plugin_type import PluginType
from test_engine_core.plugins.metadata.plugin_metadata import PluginMetadata
from test_engine_core.utils.json_utils import load_schema_file, validate_json
from test_engine_core.utils.simple_progress import SimpleProgress


# =====================================================================================
# NOTE:
# 1. Check that you have installed the test_engine_core latest package.
# 2. Check that you have run tests/install_core_plugins_requirements.sh to install all the
#    requirements required by the core plugins (serializers, data, models).
#    Alternatively, you may install the plugins that you require by installing the
#    requirements individually.
# 3. Do not modify the class name, else the plugin cannot be read by the system.
# =====================================================================================
class Plugin(IAlgorithm):
    """
    # TODO: Update the plugin description below
    The Plugin(Bias Algorithm) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name: str = "Bias Algorithm"
    _description: str = "Test for bias in dataset"
    _version: str = "0.1.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.ALGORITHM
    _requires_ground_truth: bool = False
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
        self._progress_inst = SimpleProgress(
            1, 0, kwargs.get("progress_callback", None)
        )

        # Check if data and model are tuples and if the tuples contain 2 items
        if (
            not isinstance(data_instance_and_serializer, Tuple)
            or len(data_instance_and_serializer) != 2
        ):
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed data validation: {data_instance_and_serializer}",
            )
            raise RuntimeError("The algorithm has failed data validation")

        if (
            not isinstance(model_instance_and_serializer, Tuple)
            or len(model_instance_and_serializer) != 2
        ):
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
                raise RuntimeError(
                    "The algorithm has failed ground truth data validation"
                )
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

        # TODO: Update the input json schema in input.schema.json
        # Algorithm input schema defined in input.schema.json
        # By defining the input schema, it allows the front-end to know what algorithm input params is
        # required by this plugin. This allows this algorithm plug-in to receive the arguments values it requires.
        self._input_schema = load_schema_file(
            str(self._base_path / "input.schema.json")
        )

        # TODO: Update the output json schema in output.schema.json
        # Algorithm output schema defined in output.schema.json
        # By defining the output schema, this plug-in validates the result with the output schema.
        # This allows the result to be validated against the schema before passing it to the front-end for display.
        self._output_schema = load_schema_file(
            str(self._base_path / "output.schema.json")
        )

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
            raise RuntimeError("The algorithm has failed input schema validation. \
                               The input must adhere to the schema in input.schema.json")


    def _perform_input_validation(self) -> Tuple[int, str]:
        """
        A helper method to perform input validation

        Returns:
            Tuple[int, str]: Returns a tuple consisting of total error count and error messages
        """
        error_count = 0
        error_message = ""

        # Retrieve data information
        self._data = self._data_instance.get_data()
        target_variable_name = self._input_arguments['target_variable']
        test_variable_names = self._input_arguments['test_variable']
        p_value = self._input_arguments["p_value"]

        if target_variable_name not in self._data.columns:
            error_count += 1
            error_message += (f"Target variable ({target_variable_name}) is invalid;")

        for test_variable_name in test_variable_names:
            if test_variable_name not in self._data.columns:
                error_count += 1
                error_message += (f"Test variable ({test_variable_name}) is invalid;")

        # p-value must be (0, 1)
        if (p_value <= 0) or (p_value >= 1):
            error_count += 1
            error_message += (f"p-value is invalid;")         

        return error_count, error_message


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
                raise RuntimeError(
                    "The algorithm has failed to set up logger. The logger type is invalid"
                )

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
        if not isinstance(self._model_instance, IModel) and not isinstance(
            self._model_instance, IPipeline
        ):
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
                raise RuntimeError(
                    "The algorithm has failed ground truth data validation"
                )

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
                raise RuntimeError(
                    "The algorithm has failed validation for the progress bar"
                )

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
    
    def test_description(self, test_name: list[str]) -> str:

        text = ""

        description = dict()
        description["chi2"] = "The Chi-square test tests the null hypothesis of independence of variables in a contingency table."
        description["kruskal"] = "The Kruskal-Wallis H-test tests the null hypothesis that the population median of all of the groups are equal. It is a non-parametric method for testing whether samples originate from the same distribution."
        description["spearmanr"] = "The Spearman rank-order correlation coefficient is a nonparametric measure of the monotonicity of the relationship between two datasets. The p-value roughly indicates the probability of an uncorrelated system producing datasets that have a Spearman correlation at least as extreme as the one computed from these datasets."

        # get unique test performed
        test_name = sorted(list(set(test_name)))
        for test in test_name:
            text += description[test]
            text += "\n\n"

        return text

    def generate(self) -> None:
        """
        A method to generate the algorithm results with the provided data, model, ground truth information.
        """
        error_count, error_message = self._perform_input_validation()
        if error_count > 0:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed input arguments validation: {error_message}",
            )
            raise RuntimeError(
                f"The algorithm has failed input arguments validation: {error_message}"
            )

        # Retrieve data information
        self._data = self._data_instance.get_data()

        # TODO: Insert algorithm logic for this plug-in.
        target_variable_name = self._input_arguments['target_variable']
        test_variable_names = self._input_arguments['test_variable']

        # Check if data follows normal distrution to 'guess' categorical or numerical
        def is_col_cat(col_name):
            return (self._data[col_name].unique().shape[0] / self._data[col_name].shape[0]) < self._input_arguments.get("p_value", 0.05)

        target_var_is_cat = is_col_cat(target_variable_name)

        analysis = []
        for test_variable_name in test_variable_names:
            if target_var_is_cat:
                if is_col_cat(test_variable_name):
                    res = stats.chi2_contingency(pd.crosstab(self._data[target_variable_name], self._data[test_variable_name]))
                    analysis.append((res.statistic, res.pvalue, 'chi2'))
                else:
                    res = stats.kruskal(*[group[test_variable_name].values for name, group in self._data.groupby(target_variable_name)])
                    analysis.append((res.statistic, res.pvalue, 'kruskal'))
            else:
                if is_col_cat(test_variable_name):
                    res = stats.kruskal(*[group[target_variable_name].values for name, group in self._data.groupby(test_variable_name)])
                    analysis.append((res.statistic, res.pvalue, 'kruskal'))
                else:
                    res = stats.spearmanr(self._data[target_variable_name], self._data[test_variable_name])
                    analysis.append((res.statistic, res.pvalue, 'spearmanr'))

        
        analysis_df = pd.DataFrame(analysis, columns = ['statistic', 'pvalue', 'test_name']) 
        self._results = analysis_df.to_dict(orient = 'list')
        
        self._results["test_description"] = self.test_description(self._results.get("test_name"))
        self._results["feature_names"] = test_variable_names
        self._results["pvalue_threshold"] = self._input_arguments.get("p_value", 0.05)
        
        # Update progress (For 100% completion)
        self._progress_inst.update(1)
