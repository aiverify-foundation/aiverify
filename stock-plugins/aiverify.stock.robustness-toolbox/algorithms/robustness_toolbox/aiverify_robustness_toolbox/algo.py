import copy
import logging
import pickle
import shutil
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
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.enums.serializer_plugin_type import (
    SerializerPluginType,
)
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.utils.json_utils import load_schema_file, validate_json
from aiverify_test_engine.utils.simple_progress import SimpleProgress
from PIL import Image
from sklearn.metrics import accuracy_score, mean_absolute_error


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
    The Plugin(Robustness Toolbox) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name: str = "Robustness Toolbox"
    _description: str = "This plugin generates a perturbed dataset using boundary attack algorithm on the test dataset."
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

        # Perform setup for this plug-in
        self.setup()

        # Other variables
        self._model = None
        self._data = None
        self._data_labels = None
        self._max_iteration = 10
        self._max_test = 5
        self._max_sample = 5
        self._adapt_value = 0.667
        self._results = {"results": [0]}
        output_folder = Path.cwd() / "output"
        output_folder.mkdir(parents=True, exist_ok=True)
        self._tmp_path = output_folder / "temp"
        self._save_path = output_folder / "widgets" / "images"

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
        # Retrieve data and model information
        try:
            if self._serializer_instance.get_serializer_plugin_type() is SerializerPluginType.IMAGE:
                self._model = self._initial_model_instance
                self._data = self._initial_data_instance
                self._data_labels = list(self._initial_data_instance.read_labels().keys())
                self._data_labels_items = list(self._initial_data_instance.read_labels().items())
                annotated_ground_truth_path = self._input_arguments.get("annotated_ground_truth_path", "")
                annotated_ground_truth = pickle.load(open(annotated_ground_truth_path, "rb")).set_index(
                    self._input_arguments.get("file_name_label")
                )
                file_names = [Path(i).name for i in self._data.get_data()["image_directory"]]
                self._ordered_ground_truth = annotated_ground_truth.reindex(file_names)

                # initialise the save directory
                if Path(str(self._save_path)).exists():
                    shutil.rmtree(str(self._save_path))
                Path(str(self._save_path)).mkdir(parents=True, exist_ok=True)
            else:
                self._model = self._model_instance
                self._data = self._data_instance
                self._data_labels = list(self._data_instance.read_labels().keys())
                self._data_labels_items = self._data_instance.read_labels().items()
                self._ordered_ground_truth = self._ground_truth_instance.get_data()

            # Perform boundary attack
            self._perform_boundary_attack()
        except Exception:
            import traceback

            traceback.print_exc()

        # Update progress (For 100% completion)
        self._progress_inst.update(1)

    def _perform_boundary_attack(self):
        """
        This method generates un-targeted adversarial examples from image dataset.

        Reference:
            - https://arxiv.org/pdf/1712.04248.pdf

        Future:
            - To implement targeted attack for this algorithm.

        Returns:
             pandas.DataFrame: a panda DF that contains accuracies
        """
        if self._data.get_data_plugin_type() is DataPluginType.PANDAS:
            # clear anything in the temp directory before performing boundary attack for images
            if Path(str(self._tmp_path)).exists():
                shutil.rmtree(str(self._tmp_path))
            data_in_numpy, raw_shapes = self._transform_to_numpy(self._data.get_data())
            ground_truth_in_numpy = self._ordered_ground_truth.to_numpy().astype(int)

            min_feature_value = np.min(data_in_numpy)
            max_feature_value = np.max(data_in_numpy)

            # if model is XGB core, pass in dataframe instead of numpy array
            if self._check_for_xgb_model_type() and self._model_instance._model_algorithm == "xgboost.core.Booster":
                data_to_predict = self._data.get_data()
            else:
                data_to_predict = self._transform_to_df(data_in_numpy, raw_shapes, subfolder_name="pred_init")

            predictions = self._model.predict(data_to_predict, self._data_labels_items)
            # Update the progress total value (initial adversarial + final adversarial samples)
            self._progress_inst.add_total(2 * len(data_in_numpy))

            # Get the initial adversarial samples
            (
                initial_adversarial_samples,
                _initial_adversarial_predictions,
            ) = self._get_initial_adversarial_samples(data_in_numpy, ground_truth_in_numpy, raw_shapes)

            # Get the final adversarial samples
            (
                num_final_adversarial_samples,
                org_accuracy,
                adversarial_accuracy,
                num_failed_samples,
                adv_samples,
                org_samples,
                feature_names,
                adv_predictions,
                org_predictions,
            ) = self._get_final_adversarial_samples(
                data_in_numpy,
                ground_truth_in_numpy,
                initial_adversarial_samples,
                min_feature_value,
                max_feature_value,
                predictions,
                raw_shapes,
            )

            # Set the results
            self._results = self._format_result(
                num_final_adversarial_samples,
                org_accuracy,
                adversarial_accuracy,
                num_failed_samples,
                adv_samples,
                org_samples,
                feature_names,
                adv_predictions,
                org_predictions,
            )

        else:
            self.add_to_log(
                logging.ERROR,
                f"Invalid data plugin type - {self._data_instance.get_data_plugin_type()}",
            )
            raise RuntimeError(f"Invalid data plugin type - {self._data_instance.get_data_plugin_type()}")

    def _transform_to_numpy(self, dir_df: pd.DataFrame):
        """
        Args:
            dir_df (pd.DataFrame): the dir in dataframe

        Returns:
            Tuple[int, np.float64, np.float64, int, list, list, list, np.ndarray, np.ndarray]
        """

        if self._serializer_instance.get_serializer_plugin_type() is not SerializerPluginType.IMAGE:
            return self._data.get_data().to_numpy(), None
        images, image_shapes = [], []
        count = 0
        for dir in dir_df["image_directory"]:  # work directly with the raw image by reading from the directory itself
            image_array = np.array(Image.open(dir), dtype=float)
            image_shapes.append(image_array.shape)
            image_array = image_array.reshape(image_array.size)
            count += 1
            images.append(np.float64(image_array))
        return images, image_shapes

    def _transform_to_df(self, data_np: np.ndarray, img_shape, subfolder_name: str):
        """
        Args:
            data_np (np.ndarray):
            img_shape ():
            subfolder_name (str): the name of the subfolder

        Returns:
            Tuple[int, np.float64, np.float64, int, list, list, list, np.ndarray, np.ndarray]
        """

        if self._serializer_instance.get_serializer_plugin_type() is not SerializerPluginType.IMAGE:
            return data_np
        pred_dirs = []
        tmp_path = self._tmp_path
        Path(str(tmp_path / subfolder_name)).mkdir(parents=True, exist_ok=True)
        for index, img_array in enumerate(data_np):
            img_reshaped = img_array.reshape(img_shape[index])
            Image.fromarray(np.uint8(img_reshaped)).save(str(tmp_path / subfolder_name / (str(index) + ".png")))
        for i in sorted(
            Path.iterdir(Path(str(tmp_path / subfolder_name))),
            key=lambda i: int(i.stem),
        ):
            pred_dirs.append(str(i))
        pred_dirs_df = pd.DataFrame(pred_dirs, columns=["image_directory"])
        return pred_dirs_df

    def _get_initial_adversarial_samples(
        self,
        data_in_numpy: np.ndarray,
        ground_truth_in_numpy: np.ndarray,
        image_shapes: np.ndarray,
        init_size: int = 200,
    ) -> Tuple[List, List]:
        """
        This method generates initial adversarial samples for the given data using Salt and Pepper algorithm.

        Args:
            data_in_numpy (np.ndarray): data used to generate adversarial examples without ground truth
            ground_truth_in_numpy (np.ndarray): ground truth to test with adv_pred
            image_shapes (np.ndarray): shapes of the images
            init_size (int): the maximum number of time to try to generate the init_adv_sample

        Returns:
            Tuple[List, List]: Returns the initial_adversarial_samples and initial_adversarial_predictions
        """
        initial_adversarial_predictions = [None] * len(data_in_numpy)
        initial_adversarial_samples = [None] * len(data_in_numpy)

        for count, original in enumerate(data_in_numpy):
            adversarial_prediction = None
            perturbed_input = None
            ground_truth = ground_truth_in_numpy[count][0]

            for _ in range(init_size):
                if adversarial_prediction is not None and adversarial_prediction[0] != ground_truth:
                    initial_adversarial_samples[count] = perturbed_input
                    initial_adversarial_predictions[count] = adversarial_prediction[0]
                    break
                elif self._model_type == ModelType.REGRESSION and adversarial_prediction is not None:
                    diff = ground_truth - adversarial_prediction[0]
                    frac = diff / ground_truth

                    if adversarial_prediction[0] > ground_truth:
                        diff = adversarial_prediction[0] - ground_truth
                        frac = diff / adversarial_prediction[0]

                    if frac > 0.5:
                        initial_adversarial_samples[count] = perturbed_input
                        initial_adversarial_predictions[count] = adversarial_prediction[0]
                        break

                perturbed_input = self._salt_and_pepper(original, 2)
                # if model is XGBoost, cast perturbed_input into a 2D np array to pass into XGBoost's predict
                # this is required to fit into the model's expected fields
                if self._check_for_xgb_model_type():
                    if self._model_instance._model_algorithm == "xgboost.core.Booster":
                        my_array = np.array([perturbed_input])
                        transformed_pertubed_input = pd.DataFrame(my_array, columns=self._data_labels)
                    else:
                        transformed_pertubed_input = np.array([perturbed_input])
                    transformed_pertubed_input_df = self._transform_to_df(
                        transformed_pertubed_input,
                        image_shapes,
                        subfolder_name="adv_pred",
                    )
                    adversarial_prediction = self._model.predict(
                        transformed_pertubed_input_df,
                        self._data_labels_items,
                    )

                else:
                    processed_pertubed_input_df = self._transform_to_df(
                        [perturbed_input],
                        image_shapes,
                        subfolder_name="adv_pred",
                    )
                    adversarial_prediction = self._model.predict(
                        processed_pertubed_input_df,
                        self._data_labels_items,
                    )

            # Update the progress
            self._progress_inst.update(1)
        return initial_adversarial_samples, initial_adversarial_predictions

    def _get_final_adversarial_samples(
        self,
        data_in_numpy: np.ndarray,
        ground_truth_in_numpy: np.ndarray,
        initial_adversarial_samples: List,
        min_feature_value: float,
        max_feature_value: float,
        predictions,
        image_shapes: np.ndarray,
    ) -> Tuple[int, np.float64, np.float64, int, list, list, list, np.ndarray, np.ndarray]:
        """
        This method generates final adversarial samples for the given data.

        Args:
            data_in_numpy (np.ndarray): data used to generate adversarial examples without ground truth
            ground_truth_in_numpy (np.ndarray): the ground truth data in numpy array
            initial_adversarial_samples (List): the adversarial samples in a list
            min_feature_value (float): the min feature value in float
            max_feature_value (float): the max feature value in float
            predictions (np.ndarray): the predictions in numpy array
            image_shapes (np.ndarray): the images shapes in numpy array

        Returns:
            Tuple[int, np.float64, np.float64, int, list, list, list, np.ndarray, np.ndarray]
        """
        delta_ratio_min_threshold = 0.2
        delta_ratio_max_threshold = 0.5
        delta_ratio_zero_threshold = 0.0
        epsilon_ratio_min_threshold = 0.2
        epsilon_ratio_max_threshold = 0.5
        epsilon_ratio_zero_threshold = 0.0

        try:
            final_adversarial_samples = [None] * len(data_in_numpy)
            for count, original in enumerate(data_in_numpy):
                current_delta = 0.01
                current_epsilon = 0.01

                x_adversarial = initial_adversarial_samples[count]
                if type(x_adversarial) is not np.ndarray:
                    # Cannot find initial adversarial samples
                    pass

                else:
                    for iteration in range(self._max_iteration):
                        x_adversarial_array = np.array([])

                        for count_test in range(self._max_test):
                            adversarial_list = list()

                            for count_sample in range(self._max_sample):
                                # Create max_sample number of adversarial sample using orthogonal steps
                                # [supposed to get closer to the boundary line]
                                adversarial_value = x_adversarial + self._orthogonal_step(
                                    current_delta, x_adversarial, original
                                )
                                adversarial_value = np.clip(
                                    adversarial_value,
                                    min_feature_value,
                                    max_feature_value,
                                )
                                adversarial_list.append(adversarial_value)

                            adversarial_list_to_predict = self._transform_to_df(
                                np.array(adversarial_list),
                                image_shapes,
                                subfolder_name="adv_pred" + str(iteration) + str(count_test),
                            )

                            if self._check_for_xgb_model_type():
                                if self._model_instance._model_algorithm == "xgboost.core.Booster":
                                    adversarial_list_to_predict = pd.DataFrame(
                                        adversarial_list, columns=self._data_labels
                                    )

                            # Check predictions for adversarial
                            potential_adversarials_prediction = self._model.predict(
                                adversarial_list_to_predict, self._data_labels_items
                            )
                            satisfied = potential_adversarials_prediction != ground_truth_in_numpy
                            delta_ratio = np.mean(satisfied)
                            if delta_ratio < delta_ratio_min_threshold:
                                current_delta *= self._adapt_value
                            elif delta_ratio > delta_ratio_max_threshold:
                                current_delta /= self._adapt_value

                            if delta_ratio > delta_ratio_zero_threshold:
                                x_adversarial_array = np.array(adversarial_list)
                                break
                        for count_test in range(self._max_test):
                            perturb = (
                                np.repeat(
                                    np.array([original]),
                                    len(x_adversarial_array),
                                    axis=0,
                                )
                                - x_adversarial_array
                            )
                            perturb *= current_epsilon
                            potential_adversarials = x_adversarial_array + perturb
                            potential_adversarials = np.clip(
                                potential_adversarials,
                                min_feature_value,
                                max_feature_value,
                            )

                            if self._check_for_xgb_model_type():
                                if self._model_instance._model_algorithm == "xgboost.core.Booster":
                                    df = pd.DataFrame(
                                        potential_adversarials,
                                        columns=self._data_labels,
                                    )
                                    potential_adversarials_prediction = self._model.predict(df, self._data_labels_items)
                            else:
                                potential_adv_pred_transformed = self._transform_to_df(
                                    np.array(potential_adversarials),
                                    image_shapes,
                                    subfolder_name="potential_adv_pred" + str(iteration) + str(count_test),
                                )
                                potential_adversarials_prediction = self._model.predict(
                                    potential_adv_pred_transformed,
                                    self._data_labels_items,
                                )
                            satisfied = potential_adversarials_prediction != ground_truth_in_numpy
                            epsilon_ratio = np.mean(satisfied)
                            if epsilon_ratio < epsilon_ratio_min_threshold:
                                current_epsilon *= self._adapt_value
                            elif epsilon_ratio > epsilon_ratio_max_threshold:
                                current_epsilon /= self._adapt_value

                            if epsilon_ratio > epsilon_ratio_zero_threshold:
                                x_adversarial = self._best_adversarial(original, x_adversarial_array)
                                final_adversarial_samples[count] = x_adversarial
                                break

                    final_adversarial_samples[count] = x_adversarial
                # Update the progress
                self._progress_inst.update(1)
        except Exception:
            import traceback

            traceback.print_exc()

        # Store sample datapoints for reporting later
        adv_samples = []
        org_samples = []
        samples_to_show = 1

        # Clean up for those that are None, replace with original input
        number_of_samples_cannot_generate_adversarial = 0
        for count, sample in enumerate(final_adversarial_samples):
            if not isinstance(sample, np.ndarray):
                final_adversarial_samples[count] = data_in_numpy[count]
                number_of_samples_cannot_generate_adversarial += 1
            elif len(adv_samples) != samples_to_show:
                # to link up the samples with the actual values
                adv_samples.append(sample)
                org_samples.append(data_in_numpy[count])

        feature_names = []
        if self._serializer_instance.get_serializer_plugin_type() is not SerializerPluginType.IMAGE:
            feature_names = self._data_labels

        # Save in the temporary folder
        adv_samples_df = self._transform_to_df(adv_samples, image_shapes, subfolder_name="adv_samples")

        org_samples_df = self._transform_to_df(org_samples, image_shapes, subfolder_name="org_samples")

        if self._serializer_instance.get_serializer_plugin_type() is SerializerPluginType.IMAGE:
            adv_samples = adv_samples_df["image_directory"].values.tolist()
            org_samples = org_samples_df["image_directory"].values.tolist()

            shutil.move(self._tmp_path / "adv_samples", self._save_path / "adv_samples")
            shutil.move(self._tmp_path / "org_samples", self._save_path / "org_samples")

        if self._check_for_xgb_model_type():
            if self._model_instance._model_algorithm == "xgboost.core.Booster":
                final_adversarial_samples_to_predict = pd.DataFrame(
                    final_adversarial_samples, columns=self._data_labels
                )
            else:
                final_adversarial_samples_to_predict = np.array(final_adversarial_samples)
        else:
            # Calculate the adversarial predictions and accuracy
            final_adversarial_samples_to_predict = self._transform_to_df(
                final_adversarial_samples, image_shapes, subfolder_name="adv_prediction"
            )

        adversarial_prediction = self._model.predict(final_adversarial_samples_to_predict, self._data_labels_items)

        # get the sample predictions to use for the sample section later
        sample_adv_predictions = adversarial_prediction[:samples_to_show]
        sample_org_predictions = ground_truth_in_numpy[:samples_to_show]

        adversarial_accuracy = None
        org_accuracy = None

        adversarial_prediction_rint = np.rint(adversarial_prediction)
        if self._model_type == ModelType.CLASSIFICATION:
            adversarial_accuracy = accuracy_score(ground_truth_in_numpy, adversarial_prediction_rint)
            predictions_rint = np.rint(predictions)
            org_accuracy = accuracy_score(ground_truth_in_numpy, predictions_rint)

        elif self._model_type == ModelType.REGRESSION:
            adversarial_accuracy = mean_absolute_error(ground_truth_in_numpy, adversarial_prediction)

            org_accuracy = mean_absolute_error(ground_truth_in_numpy, predictions)

        if not adversarial_accuracy or not org_accuracy:
            self.add_to_log(
                logging.ERROR,
                f"Failed to calculate performance metrics for {self._model_type}",
            )
            raise RuntimeError("Failed to calculate performance metrics.")

        return (
            len(final_adversarial_samples),
            org_accuracy,
            adversarial_accuracy,
            number_of_samples_cannot_generate_adversarial,
            adv_samples,
            org_samples,
            feature_names,
            sample_adv_predictions,
            sample_org_predictions,
        )

    def _salt_and_pepper(self, image: np.ndarray, severity: int = 1) -> np.ndarray:
        """
        Adding salt and pepper noise to images
        Adapted from skimage's implementation:
        https://github.com/scikit-image/scikit-image/blob/v0.20.0/skimage/util/noise.py#L39-L234 (License: BSD-3-Clause)

        Args:
            image (np.ndarray) : original image to be corrupted
            severity (int) : Level of severity of noise added, range(1,5)

        Returns:
            np.ndarray: Image with salt and pepper noise corruption
        """
        severity_constant = [0.03, 0.06, 0.09, 0.17, 0.27][severity - 1]

        if image.min() < 0:
            low_clip = -1.0
        else:
            low_clip = 0.0

        out = copy.deepcopy(image)
        amount = severity_constant
        ratio = 0.5
        flipped = np.random.choice([True, False], size=image.shape, p=[amount, 1 - amount])
        salted = np.random.choice([True, False], size=image.shape, p=[ratio, 1 - ratio])
        peppered = ~salted
        out[flipped & salted] = 1
        out[flipped & peppered] = low_clip
        return out.astype(np.float32)

    def _best_adversarial(self, original_sample: np.ndarray, potential_advs: np.ndarray) -> np.ndarray:
        """
        From the potential adversarial examples, find the one that has the minimum L2 distance from the original sample

        Reference:
        https://github.com/Trusted-AI/adversarial-robustness-toolbox/blob/main/art/attacks/evasion/boundary.py::_best_adv

        Args:
            original_sample (np.ndarray): The original input.
            potential_advs (np.ndarray): Array containing the potential adversarial examples

        Returns:
            np.ndarray: The adversarial example that has the minimum L2 distance from the original input
        """
        shape = potential_advs.shape
        min_idx = np.linalg.norm(original_sample.flatten() - potential_advs.reshape(shape[0], -1), axis=1).argmin()
        return potential_advs[min_idx]

    def _orthogonal_step(self, delta: float, current: np.ndarray, original: np.ndarray) -> np.ndarray:
        """
        This method takes orthogonal step to close up the distance between current and original input.
        Find the least perturbation to cause the change in prediction.

        Args:
            delta (float): the step size for this orthogonal step
            current (np.ndarray): the current adversarial sample used to compute
            original (np.ndarray): the original input

        Returns:
            ndarray: the possible perturbed input

        Reference:
        https://github.com/Trusted-AI/adversarial-robustness-toolbox/blob/main/art/attacks/evasion/boundary.py::_orthogonal_perturb
        https://github.com/bethgelab/foolbox/blob/12abe74e2f1ec79edb759454458ad8dd9ce84939/foolbox/attacks/boundary_attack.py#L107
        """
        # Generate a perturbation randomly
        random_perturb = np.random.randn(original.shape[0])

        random_perturb /= np.linalg.norm(random_perturb)

        # if the current distance is same as the original intput
        # we need to stop perturbation -> this happens for tabular dataset
        current_delta = original - current
        if current_delta.all() != 0:
            random_perturb *= delta * np.linalg.norm(original - current)

            # Spherical/compute the difference between the original and current adversarial sample
            direction = original - current

            flatten_direction = direction.flatten()
            flatten_perturb = random_perturb.flatten()

            flatten_direction /= np.linalg.norm(flatten_direction)
            flatten_perturb -= np.dot(flatten_perturb, flatten_direction.T) * flatten_direction
            perturb = flatten_perturb.reshape(original.shape[0])

            # Compute the perturbation for this orthogonal move
            hypotenuse = np.sqrt(1 + delta**2)
            perturb = ((1 - hypotenuse) * (current - original) + perturb) / hypotenuse

        else:
            perturb = current

        return perturb

    def _format_result(
        self,
        adversarial_samples: int,
        org_accuracy: float,
        adversarial_accuracy: float,
        failed_samples: int,
        adv_samples: list,
        org_samples: list,
        feature_names: list,
        adv_predictions: list,
        org_predictions: list,
    ) -> Dict:
        """
        A helper method to format the results to match output schema
        """
        output_dict = dict({"results": dict()})

        # Store the results
        results_dict = {
            "num_of_perturbed_samples": adversarial_samples,
            "org_performance": org_accuracy,
            "perturbed_performance": adversarial_accuracy,
            "num_of_failed_perturbed_samples": failed_samples,
            "perturbed_samples": adv_samples,
            "org_samples": org_samples,
            "feature_names": feature_names,
            "perturbed_pred": adv_predictions,
            "original_pred": org_predictions,
        }

        output_dict["results"].update(results_dict)
        return output_dict

    def _check_for_xgb_model_type(self) -> bool:
        """
        A helper function to check if model used is XGBoost as XGBoost's predict function
        takes in a different data type
        """
        if (
            self._model_instance.get_plugin_type() is PluginType.MODEL
            and self._model_instance.get_model_plugin_type() is ModelPluginType.XGBOOST
        ):
            return True
        return False
