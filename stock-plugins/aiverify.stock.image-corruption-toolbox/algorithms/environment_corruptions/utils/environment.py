from io import BytesIO
from typing import Tuple

import cv2
import numpy as np
from PIL import Image, ImageEnhance
from scipy.ndimage import zoom as scizoom
from wand.api import library as wandlibrary
from wand.image import Image as WandImage

gaussianbandwidths = [0.5, 1, 1.5, 2, 2.5, 3, 3.5]


def clipped_zoom(img: np.ndarray, zoom_factor: int) -> np.ndarray:
    h = img.shape[0]
    # ceil crop height(= crop width)
    ch = int(np.ceil(h / zoom_factor))

    top = (h - ch) // 2
    img = scizoom(
        img[top : top + ch, top : top + ch], (zoom_factor, zoom_factor, 1), order=1
    )
    # trim off any eimgtra piimgels
    trim_top = (img.shape[0] - h) // 2
    return img[trim_top : trim_top + h, trim_top : trim_top + h]


def plasma_fractal(mapsize: int = 256, wibbledecay: float = 3) -> np.ndarray:
    """
    Generate a heightmap using diamond-square algorithm.
    Return square 2d array, side length 'mapsize', of floats in range 0-255.
    'mapsize' must be a power of two.
    Modification of https://github.com/FLHerne/mapgen/blob/master/diamondsquare.py
    """
    assert mapsize & (mapsize - 1) == 0
    maparray = np.empty((mapsize, mapsize), dtype=np.float64)
    maparray[0, 0] = 0
    stepsize = mapsize
    wibble = 100

    def wibbledmean(array: np.ndarray) -> np.ndarray:
        return array / 4 + wibble * np.random.uniform(-wibble, wibble, array.shape)

    def fillsquares():
        """For each square of points stepsize apart,
        calculate middle value as mean of points + wibble"""
        cornerref = maparray[0:mapsize:stepsize, 0:mapsize:stepsize]
        squareaccum = cornerref + np.roll(cornerref, shift=-1, axis=0)
        squareaccum += np.roll(squareaccum, shift=-1, axis=1)
        maparray[
            stepsize // 2 : mapsize : stepsize, stepsize // 2 : mapsize : stepsize
        ] = wibbledmean(squareaccum)

    def filldiamonds():
        """For each diamond of points stepsize apart,
        calculate middle value as mean of points + wibble"""
        mapsize = maparray.shape[0]
        drgrid = maparray[
            stepsize // 2 : mapsize : stepsize, stepsize // 2 : mapsize : stepsize
        ]
        ulgrid = maparray[0:mapsize:stepsize, 0:mapsize:stepsize]
        ldrsum = drgrid + np.roll(drgrid, 1, axis=0)
        lulsum = ulgrid + np.roll(ulgrid, -1, axis=1)
        ltsum = ldrsum + lulsum
        maparray[0:mapsize:stepsize, stepsize // 2 : mapsize : stepsize] = wibbledmean(
            ltsum
        )
        tdrsum = drgrid + np.roll(drgrid, 1, axis=1)
        tulsum = ulgrid + np.roll(ulgrid, -1, axis=0)
        ttsum = tdrsum + tulsum
        maparray[stepsize // 2 : mapsize : stepsize, 0:mapsize:stepsize] = wibbledmean(
            ttsum
        )

    while stepsize >= 2:
        fillsquares()
        filldiamonds()
        stepsize //= 2
        wibble /= wibbledecay

    maparray -= maparray.min()
    return maparray / maparray.max()


# Eimgtend wand.image.Image class to include method signature
class MotionImage(WandImage):
    def motion_blur(self, radius=0.0, sigma=0.0, angle=0.0) -> None:
        wandlibrary.MagickMotionBlurImage(self.wand, radius, sigma, angle)


def snow(img: np.ndarray, severity: int = 1) -> np.float32:
    """
    Adding snow to images
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)

    Parameters:
        img (ndarray) : original image to be corrupted
        severity (int) : Level of severity of noise addedd

    Returns:
        nd.float32: Numpy float of image with snow environment corruption
    """
    severity_constant = [
        (0.1, 0.3, 3, 0.5, 10, 4, 0.8),
        (0.2, 0.3, 2, 0.5, 12, 4, 0.7),
        (0.55, 0.3, 4.5, 0.85, 12, 8, 0.65),
        (0.6, 0.3, 6.5, 0.9, 16, 16, 0.3),
        (0.6, 0.35, 7.5, 0.9, 18, 18, 0.2),
    ][severity - 1]

    loc = severity_constant[0]
    scale = severity_constant[1]
    zoom_factor = severity_constant[2]
    radius = severity_constant[4]
    sigma = severity_constant[5]
    add_const = severity_constant[6]
    
    image = img.copy()
    image = np.array(image, dtype=np.float32)

    width, height, channel = img.shape
    snow_layer = np.random.normal(
        size=image.shape[:2], loc=loc, scale=scale
    )  # [:2] for monochrome

    snow_layer = clipped_zoom(snow_layer[..., np.newaxis], zoom_factor)
    snow_layer[snow_layer < severity_constant[3]] = 0

    snow_layer = Image.fromarray(
        (np.clip(snow_layer.squeeze(), 0, 1) * 255).astype(np.uint8), mode="L"
    )
    output = BytesIO()
    snow_layer.save(output, format="PNG")
    snow_layer = MotionImage(blob=output.getvalue())

    snow_layer.motion_blur(radius, sigma, angle=np.random.uniform(-135, -45))

    snow_layer = (
        cv2.imdecode(
            np.fromstring(snow_layer.make_blob(), np.uint8), cv2.IMREAD_UNCHANGED
        )
        / 255.0
    )
    snow_layer = snow_layer[..., np.newaxis]

    image = add_const * image + (1 - add_const) * np.maximum(
        image, cv2.cvtColor(image, cv2.COLOR_RGB2GRAY).reshape(width, height, 1) * 1.5 + 0.5
    )
    return (np.clip(image + snow_layer + np.rot90(snow_layer, k=2), 0, 1)).astype(
        np.float32
    )


def fog(img: np.ndarray, severity: int = 1) -> np.ndarray:
    """
    Adding fog to images
    Modified from : https://github.com/hendrycks/robustness/blob/master/ImageNet-C/create_c/make_imagenet_c.py
    (Apache 2.0)

    Parameters:
        img (ndarray) : Numpy array of original image to be corrupted
        severity (int) : Level of severity of noise addedd
    Returns:
        ndarray: Numpy array of image with fog environment corruption
    """
    severity_constant = [(0.8, 3), (1.2, 2.5), (1.6, 2), (2.5, 1.75), (2.8, 1.6)][
        severity - 1
    ]
    wibbledecay = severity_constant[1]
    add_const = severity_constant[0]

    image = img.copy()
    max_val = image.max()
    shape = img.shape
    image += (
        add_const
        * plasma_fractal(wibbledecay=wibbledecay)[: shape[0], : shape[1]][
            ..., np.newaxis
        ]
    )
    return (np.clip(image * max_val / (max_val + add_const), 0, 1)).astype(np.float32)


def generate_random_lines(
    image: np.ndarray, slant: int, drop_length: np.uint8, drop_density: int
) -> Tuple[list, np.uint8]:
    """
    A method to randomly generate lines as rain
    Modified from : https://github.com/UjjwalSaxena/Automold--Road-Augmentation-Library/blob/master/Automold.py
    (MIT)
    """
    imshape = image.shape
    area = imshape[0] * imshape[1]
    no_of_drops = area // drop_density
    drops = []

    for i in range(no_of_drops):  # If You want heavy rain, try increasing this
        if slant < 0:
            img = np.random.randint(slant, imshape[1])
        else:
            img = np.random.randint(0, imshape[1] - slant)
        y = np.random.randint(0, imshape[0] - drop_length)
        drops.append((img, y))
    return drops, drop_length


def rain_process(
    image: np.ndarray,
    slant: int,
    drop_length: np.uint8,
    drop_color: Tuple[int, int, int],
    drop_width: np.uint8,
    rain_drops: list,
    brightness_coefficient: float,
) -> Image:
    """
    A method to add rain and decrease darkness
    Modified from : https://github.com/UjjwalSaxena/Automold--Road-Augmentation-Library/blob/master/Automold.py
    (MIT)
    """
    image_t = image.copy()
    for rain_drop in rain_drops:
        cv2.line(
            image_t,
            (rain_drop[0], rain_drop[1]),
            (rain_drop[0] + slant, rain_drop[1] + drop_length),
            drop_color,
            drop_width,
        )
    image = cv2.blur(image_t, (3, 3))  # adding blur to the rainy view
    image_rgb = cv2.cvtColor(np.uint8(image), cv2.COLOR_BGR2RGB)
    image_rgb = Image.fromarray(np.array(image))
    image_brightness_down = ImageEnhance.Brightness(image_rgb).enhance(
        brightness_coefficient
    )
    return image_brightness_down


# rain_type='drizzle','heavy','torrential'
def add_rain(
    image: np.ndarray, severity: int, drop_color: Tuple[int, int, int] = (200, 200, 200)
) -> np.ndarray:
    """
    Adding rain to images
    Modified from : https://github.com/UjjwalSaxena/Automold--Road-Augmentation-Library/blob/master/Automold.py
    (MIT)

    Parameters:
        img (ndarray) : numpy ndarray of original image to be corrupted
        severity (int) : level of severity of noise addedd
        drop_color (Tuple): (200,200,200) a shade of gray

    Returns:
        ndarray: Image with rain environment corruption
    """
    severity_constant = [
        (12, 250, 100, 0.7),
        (10, 100, 100, 0.7),
        (8, 90, 100, 0.6),
        (5, 80, 100, 0.5),
        (4, 70, 100, 0.5),
    ][
        severity - 1
    ]  # (drop_length, drop_density, drop_width)
    image_255 = np.uint8(image * 255.0)

    image_height, image_width, channels = image.shape
    drop_length = np.uint8(image_height / severity_constant[0])
    drop_density = severity_constant[1]
    drop_width = np.uint8(image_width / severity_constant[2])
    brightness = severity_constant[3]
    min_angle, max_angle = -10, 10
    slant = np.random.randint(min_angle, max_angle)  # generate random slant
    drops, drop_length = generate_random_lines(
        image_255, slant, drop_length, drop_density
    )
    output = rain_process(
        image_255,
        slant,
        drop_length,
        drop_color,
        drop_width,
        drops,
        brightness_coefficient=brightness,
    )
    output = np.array(output) / 255.0
    return output
