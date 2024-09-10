from io import BytesIO

import numpy as np
import PIL
import skimage as sk
from PIL import Image, ImageEnhance


def brightness_down_mapping(img, severity):
    """
    Perform the brightness down effect.
    Reference to: https://github.com/stanfordmlgroup/cheXphoto/tree/master/transforms (MIT)

    Args:
        img (ndarray): Image to perturb
        severity (int): severity level of corruption

    Returns:
        ndarry: the Image perturbed by brightness down
    """
    severity_constant = [1.8, 2.6, 3, 4.5, 5.5][severity - 1]
    noisy_factor = 1 / severity_constant
    img = PIL.Image.fromarray(np.uint8(img * 255.0))
    img_b = ImageEnhance.Brightness(img).enhance(noisy_factor)
    return np.array(img_b) / 255.0


def brightness_up_mapping(img, severity):
    """
    Perform the brightness up effect.
    Reference to: https://github.com/stanfordmlgroup/cheXphoto/tree/master/transforms (MIT)

    Args:
        img (ndarray): Image to perturb
        severity (int): severity level of corruption

    Returns:
        ndarry: the Image perturbed by brightness up
    """
    severity_constant = [1.6, 2.0, 2.5, 3, 4.5][severity - 1]
    noisy_factor = severity_constant
    img = PIL.Image.fromarray(np.uint8(img * 255.0))
    img_bright = ImageEnhance.Brightness(img).enhance(noisy_factor)
    return np.array(img_bright) / 255.0


def contrast_down_mapping(img, severity):
    """
    Perform the contrast down effect.
    Reference to: https://github.com/stanfordmlgroup/cheXphoto/tree/master/transforms (MIT)

    Args:
        img (ndarray): Image to perturb
        severity (int): severity level of corruption

    Returns:
        ndarry: the Image perturbed by contrast down
    """
    severity_constant = [2.2, 2.8, 3.6, 4.6, 7.0][severity - 1]
    noisy_factor = 1 / severity_constant
    img = PIL.Image.fromarray(np.uint8(img * 255.0))
    img_contrast = ImageEnhance.Contrast(img).enhance(noisy_factor)
    return np.array(img_contrast) / 255.0


def contrast_up_mapping(img, severity):
    """
    Perform the contrast up effect.
    Reference to: https://github.com/stanfordmlgroup/cheXphoto/tree/master/transforms (MIT)

    Args:
        img (ndarray): Image to perturb
        severity (int): severity level of corruption

    Returns:
        ndarry: the Image perturbed by the contrast up
    """
    severity_constant = [2.2, 2.8, 4.0, 8.5, 30][severity - 1]
    noisy_factor = severity_constant
    img = PIL.Image.fromarray(np.uint8(img * 255.0))
    img_contrast = ImageEnhance.Contrast(img).enhance(noisy_factor)
    return np.array(img_contrast) / 255.0


def saturate(img, severity=1):
    """
    Perform the saturation effect.
    Modified from :
    https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py (Apache 2.0)

    Args:
        img (ndarray): Image to perturb
        severity (int): severity level of corruption

    Returns:
        ndarry: the Image perturbed with saturation
    """
    severity_constant = [(2.2, 0), (3, 0), (3.5, 0.1), (5, 0.1), (30, 0.2)][
        severity - 1
    ]

    img = np.array(img) * 255.0
    img = sk.color.rgb2hsv(img)
    img[:, :, 1] = np.clip(
        img[:, :, 1] * severity_constant[0] + severity_constant[1], a_min=0, a_max=255
    )
    img = sk.color.hsv2rgb(img)
    return np.clip(img, 0, 255) / 255.0


"""Implement 3-D tilt perturbation on a set of images."""


def find_coeffs(pa, pb):
    """
    Calculate parameters for PIL perspective transform.
    Source:https://stackoverflow.com/questions/14177744/

    Args:
        pa (list): list of 4 (x, y) points to map to pb
        pb (list): list of 4 (x, y) points to be mapped from pa

    Returns:
        (np.ndarray): parameters for PIL perspective transform
    """
    matrix = []
    for p1, p2 in zip(pa, pb):
        matrix.append([p1[0], p1[1], 1, 0, 0, 0, -p2[0] * p1[0], -p2[0] * p1[1]])
        matrix.append([0, 0, 0, p1[0], p1[1], 1, -p2[1] * p1[0], -p2[1] * p1[1]])

    A = np.matrix(matrix, dtype=np.float64)
    B = np.array(pb).reshape(8)

    res = np.dot(np.linalg.inv(A.T * A) * A.T, B)
    return np.array(res).reshape(8)


def tilt_mapping(img, severity):
    """
    Perform a 3-D tilt transformation.
    Reference to: https://github.com/stanfordmlgroup/cheXphoto/tree/master/transforms (MIT)

    Args:
        level (int): level of perturbation
        src_img (Image): PIL Image to perturb

    Returns:
        (Image): the Image perturbed by the tilt
    """

    img = PIL.Image.fromarray(np.uint8(img * 255.0))
    width, height = img.size

    degree_step = 0.05
    severity_constant = [0.75, 1.25, 1.5, 2, 3][severity - 1]
    degree = severity_constant * degree_step

    coeffs = find_coeffs(
        [
            (
                width * np.random.uniform(0, degree),
                height * np.random.uniform(0, degree),
            ),
            (
                width * np.random.uniform(1 - degree, 1),
                height * np.random.uniform(0, degree),
            ),
            (
                width * np.random.uniform(1 - degree, 1),
                height * np.random.uniform(1 - degree, 1),
            ),
            (
                width * np.random.uniform(0, degree),
                height * np.random.uniform(1 - degree, 1),
            ),
        ],
        [(0, 0), (width, 0), (width, height), (0, height)],
    )

    img = img.transform((width, height), Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    return np.array(img) / 255.0


def jpeg_compression(img, severity=1):
    """
    Perform the jpeg compression effect.
    Modified from :
    https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py (Apache 2.0)

    Args:
        img (ndarray): Image to perturb
        severity (int): severity level of corruption

    Returns:
        ndarry: the Image perturbed by the brightness
    """
    severity_constant = [85, 75, 65, 55, 45][severity - 1]
    img = PIL.Image.fromarray(np.uint8(img * 255.0))
    output = BytesIO()
    img.save(output, "JPEG", quality=severity_constant)
    img = Image.open(output)
    return np.array(img) / 255.0
