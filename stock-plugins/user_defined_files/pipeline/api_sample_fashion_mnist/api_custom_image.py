import requests
from typing import Iterable
import numpy as np
import logging

from aiverify_test_engine.io.custompipeline.custompipeline import CustomInferencePipeline  # Adjust the import path if needed

# Set up logging
logger = logging.getLogger(__name__)

class MyCustomPipeline(CustomInferencePipeline):
    
    def __init__(self):
        super().__init__()
        self._api_url = "" #insert your URL here, eg. http://xxx:8000/predict
    
    def predict(self, img_paths: Iterable[str]) -> np.ndarray:
        """
        Sends image files to the API and returns predictions.

        Args:
            img_paths (Iterable[str]): Paths to image files.

        Returns:
            np.ndarray: Predicted class indices.
        """

        try:
            files = [("files", (img, open(img, "rb"), "image/jpeg")) for img in img_paths] #(fieldname, (filename, fileobj, content_type))
            response = requests.post(self._api_url, files=files)

            if response.status_code == 200:
                predictions = response.json().get("predictions", [])
                return np.array(predictions)
            else:
                logger.error(f"API error: {response.status_code}, {response.text}")
                return np.array([])
            
        except Exception as e:
            logger.exception(f"Exception during API request: {e}")
            return np.array([])
