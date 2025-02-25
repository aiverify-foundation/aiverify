import json
import os
import pytest
from pydantic import ValidationError
from aiverify_veritastool.util.schema import (
    ModelArtifact,
    parse_model_artifact,
    parse_model_artifact_json,
    FeatureDistribution,
    WeightedConfusionMatrix,
    FeatureImportance,
)

@pytest.fixture
def sample_valid_data():
    """Fixture providing sample valid data"""
    return {
        "fairness": {
            "fairness_init": {
                "fair_metric_name_input": "disparate_impact",
                "fair_metric_name": "disparate_impact",
                "perf_metric_name": "accuracy",
                "protected_features": ["gender", "race"],
                "fair_threshold_input": 0.8,
                "fair_neutral_tolerance": 0.05,
                "fair_priority": "benefit",
                "fair_concern": "eligible",
                "fair_impact": "normal"
            },
            "perf_metric_values": {"accuracy": [0.85, 0.02]},
            "weighted_confusion_matrix": {
                "tp": 100.0,
                "fp": 20.0,
                "tn": 80.0,
                "fn": 10.0
            },
            "features": {
                "gender": {
                    "fair_threshold": 0.8,
                    "privileged": [[1, "male"]],
                    "unprivileged": [[0, "female"]],
                    "feature_distribution": {
                        "privileged_group": 0.6,
                        "unprivileged_group": 0.4
                    },
                    "fair_metric_values": {
                        "disparate_impact": [0.85, 0.8]
                    },
                    "fairness_conclusion": "fair"
                }
            }
        }
    }

@pytest.fixture
def sample_invalid_data():
    """Fixture providing sample invalid data"""
    return {
        "fairness": {
            "fairness_init": {
                # Missing required fields
                "fair_metric_name_input": "disparate_impact",
                "fair_metric_name": "disparate_impact"
            }
        }
    }

def test_feature_distribution_model():
    """Test FeatureDistribution model validation"""
    # Valid case
    valid_data = {"privileged_group": 0.6, "unprivileged_group": 0.4}
    distribution = FeatureDistribution(**valid_data)
    assert distribution.privileged_group == 0.6
    assert distribution.unprivileged_group == 0.4

    # Invalid case
    with pytest.raises(ValidationError):
        FeatureDistribution(privileged_group="invalid", unprivileged_group=0.4)

def test_weighted_confusion_matrix_model():
    """Test WeightedConfusionMatrix model validation"""
    # Valid case
    valid_data = {"tp": 100.0, "fp": 20.0, "tn": 80.0, "fn": 10.0}
    matrix = WeightedConfusionMatrix(**valid_data)
    assert matrix.tp == 100.0

    # Valid case with optional fields
    partial_data = {"tp": 100.0, "fp": 20.0}
    matrix = WeightedConfusionMatrix(**partial_data)
    assert matrix.tn is None

def test_feature_importance_model():
    """Test FeatureImportance model validation"""
    valid_data = {
        "feature1": [0.5, 25.0, "High importance", "Consider keeping"],
        "feature2": [0.3, 15.0, "Medium importance", "Monitor"]
    }
    importance = FeatureImportance(valid_data)
    assert importance.root["feature1"][0] == 0.5 

def test_parse_model_artifact_valid(sample_valid_data):
    """Test parsing valid model artifact data"""
    artifact, messages = parse_model_artifact(sample_valid_data)
    assert artifact is not None
    assert len(messages) == 0
    assert isinstance(artifact, ModelArtifact)
    assert artifact.fairness.fairness_init.fair_metric_name == "disparate_impact"

def test_parse_model_artifact_invalid(sample_invalid_data):
    """Test parsing invalid model artifact data"""
    artifact, messages = parse_model_artifact(sample_invalid_data)
    assert artifact is None
    assert len(messages) > 0
    assert any("Error at" in message for message in messages)

def test_parse_model_artifact_empty():
    """Test parsing empty model artifact data"""
    artifact, messages = parse_model_artifact({})
    assert artifact is None
    assert len(messages) > 0
    assert "At least one of 'fairness' or 'transparency' must be present" in messages[0]

@pytest.fixture
def temp_json_file(tmp_path, sample_valid_data):
    """Fixture to create a temporary JSON file"""
    file_path = tmp_path / "test_artifact.json"
    with open(file_path, 'w') as f:
        json.dump(sample_valid_data, f)
    return str(file_path)

def test_parse_model_artifact_json_valid(temp_json_file):
    """Test parsing valid JSON file"""
    artifact, messages = parse_model_artifact_json(temp_json_file)
    assert artifact is not None
    assert len(messages) == 0
    assert isinstance(artifact, ModelArtifact)

def test_parse_model_artifact_json_nonexistent():
    """Test parsing non-existent JSON file"""
    artifact, messages = parse_model_artifact_json("nonexistent.json")
    assert artifact is None
    assert len(messages) == 1
    assert "File not found" in messages[0]

def test_parse_model_artifact_json_invalid_json(tmp_path):
    """Test parsing invalid JSON file"""
    invalid_json_path = tmp_path / "invalid.json"
    with open(invalid_json_path, 'w') as f:
        f.write("invalid json content")

    artifact, messages = parse_model_artifact_json(str(invalid_json_path))
    assert artifact is None
    assert len(messages) == 1
    assert "Invalid JSON file" in messages[0]
