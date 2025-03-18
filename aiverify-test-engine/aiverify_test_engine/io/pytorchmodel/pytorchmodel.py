from __future__ import annotations

from typing import Any, Tuple

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


# NOTE: Do not change the class name, else the plugin cannot be read by the system
class Plugin(IModel):
    """
    The Plugin(pytorchmodel) class specifies methods on
    handling methods in performing identifying, validating, predicting, scoring.
    """

    # Some information on plugin
    _model: Any = None
    _model_algorithm: str = ""
    _name: str = "pytorchmodel"
    _description: str = "pytorchmodel supports detecting pytorch models"
    _version: str = "0.9.0"
    _metadata: PluginMetadata = PluginMetadata(_name, _description, _version)
    _plugin_type: PluginType = PluginType.MODEL
    _model_plugin_type: ModelPluginType = ModelPluginType.PYTORCH
    _batch_size: int = 1
    _num_workers: int = 0

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
            # Set the model to evaluation mode
            self._model.eval()

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
        A method to perform prediction using the model (classification).

        Args:
            data (Union[pd.DataFrame, list, np.ndarray, torch.Tensor]): Data to be predicted by the model.

        Returns:
            np.ndarray: Predicted results.
        """
        try:
            predictions = []

            # Create DataLoader from input data
            dataloader = self._create_dataloader(data)
            with torch.no_grad():
                for batch in dataloader:
                    # TensorDataset returns a tuple, get the first element
                    batch_input = batch[0]
                    batch_pred = self._model(batch_input)
                    # Apply argmax to get class labels
                    batch_classes = torch.argmax(
                        batch_pred, dim=1
                    )  # dim=1 assumes class logits are along dimension 1
                    predictions.append(batch_classes)
                    # predictions.append(batch_pred)

            # Concatenate all predictions and return as NumPy array
            return torch.cat(predictions, dim=0).numpy()

        except Exception as e:
            print(f"Error during prediction: {e}")
            raise e

    def predict_proba(self, data: Any, *args) -> Any:
        """
        A method to perform prediction probabilities using the model.

        Args:
            data (Any): Data to be predicted by the model.

        Returns:
            Any: Predicted result probabilities.
        """
        try:
            # Create a DataLoader using the provided data
            dataloader = self._create_dataloader(data)

            probabilities = []  # Store predicted probabilities
            with torch.no_grad():
                for batch in dataloader:
                    # Extract input data from the DataLoader batch
                    batch_input = batch[0]  # TensorDataset returns a tuple
                    logits = self._model(batch_input)
                    probas = F.softmax(logits, dim=1)
                    probabilities.append(probas)

            # Concatenate all probabilities into a single NumPy array
            return torch.cat(probabilities, dim=0).numpy()

        except Exception as e:
            raise ValueError(f"Error during prediction probability computation: {e}")

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

    def _convert_to_tensor(self, data: Any) -> torch.Tensor:
        """
        Convert input data to PyTorch tensor.

        Args:
            data: Input data in various formats

        Returns:
            torch.Tensor: Converted data tensor
        """
        try:
            if isinstance(data, torch.Tensor):
                tensor = data.float()
            elif isinstance(data, np.ndarray):
                tensor = torch.from_numpy(data.astype(np.float32))
            elif isinstance(data, list):
                arr = np.array(data, dtype=np.float32)
                # Convert the NumPy array to a PyTorch tensor
                tensor = torch.tensor(arr, dtype=torch.float32).squeeze(0)
            elif isinstance(data, pd.DataFrame):
                arr = data.values.astype(np.float32)
                tensor = torch.from_numpy(arr)
            else:
                raise ValueError(f"Unsupported data type: {type(data)}")

            # Ensure 2D tensor
            if tensor.ndim == 1:
                tensor = tensor.reshape(-1, 1)
            elif tensor.ndim > 2:
                tensor = tensor.reshape(tensor.shape[0], -1)

            return tensor

        except Exception as e:
            raise ValueError(f"Failed to convert input to tensor: {str(e)}")

    def _create_dataloader(self, data: Any) -> DataLoader:
        """
        Create a DataLoader using TensorDataset.

        Args:
            data: Input data in supported format

        Returns:
            DataLoader: PyTorch DataLoader
        """
        try:
            # Convert to tensor
            tensor_data = self._convert_to_tensor(data)

            # Create TensorDataset
            dataset = TensorDataset(tensor_data)

            # Create DataLoader
            return DataLoader(
                dataset,
                batch_size=self._batch_size,
                shuffle=False,
                num_workers=self._num_workers,
                pin_memory=False,
                drop_last=False,
            )
        except Exception as e:
            raise ValueError(f"Failed to create DataLoader: {str(e)}")

    def _identify_model_algorithm(self, model: Any) -> Tuple[bool, str]:
        """
        A helper method to identify the model algorithm whether it is being supported

        Args:
            model (Any): the model to be checked against the supported model list

        Returns:
            Tuple[bool, str]: true if model is supported, str will store the support
            algo name
        """
        is_success = isinstance(model, torch.nn.Module)
        model_algorithm = f"{type(model).__module__}.{type(model).__name__}"

        return is_success, model_algorithm
