import pytest as pytest
from aiverify_test_engine.plugins.enums.image_type import ImageType
from aiverify_test_engine.plugins.metadata.image_metadata import ImageMetadata


class TestCollectionImageMetadata:
    @pytest.mark.parametrize(
        "data, image_type, filepath, expected_data, expected_imagetype, expected_filepath",
        [
            # Test data
            (
                None,
                ImageType.JPG,
                "tests/image/image1.png",
                None,
                ImageType.JPG,
                "tests/image/image1.png",
            ),
            (
                "None",
                ImageType.JPG,
                "tests/image/image1.png",
                "None",
                ImageType.JPG,
                "tests/image/image1.png",
            ),
            (
                "",
                ImageType.JPG,
                "tests/image/image1.png",
                "",
                ImageType.JPG,
                "tests/image/image1.png",
            ),
            (
                [],
                ImageType.JPG,
                "tests/image/image1.png",
                [],
                ImageType.JPG,
                "tests/image/image1.png",
            ),
            (
                {},
                ImageType.JPG,
                "tests/image/image1.png",
                {},
                ImageType.JPG,
                "tests/image/image1.png",
            ),
            (
                123,
                ImageType.JPG,
                "tests/image/image1.png",
                123,
                ImageType.JPG,
                "tests/image/image1.png",
            ),
            # Test image type
            (123, None, "tests/image/image1.png", 123, None, "tests/image/image1.png"),
            (
                123,
                "None",
                "tests/image/image1.png",
                123,
                None,
                "tests/image/image1.png",
            ),
            (123, "", "tests/image/image1.png", 123, None, "tests/image/image1.png"),
            (123, [], "tests/image/image1.png", 123, None, "tests/image/image1.png"),
            (123, {}, "tests/image/image1.png", 123, None, "tests/image/image1.png"),
            (123, 123, "tests/image/image1.png", 123, None, "tests/image/image1.png"),
            # Test file path
            (123, ImageType.JPG, None, 123, ImageType.JPG, ""),
            (
                123,
                ImageType.JPG,
                "None",
                123,
                ImageType.JPG,
                "None",
            ),
            (123, ImageType.JPG, "", 123, ImageType.JPG, ""),
            (123, ImageType.JPG, [], 123, ImageType.JPG, ""),
            (123, ImageType.JPG, {}, 123, ImageType.JPG, ""),
            (123, ImageType.JPG, 123, 123, ImageType.JPG, ""),
        ],
    )
    def test_init(
        self,
        data,
        image_type,
        filepath,
        expected_data,
        expected_imagetype,
        expected_filepath,
    ):
        """
        Test initialising
        """
        new_object = ImageMetadata(data, image_type, filepath)
        assert new_object._data == expected_data
        assert new_object._image_type == expected_imagetype
        assert new_object._file_path == expected_filepath

    @pytest.mark.parametrize(
        "data, image_type, filepath, expected_data",
        [
            # Test data
            (
                None,
                ImageType.JPG,
                "tests/image/image1.png",
                None,
            ),
            (
                "None",
                ImageType.JPG,
                "tests/image/image1.png",
                "None",
            ),
            (
                "",
                ImageType.JPG,
                "tests/image/image1.png",
                "",
            ),
            (
                [],
                ImageType.JPG,
                "tests/image/image1.png",
                [],
            ),
            (
                {},
                ImageType.JPG,
                "tests/image/image1.png",
                {},
            ),
            (
                123,
                ImageType.JPG,
                "tests/image/image1.png",
                123,
            ),
            # Test image type
            (
                123,
                None,
                "tests/image/image1.png",
                123,
            ),
            (
                123,
                "None",
                "tests/image/image1.png",
                123,
            ),
            (
                123,
                "",
                "tests/image/image1.png",
                123,
            ),
            (
                123,
                [],
                "tests/image/image1.png",
                123,
            ),
            (
                123,
                {},
                "tests/image/image1.png",
                123,
            ),
            (
                123,
                123,
                "tests/image/image1.png",
                123,
            ),
            # Test file path
            (
                123,
                ImageType.JPG,
                None,
                123,
            ),
            (
                123,
                ImageType.JPG,
                "None",
                123,
            ),
            (
                123,
                ImageType.JPG,
                "",
                123,
            ),
            (
                123,
                ImageType.JPG,
                [],
                123,
            ),
            (
                123,
                ImageType.JPG,
                {},
                123,
            ),
            (
                123,
                ImageType.JPG,
                123,
                123,
            ),
        ],
    )
    def test_get_data(self, data, image_type, filepath, expected_data):
        """
        Test getting data
        """
        new_object = ImageMetadata(data, image_type, filepath)
        assert new_object.get_data() == expected_data

    @pytest.mark.parametrize(
        "data, image_type, filepath, expected_image_type",
        [
            # Test data
            (
                None,
                ImageType.JPG,
                "tests/image/image1.png",
                ImageType.JPG,
            ),
            (
                "None",
                ImageType.JPG,
                "tests/image/image1.png",
                ImageType.JPG,
            ),
            (
                "",
                ImageType.JPG,
                "tests/image/image1.png",
                ImageType.JPG,
            ),
            (
                [],
                ImageType.JPG,
                "tests/image/image1.png",
                ImageType.JPG,
            ),
            (
                {},
                ImageType.JPG,
                "tests/image/image1.png",
                ImageType.JPG,
            ),
            (
                123,
                ImageType.JPG,
                "tests/image/image1.png",
                ImageType.JPG,
            ),
            # Test image type
            (
                123,
                None,
                "tests/image/image1.png",
                None,
            ),
            (
                123,
                "None",
                "tests/image/image1.png",
                None,
            ),
            (
                123,
                "",
                "tests/image/image1.png",
                None,
            ),
            (
                123,
                [],
                "tests/image/image1.png",
                None,
            ),
            (
                123,
                {},
                "tests/image/image1.png",
                None,
            ),
            (
                123,
                123,
                "tests/image/image1.png",
                None,
            ),
            # Test file path
            (
                123,
                ImageType.JPG,
                None,
                ImageType.JPG,
            ),
            (
                123,
                ImageType.JPG,
                "None",
                ImageType.JPG,
            ),
            (
                123,
                ImageType.JPG,
                "",
                ImageType.JPG,
            ),
            (
                123,
                ImageType.JPG,
                [],
                ImageType.JPG,
            ),
            (
                123,
                ImageType.JPG,
                {},
                ImageType.JPG,
            ),
            (
                123,
                ImageType.JPG,
                123,
                ImageType.JPG,
            ),
        ],
    )
    def test_get_type(self, data, image_type, filepath, expected_image_type):
        """
        Tests getting image type
        """
        new_object = ImageMetadata(data, image_type, filepath)
        assert new_object.get_type() == expected_image_type

    @pytest.mark.parametrize(
        "data, image_type, filepath, expected_path",
        [
            # Test data
            (None, ImageType.JPG, "tests/image/image1.png", "tests/image/image1.png"),
            ("None", ImageType.JPG, "tests/image/image1.png", "tests/image/image1.png"),
            ("", ImageType.JPG, "tests/image/image1.png", "tests/image/image1.png"),
            ([], ImageType.JPG, "tests/image/image1.png", "tests/image/image1.png"),
            ({}, ImageType.JPG, "tests/image/image1.png", "tests/image/image1.png"),
            (123, ImageType.JPG, "tests/image/image1.png", "tests/image/image1.png"),
            # Test image type
            (123, None, "tests/image/image1.png", "tests/image/image1.png"),
            (123, "None", "tests/image/image1.png", "tests/image/image1.png"),
            (123, "", "tests/image/image1.png", "tests/image/image1.png"),
            (123, [], "tests/image/image1.png", "tests/image/image1.png"),
            (123, {}, "tests/image/image1.png", "tests/image/image1.png"),
            (123, 123, "tests/image/image1.png", "tests/image/image1.png"),
            # Test file path
            (123, ImageType.JPG, None, ""),
            (
                123,
                ImageType.JPG,
                "None",
                "None",
            ),
            (123, ImageType.JPG, "", ""),
            (123, ImageType.JPG, [], ""),
            (123, ImageType.JPG, {}, ""),
            (123, ImageType.JPG, 123, ""),
        ],
    )
    def test_get_path(self, data, image_type, filepath, expected_path):
        """
        Tests getting path
        """
        new_object = ImageMetadata(data, image_type, filepath)
        assert new_object.get_path() == expected_path
