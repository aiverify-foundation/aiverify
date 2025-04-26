import numpy as np
from PIL import Image


class imageProcessingStage:
    def transform(self, X, y=None):
        """Convert a batch of image path into numpy array for model input"""
        out = []
        for x in X:
            img = Image.open(x)
            img = np.array(img) / 255.0
            img = img.flatten()
            out.append(img)
        return np.array(out)
