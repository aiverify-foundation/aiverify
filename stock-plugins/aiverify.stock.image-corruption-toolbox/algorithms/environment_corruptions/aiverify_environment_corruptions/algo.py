import collections
import logging
import pickle
import shutil
from collections import OrderedDict
from pathlib import Path, PurePath
from typing import Dict, List, Tuple, Union

import numpy as np
import pandas as pd
from aiverify_environment_corruptions.utils import environment
from PIL import Image
from sklearn.metrics import accuracy_score
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
    The Plugin(Environment Corruptions) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name: str = "Environment Corruptions"
    _description: str = "Robustness plugin with environment corruptions"
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

        # Perform setup for this plug-in
        self.setup()

        # Other variables
        self._data = None
        self._results = {"results": [0]}
        self._ordered_ground_truth = None
        # write all output to the output folder
        output_folder = Path.cwd() / "output"
        output_folder.mkdir(parents=True, exist_ok=True)
        self._tmp_path = output_folder / "temp"
        self._save_path = output_folder / "widgets" / "environment_images"

        # Algorithm input schema defined in input.schema.json
        # By defining the input schema, it allows the front-end to know what algorithm input params is
        # required by this plugin. This allows this algorithm plug-in to receive the arguments values it requires.
        current_file_dir = Path(__file__).parent
        self._input_schema = load_schema_file(
            str(current_file_dir / "input.schema.json")
        )

        # Algorithm output schema defined in output.schema.json
        # By defining the output schema, this plug-in validates the result with the output schema.
        # This allows the result to be validated against the schema before passing it to the front-end for display.
        self._output_schema = load_schema_file(
            str(current_file_dir / "output.schema.json")
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

    def generate(self) -> None:
        """
        A method to generate the algorithm results with the provided data, model, ground truth information.
        """
        # Retrieve data information
        self._model = self._initial_model_instance
        self._data = self._initial_data_instance
        self._data_labels = list(self._initial_data_instance.read_labels().keys())
        annotated_ground_truth_path = self._input_arguments.get(
            "annotated_ground_truth_path", ""
        )
        annotated_ground_truth = pickle.load(
            open(annotated_ground_truth_path, "rb")
        ).set_index(self._input_arguments.get("file_name_label"))
        file_names = [Path(i).name for i in self._data.get_data()["image_directory"]]
        self._ordered_ground_truth = annotated_ground_truth.reindex(file_names)

        envt_corruptions = collections.OrderedDict(
            {
                "Fog": environment.fog,
                "Snow": environment.snow,
                "Rain": environment.add_rain,
            }
        )

        # initialise main image directory
        if Path(str(self._tmp_path)).exists():
            shutil.rmtree(str(self._tmp_path))
        Path(str(self._tmp_path)).mkdir(parents=True, exist_ok=True)

        if Path(str(self._save_path)).exists():
            shutil.rmtree(str(self._save_path))
        Path(str(self._save_path)).mkdir(parents=True, exist_ok=True)

        # assumption that there are a fixed 5 levels of severity for robustness investigation
        severities = [0, 1, 2, 3, 4, 5]

        self._assess_robustness(envt_corruptions, severities)

        # Update progress (For 100% completion)
        self._progress_inst.update(1)

    def _assess_robustness(self, corruption_group: OrderedDict, severities: list):
        """
        A method to get the accuracy results at different severity levels and formatted in the desired output schema

        Parameters:
            corruption_group (OrderedDict): OrderedDict of corruption functions in the corruption group
            severities (list): List of severities

        Returns:
            dict: formatted results
        """
        image_df, image_shapes = self._transform_to_numpy(self._data.get_data())
        ground_truth = self._ordered_ground_truth
        combined_results = []
        output_results = dict()

        seed = self._input_arguments.get("set_seed")
        np.random.seed(seed)
        random_index = np.random.choice(len(image_df))

        self._progress_inst.add_total(len(corruption_group))

        for corruption in corruption_group:
            individual_results = dict()
            accuracies = dict()
            display_info = dict()

            individual_results.update({"corruption_group": "Environment"})
            corruption_fn = corruption_group[corruption]
            individual_results.update({"corruption_function": str(corruption)})

            # updating model accuracies using corrupted test dataset
            for i in severities:
                fn_params = i
                if i != 0:
                    corrupted_df = self._build_corrupted_dataframe(
                        image_df, ground_truth, corruption_fn, fn_params, corruption
                    )
                else:
                    corrupted_df = self._build_corrupted_dataframe(
                        image_df, ground_truth, None, fn_params, corruption
                    )
                accuracy = self._get_accuracy(corrupted_df, ground_truth)
                accuracies.update({"severity" + str(i): accuracy})

                random_display = self._get_rand_display(
                    corrupted_df, ground_truth, corruption, i, random_index
                )
                display_info.update({"severity" + str(i): random_display})

            individual_results.update(
                {"accuracy": accuracies, "display_info": display_info}
            )
            combined_results.append(individual_results)

            self._progress_inst.update(1)

        output_results.update({"results": combined_results})

        # Assign output results
        self._results = output_results

    def _transform_to_numpy(self, dir_df: pd.DataFrame) -> tuple[pd.DataFrame, list]:
        """
        A method to transform images in directory to numpy

        Args:
            dir_df (dataframe): pandas Series containing column with array of directories of images

        Returns:
            tuple[pd.DataFrame, list]: Dataframe containing the array of all images and list of original image shapes
        """
        images, image_shapes = [], []
        for dir in dir_df[
            "image_directory"
        ]:  # work directly with the raw image by reading from the directory itself
            image_array = np.array(Image.open(dir)) / 255.0
            image_shapes.append(image_array.shape)
            images.append((image_array))
        image_df = pd.Series(list(images), name="images")
        return image_df, image_shapes

    def _get_accuracy(self, images: pd.Series, labels: pd.Series) -> np.float64:
        """
        A method to return the accuracy of the model with the corrupted set of inputs

        Args:
            images (dataframe): pandas Series containing column with array of all corrupted images
            labels (dataframe): pandas Series containing column with ground truths

        Returns:
            np.float64: accuracy score
        """
        predictions = self._model.predict(images)
        accuracy = accuracy_score(labels, predictions)

        return accuracy

    def _get_rand_display(
        self,
        images: pd.Series,
        labels: pd.Series,
        corruption: str,
        severity: np.int64,
        index: np.int64,
    ) -> np.ndarray:
        """
        A method to return random samples images for display

        Args:
            image_df (dataframe): pandas Series containing column with array of all corrupted images
            labels (dataframe): pandas Series containing column with ground truths
            corruption (str): name of the corurption function
            severtity (np.int64): level of severity of perturbation
            index (np.int64): randomly selected index for sampling

        Returns:
            np.float64: accuracy score
        """
        predictions = self._model.predict(images)
        labels = np.array(labels[self._ground_truth])

        random_pred = predictions[index]
        random_actual = labels[index]

        image_name = str(severity) + ".png"
        image_path = images["image_directory"].iloc[index]
        image_relative_path = str(Path(image_path).relative_to(Path().absolute()))

        Path(self._save_path / corruption).mkdir(parents=True, exist_ok=True)
        shutil.copy(
            image_path,
            self._save_path / corruption / image_name,
        )
        display_info = np.array([image_relative_path, random_actual, random_pred])
        return display_info

    def _build_corrupted_dataframe(
        self,
        data: pd.Series,
        labels: str,
        noise_fn: callable,
        severity: int,
        corruption: str,
    ) -> pd.DataFrame:
        """
        Build pandas dataframe of corrupted image (array)

        Args:
            data (Series): Pandas Series containing all the original images
            labels (str): Image column name from input schema
            noise_fn (callable): Corruption function to be used
            severity (int): Severity of corruption function
            corruption (str): Name of corruption function

        Returns:
            pd.DataFrame: Corrupted images in pandas DataFrame in col1 and ground truth labels
        """
        corrupted_list = []
        data_array = np.array(data)

        for index, img in enumerate(data_array):
            if noise_fn is not None:
                corrupted_image = noise_fn(img, severity)
                corrupted_list.append(corrupted_image)
            else:
                corrupted_list.append(img)
        images_df = self._transform_to_dir_df(
            corrupted_list, Path(corruption).joinpath("severity" + str(severity))
        )

        corrupted_df = pd.concat(
            [images_df, labels.reset_index(drop=True, inplace=True)], axis=1
        )
        return corrupted_df

    def _transform_to_dir_df(
        self, data_np: np.ndarray, subfolder_name: str
    ) -> pd.DataFrame:
        """
        A method to convert images in np.array form into saved images in directories for the model pipeline

        Args:
            data_np (np.ndarray): array containing all the iamges in np.ndarray format
            subfolder_name (str): name of the subfolder to save the images in

        Returns:
            pd.DataFrame: Image directories in pandas dataframe
        """
        pred_dirs = []
        tmp_path = self._tmp_path
        Path(str(tmp_path / subfolder_name)).mkdir(parents=True, exist_ok=True)
        for index, img_array in enumerate(data_np):
            Image.fromarray(np.uint8(img_array * 255.0)).save(
                str(tmp_path / subfolder_name / (str(index) + ".png"))
            )
        for i in sorted(
            Path.iterdir(Path(str(tmp_path / subfolder_name))),
            key=lambda i: int(i.stem),
        ):
            pred_dirs.append(str(i))
        pred_dirs_df = pd.DataFrame(pred_dirs, columns=["image_directory"])
        return pred_dirs_df
