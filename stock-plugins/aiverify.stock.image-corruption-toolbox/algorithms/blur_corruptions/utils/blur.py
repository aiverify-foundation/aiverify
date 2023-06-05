import cv2
import numpy as np
from scipy.ndimage import zoom as scizoom
from skimage.filters import gaussian


def disk(radius: int, alias_blur: float = 0.1, dtype: type = np.float32) -> np.ndarray:
    """
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)
    """
    if radius <= 8:
        L = np.arange(-8, 8 + 1)
        ksize = (3, 3)
    else:
        L = np.arange(-radius, radius + 1)
        ksize = (5, 5)
    X, Y = np.meshgrid(L, L)
    aliased_disk = np.array((X**2 + Y**2) <= radius**2, dtype=dtype)  # circle
    aliased_disk /= np.sum(aliased_disk)

    # supersample disk to antialias
    return cv2.GaussianBlur(aliased_disk, ksize=ksize, sigmaX=alias_blur)


def clipped_zoom(img: np.ndarray, zoom_factor: int) -> np.ndarray:
    """
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)
    """
    height = img.shape[0]
    # ceil crop height(= crop width)
    crop_height = int(np.ceil(height / zoom_factor))
    top = (height - crop_height) // 2
    img = scizoom(
        img[top : top + crop_height, top : top + crop_height],
        (zoom_factor, zoom_factor, 1),
        order=1,
    )
    # trim off any extra pixels
    trim_top = (img.shape[0] - height) // 2
    return img[trim_top : trim_top + height, trim_top : trim_top + height]


def gaussian_blur(img: np.ndarray, severity: int = 1) -> np.ndarray:
    """
    Adding gaussian blur to images
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)

    Parameters:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted
        severity (int) : Level of severity of noise added

    Returns:
        np.ndarray: Numpy ndarray of image with Gaussian blur corruption
    """
    severity_constant = [8, 15, 23, 35, 65][severity - 1]
    img = gaussian(img, sigma=severity_constant, channel_axis=2)
    return np.clip(img, 0, 1)


def glass_blur(img: np.ndarray, severity=1) -> np.ndarray:
    """
    Adding glass blur to images
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)

    Parameters:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted
        severity (int) : Level of severity of noise addedd

    Returns:
        np.ndarray: Numpy ndarray of image with glassblur corruption
    """
    # severity_constant = [sigma, max_delta, iterations]
    severity_constant = [
        (1.5, 4, 1),
        (1.8, 4, 3),
        (2.0, 5, 4),
        (2.2, 7, 5),
        (3.0, 8, 6),
    ][severity - 1]
    img = np.uint8(gaussian(img, sigma=severity_constant[0], channel_axis=2) * 255)
    sigma = severity_constant[0]
    max_delta = severity_constant[1]
    iterations = severity_constant[2]
    # locally shuffle pixels, iterations depends on the severity level and
    for i in range(iterations):
        # height, width = img.shape
        for h in range(img.shape[0] - max_delta, max_delta, -1):
            for w in range(img.shape[1] - max_delta, max_delta, -1):
                dx, dy = np.random.randint(-max_delta, max_delta, size=(2,))
                h_prime, w_prime = h + dy, w + dx
                # swap
                img[h, w], img[h_prime, w_prime] = img[h_prime, w_prime], img[h, w]
    return np.clip(gaussian(img / 255.0, sigma, channel_axis=2), 0, 1)


def defocus_blur(img: np.ndarray, severity: int = 1) -> np.ndarray:
    """
    Adding defocus to images
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)

    Parameters:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted
        severity (int) : Level of severity of noise addedd

    Returns:
        np.ndarray: Numpy ndarray of image with defocus blur corruption
    """
    severity_constant = [(9, 0.6), (13, 0.4), (18, 0.3), (25, 0.3), (35, 0.3)][
        severity - 1
    ]
    radius = severity_constant[0]
    alias_blur = severity_constant[1]
    kernel = disk(radius, alias_blur)
    channels = []
    two_dim = False
    for d in range(3):
        channels.append(cv2.filter2D(img[:, :, d], -1, kernel))
    channels = np.array(channels).transpose((1, 2, 0))
    if two_dim:
        channels = cv2.cvtColor(channels, cv2.COLOR_RGB2GRAY)
    return np.clip(channels, 0, 1)


def horizontal_motion_blur(img: np.ndarray, severity: int = 1) -> np.ndarray:
    """
    Perform the hoirzontal motion blur effect.
    Adapted from: https://github.com/stanfordmlgroup/cheXphoto/tree/master/transforms (MIT)

    Args:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted
        severity (int) : Level of severity of noise addedd

    Returns:
        np.ndarray: Numpy ndarray of the image perturbed by the blur
    """
    severity_constant = [25, 40, 60, 95, 200][severity - 1]
    img = img * 255.0
    two = False
    if img.ndim == 2:
        two = True
        img = np.expand_dims(img, axis=2)
    img = img[:, :, ::-1].copy()
    # generating the kernel
    kernel_motion_blur = np.zeros((severity_constant, severity_constant))
    kernel_motion_blur[int((severity_constant - 1) / 2), :] = np.ones(severity_constant)
    kernel_motion_blur = kernel_motion_blur / severity_constant

    # applying the kernel to the input image
    output = cv2.filter2D(img, -1, kernel_motion_blur)
    output = cv2.cvtColor(output.astype(np.uint8), cv2.COLOR_BGR2RGB)
    if two:
        test = np.squeeze(output, axis = 2)
        
    return output / 255.0


def vertical_motion_blur(img: np.ndarray, severity: int = 1) -> np.ndarray:
    """
    Perform the vertical motion blur effect.
    Adapted from: https://github.com/stanfordmlgroup/cheXphoto/tree/master/transforms (MIT)

    Args:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted
        severity (int) : Level of severity of noise addedd

    Returns:
        np.ndarray: Numpy ndarray of the image perturbed by the blur
    """
    severity_constant = [25, 40, 55, 85, 145][severity - 1]
    img = img * 255.0
    img = img[:, :, ::-1].copy()
    # generating the kernel
    kernel_motion_blur = np.zeros((severity_constant, severity_constant))
    kernel_motion_blur[:, int((severity_constant - 1) / 2)] = np.ones(severity_constant)
    kernel_motion_blur = kernel_motion_blur / severity_constant

    # applying the kernel to the input image
    output = cv2.filter2D(img, -1, kernel_motion_blur)
    output = cv2.cvtColor(output.astype(np.uint8), cv2.COLOR_BGR2RGB)
    return output / 255.0


def zoom_blur(img: np.ndarray, severity: int = 1) -> np.ndarray:
    """
    Adding blur caused by zooming to images
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)

    Parameters:
        img (np.ndarray) : Numpy ndarray of original image to be corrupted
        severity (int) : Level of severity of noise addedd

    Returns:
        np.ndarray: Numpy ndarray of the image with zoom blur corruption
    """
    severity_constant = [
        np.arange(1, 1.16, 0.01),
        np.arange(1, 1.26, 0.01),
        np.arange(1, 1.46, 0.02),
        np.arange(1, 1.66, 0.02),
        np.arange(1, 2.4, 0.03),
    ][severity - 1]
    out = np.zeros_like(img)
    for zoom_factor in severity_constant:
        out += clipped_zoom(img, zoom_factor)
    img = (img + out) / (len(severity_constant) + 1)
    return np.clip(img, 0, 1)
