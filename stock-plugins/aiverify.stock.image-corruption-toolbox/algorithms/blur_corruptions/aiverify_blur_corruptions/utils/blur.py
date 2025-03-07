import albumentations as A
import numpy as np

DEFAULT_PARAMS: dict[str, list] = {}  # Must be in format {"<function>_<param>": [values...]}


def gaussian_blur(img: np.ndarray, sigma: float = 2.0) -> np.ndarray:
    """
    Apply Gaussian blur to the input image.

    Gaussian blur is a widely used image processing technique that reduces image noise and detail, creating a smoothing
    effect.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        sigma (float, optional): Standard deviation of the Gaussian kernel. Must be in range [0, inf). Defaults to 2.0.

    Returns:
        np.ndarray: Numpy ndarray of image with Gaussian Blur corruption.
    """
    transform = A.GaussianBlur(sigma_limit=(sigma, sigma), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["gaussian_blur_sigma"] = [0.5, 1.0, 2.0, 3.0, 4.0]


def glass_blur(img: np.ndarray, max_delta: int = 3) -> np.ndarray:
    """
    Apply a glass blur effect to the input image.

    This transform simulates the effect of looking through textured glass by locally shuffling pixels in the image. It
    creates a distorted, frosted glass-like appearance.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        max_delta (int, optional): Maximum distance in pixels for shuffling. Determines how far pixels can be moved.
            Larger value creates more distortion. Must be a positive integer. Defaults to 3.

    Returns:
        np.ndarray: Numpy ndarray of image with Glass Blur corruption.
    """
    transform = A.GlassBlur(max_delta=max_delta, p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["glass_blur_max_delta"] = [1, 2, 3, 4, 5]


def defocus_blur(img: np.ndarray, radius: int = 7) -> np.ndarray:
    """
    Apply defocus blur to the input image.

    This transform simulates the effect of an out-of-focus camera by applying a defocus blur to the image. It uses a
    combination of disc kernels and Gaussian blur to create a realistic defocus effect.

    Args:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted.
        radius (int, optional) : Radius of the defocus blur. Larger values create a stronger blur effect. Defaults to 7.

    Returns:
        np.ndarray: Numpy ndarray of image with Defocus Blur corruption.
    """
    transform = A.Defocus(radius=(radius, radius), alias_blur=(0.5, 0.5), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["defocus_blur_radius"] = [3, 5, 7, 9, 11]


def horizontal_motion_blur(img: np.ndarray, kernel_size: int = 11) -> np.ndarray:
    """
    Apply horizontal motion blur to the input image using a line-shaped kernel.

    This transform simulates motion blur effects that occur during image capture, such as camera shake or object
    movement.

    Args:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted.
        kernel_size (int, optional) : Kernel size for blurring. Should be in range [3, inf). Defaults to 11.

    Returns:
        np.ndarray: Numpy ndarray of the image with Horizontal Motion Blur corruption.
    """
    transform = A.MotionBlur(
        blur_limit=(kernel_size, kernel_size),
        angle_range=(0.0, 0.0),
        direction_range=(0.0, 0.0),
        allow_shifted=False,
        p=1.0,
    )
    return transform(image=img)["image"]


DEFAULT_PARAMS["horizontal_motion_blur_kernel_size"] = [3, 7, 11, 15, 19]


def vertical_motion_blur(img: np.ndarray, kernel_size: int = 11) -> np.ndarray:
    """
    Apply vertical motion blur to the input image using a line-shaped kernel.

    This transform simulates motion blur effects that occur during image capture, such as camera shake or object
    movement.

    Args:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted.
        kernel_size (int, optional) : Kernel size for blurring. Should be in range [3, inf). Defaults to 11.

    Returns:
        np.ndarray: Numpy ndarray of the image with Vertical Motion Blur corruption.
    """
    transform = A.MotionBlur(
        blur_limit=(kernel_size, kernel_size),
        angle_range=(90.0, 90.0),
        direction_range=(0.0, 0.0),
        allow_shifted=False,
        p=1.0,
    )
    return transform(image=img)["image"]


DEFAULT_PARAMS["vertical_motion_blur_kernel_size"] = [3, 7, 11, 15, 19]


def zoom_blur(img: np.ndarray, zoom_factor: float = 1.1) -> np.ndarray:
    """
    Apply zoom blur corruption.

    Args:
        img (np.ndarray): Numpy ndarray of original image to be corrupted.
        zoom_factor (float, optional): Zoom blurring factor. Larger value creates a stronger effect. All zoom_factor
            values should be larger than 1. Defaults to 1.1.

    Returns:
        np.ndarray: Numpy ndarray of the image with Zoom Blur corruption.
    """
    transform = A.ZoomBlur(max_factor=(zoom_factor, zoom_factor), step_factor=(0.03, 0.03), p=1.0)
    return transform(image=img)["image"]


DEFAULT_PARAMS["zoom_blur_zoom_factor"] = [1.00, 1.05, 1.10, 1.15, 1.20]

CORRUPTION_FN = {
    "Gaussian_Blur": gaussian_blur,
    "Glass_Blur": glass_blur,
    "Defocus_Blur": defocus_blur,
    "Horizontal_Motion_Blur": horizontal_motion_blur,
    "Vertical_Motion_Blur": vertical_motion_blur,
    "Zoom_Blur": zoom_blur,
}
