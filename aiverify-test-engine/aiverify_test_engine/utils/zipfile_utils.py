import shutil
import zipfile
from pathlib import Path
from typing import Optional, Tuple

from aiverify_test_engine.utils.validate_checks import is_excluded


def extract_zipfile(
    zip_path: str,
) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """
    Extracts a ZIP archive to a temporary directory.

    Args:
        zip_path (str): The path to the ZIP archive to be extracted.

    Returns:
        Tuple[bool, Optional[str], Optional[str], Optional[str]]:
            Returns a tuple containing:
                - A boolean indicating success or failure
                - The path to the extracted folder if successful
                - An error message if there was an issue
                - The path to the temp directory where extraction occurred
    """
    temp_dir = None
    try:
        # Create a temporary directory to extract the ZIP file
        temp_dir = str(Path(zip_path).with_suffix("")) + "_temp"
        zipfile_name = Path(zip_path).with_suffix("").name
        print(zip_path)
        # Extract the ZIP file
        print("extracting")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)
            print("extracted")

        # Locate the directory inside temp_dir
        extracted_folders = [f for f in Path(temp_dir).iterdir() if f.is_dir()]
        extracted_folders = [f for f in extracted_folders if not is_excluded(f.name)]
        if not extracted_folders:
            shutil.rmtree(temp_dir)
            return (
                False,
                None,
                "No folder found inside the extracted ZIP archive",
                temp_dir,
            )

        # Get the folder that matches the zipfile name, or default to the first folder
        extracted_folder = None
        for folder in extracted_folders:
            if folder.name == zipfile_name:
                extracted_folder = folder
                break
        if not extracted_folder:
            extracted_folder = extracted_folders[0]
        return True, str(extracted_folder), None, temp_dir

    except Exception as e:
        error_message = f"Error while extracting ZIP archive: {str(e)}"
        if temp_dir and Path(temp_dir).exists():
            shutil.rmtree(temp_dir)
        return False, None, error_message, temp_dir
