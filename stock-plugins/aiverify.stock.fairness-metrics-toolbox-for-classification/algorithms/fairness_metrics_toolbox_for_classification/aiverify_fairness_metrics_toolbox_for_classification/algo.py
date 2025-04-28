import logging
import pickle
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
from aiverify_test_engine.plugins.enums.serializer_plugin_type import (
    SerializerPluginType,
)
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.utils.json_utils import load_schema_file, validate_json
from aiverify_test_engine.utils.simple_progress import SimpleProgress
from sklearn.metrics import confusion_matrix


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
    The Plugin(Fairness Metrics Toolbox for Classification) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name: str = "Fairness Metrics Toolbox for Classification"
    _description: str = (
        "The Fairness Metrics Toolbox (FMT) for Classification contains a list of fairness metrics "
        "to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among "
        "the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) "
        "(e.g. gender, marital status). This plugin is developed for classification models."
    )
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.ALGORITHM
    _requires_ground_truth: bool = True
    _supported_algorithm_model_type: List = [ModelType.CLASSIFICATION]

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
        self._serializer_instance = data_instance_and_serializer[1]

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

        try:
            # check if input data type is image
            if self._serializer_instance.get_serializer_plugin_type() is SerializerPluginType.IMAGE:
                self._model = self._initial_model_instance
                self._data = self._initial_data_instance.get_data()
                self._data_labels = list(self._initial_data_instance.read_labels().keys())
                annotated_labels_path = self._input_arguments.get("annotated_labels_path", "")
                # reindex the ground truth using the order that has been read by AI Verify
                annotated_labels = pickle.load(open(annotated_labels_path, "rb")).set_index(
                    self._input_arguments.get("file_name_label")
                )
                file_names = [Path(i).name for i in self._data["image_directory"]]
                self._ordered_annotations = annotated_labels.reindex(file_names)
                self._y_test = self._ordered_annotations[self._ground_truth]

                # get col(s) of sensitive feature(s)
                self._data_sensitive_feature_np = self._ordered_annotations[self._sensitive_feature].to_numpy()

            else:
                # for tabular use case
                self._model = self._model_instance
                self._data = self._data_instance.get_data()
                self._data_labels = list(self._data_instance.read_labels().keys())
                self._y_test = self._ground_truth_instance.get_data()[self._ground_truth]

                # get col(s) of sensitive feature(s)
                self._data_sensitive_feature_np = self._data[self._sensitive_feature].to_numpy()

            # Compute score for features
            self._compute_score_for_features()

        except Exception:
            import traceback

            traceback.print_exc()

        # Update progress (For 100% completion)
        self._progress_inst.update(1)

    def _compute_rate(
        self,
        numerator: Union[int, float, np.int64, np.float64],
        denominator: Union[int, float, np.int64, np.float64],
    ) -> Union[float, np.float64]:
        """
        A helper method to compute the rate

        Args:
            numerator (Union[int, float, np.int64, np.float64]): The numerator number used for computing rate
            denominator (Union[int, float, np.int64, np.float64]): The denominator number used for computing rate

        Returns:
            Union[float, np.float64]: The computed rated
        """

        if numerator == 0.0 or denominator == 0.0:
            return 0
        return numerator / denominator

    def _add_to_results(
        self,
        results: dict,
        matrix_name: str,
        output_class: np.int64,
        value: Union[int, float, np.int64, np.float64],
        unique_group: np.ndarray,
    ) -> dict:
        """
        A helper method to add the computed results

        Args:
            results (dict): The generated results from _compute_between_group function in a dict
            matrix_name (str): The name of the matrix (E.g. Equal Selection Parity, Predicted Prevalance)
            output_class (np.int64): The output class (E.g. 0)
            value (Union[int, float, np.int64, np.float64]): The metric value of the matrix
            unique_group (np.ndarray): The group of the results (E.g. [0,1])

        Returns:
            dict: The appended results to be returned for display in a dict
        """
        if output_class not in results:
            results[output_class] = dict()

        list_unique_group = unique_group.tolist()

        # add group and matrix score to list
        if matrix_name not in results[output_class]:
            results[output_class][matrix_name] = [{"group": list_unique_group, "metric": float(value)}]
        else:
            results[output_class][matrix_name].append({"group": list_unique_group, "metric": float(value)})
        return results

    def _compute_score_for_features(self) -> dict:
        """
        A function to compute TPR, TNR, PPV, NPV, FPR, FNR, FDR, FOR scores for all classes

        Returns:
            dict: The results to be returned for display in a dict
        """
        if self._data_instance.get_data_plugin_type() is DataPluginType.PANDAS:
            # # Declarations
            # get ground truth in numpy
            data_ground_truth_np = self._y_test.transpose().to_numpy()

            # get predicted data
            data_predicted = self._predict_data()

            # compute scores for all groups
            results = self._compute_between_group(data_ground_truth_np, data_predicted, self._data_sensitive_feature_np)

            self._results = results
            return results

        else:
            self.add_to_log(
                logging.ERROR,
                f"Invalid data plugin type - {self._data_instance.get_data_plugin_type()}",
            )
            raise RuntimeError(f"Invalid data plugin type - {self._data_instance.get_data_plugin_type()}")

    def _predict_data(self) -> np.ndarray:
        """
        A function to predict data from the test data and return the predicted data

        Returns:
            np.ndarray: The predicted data in a numpy array
        """

        # list of tuple of labels to be passed into predict()
        dict_items_labels = self._data_instance.read_labels().items()
        predicted_data = self._model.predict(self._data, dict_items_labels)
        return [eval(str(i)) for i in predicted_data]

    def _compute_between_group(
        self,
        data_ground_truth_np: np.ndarray,
        data_predicted: np.ndarray,
        sensitive_feature_np: np.ndarray,
    ) -> dict:
        """
        A method to compute the results for the various matrix groups

        Args:
            data_ground_truth_np (np.ndarray): The ground truth data in a numpy array
            data_predicted (np.ndarray): The predicted data in a numpy array
            sensitive_feature_np (np.ndarray): The sensitive features in a numpy array

        Returns:
            dict: The computed results in a dict
        """

        cm = confusion_matrix(data_ground_truth_np, data_predicted)
        FP = cm.sum(axis=0) - np.diag(cm)  # vertical as the TP minus the TP
        FN = cm.sum(axis=1) - np.diag(cm)  # same row as the TP minus the TP
        TP = np.diag(cm)  # diagonals
        TN = cm[:].sum() - (FP + FN + TP)  # all the others

        unique_groups = np.unique(sensitive_feature_np, axis=0)
        results = dict()
        # initiate a second dictionary for intermediate results necessary for computation of disparate impact and
        # equal parity
        intermediate_results = dict()
        # number_of_class = len(np.unique(data_ground_truth_np))
        output_classes = np.unique(data_ground_truth_np)

        number_of_unique_groups = len(unique_groups)
        number_of_output_classes = len(output_classes)
        total_number_of_iterations = number_of_unique_groups * number_of_output_classes

        # Update the progress total value
        self._progress_inst.add_total(total_number_of_iterations)
        for output_class in output_classes:
            self.add_to_log(
                logging.INFO,
                f"\nComputing the TP, FP, FN, TN based on the output class {output_class}",
            )

            num_false_negative_by_class = FN[output_class]
            num_true_positive_by_class = TP[output_class]
            num_true_negative_by_class = TN[output_class]
            num_false_positive_by_class = FP[output_class]

            tp_condition_A = data_ground_truth_np == output_class
            tp_condition_B = data_predicted == output_class
            true_positive = np.logical_and(tp_condition_A, tp_condition_B)

            fp_condition_A = data_ground_truth_np != output_class
            fp_condition_B = data_predicted == output_class
            false_positive = np.logical_and(fp_condition_A, fp_condition_B)

            fn_condition_A = data_ground_truth_np == output_class
            fn_condition_B = data_predicted != output_class
            false_negative = np.logical_and(fn_condition_A, fn_condition_B)

            tn_condition_A = data_ground_truth_np != output_class
            tn_condition_B = data_predicted != output_class
            true_negative = np.logical_and(tn_condition_A, tn_condition_B)

            # start tracking this for disparate impact
            lowest_group_tp_fp, highest_group_tp_fp = 0, 0

            for unique_group in unique_groups:
                self.add_to_log(logging.INFO, f"Processing for group with value {unique_group}")
                """
                Identify the datapoints that are relevant in this group [For example, we are finding all the
                females in the group]
                Mock an array where the rows satisfied the group condition
                For example, given this array: [[0 1], [1 0], [1 1], [0 1], [1 2] ,[1 1] ,[1 0] ,[1 2] ,[0 2] ,[1 2]]
                we are looking for position with [0, 1]. In the above array, index 0 and index 3 are True.
                Using tmp = (group == [0, 1]) returns us [[True, True], [False, False], [False, True], [True, True]....]
                np.where(np.all(tmp, axis=1), True, False) returns us [True, False, False, True, ...] that becomes
                our positional condition for this group
                """
                tmp = sensitive_feature_np == unique_group
                group_with_cond = np.where(
                    np.all(tmp, axis=1), True, False
                )  # find the rows that are all true based on tmp

                # This allows us to find the location in the array that is tp, fn, fp, tn respectively
                num_tp_by_group = np.logical_and(group_with_cond, true_positive)
                num_fn_by_group = np.logical_and(group_with_cond, false_negative)
                num_fp_by_group = np.logical_and(group_with_cond, false_positive)
                num_tn_by_group = np.logical_and(group_with_cond, true_negative)

                # Compute the number of tp, tn, fp, fn for this group
                tp_by_group = len(np.where(num_tp_by_group)[0])
                tn_by_group = len(np.where(num_tn_by_group)[0])
                fp_by_group = len(np.where(num_fp_by_group)[0])
                fn_by_group = len(np.where(num_fn_by_group)[0])

                tp_fp = tp_by_group + fp_by_group

                if tp_fp > highest_group_tp_fp:
                    highest_group_tp_fp = tp_fp

                if tp_fp < lowest_group_tp_fp or lowest_group_tp_fp == 0:
                    lowest_group_tp_fp = tp_fp

                # No. of actual positives & negatives, predicted postives & negatives BY GROUP
                positive_by_group = tp_by_group + fn_by_group
                negative_by_group = tn_by_group + fp_by_group
                population = positive_by_group + negative_by_group

                # Prevalance and predicted prevalance BY GROUP
                prevalance_by_group = self._compute_rate(positive_by_group, population)
                predicted_prevalence_by_group = self._compute_rate(tp_fp, population)

                # Compute all the different rates for this group based on the formula
                tpr_by_group = self._compute_rate(
                    tp_by_group,
                    num_true_positive_by_class + num_false_negative_by_class,
                )
                tnr_by_group = self._compute_rate(
                    tn_by_group,
                    num_true_negative_by_class + num_false_positive_by_class,
                )
                ppv_by_group = self._compute_rate(
                    tp_by_group,
                    num_true_positive_by_class + num_false_positive_by_class,
                )
                npv_by_group = self._compute_rate(
                    tn_by_group,
                    num_true_negative_by_class + num_false_negative_by_class,
                )
                fpr_by_group = self._compute_rate(
                    fp_by_group,
                    num_true_negative_by_class + num_false_positive_by_class,
                )
                fnr_by_group = self._compute_rate(
                    fn_by_group,
                    num_true_positive_by_class + num_false_negative_by_class,
                )
                fdr_by_group = self._compute_rate(
                    fp_by_group,
                    num_true_positive_by_class + num_false_positive_by_class,
                )
                for_by_group = self._compute_rate(
                    fn_by_group,
                    num_true_negative_by_class + num_false_negative_by_class,
                )

                self._add_to_results(
                    results,
                    "True Positive Rate",
                    output_class,
                    tpr_by_group,
                    unique_group,
                )
                self._add_to_results(
                    results,
                    "True Negative Rate",
                    output_class,
                    tnr_by_group,
                    unique_group,
                )
                self._add_to_results(
                    results,
                    "Positive Predictive Value Parity",
                    output_class,
                    ppv_by_group,
                    unique_group,
                )
                self._add_to_results(
                    results,
                    "Negative Predictive Value Parity",
                    output_class,
                    npv_by_group,
                    unique_group,
                )
                self._add_to_results(
                    results,
                    "False Positive Rate",
                    output_class,
                    fpr_by_group,
                    unique_group,
                )
                self._add_to_results(
                    results,
                    "False Negative Rate",
                    output_class,
                    fnr_by_group,
                    unique_group,
                )
                self._add_to_results(
                    results,
                    "False Discovery Rate",
                    output_class,
                    fdr_by_group,
                    unique_group,
                )
                self._add_to_results(
                    results,
                    "False Omission Rate",
                    output_class,
                    for_by_group,
                    unique_group,
                )
                # adding to intermediate results for calculation of equal parity and disparate imapct
                self._add_to_results(
                    intermediate_results,
                    "True Positives",
                    output_class,
                    tp_by_group,
                    unique_group,
                )
                self._add_to_results(
                    intermediate_results,
                    "True Negatives",
                    output_class,
                    tn_by_group,
                    unique_group,
                )
                self._add_to_results(
                    intermediate_results,
                    "False Positives",
                    output_class,
                    fp_by_group,
                    unique_group,
                )
                self._add_to_results(
                    intermediate_results,
                    "False Negatives",
                    output_class,
                    fn_by_group,
                    unique_group,
                )
                self._add_to_results(
                    intermediate_results,
                    "Prevalence",
                    output_class,
                    prevalance_by_group,
                    unique_group,
                )
                self._add_to_results(
                    intermediate_results,
                    "Predicted Prevalence",
                    output_class,
                    predicted_prevalence_by_group,
                    unique_group,
                )

            # Generate Disparate Impact and Equal Selection Parity for all combinations
            predicted_positive_all = intermediate_results[output_class]["Predicted Prevalence"]
            true_positive_all = intermediate_results[output_class]["True Positives"]
            false_positive_all = intermediate_results[output_class]["False Positives"]

            for i in range(len(predicted_positive_all)):
                for j in range(i + 1, len(predicted_positive_all)):
                    # comparing me with the rest as the base, how far am i away?
                    disparate_impact = self._compute_rate(
                        predicted_positive_all[i]["metric"],
                        predicted_positive_all[j]["metric"],
                    )

                    group_numerator = np.array(unique_groups[i])
                    group_denominator = np.array(unique_groups[j])
                    subgroup = np.concatenate((group_numerator, group_denominator), axis=None)
                    self._add_to_results(
                        results,
                        "Disparate Impact",
                        output_class,
                        disparate_impact,
                        subgroup,
                    )
                    equal_selection_parity = abs(
                        (true_positive_all[i]["metric"] + false_positive_all[i]["metric"])
                        - (true_positive_all[j]["metric"] + false_positive_all[j]["metric"])
                    )
                    self._add_to_results(
                        results,
                        "Equal Selection Parity",
                        output_class,
                        equal_selection_parity,
                        subgroup,
                    )
            self._progress_inst.update(1)
            formatted_output = self._format_result(results, output_classes)
        return formatted_output

    def _format_result(self, results: dict, output_classes: np.ndarray) -> dict:
        """
        A function to format the results to match output schema

        Args:
            results (dict): The final computed results to be formatted
            output_classes (np.ndarray): The list of output classes in numpy array

        Returns:
            dict: The formatted results that is required for the output
        """

        results_list = list()
        results_list.append(results)

        list_output_classes = output_classes.tolist()

        output_class_data_list = list()
        for output_class in list_output_classes:
            output_class_data = results.get(output_class)
            output_class_data_list.append(output_class_data)

        output_dict = {
            "sensitive_feature": self._sensitive_feature,
            "output_classes": list_output_classes,
            "results": output_class_data_list,
        }
        return output_dict
