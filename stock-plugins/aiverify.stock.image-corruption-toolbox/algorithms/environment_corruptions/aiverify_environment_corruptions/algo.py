import copy
import logging
import shutil
from pathlib import Path
from typing import Any, Callable, Dict, Optional, Tuple

import numpy as np
import pandas as pd
from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.iserializer import ISerializer
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
from aiverify_test_engine.utils.json_utils import load_schema_file, validate_json
from aiverify_test_engine.utils.simple_progress import SimpleProgress
from PIL import Image
from sklearn.metrics import accuracy_score

from aiverify_environment_corruptions.utils import environment


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
    The Plugin(Environment Corruptions) class specifies methods in generating results for algorithm
    """

    # Some information on plugin
    _name = "Environment Corruptions"
    _description = "Robustness plugin with environment corruptions"
    _version = "0.9.0"
    _metadata = PluginMetadata(_name, _description, _version)
    _plugin_type = PluginType.ALGORITHM
    _supported_algorithm_model_type = [ModelType.CLASSIFICATION]

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
        ground_truth_instance_and_serializer: Tuple[Optional[IData], Optional[ISerializer]],
        initial_data_instance: Any,  # This is not used in this plugin, but is required to match the algo_execute signature
        initial_model_instance: Any,  # This is not used in this plugin, but is required to match the algo_execute signature
        model_type: ModelType,
        logger: logging.Logger,
        progress_callback: Callable,
        ground_truth: str,
        file_name_label: str,
        requires_ground_truth: bool = True,
        set_seed: Optional[int] = None,
        **user_defined_params: Dict[str, Any],
    ):
        if not requires_ground_truth:
            raise NotImplementedError("This plugin does not support tasks without ground truth yet.")

        # Store the input arguments as private vars
        self._data_instance, _ = data_instance_and_serializer
        self._model_instance, _ = model_instance_and_serializer
        self._ground_truth_instance, _ = ground_truth_instance_and_serializer
        self._model_type = model_type
        self._requires_ground_truth = requires_ground_truth
        self._user_defined_params = user_defined_params
        self._logger = logger
        self._progress_inst = SimpleProgress(1, 0, progress_callback)
        self._ground_truth_label = ground_truth

        # Store the input parameters defined in the input schema
        self._file_name_label = self.file_name_label = file_name_label
        self._set_seed = self.set_seed = set_seed

        corruptions = self._user_defined_params.get("corruptions", [])
        corruptions = [name.lower() for name in corruptions]  # Normalize
        if not corruptions or "all" in corruptions:
            # If no corruptions are provided, or if "all" is provided, use all corruptions
            corruptions = list(environment.CORRUPTION_FN)
        else:
            # Filter corruption functions based on user input, make sure algorithm names are in correct format & order
            corruptions = [name for name in environment.CORRUPTION_FN if name.lower() in corruptions]  # fmt: skip
        self._corruptions = self.corruptions = self._user_defined_params["corruptions"] = corruptions

        # Perform setup for this plug-in
        self.setup()

        # Write all output to the output folder
        self._output_folder = Path.cwd() / "output"
        self._output_folder.mkdir(parents=True, exist_ok=True)
        self._save_folder = self._output_folder / "images"

        # Algorithm input schema defined in input.schema.json
        # By defining the input schema, it allows the front-end to know what algorithm input params is
        # required by this plugin. This allows this algorithm plug-in to receive the arguments values it requires.
        self._input_schema = load_schema_file(str(Path(__file__).parent / "input.schema.json"))

        # Algorithm output schema defined in output.schema.json
        # By defining the output schema, this plug-in validates the result with the output schema.
        # This allows the result to be validated against the schema before passing it to the front-end for display.
        self._output_schema = load_schema_file(str(Path(__file__).parent / "output.schema.json"))

        # Retrieve the input parameters defined in the input schema and store them
        self._input_arguments = dict()
        variables = {**vars(self), **self._user_defined_params}
        for key in self._input_schema.get("properties", ()):
            self._input_arguments.update({key: variables.get(key)})

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
            if not isinstance(self._ground_truth_label, str):
                self.add_to_log(
                    logging.ERROR,
                    "The algorithm has failed ground truth header validation. \
                    Header must be in String and must be present in the dataset: {self._ground_truth_label}",
                )
                raise RuntimeError(
                    "The algorithm has failed ground truth header validation. \
                    Header must be in String and must be present in the dataset"
                )

        # Perform validation on progress_inst
        if self._progress_inst:
            if not isinstance(self._progress_inst, SimpleProgress):
                raise RuntimeError("The algorithm has failed validation for the progress bar")

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
        # Sort ground truth based on file name
        file_names = [Path(i).name for i in self._data_instance.get_data()["image_directory"]]
        df: pd.DataFrame = self._ground_truth_instance.get_data()
        self._ordered_ground_truth_df = df.set_index(self._input_arguments["file_name_label"]).reindex(file_names)

        # Initialise main image directory
        if self._save_folder.exists():
            shutil.rmtree(self._save_folder)
        self._save_folder.mkdir(parents=True, exist_ok=True)

        # Apply user defined parameters to default parameters
        corruption_fn = {name: environment.CORRUPTION_FN[name] for name in self._input_arguments["corruptions"]}
        user_params = {k: v for k, v in self._input_arguments.items() if k in environment.DEFAULT_PARAMS and v}
        parameters = copy.deepcopy(environment.DEFAULT_PARAMS)
        parameters.update(user_params)

        self._assess_robustness(corruption_fn, parameters)

        # Update progress (For 100% completion)
        self._progress_inst.update(1)

    def _assess_robustness(self, corruption_fn: dict[str, Callable], parameters: dict[str, list]) -> None:
        """
        A method to get the accuracy results at different severity levels and formatted in the desired output schema

        Parameters:
            corruption_fn (dict): Mapping of corruption name to its corresponding function object
            parameters (dict): Dict of parameter values at different severity levels
        """
        image_paths: list[str] = self._data_instance.get_data()["image_directory"].tolist()
        ground_truths = self._ordered_ground_truth_df[self._ground_truth_label].tolist()
        images = self._load_images(image_paths)
        combined_results = []
        output_results = dict()

        np.random.seed(self._set_seed)
        display_idx = np.random.choice(len(image_paths))

        self._progress_inst.add_total(len(corruption_fn))

        for corruption in corruption_fn:
            individual_results = dict()
            severity_params = dict()
            accuracies = dict()
            display_info = dict()

            individual_results.update({"corruption_group": "Environment"})
            individual_results.update({"corruption_function": str(corruption)})

            # Assuming parameter key is in format <fn_name>_<kw_name>, e.g. "glass_blur_max_delta"
            fn_name = f"{corruption.lower()}_"
            # Perform: (1) Filter relevant parameters (2) Strip function name from key (3) Prepend a dummy value
            fn_params = {k.removeprefix(fn_name): [None] + v for k, v in parameters.items() if k.startswith(fn_name)}
            # Reshape a dict of values into a list of kwargs
            try:
                fn_kwargs = [dict(zip(fn_params, values)) for values in zip(*fn_params.values(), strict=True)]
            except ValueError:
                raise ValueError(f"Number of values must be the same for all parameters! Got: {fn_params}")

            for severity, _fn_kwargs in enumerate(fn_kwargs):
                _corruption_fn = corruption_fn[corruption] if severity > 0 else None
                severity_params.update({"severity" + str(severity): _fn_kwargs})

                corrupted_images = self._get_corrupted_images(images, _corruption_fn, _fn_kwargs)
                corrupted_dir = Path(corruption) / f"severity{severity}"
                corrupted_image_paths = self._save_images(corrupted_images, str(corrupted_dir))
                predictions = self._model_instance.predict(corrupted_image_paths)

                accuracy = accuracy_score(ground_truths, predictions)
                accuracies.update({f"severity{severity}": accuracy})

                random_display = [
                    str(Path(corrupted_image_paths[display_idx]).relative_to(self._output_folder)),
                    ground_truths[display_idx],
                    predictions[display_idx],
                ]
                display_info.update({"severity" + str(severity): random_display})

            individual_results.update(
                {"parameter": severity_params, "accuracy": accuracies, "display_info": display_info}
            )
            combined_results.append(individual_results)

            self._progress_inst.update(1)

        output_results.update({"results": combined_results})

        # Assign output results
        self._results = output_results

    def _load_images(self, image_paths: list[str]) -> list[np.ndarray]:
        """
        Load a list of numpy images from file paths.

        Args:
            image_paths (list[str]): A list of image file paths

        Returns:
            np.ndarray: A list of numpy images
        """
        return [np.array(Image.open(i)) / 255.0 for i in image_paths]

    def _get_corrupted_images(
        self, images: list[np.ndarray], corruption_fn: Optional[Callable], fn_kwargs: dict
    ) -> list[np.ndarray]:
        """
        Apply the corruption function to a list of images.

        Args:
            images (list[np.ndarray]): A list of numpy images
            corruption_fn (Optional[Callable]): The corruption function to apply
            fn_kwargs (dict): The keyword arguments to pass to the corruption function

        Returns:
            list[np.ndarray]: A list of corrupted images
        """
        corrupted_images = []
        for image in images:
            if corruption_fn:
                corrupted_image = corruption_fn(image, **fn_kwargs)
                corrupted_images.append(corrupted_image)
            else:
                corrupted_images.append(image)
        return corrupted_images

    def _save_images(self, images: list[np.ndarray], subfolder_name: str) -> list[str]:
        """
        Save a list of numpy arrays as images in a subfolder.

        Args:
            images (list[np.ndarray]): A list of numpy images
            subfolder_name (str): The name of the subfolder to save images

        Returns:
            list[str]: A list of saved image paths
        """
        image_paths = []
        save_dir = self._save_folder / subfolder_name
        save_dir.mkdir(parents=True, exist_ok=True)

        for idx, image in enumerate(images):
            image_path = save_dir / f"{idx}.png"
            Image.fromarray((image * 255.0).astype(np.uint8)).save(image_path)
            image_paths.append(str(image_path))
        return image_paths
