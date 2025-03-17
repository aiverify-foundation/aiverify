import json
import base64
import re
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any, Literal, Optional

from aiverify_test_engine.interfaces.itestresult import ITestArguments, ITestResult
from aiverify_test_engine.utils.json_utils import (
    load_schema_file,
    remove_numpy_formats,
    validate_json,
    validate_test_result_schema,
)
from aiverify_veritastool.util.schema import ModelArtifact, parse_model_artifact_json
from aiverify_veritastool.util.report_plots import generate_veritas_images


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


def process_dict(
    d: dict[str, Any], output_dir: Path, parent_key: str = "", _root_call: bool = True
) -> tuple[dict[str, Any], list[str]]:
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
        Processed dictionary with image paths instead of base64 strings and added artifacts list
    """
    result = {}
    image_paths = []

    def process_value(value, current_key: str) -> tuple[Any, list[str]]:
        if isinstance(value, dict):
            processed = process_dict(value, output_dir, current_key, False)
            # Collect any nested artifacts
            nested_paths = processed.pop("artifacts", []) if "artifacts" in processed else []
            return processed, nested_paths

        if isinstance(value, str) and is_base64_image(value):
            path = save_base64_image(value, output_dir, current_key)
            return path, [path]

        return value, []

    for key, value in d.items():
        current_key = f"{parent_key}_{key}" if parent_key else key

        if isinstance(value, list):
            result[key] = []
            for i, item in enumerate(value):
                processed, paths = process_value(item, f"{current_key}_{i}")
                result[key].append(processed)
                image_paths.extend(paths)
        else:
            processed, paths = process_value(value, current_key)
            result[key] = processed
            image_paths.extend(paths)

    if image_paths:
        result["artifacts"] = image_paths

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


def infer_model_type(results: dict) -> Literal["classification", "regression"]:
    """
    Infer whether the model is classification or regression based on model artifact fields.

    Parameters
    ----------
    results : dict
        The model artifact dictionary

    Notes
    -----
    Classification models typically have:
    - class_distribution field
    - weighted_confusion_matrix with tp, fp, tn, fn
    - fairness metrics related to classification (e.g. disparate impact)

    Regression models typically:
    - Don't have class_distribution
    - Don't have confusion matrix
    - Have regression-specific metrics
    """
    fairness = results.get("fairness")
    if fairness is None:
        raise RuntimeError("Cannot infer model type - fairness data is missing")

    if "class_distribution" in fairness and fairness["class_distribution"]:
        return "classification"

    wcm = fairness.get("weighted_confusion_matrix")
    if (
        wcm
        and any(metric in wcm for metric in ["tp", "fp", "tn", "fn"])
        and all(wcm[metric] in wcm for metric in ["tp", "fp", "tn", "fn"])
    ):
        return "classification"

    # Check fairness metrics
    features = fairness.get("features", {})
    if features:
        # Get first feature's metrics
        first_feature = next(iter(features.values()))
        fair_metrics = first_feature.get("fair_metric_values", {})

        # Classification-specific metrics
        classification_metrics = {
            "Demographic Parity",
            "Equal Opportunity",
            "False Positive Rate Parity",
            "True Negative Rate Parity",
        }

        # Regression-specific metrics
        regression_metrics = {
            "Root Mean Squared Error",
            "Mean Absolute Percentage Error",
            "Weighted Absolute Percentage Error",
        }

        metric_names = set(fair_metrics.keys())

        if metric_names & classification_metrics:
            return "classification"
        if metric_names & regression_metrics:
            return "regression"

    # Fallback - look at performance metrics
    perf_metrics = fairness.get("perf_metric_values", {})
    if perf_metrics:
        # Classification-specific metrics
        if any(
            metric in perf_metrics.keys()
            for metric in [
                "Demographic Parity",
                "Equal Opportunity",
                "False Positive Rate Parity",
                "True Negative Rate Parity",
            ]
        ):
            return "classification"

        # Regression-specific metrics
        if any(
            metric in perf_metrics.keys()
            for metric in [
                "Root Mean Squared Error",
                "Mean Absolute Percentage Error",
                "Weighted Absolute Percentage Error",
            ]
        ):
            return "regression"

    raise RuntimeError("Cannot definitively infer model type from the data")


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
    results = remove_numpy_formats(results)
    module_root = Path(__file__).parent.parent

    if not validate_json(
        results,
        load_schema_file(str(module_root / "output.schema.json")),
    ):
        raise RuntimeError("Failed output schema validation")

    f = open(str(module_root / "algo.meta.json"))
    meta_file = json.load(f)

    model_type = test_args.get("model_type", "")
    if not model_type:
        try:
            model_type = infer_model_type(results)
        except RuntimeError as e:
            raise RuntimeError(f"Could not determine model type: {str(e)}")

    if model_type not in ["classification", "regression"]:
        raise RuntimeError("Invalid model type - must be either classification or regression")

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

    # Process results to extract images from base64 strings
    processed_results = process_dict(results, output_dir)

    # Generate visualization images from the model artifact
    visualization_images, report_plots_structure = generate_veritas_images(results, output_dir)

    # Combine artifacts from processed_results and visualization_images
    artifacts = processed_results.pop("artifacts", []) if "artifacts" in processed_results else []
    artifacts.extend(visualization_images)

    # Add report_plots structure to the output results
    for section, data in report_plots_structure.items():
        if section in processed_results:
            if processed_results[section] is None:
                processed_results[section] = data
            else:
                processed_results[section].update(data)
        else:
            processed_results[section] = data

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
        artifacts=artifacts,
    )

    output_json = output.model_dump_json(exclude_none=True)
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
