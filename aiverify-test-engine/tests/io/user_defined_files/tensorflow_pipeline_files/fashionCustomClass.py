from typing import Iterable

import keras
import numpy as np
import tensorflow as tf


@keras.saving.register_keras_serializable()
class FashionMNISTTensorflow(tf.keras.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.model = tf.keras.Sequential(
            [
                tf.keras.layers.Input(shape=(28, 28)),
                tf.keras.layers.Flatten(),
                tf.keras.layers.Dense(128, activation="relu"),
                tf.keras.layers.Dense(10, activation="softmax"),
            ]
        )
        self.model.build((None, 28, 28))

    def predict(self, image_paths: Iterable[str]) -> np.ndarray:
        processed_images = []
        for img_path in image_paths:
            img = tf.keras.utils.load_img(
                img_path, target_size=(28, 28), color_mode="grayscale"
            )
            img_array = tf.keras.utils.img_to_array(img)
            img_array /= 255.0
            processed_images.append(img_array)

        image_batch = np.stack(processed_images, axis=0)
        predictions = self.model.predict(image_batch)
        predicted_classes = np.argmax(predictions, axis=1)

        return predicted_classes
