import pytest
from aiverify_apigw.lib.utils import *


class TestGuessMimetypeFromFilename:

    @pytest.mark.parametrize("filename, expected_mimetype", [
        ("example.txt", "text/plain"),
        ("image.png", "image/png"),
        ("document.pdf", "application/pdf"),
        ("archive.zip", "application/zip"),
        ("music.mp3", "audio/mpeg"),
    ])
    def test_known_mimetype(self, filename, expected_mimetype):
        """Test with filenames that have known MIME types."""
        assert guess_mimetype_from_filename(filename) == expected_mimetype

    @pytest.mark.parametrize("filename", [
        "unknownfile.unknownext",
        "noextension",
        ".hiddenfile",
        "file.with.multiple.dots.invalidext"
    ])
    def test_unknown_mimetype(self, filename):
        """Test with filenames that have unknown or no MIME types."""
        assert guess_mimetype_from_filename(filename) is None

    @pytest.mark.parametrize("filename, expected_mimetype", [
        ("readme.md", mimetypes.types_map.get(".md", None)),  # Depending on system configuration
        ("styles.css", "text/css"),
        ("script.js", "application/javascript"),
    ])
    def test_edge_cases(self, filename, expected_mimetype):
        """Test edge cases and less common file extensions."""
        assert guess_mimetype_from_filename(filename) == expected_mimetype

    def test_empty_filename(self):
        """Test with an empty filename."""
        assert guess_mimetype_from_filename("") is None

    def test_only_extension(self):
        """Test with filename that only contains an extension."""
        assert guess_mimetype_from_filename(".txt") is None

    def test_filename_with_spaces(self):
        """Test with filenames that include spaces."""
        assert guess_mimetype_from_filename("my file.txt") == "text/plain"
