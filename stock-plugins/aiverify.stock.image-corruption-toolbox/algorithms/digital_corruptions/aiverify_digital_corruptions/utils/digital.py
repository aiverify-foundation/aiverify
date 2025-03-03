import albumentations as A
import numpy as np

DEFAULT_PARAMS: dict[str, list] = {}  # Must be in format {"<function>_<param>": [values...]}


def brightness_down(img: np.ndarray, factor: float = 0.5) -> np.ndarray:
    """
    Reduce the brightness of the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        factor (float, optional): Factor for reducing brightness. Must be in the range [0.0, 1.0], where 0 means no
            change, 1.0 means minimum brightness. Defaults to 0.5.

    Returns:
        np.ndarray: Numpy ndarray of image with Brightness Down corruption.
    """
    transform = A.RandomBrightnessContrast(brightness_limit=(-factor, -factor), contrast_limit=(0, 0), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["brightness_down_factor"] = [0.2, 0.35, 0.5, 0.65, 0.7]


def brightness_up(img: np.ndarray, factor: float = 0.5) -> np.ndarray:
    """
    Increase the brightness of the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        factor (float, optional): Factor for increasing brightness. Must be in the range [0.0, 1.0], where 0 means no
            change, 1.0 means maximum brightness. Defaults to 0.5.

    Returns:
        np.ndarray: Numpy ndarray of image with Brightness Up corruption.
    """
    transform = A.RandomBrightnessContrast(brightness_limit=(factor, factor), contrast_limit=(0, 0), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["brightness_up_factor"] = [0.2, 0.35, 0.5, 0.65, 0.7]


def contrast_down(img: np.ndarray, factor: float = 0.5) -> np.ndarray:
    """
    Reduce the contrast of the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        factor (float, optional): Factor for reducing contrast. Must be in the range [0.0, 1.0], where 0 means no
            change, 1.0 means minimum contrast. Defaults to 0.5.

    Returns:
        np.ndarray: Numpy ndarray of image with Contrast Down corruption.
    """
    transform = A.RandomBrightnessContrast(contrast_limit=(-factor, -factor), brightness_limit=(0, 0), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["contrast_down_factor"] = [0.2, 0.3, 0.5, 0.7, 0.9]


def contrast_up(img: np.ndarray, factor: float = 0.5) -> np.ndarray:
    """
    Increase the contrast of the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        factor (float, optional): Factor for increasing contrast. Must be in the range [0.0, 1.0], where 0 means no
            change, 1.0 means maximum contrast. Defaults to 0.5.
    Returns:
        np.ndarray: Numpy ndarray of image with Contrast Up corruption.
    """
    transform = A.RandomBrightnessContrast(contrast_limit=(factor, factor), brightness_limit=(0, 0), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["contrast_up_factor"] = [0.2, 0.3, 0.5, 0.7, 0.9]


def saturate_down(img: np.ndarray, factor: float = 0.4) -> np.ndarray:
    """
    Reduce the saturation of the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        factor (float, optional): Factor for reducing saturation. Must be in the range [0.0, 1.0], where 0 means no
            change, 1.0 means minimum saturation. Defaults to 0.4.

    Returns:
        np.ndarray: Numpy ndarray of image with Saturate Down corruption.
    """
    transform = A.HueSaturationValue(
        sat_shift_limit=(-factor * 255, -factor * 255), hue_shift_limit=(0, 0), val_shift_limit=(0, 0), p=1.0
    )
    if img.dtype != np.uint8:
        img = img.astype(np.float32)
    return transform(image=img)["image"]


DEFAULT_PARAMS["saturate_down_factor"] = [0.1, 0.25, 0.4, 0.55, 0.7]


def saturate_up(img: np.ndarray, factor: float = 0.4) -> np.ndarray:
    """
    Increase the saturation of the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        factor (float, optional): Factor for increasing saturation. Must be in the range [0.0, 1.0], where 0 means no
            change, 1.0 means maximum saturation. Defaults to 0.4.

    Returns:
        np.ndarray: Numpy ndarray of image with Saturate Up corruption.
    """
    transform = A.HueSaturationValue(
        sat_shift_limit=(factor * 255, factor * 255), hue_shift_limit=(0, 0), val_shift_limit=(0, 0), p=1.0
    )
    if img.dtype != np.uint8:
        img = img.astype(np.float32)
    return transform(image=img)["image"]


DEFAULT_PARAMS["saturate_up_factor"] = [0.1, 0.25, 0.4, 0.55, 0.7]


def random_perspective(img: np.ndarray, sigma: float = 0.2) -> np.ndarray:
    """
    Apply random four point perspective transformation to the input.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        sigma (float, optional): Standard deviation of the normal distributions. These are used to sample the random
            distances of the subimage's corners from the full image's corners. Defaults to 0.2.

    Returns:
        np.ndarray: Numpy ndarray of image with Random Perspective corruption.
    """
    transform = A.Perspective(scale=(sigma, sigma), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["random_perspective_sigma"] = [0.1, 0.15, 0.2, 0.25, 0.3]


def jpeg_compression(img: np.ndarray, quality: int = 30) -> np.ndarray:
    """
    Decrease image quality by applying JPEG compression.

    This transform simulates the effect of saving an image with lower quality settings, which can introduce compression
    artifacts.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        quality (int, optional): JPEG compression quality. Must be in the range [1, 100], where 1 means lowest quality,
            100 means highest quality. Defaults to 30.

    Returns:
        np.ndarray: Numpy ndarray of image with JPEG Compression corruption.
    """
    transform = A.ImageCompression(quality_range=(quality, quality), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["jpeg_compression_quality"] = [90, 60, 30, 15, 5]

CORRUPTION_FN = {
    "Brightness_Down": brightness_down,
    "Brightness_Up": brightness_up,
    "Contrast_Down": contrast_down,
    "Contrast_Up": contrast_up,
    "Saturate_Down": saturate_down,
    "Saturate_Up": saturate_up,
    "Random_Perspective": random_perspective,
    "JPEG_Compression": jpeg_compression,
}
