import shutil
from pathlib import Path

import pytest
from aiverify_test_engine.utils.zipfile_utils import extract_zipfile


class TestExtractZipfile:
    @pytest.fixture
    def zip_filepath(self):
        return str(
            Path(__file__).parent / "io/user_defined_files/sklearn_pipeline_files.zip"
        )

    def test_extract_zipfile_success(self, zip_filepath):
        success, extracted_path, error_message, temp_dir = extract_zipfile(zip_filepath)
        assert success
        assert extracted_path is not None
        assert temp_dir is not None
        assert not error_message
        assert (Path(temp_dir) / "sklearn_pipeline_files").exists()

        shutil.rmtree(temp_dir)

    def test_extract_zipfile_invalid(self):
        # Create an invalid zip file
        temp_dir = Path("temp_zip_invalid")
        temp_dir.mkdir(parents=True, exist_ok=True)
        invalid_zip_path = temp_dir / "invalid.zip"
        with open(invalid_zip_path, "wb") as f:
            f.write(b"Not a zip file")

        success, extracted_path, error_message, _ = extract_zipfile(invalid_zip_path)
        assert not success
        assert extracted_path is None
        assert "Error while extracting ZIP archive" in error_message

        shutil.rmtree(temp_dir)
