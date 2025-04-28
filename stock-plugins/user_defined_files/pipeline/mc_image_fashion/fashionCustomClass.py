import numpy as np
import pandas as pd
from PIL import Image


class imageProcessingStage:
    def __init__(self, dir_column="image_directory"):
        self.dir_column = dir_column

    def transform(self, X, y=None):
        """Convert columns into dataframe for model input"""
        images = []
        X_ = X.copy()
        for dir in X_[self.dir_column]:
            image_array = np.array(Image.open(dir)) / 255.0
            image_array = image_array.reshape(100 * 100 * 3)
            images.append(np.array(image_array))
        return pd.DataFrame(images)
