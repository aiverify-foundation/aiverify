import albumentations as A
import numpy as np

DEFAULT_PARAMS: dict[str, list] = {}  # Must be in format {"<function>_<param>": [values...]}


def gaussian_noise(img: np.ndarray, sigma: float = 0.3) -> np.ndarray:
    """
    Apply Gaussian noise to the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        sigma (float, optional): Gaussian noise standard deviation as a fraction of the maximum value (255 for uint8
            images or 1.0 for float images). Must be in range [0, 1]. Defaults to 0.3.

    Returns:
        np.ndarray: Numpy ndarray of image with Gaussian Noise corruption.
    """
    transform = A.GaussNoise(std_range=(sigma, sigma), p=1.0)
    if img.dtype != np.uint8:
        img = img.astype(np.float32)
    return transform(image=img)["image"]


DEFAULT_PARAMS["gaussian_noise_sigma"] = [0.1, 0.2, 0.3, 0.4, 0.5]


def poisson_noise(img: np.ndarray, scale: float = 0.3) -> np.ndarray:
    """
    Apply Poisson noise to the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        scale (float, optional): Poisson noise scale factor. Higher values means more noise. Defaults to 0.3.

    Returns:
        np.ndarray: Numpy ndarray of image with Poisson Noise corruption.
    """
    transform = A.ShotNoise(scale_range=(scale, scale), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["poisson_noise_scale"] = [0.1, 0.2, 0.3, 0.4, 0.5]


def salt_and_pepper_noise(img: np.ndarray, amount: float = 0.2) -> np.ndarray:
    """
    Apply salt and pepper noise to the input image.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        amount (float, optional): Amount of noise (both salt and pepper). Must be in range [0, 1]. Defaults to 0.2.

    Returns:
        np.ndarray: Numpy ndarray of image with Salt and Pepper Noise corruption.
    """
    transform = A.SaltAndPepper(amount=(amount, amount), salt_vs_pepper=(0.5, 0.5), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["salt_and_pepper_noise_amount"] = [0.1, 0.15, 0.2, 0.25, 0.3]

CORRUPTION_FN = {
    "Gaussian_Noise": gaussian_noise,
    "Poisson_Noise": poisson_noise,
    "Salt_and_Pepper_Noise": salt_and_pepper_noise,
}
