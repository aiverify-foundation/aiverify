import warnings
import json
from typing import Dict, List, Optional, Tuple, Union, Literal
from pydantic import BaseModel, RootModel, Field, ValidationError


# Schema for Fairness Metrics


class FeatureDistribution(BaseModel):
    privileged_group: float
    unprivileged_group: float


class WeightedConfusionMatrix(BaseModel):
    tp: Optional[float] = None
    fp: Optional[float] = None
    tn: Optional[float] = None
    fn: Optional[float] = None


class FeatureImportance(RootModel):
    # Dict where key is feature name and value is a list containing:
    # [coefficient, percentage, conclusion_message, recommendation]
    root: Dict[str, List[Union[float, str]]]


class FeatureMetrics(BaseModel):
    fair_threshold: float
    privileged: List[List[Union[int, str]]]
    unprivileged: List[List[Union[int, str]]]
    feature_distribution: FeatureDistribution
    # Dict where key is metric name and value is [metric_value, threshold]
    fair_metric_values: Dict[str, Union[List[float], List[Literal["NA"]]]]
    fairness_conclusion: Literal["fair", "unfair"]
    tradeoff: Optional[Dict] = None
    feature_importance: Optional[FeatureImportance] = None


class CorrelationMatrix(BaseModel):
    feature_names: List[str]
    corr_values: List[List[float]]


class FairnessInit(BaseModel):
    fair_metric_name_input: str
    fair_metric_name: str
    perf_metric_name: str
    protected_features: List[str]
    fair_threshold_input: float
    fair_neutral_tolerance: float
    # Only present for classification models
    fair_priority: Optional[str] = None
    fair_concern: Optional[str] = None
    fair_impact: Optional[str] = None


class FairnessModel(BaseModel):
    fairness_init: FairnessInit
    # Performance metrics with names as keys and [value, std_dev] as values
    perf_metric_values: Dict[str, List[float]]
    # Optional class distribution (present in classification)
    class_distribution: Optional[Dict[str, float]] = None
    weighted_confusion_matrix: WeightedConfusionMatrix
    calibration_curve: Optional[Dict] = None
    perf_dynamic: Optional[Dict] = None
    correlation_matrix: Optional[CorrelationMatrix] = None
    features: Dict[str, FeatureMetrics]
    individual_fairness: Optional[Dict] = None


# Schema for Transparency Metrics
class PermutationScore(BaseModel):
    feature: str
    score: float


class FeatureInfo(BaseModel):
    Feature_name: str
    Value: Optional[float] = None
    Shap: float


class LocalInterpretability(BaseModel):
    id: int
    efx: float
    fx: float
    plot_display: bool
    feature_info: List[FeatureInfo]


class ModelDetails(BaseModel):
    id: int
    summary_plot: Optional[str] = None  # base64 encoded image
    summary_plot_data_table: Optional[str] = None
    local_interpretability: Optional[List[LocalInterpretability]] = None
    partial_dependence_plot: Optional[Dict] = None


class TransparencyResults(BaseModel):
    permutation: Optional[Dict[str, Optional[Union[str, List[PermutationScore]]]]] = Field(
        None, description="Contains permutation importance scores with title, footnote and scores"
    )
    model_list: List[ModelDetails] = Field(description="List of model specific transparency results")


# Overall Model Artifact Schema


class ModelArtifact(BaseModel):
    fairness: Optional[FairnessModel] = Field(None, description="Fairness analysis results")
    transparency: Optional[TransparencyResults] = Field(
        None, description="Transparency analysis results with permutation importance and model interpretability"
    )


def parse_model_artifact(data: dict) -> Tuple[Optional[ModelArtifact], List[str]]:
    """
    Parses and validates a dictionary into a ModelArtifact instance.
    Returns a tuple of (ModelArtifact instance if valid or None, list of messages)

    Parameters
    ----------
    data : dict
        The dictionary to validate against the ModelArtifact schema

    Returns
    -------
    Tuple[Optional[ModelArtifact], List[str]]
        - First element: ModelArtifact instance if validation passes, None if it fails
        - Second element: List of warning/error messages (empty if no issues)
    """
    messages = []

    # Check for missing or None top-level keys
    top_level_keys = ["fairness", "transparency"]

    for key in top_level_keys:
        if key not in data:
            warnings.warn(f"{key} key is missing")
        elif data[key] is None:
            warnings.warn(f"{key} key is present but value is None")

    # If no keys are present at all, fail validation
    if not any(key in data for key in top_level_keys):
        messages.append("Error: At least one of 'fairness' or 'transparency' must be present")
        return None, messages

    try:
        artifact = ModelArtifact.parse_obj(data)
        return artifact, messages

    except ValidationError as e:
        # Add validation error messages
        for error in e.errors():
            location = " -> ".join(str(loc) for loc in error["loc"])
            message = error["msg"]
            messages.append(f"Error at {location}: {message}")

        return None, messages


def parse_model_artifact_json(json_path: str) -> Tuple[Optional[ModelArtifact], List[str]]:
    """
    Parses and validates a JSON file into a ModelArtifact instance.

    Parameters
    ----------
    json_path : str
        The path to the JSON file to validate against the ModelArtifact schema

    Returns
    -------
    Tuple[Optional[ModelArtifact], List[str]]
        - First element: ModelArtifact instance if validation passes, None if it fails
        - Second element: List of warning/error messages (empty if no issues)
    """
    try:
        with open(json_path) as f:
            data = json.load(f)
    except FileNotFoundError:
        return None, [f"Error: File not found: {json_path}"]
    except json.JSONDecodeError as e:
        return None, [f"Error: Invalid JSON file: {str(e)}"]

    return parse_model_artifact(data)
