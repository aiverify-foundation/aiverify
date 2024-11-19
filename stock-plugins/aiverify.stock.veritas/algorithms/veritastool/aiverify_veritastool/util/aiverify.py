import json
import base64
import re
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from aiverify_test_engine.interfaces.itestresult import ITestArguments, ITestResult
from aiverify_test_engine.utils.json_utils import load_schema_file, validate_json, validate_test_result_schema
from aiverify_veritastool.util.schema import ModelArtifact, parse_model_artifact_json
from jsonschema.validators import validate


def save_base64_image(base64_str: str, output_dir: Path, image_name: str) -> str:
    """
    Save a base64 encoded image to a file and return the relative path.

    Parameters
    ----------
    base64_str : str
        The base64 encoded image string
    output_dir : Path
        Directory to save the image
    image_name : str
        Name for the image file

    Returns
    -------
    str
        Relative path to the saved image
    """
    try:
        # Remove data URL prefix if present
        if base64_str.startswith("data:image"):
            base64_str = re.sub("^data:image/.+;base64,", "", base64_str)

        # Create images directory
        images_dir = output_dir / "images"
        images_dir.mkdir(exist_ok=True)

        # Generate image path
        image_path = images_dir / f"{image_name}.png"

        # Decode and save image
        image_data = base64.b64decode(base64_str)
        with open(image_path, "wb") as f:
            f.write(image_data)

        # Return relative path from output directory
        return str(image_path.relative_to(output_dir))

    except Exception as e:
        print(f"Warning: Failed to save image {image_name}: {str(e)}")
        return base64_str  # Return original string if saving fails


def process_dict(d: dict[str, Any], output_dir: Path, parent_key: str = "") -> dict[str, Any]:
    """
    Recursively process dictionary to find and save base64 encoded images.

    Parameters
    ----------
    d : Dict[str, Any]
        Dictionary to process
    output_dir : Path
        Directory to save images
    parent_key : str
        Parent key for naming images

    Returns
    -------
    Dict[str, Any]
        Processed dictionary with image paths instead of base64 strings
    """
    result = {}

    for key, value in d.items():
        current_key = f"{parent_key}_{key}" if parent_key else key

        if isinstance(value, dict):
            result[key] = process_dict(value, output_dir, current_key)

        elif isinstance(value, list):
            result[key] = [
                process_dict(item, output_dir, f"{current_key}_{i}")
                if isinstance(item, dict)
                else save_base64_image(item, output_dir, f"{current_key}_{i}")
                if isinstance(item, str) and is_base64_image(item)
                else item
                for i, item in enumerate(value)
            ]

        elif isinstance(value, str) and is_base64_image(value):
            result[key] = save_base64_image(value, output_dir, current_key)

        else:
            result[key] = value

    return result


def is_base64_image(s: str) -> bool:
    """
    Check if a string is likely a base64 encoded image.

    Parameters
    ----------
    s : str
        String to check

    Returns
    -------
    bool
        True if string appears to be base64 encoded image
    """
    if not isinstance(s, str):
        return False

    # Check for common image data URL patterns
    if s.startswith("data:image"):
        return True

    # Check if string is base64 encoded
    try:
        # Check if string is base64 encoded and reasonably long
        if len(s) > 100:  # Arbitrary minimum length for an image
            base64.b64decode(s)
            return True
    except:
        pass

    return False


def convert_veritas_artifact_to_aiverify(
    model_artifact_path: Optional[str] = None,
    model_artifact: Optional[ModelArtifact] = None,
    output_dir: Optional[str] = None,
    test_args: Optional[dict] = {},
) -> None:
    """
    Format the output results into the AI Verify Test Result and write to a JSON file.
    Extracts and saves any base64 encoded images to separate files.
    """
    if model_artifact_path is None and model_artifact is None:
        raise RuntimeError("Either model artifact path or model artifact must be provided")

    if model_artifact_path is not None:
        model_artifact, _ = parse_model_artifact_json(model_artifact_path)

    if model_artifact is None:
        raise RuntimeError("Model artifact is None")

    results = model_artifact.dict()
    module_root = Path(__file__).parent.parent

    schema = load_schema_file(str(module_root / "output.schema.json"))
    validate(instance=results, schema=schema)

    if not validate_json(
        results,
        load_schema_file(str(module_root / "output.schema.json")),
    ):
        raise RuntimeError("Failed output schema validation")

    f = open(str(module_root / "algo.meta.json"))
    meta_file = json.load(f)

    model_type = test_args.get("model_type", "")
    if model_type not in ["classification", "regression"]:
        raise RuntimeError("Invalid model type - model_type in test_args must be either classification or regression")
    model_path = test_args.get("model_path", "")
    ground_truth = get_test_arg_or_warn(test_args, "ground_truth")
    data_path = get_test_arg_or_warn(test_args, "data_path")
    ground_truth_path = get_test_arg_or_warn(test_args, "ground_truth_path")
    algorithm_args = test_args.get("algorithm_args", {})

    # Prepare test arguments
    test_arguments = ITestArguments(
        groundTruth=ground_truth,
        modelType=model_type,
        testDataset=data_path,
        modelFile=model_path,
        groundTruthDataset=ground_truth_path,
        algorithmArgs=algorithm_args,
        mode="upload",
    )

    # Create output directory
    output_dir = Path(output_dir) if output_dir is not None else Path.cwd() / "output"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Process results to extract images
    processed_results = process_dict(results, output_dir)

    # Create the output result
    startTime = datetime.now().isoformat()
    output = ITestResult(
        gid=meta_file["gid"],
        cid=meta_file["cid"],
        version=meta_file.get("version"),
        startTime=startTime,
        timeTaken=0,
        testArguments=test_arguments,
        output=processed_results,
    )

    output_json = output.json(exclude_none=True, indent=4)
    output_path = output_dir / "results.json"

    if validate_test_result_schema(json.loads(output_json)) is True:
        with open(output_path, "w") as json_file:
            json_file.write(output_json)
    else:
        raise RuntimeError("Failed test result schema validation")


def get_test_arg_or_warn(test_args: dict, key: str) -> str:
    """
    Get the value of a test argument
    """
    if key not in test_args:
        warnings.warn(f"{key} key is missing")
    return test_args.get(key, "")
