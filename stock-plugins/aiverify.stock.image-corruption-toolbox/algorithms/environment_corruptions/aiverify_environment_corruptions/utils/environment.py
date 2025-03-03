from typing import Literal

import albumentations as A
import numpy as np

DEFAULT_PARAMS: dict[str, list] = {}  # Must be in format {"<function>_<param>": [values...]}


def snow(img: np.ndarray, intensity: float = 2.5) -> np.ndarray:
    """
    Applies a random snow effect to the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        intensity (float, optional): Coefficient applied to increase the brightness of pixels below the snow_point
            threshold. Larger values lead to more pronounced snow effects. Must be > 0. Defaults to 2.5.

    Returns:
        np.ndarray: Numpy ndarray of image with Snow corruption.
    """
    transform = A.RandomSnow(brightness_coeff=intensity, snow_point_range=(0.1, 0.1), method="texture", p=1.0)
    if img.dtype != np.uint8:
        img = img.astype(np.float32)
    return transform(image=img)["image"]


DEFAULT_PARAMS["snow_intensity"] = [0.5, 1.5, 2.5, 3.5, 4.5]


def fog(img: np.ndarray, intensity: float = 0.5) -> np.ndarray:
    """
    Simulates fog for the image by adding random fog-like artifacts.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        intensity (float, optional): Fog intensity coefficient. Must be in range [0, 1]. Defaults to 0.5.

    Returns:
        np.ndarray: Numpy ndarray of image with Fog corruption.
    """
    transform = A.RandomFog(fog_coef_range=(intensity, intensity), alpha_coef=0.2, p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["fog_intensity"] = [0.1, 0.3, 0.5, 0.7, 0.9]


def rain(img: np.ndarray, type: Literal["drizzle", "heavy", "torrential"] = "drizzle") -> np.ndarray:
    """
    Adds rain effects to an image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        type (str, optional): Type of rain to simulate. Must be one of: ["drizzle", "heavy", "torrential"]. Defaults to
            "drizzle".

    Returns:
        np.ndarray: Numpy ndarray of image with Rain corruption.
    """
    transform = A.RandomRain(rain_type=type, p=1.0)
    if img.dtype != np.uint8:
        img = img.astype(np.float32)
    return transform(image=img)["image"]


DEFAULT_PARAMS["rain_type"] = ["drizzle", "heavy", "torrential"]

CORRUPTION_FN = {
    "Snow": snow,
    "Fog": fog,
    "Rain": rain,
}
