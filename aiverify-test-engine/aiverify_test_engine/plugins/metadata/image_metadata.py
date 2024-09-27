from typing import Any, Union

from aiverify_test_engine.plugins.enums.image_type import ImageType
from aiverify_test_engine.utils.validate_checks import is_empty_string


class ImageMetadata:
    """
    The ImageMetadata class comprises information on Image
    """

    _data: Union[Any, None] = None
    _file_path: str = ""
    _image_type: ImageType = None

    def __init__(self, data: Any, image_type: ImageType, file_path: str = ""):
        self._data = data

        if image_type is not None and isinstance(image_type, ImageType):
            self._image_type = image_type

        if not is_empty_string(file_path) and isinstance(file_path, str):
            self._file_path = file_path

    def get_data(self) -> Any:
        """
        A method to return data value

        Returns:
            Any: the image data that is read from the file
        """
        return self._data

    def get_type(self) -> ImageType:
        """
        A method to return image type

        Returns:
            ImageType: the image type that the data uses
        """
        return self._image_type

    def get_path(self) -> str:
        """
        A method to return the image path

        Returns:
            str: image file path
        """
        return self._file_path
