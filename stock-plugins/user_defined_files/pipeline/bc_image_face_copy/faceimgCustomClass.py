import numpy as np
import pandas as pd
from PIL import Image


class imageProcessingStage:
    def __init__(self, dir_column):
        self.dir_column = dir_column

    def transform(self, X, y=None):
        """Convert columns into dataframe for model input"""
        images = []
        height, width, channel = 100, 100, 3
        X_ = X.copy()
        for dir in X_[self.dir_column]:
            image_array = np.array(Image.open(dir).resize((100, 100))) / 255.0
            image_array = image_array.reshape(height * width * channel)
            images.append(np.array(image_array))
        return pd.DataFrame(images)

    def fit(self, X, y=None):
        return self
