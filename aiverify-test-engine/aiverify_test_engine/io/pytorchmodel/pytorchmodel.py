from __future__ import annotations

from typing import Any, List, Tuple

from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata
import numpy as np
import torch
import torch.nn.functional as F


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IModel):
    """
    The Plugin(pytorchmodel) class specifies methods on
    handling methods in performing identifying, validating, predicting, scoring.
    """

    # Some information on plugin
    _model: Any = None
    _model_algorithm: str = ""
    _supported_algorithms: List = ["torch.nn.Sequential", "torch.nn.modules.container.Sequential"]
    _name: str = "pytorchmodel"
    _description: str = "pytorchmodel supports detecting pytorch models"
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.MODEL
    _model_plugin_type: ModelPluginType = ModelPluginType.PYTORCH

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

    @staticmethod
    def get_model_plugin_type() -> ModelPluginType:
        """
        A method to return ModelPluginType

        Returns:
            ModelPluginType: Model Plugin Type
        """
        return Plugin._model_plugin_type

    def __init__(self, **kwargs) -> None:
        model = kwargs.get("model", None)
        if model:
            self._model = model

    def cleanup(self) -> None:
        """
        A method to clean-up objects
        """
        pass  # pragma: no cover

    def setup(self) -> Tuple[bool, str]:
        """
        A method to perform setup

        Returns:
            Tuple[bool, str]: Returns bool to indicate success, str will indicate the
            error message if failed.
        """
        print("performing setup...")
        is_success = True
        error_messages = ""
        return is_success, error_messages

    def get_model(self) -> Any:
        """
        A method to return the model

        Returns:
            Any: Model
        """
        if self._model:
            return self._model
        else:
            return None

    def get_model_algorithm(self) -> str:
        """
        A method to return the model algorithm.
        Either one of the supported algorithms or ""

        Returns:
            str: model algorithm name if supported or "" if not supported
        """
        return self._model_algorithm

    def is_supported(self) -> bool:
        """
        A method to check whether the model is being identified correctly
        and is supported

        Returns:
            bool: True if is an instance of model and is supported
        """
        is_algorithm_supported, model_algorithm = self._identify_model_algorithm(
            self._model
        )

        if is_algorithm_supported:
            self._model_algorithm = model_algorithm
        else:
            # Not supported
            pass

        return is_algorithm_supported

    def predict(self, data: Any, *args) -> Any:
        """
        A method to perform prediction using the model (classification)

        Args:
            data (Union[pd.DataFrame, list]): data to be predicted by the model

        Returns:
            Any: predicted result
        """

        try:

            if isinstance(data, list):
                # Convert the list to a NumPy array
                data_list = np.array(data, dtype=np.float32)
                print("converting np array to tensor")
                # Convert the NumPy array to a PyTorch tensor
                data_tensor = torch.tensor(data_list, dtype=torch.float32).squeeze(0)

            else:
                raise ValueError("Unsupported data format. Provide a list or pandas DataFrame.")

            self._model.eval()
            torch.set_num_threads(1)
            
            # predictions are made without gradient tracking
            with torch.no_grad():
                if len(data_tensor.shape) == 1:
                    # Single item prediction (no batch dimension)
                    input_tensor = data_tensor.unsqueeze(0)
                    prediction = self._model(input_tensor).squeeze().numpy()
                    print("Predicted probabilities:", predictions)
                    return prediction
                else:
                    # Batch prediction
                    predictions = self._model(data_tensor).numpy()
                    print("Predicted probabilities  :", predictions)
                    return predictions

        except Exception as e:
            print(f"Error during prediction: {e}")
            raise e
        
    def predict_proba(self, data: Any, *args) -> Any:
        """
        A method to perform prediction probability using the model.

        Args:
            data (Any): data to be predicted by the model

        Returns:
            Any: predicted result probabilities
        """
        try:
            # Set the model to evaluation mode
            self._model.eval()
            torch.set_num_threads(1)
            
            with torch.no_grad():
                # Check if data is a list
                if isinstance(data, list):
                        # Convert the list to a NumPy array
                        data_list = np.array(data, dtype=np.float32)
                        # Convert the NumPy array to a PyTorch tensor
                        data_tensor = torch.tensor(data_list, dtype=torch.float32).squeeze(0)
                        probabilities = []
                        for item in data_tensor:
                            input_tensor = torch.tensor(item).unsqueeze(0)
                            logits = self._model(input_tensor)
                            probas = F.softmax(logits, dim=1).squeeze().numpy()
                            probabilities.append(probas)
                        return probabilities
                else:
                    # For single item prediction
                    input_tensor = torch.tensor(data).unsqueeze(0)
                    logits = self._model(input_tensor)
                    return F.softmax(logits, dim=1).squeeze().numpy()

        except Exception as e:
            raise e

    def score(self, data: Any, y_true: Any) -> Any:
        """
        A method to perform scoring using the model

        Args:
            data (Any): data to be scored with y_true
            y_true (Any): ground truth

        Returns:
            Any: score result
        """
        raise NotImplementedError

    def _identify_model_algorithm(self, model: Any) -> Tuple[bool, str]:
        """
        A helper method to identify the model algorithm whether it is being supported

        Args:
            model (Any): the model to be checked against the supported model list

        Returns:
            Tuple[bool, str]: true if model is supported, str will store the support
            algo name
        """
        model_algorithm = ""
        is_success = False

        module_type_name = f"{type(model).__module__}.{type(model).__name__}"
        
        for supported_algo in self._supported_algorithms:
            if supported_algo == module_type_name:
                model_algorithm = supported_algo
                is_success = True

        return is_success, model_algorithm
    