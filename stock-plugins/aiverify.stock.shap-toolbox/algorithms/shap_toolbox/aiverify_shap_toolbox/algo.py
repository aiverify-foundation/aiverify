import logging
from pathlib import Path, PurePath
from typing import Any, Dict, List, Tuple, Union

import numpy as np
import shap
import xgboost
from aiverify_shap_toolbox.utils.explain_types import ExplainType
from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.data_plugin_type import DataPluginType
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from aiverify_test_engine.utils.json_utils import load_schema_file, validate_json
from aiverify_test_engine.utils.simple_progress import SimpleProgress
from aiverify_test_engine.utils.url_utils import is_url


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
    The Plugin(SHAP Toolbox) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name: str = "SHAP Toolbox"
    _description: str = (
        "SHAP (SHapley Additive exPlanations) is a game theoretic approach to explain the "
        "output of any machine learning model. It connects optimal credit allocation with "
        "local explanations using the classic Shapley values from game theory and their related "
        "extensions (see papers for details and citations)."
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
        self._sensitive_feature = kwargs.get("sensitive_feature", None)

        # Other variables
        self._background = None
        self._background_path = ""
        self._background_instance = None
        self._data = None
        self._data_labels = list()
        self._explain_type = ""
        self._model = None
        self._sample_seed = 1
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

        print(f"_input_arguments :  {self._input_arguments}")
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
            raise RuntimeError("The algorithm has failed data validation.")

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
        # Perform SHAP
        try:
            self._explain_shap()
        except Exception:
            import traceback

            traceback.print_exc()

        # Update progress (For 100% completion)
        self._progress_inst.update(1)

    def _explain_shap(self) -> None:
        """
        A helper method to perform shap explanation
        """
        # Get input arguments
        input_background_path = self._input_arguments.get("background_path", "")
        input_background_samples = self._input_arguments.get("background_samples", 0)
        input_data_samples = self._input_arguments.get("data_samples", 0)
        input_explain_type = self._input_arguments.get("explain_type", "")

        # Perform validation on input arguments
        error_count, error_message = self._perform_input_validation(
            input_background_path,
            input_background_samples,
            input_data_samples,
            input_explain_type,
        )
        if error_count > 0:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm has failed input arguments validation: {error_message}",
            )
            raise RuntimeError(f"The algorithm has failed input arguments validation: {error_message}")
        else:
            self.add_to_log(
                logging.INFO,
                f"Validated plugin input arguments - "
                f"Background Path: {input_background_path},"
                f"Background Samples: {input_background_samples},"
                f"Data Samples: {input_data_samples},"
                f"Explain Type: {input_explain_type}",
            )

            # Set the background data
            self._background_path = input_background_path

            # Set the background and data samples
            self._background_samples = input_background_samples
            self._data_samples = input_data_samples

            # Set the Explain Type
            if input_explain_type.lower() == ExplainType.GLOBAL.name.lower():
                self._explain_type = ExplainType.GLOBAL
            else:
                self._explain_type = ExplainType.LOCAL

        # Get background instance
        (
            self._background_instance,
            background_serializer,
            background_error_message,
        ) = PluginManager.get_instance(PluginType.DATA, **{"filename": self._background_path})
        if not self._background_instance:
            self.add_to_log(
                logging.ERROR,
                f"The algorithm failed to get the background data: {self._background_path} - \
                    {background_error_message}",
            )
            raise RuntimeError(
                f"The algorithm failed to get the background data: {self._background_path} - "
                f"{background_error_message}"
            )
        else:
            self.add_to_log(
                logging.INFO,
                f"Background Instance - {self._background_instance},"
                f"Background Serializer - {background_serializer}",
            )

        self._data = self._data_instance.get_data()
        self._data_labels = list(self._data_instance.read_labels().keys())
        self._model = self._initial_model_instance

        # Retrieve data information
        # Check if background dataset has ground truth first
        if self._ground_truth in self._background_instance.get_data().columns:
            self._background = self._background_instance.get_data().drop(self._ground_truth, axis=1)
        else:
            self._background = self._background_instance.get_data()

        if self._model_instance.get_plugin_type() is PluginType.PIPELINE:
            transformers = self._model.get_pipeline()[:-1]
            self._background = transformers.transform(self._background)

        # Perform data_sampling and background_sampling
        if self._data_samples > 0:
            num_of_samples = min(len(self._data), self._data_samples)
            self._data = self._data.sample(num_of_samples, random_state=self._sample_seed)

            self._ground_truth_data = self._ground_truth_instance.get_data().sample(
                num_of_samples, random_state=self._sample_seed
            )

        if self._background_samples > 0:
            num_of_samples = min(len(self._background), self._background_samples)
            self._background = self._background.sample(num_of_samples, random_state=self._sample_seed)

        # Get explainer function
        explainer = self._get_explainer()
        self.add_to_log(logging.INFO, f"Explainer Name: {explainer}")

        if self._data_instance.get_data_plugin_type() is DataPluginType.PANDAS:
            # Get single shap value
            single_shap_value = explainer.shap_values(self._data.sample(1, random_state=self._sample_seed))

            # Global or Local?
            if self._explain_type is ExplainType.GLOBAL:
                if (
                    self._model_instance.get_plugin_type() is PluginType.MODEL
                    and self._model_instance.get_model_plugin_type() is ModelPluginType.XGBOOST
                ):
                    data = xgboost.DMatrix(self._data, self._ground_truth_data)
                    shap_values = explainer.shap_values(data)
                else:
                    shap_values = explainer.shap_values(self._data)
                results = {
                    "shap_values": shap_values,
                    "samples": self._data,
                    "single_shap_value": single_shap_value,
                    "explainer": explainer,
                }
            else:
                # Local Explain Type
                results = {
                    "single_shap_value": single_shap_value,
                    "explainer": explainer,
                }

            # Format the output results
            output_results = self._format_result(results)

            # Assign the output results
            self._results = output_results

        else:
            self.add_to_log(
                logging.ERROR,
                f"Unsupported data plugin type: {self._data_instance.get_data_plugin_type()}",
            )
            raise RuntimeError(f"Unsupported data plugin type: {self._data_instance.get_data_plugin_type()}")

    def _get_explainer_predict_helper(self, data: Any) -> Any:
        """
        A self-defined function for explainer to perform prediction proba

        Arg:
            data (Any): The data to be sent for prediction proba

        Returns:
            Any: predicted value
        """
        dict_item_labels = self._data_instance.read_labels().items()
        predicted_results = self._model_instance.predict(data, dict_item_labels)
        if isinstance(predicted_results, list):
            predicted_results = np.array(list(predicted_results), dtype="float32")
        return predicted_results

    def _get_explainer(self) -> Union[shap.TreeExplainer, shap.KernelExplainer]:
        """
        A function to return upload explainer. Upload method will return explainer based on algorithm configuration

        Returns:
            Union[shap.TreeExplainer, shap.KernelExplainer]: An instance of either
            TreeExplainer, or KernelExplainer for upload
        """
        if (
            self._model_instance.get_plugin_type() is PluginType.MODEL
            and self._model_instance.get_model_plugin_type() is ModelPluginType.XGBOOST
        ):
            # Tree Explainer
            self.add_to_log(logging.DEBUG, "Using TreeExplainer")
            explainer = shap.TreeExplainer(self._model_instance.get_model())
        else:
            # Others (KernelExplainer)
            self.add_to_log(logging.DEBUG, "Using KernelExplainer")
            if (
                self._model_instance.get_plugin_type() is PluginType.MODEL
                and self._model_instance.get_model_plugin_type() is ModelPluginType.TENSORFLOW
            ):
                explainer = shap.KernelExplainer(self._model_instance.get_model(), self._background)
            else:
                explainer = shap.KernelExplainer(self._get_explainer_predict_helper, self._background)

        return explainer

    def _is_file(self, argument: str) -> bool:
        """
        A helper function to check if argument is a file

        Args:
            argument (str): path to file

        Returns:
            bool: True if argument is a file
        """
        return Path(argument).is_file()

    def _perform_input_validation(
        self,
        input_background_path: str,
        input_background_samples: int,
        input_data_samples: int,
        input_explain_type: str,
    ) -> Tuple[int, str]:
        """
        A helper method to perform input validation

        Args:
            input_background_path (str): Path to background data
            input_background_samples (str): No. of background samples
            input_data_samples (str): No. of data samples
            input_explain_type (str): String of explain type
        Returns:
            Tuple[int, str]: Returns a tuple consisting of total error count and error messages
        """
        error_count = 0
        error_message = ""

        supported_explain_types = [explain_type.name.lower() for explain_type in ExplainType]

        if input_background_path == "" or (
            not self._is_file(input_background_path) and not is_url(input_background_path)
        ):
            error_count += 1
            error_message += "The background path is invalid;"

        if input_background_samples < 0 or not isinstance(input_background_samples, int):
            error_count += 1
            error_message += "The background samples are invalid;"

        if input_data_samples < 0 or not isinstance(input_data_samples, int):
            error_count += 1
            error_message += "The samples are invalid;"

        if input_explain_type == "" or input_explain_type.lower() not in supported_explain_types:
            error_count += 1
            error_message += "The explain type is invalid;"

        return error_count, error_message

    def _format_result(self, results: dict) -> dict:
        """
        A helper method to format the results to match output schema

        Args:
            results (dict): Results to be formatted in dict

        Returns:
            dict: Formatted results in dict
        """
        output_dict = dict({"feature_names": list(), "results": dict()})

        # Populate results dictionary
        output_results = dict(
            {
                "num_local_classes": 0,
                "local": list(),
                "single_explainer_values": [],
                "single_shap_values": list(),
                "global_shap_values": list(),
                "global_samples": list(),
                "global": list(),
                "num_global_classes": 0,
            }
        )

        # Local Explainability
        # Set the local shap value
        # Populate single shap value in class0 and class1 and so on.
        local_shap_values = list()
        for count in range(len(results["single_shap_value"])):
            tmp_value = results["single_shap_value"][count]

            # Convert the tmp_value into an array of dimension.
            # If it is already a ndarray of dimension 2, it will remain same
            single_shap_value = np.array(tmp_value, ndmin=2)
            local_shap_values.append(single_shap_value.tolist())
        output_results.update({"local": local_shap_values})
        output_results.update({"num_local_classes": len(results["single_shap_value"])})

        # Set single explainer values and single shap values
        if isinstance(results["explainer"], list):
            temp_value_ndarray = np.array(results["explainer"][0], ndmin=1)
        else:
            temp_value_ndarray = np.array(results["explainer"].expected_value, ndmin=1)
        output_results.update({"single_explainer_values": temp_value_ndarray.tolist()})

        single_shap_values_list = list()
        for temp_value in results["single_shap_value"]:
            # Convert the tmp_value into an array of dimension 2.
            # If it is already a ndarray of dimension 2, it will remain same
            temp_value_ndarray = np.array(temp_value, ndmin=2)
            # Remove one dimension from the double array
            single_shap_values_list.append(temp_value_ndarray.tolist()[0])
        output_results.update({"single_shap_values": single_shap_values_list})

        # Global bar and force plot
        if self._explain_type is ExplainType.GLOBAL:
            temp_shap_value_ndarray = np.array(results["shap_values"], ndmin=3)
            temp_samples_value_ndarray = np.array(results["samples"].values, ndmin=2)
            output_results.update(
                {
                    "global_shap_values": temp_shap_value_ndarray.tolist(),
                    "global_samples": temp_samples_value_ndarray.tolist(),
                }
            )

            # Calculate average global shap values
            global_avg_shap_values = list()
            global_shap_value_ndarray = np.array(results["shap_values"], ndmin=3)
            num_of_classes = global_shap_value_ndarray.shape[0]
            num_of_features = global_shap_value_ndarray.shape[2]

            for class_count in range(num_of_classes):
                features_average = list()
                for features_count in range(num_of_features):
                    temp_data_slice = global_shap_value_ndarray[class_count, :, features_count]
                    features_average.append(np.abs(temp_data_slice).mean(0))
                global_avg_shap_values.append(features_average)
            output_results.update({"global": global_avg_shap_values})
            output_results.update({"num_global_classes": num_of_classes})

        # Populate feature names
        output_dict["feature_names"] = self._data.columns.tolist()
        output_dict["results"] = output_results

        return output_dict
