import pytest
import io
import hashlib
from aiverify_apigw.lib.file_utils import (
    check_valid_filename,
    check_file_size,
    append_filename,
    get_suffix,
    get_stem,
    get_file_digest,
    sanitize_filename,
    compute_file_hash,
    InvalidFilename,
)


class TestCheckValidFilename:
    def test_valid_filename(self):
        assert check_valid_filename("valid_filename.txt") is True
        assert check_valid_filename("valid123.txt") is True
        assert check_valid_filename("valid_name/with_path.txt") is True

    def test_invalid_filename(self):
        assert check_valid_filename("invalid@filename.txt") is False
        assert check_valid_filename("../invalid_path.txt") is False


class TestCheckFileSize:
    def test_valid_size(self):
        assert check_file_size(4294967296) is True  # 4 GB
        assert check_file_size(1000000) is True

    def test_invalid_size(self):
        assert check_file_size(4294967297) is False  # 4 GB + 1 byte


class TestAppendFilename:
    def test_append_filename(self):
        assert append_filename("file.txt", "_new") == "file_new.txt"
        assert append_filename("path/to/file.txt", "_new") == "file_new.txt"


class TestGetSuffix:
    def test_get_suffix(self):
        assert get_suffix("file.txt") == ".txt"
        assert get_suffix("file.TXT") == ".txt"
        assert get_suffix("file.tar.gz") == ".gz"


class TestGetStem:
    def test_get_stem(self):
        assert get_stem("file.txt") == "file"
        assert get_stem("path/to/file.txt") == "file"


class TestGetFileDigest:
    def test_get_file_digest(self):
        contents = io.BytesIO(b"test content")
        digest = get_file_digest(contents)
        assert isinstance(digest, bytes)
        assert len(digest) == 32  # SHA-256 digest is 32 bytes


class TestSanitizeFilename:
    def test_sanitize_valid_filename(self):
        assert sanitize_filename("valid_filename.txt") == "valid_filename.txt"
        assert sanitize_filename("valid123.txt") == "valid123.txt"

    def test_sanitize_invalid_filename(self):
        with pytest.raises(InvalidFilename):
            sanitize_filename("@invalid_filename.txt")
        assert sanitize_filename("invalid@filename.txt") == "invalidfilename.txt"


class TestComputeFileHash:
    def test_compute_file_hash(self, tmp_path):
        file_path = tmp_path / "test_file.txt"
        file_path.write_text("test content")
        file_hash = compute_file_hash(file_path)
        assert isinstance(file_hash, str)
        assert len(file_hash) == 64  # SHA-256 hash is 64 characters long
        assert file_hash == hashlib.sha256(b"test content").hexdigest()