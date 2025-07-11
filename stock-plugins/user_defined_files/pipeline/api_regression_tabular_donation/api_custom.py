import requests
from typing import List, Any, Union, Optional
import pandas as pd
import numpy as np
import logging

from aiverify_test_engine.io.custompipeline.custompipeline import CustomInferencePipeline  # Adjust the import path if needed

# Set up logging
logger = logging.getLogger(__name__)

class MyCustomPipeline(CustomInferencePipeline):
    
    def __init__(self):
        self._api_url = "" #insert your URL here, eg. http://xxx:8000/predict

    def predict(self, data: Union[pd.DataFrame, np.ndarray], labels: Optional[List[str]] = None) -> List[Any]:
        """
        Perform inference on a dataframe or array of data by sending them to the API.

        Args:
            data (Union[pd.DataFrame, np.ndarray]): DataFrame or Numpy array.

        Returns:
            List: Predictions from the API for each row of data.
        """
        
        if isinstance(data, np.ndarray):
            # for some tabular algos, mapping to labels is required as data might just be plain indexed
            data = pd.DataFrame(data, columns=labels) 

        predictions = []
        
        for _, row in data.iterrows():
            raw_payload = row.to_dict()
            
            if all(isinstance(k, tuple) and len(k) == 2 for k in raw_payload.keys()):
                payload = {k[0]: v for k, v in raw_payload.items()}
            else:
                payload = raw_payload

            try:
                response = requests.post(self._api_url, json=payload)

                if response.status_code == 200:
                    pred = response.json().get("prediction")
                    predictions.append(pred)
                else:
                    logger.error(f"API error: {response.status_code}, {response.text}")
                    predictions.append(None)
                    
            except Exception as e:
                logger.exception(f"Exception during API request: {e}")
                predictions.append(None)

        return predictions

    