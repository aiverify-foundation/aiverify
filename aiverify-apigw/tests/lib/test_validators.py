from aiverify_apigw.lib.validators import *
import pytest


class TestValidateGidCid:
    """Test cases for the validate_gid_cid function."""

    @pytest.mark.parametrize("value", [
        "validGID123",
        "valid-CID_456",
        "valid.CID-789",
        "A1._-b2",
        "1validGID",
        "1234",  # Only numbers
        "ValidOnlyLetters",
    ])
    def test_valid_gid_cid(self, value):
        """Test with valid GID/CID values that should return True."""
        assert validate_gid_cid(value) is True

    @pytest.mark.parametrize("value", [
        " invalidGID123",  # Leading space
        "invalid*GID",  # Special character *
        "invalidGID!",  # Special character !
        "invalid GID",  # Space in the middle
        "-invalidGID",  # Starts with a hyphen
        ".invalidCID",  # Starts with a dot
        "_invalidCID",  # Starts with an underscore
        "",  # Empty string
        " ",  # Single space
        "invalid@GID",  # Special character @
    ])
    def test_invalid_gid_cid(self, value):
        """Test with invalid GID/CID values that should return False."""
        assert validate_gid_cid(value) is False

    def test_edge_cases(self):
        """Test edge cases for GID/CID validation."""
        assert validate_gid_cid("valid-123_") is True  # Edge valid case
        assert validate_gid_cid("-invalid") is False  # Edge invalid case starting with hyphen

    def test_empty_string(self):
        """Test with an empty string."""
        assert validate_gid_cid("") is False

    def test_special_characters(self):
        """Test with special characters that are not allowed."""
        assert validate_gid_cid("invalid#GID") is False
        assert validate_gid_cid("invalid$GID") is False
        assert validate_gid_cid("invalid%GID") is False
