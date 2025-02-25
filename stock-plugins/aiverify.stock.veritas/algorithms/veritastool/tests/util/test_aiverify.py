import base64
import json
import os
from pathlib import Path
import pytest

from aiverify_veritastool.util.aiverify import (
    save_base64_image,
    process_dict,
    is_base64_image,
    infer_model_type,
    convert_veritas_artifact_to_aiverify,
    get_test_arg_or_warn
)
from aiverify_veritastool.util.schema import ModelArtifact

@pytest.fixture
def valid_model_artifact_data():
    """Fixture providing valid model artifact data"""
    return {
        "fairness": {
            "fairness_init": {
                "fair_metric_name_input": "disparate_impact",
                "fair_metric_name": "disparate_impact",
                "perf_metric_name": "accuracy",
                "protected_features": ["gender"],
                "fair_threshold_input": 0.8,
                "fair_neutral_tolerance": 0.05,
                "fair_priority": "benefit",
                "fair_concern": "eligible",
                "fair_impact": "normal"
            },
            "perf_metric_values": {
                "accuracy": [0.85, 0.02]
            },
            "weighted_confusion_matrix": {
                "tp": 100.0,
                "fp": 20.0,
                "tn": 80.0,
                "fn": 10.0
            },
            "class_distribution": {
                "0": 0.7,
                "1": 0.3
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
        },
        "transparency": None
    }

@pytest.fixture
def sample_base64_image():
    """Fixture providing a sample base64 encoded image"""
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

def test_save_base64_image(tmp_path, sample_base64_image):
    """Test saving base64 encoded image"""
    output_dir = tmp_path
    image_name = "test_image"

    result = save_base64_image(sample_base64_image, output_dir, image_name)

    assert result == f"images/{image_name}.png"
    assert (output_dir / "images" / f"{image_name}.png").exists()

def test_process_dict(tmp_path, sample_base64_image, monkeypatch):
    """Test processing dictionary with base64 images"""
    test_dict = {
        "image": f"data:image/png;base64,{sample_base64_image}",
        "nested": {
            "image": f"data:image/png;base64,{sample_base64_image}"
        },
        "list": [
            f"data:image/png;base64,{sample_base64_image}",
            {"image": f"data:image/png;base64,{sample_base64_image}"}
        ],
        "normal": "text"
    }

    def mock_save_base64_image(*args, **kwargs):
        return "images/test.png"

    monkeypatch.setattr('aiverify_veritastool.util.aiverify.save_base64_image', mock_save_base64_image)
    result = process_dict(test_dict, tmp_path)

    assert result["image"] == "images/test.png"
    assert result["nested"]["image"] == "images/test.png"
    assert result["list"][0] == "images/test.png"
    assert result["list"][1]["image"] == "images/test.png"
    assert result["normal"] == "text"

def test_is_base64_image(sample_base64_image):
    """Test base64 image detection"""
    valid_data_url = f"data:image/png;base64,{sample_base64_image}"
    assert is_base64_image(valid_data_url)

    assert not is_base64_image("not base64")
    assert not is_base64_image(123)
    assert not is_base64_image(None)
    assert not is_base64_image("short")

def test_infer_model_type(valid_model_artifact_data):
    """Test model type inference"""
    assert infer_model_type(valid_model_artifact_data) == "classification"

    regression_results = {
        "fairness": {
            "perf_metric_values": {
                "Root Mean Squared Error": [0.5]
            }
        }
    }
    assert infer_model_type(regression_results) == "regression"

    with pytest.raises(RuntimeError):
        infer_model_type({})

def test_convert_veritas_artifact(tmp_path, valid_model_artifact_data, monkeypatch):
    """Test converting Veritas artifact to AI Verify format"""
    def mock_validate_json(*args, **kwargs):
        return True

    def mock_load_schema_file(*args, **kwargs):
        return {}

    def mock_json_load(*args, **kwargs):
        return {"gid": "test", "cid": "test", "version": "1.0"}

    monkeypatch.setattr('aiverify_veritastool.util.aiverify.validate_json', mock_validate_json)
    monkeypatch.setattr('aiverify_veritastool.util.aiverify.load_schema_file', mock_load_schema_file)
    monkeypatch.setattr('json.load', mock_json_load)

    test_artifact = ModelArtifact(**valid_model_artifact_data)

    convert_veritas_artifact_to_aiverify(
        model_artifact=test_artifact,
        output_dir=str(tmp_path),
        test_args={"model_type": "classification"}
    )

    assert (tmp_path / "results.json").exists()

def test_get_test_arg_or_warn():
    """Test getting test arguments with warning"""
    test_args = {"existing_key": "value"}

    assert get_test_arg_or_warn(test_args, "existing_key") == "value"

    with pytest.warns(UserWarning):
        assert get_test_arg_or_warn(test_args, "missing_key") == ""

@pytest.mark.parametrize("model_type,expected_error", [
    (None, RuntimeError),
    ("invalid", RuntimeError),
    ("classification", None),
    ("regression", None),
])
def test_convert_veritas_artifact_model_type_validation(
    model_type, expected_error, tmp_path, valid_model_artifact_data, monkeypatch
):
    """Test model type validation in convert_veritas_artifact"""
    test_artifact = ModelArtifact(**valid_model_artifact_data)

    test_args = {
        "ground_truth": "test_ground_truth",
        "data_path": "test_data_path",
        "ground_truth_path": "test_ground_truth_path"
    }

    if model_type is not None:
        test_args["model_type"] = model_type

    def mock_validate_json(*args, **kwargs):
        return True

    def mock_load_schema_file(*args, **kwargs):
        return {}

    def mock_json_load(*args, **kwargs):
        return {"gid": "test", "cid": "test", "version": "1.0"}

    def mock_infer_model_type(*args, **kwargs):
        if model_type is None:
            raise RuntimeError("Cannot infer model type")
        return model_type if model_type in ["classification", "regression"] else "classification"

    monkeypatch.setattr('aiverify_veritastool.util.aiverify.validate_json', mock_validate_json)
    monkeypatch.setattr('aiverify_veritastool.util.aiverify.load_schema_file', mock_load_schema_file)
    monkeypatch.setattr('json.load', mock_json_load)
    monkeypatch.setattr('aiverify_veritastool.util.aiverify.infer_model_type', mock_infer_model_type)

    if expected_error:
        with pytest.raises(expected_error):
            convert_veritas_artifact_to_aiverify(
                model_artifact=test_artifact,
                output_dir=str(tmp_path),
                test_args=test_args
            )
    else:
        convert_veritas_artifact_to_aiverify(
            model_artifact=test_artifact,
            output_dir=str(tmp_path),
            test_args=test_args
        )
        assert (tmp_path / "results.json").exists()
        
def test_process_dict(tmp_path, sample_base64_image, monkeypatch):
    """Test processing dictionary with base64 images"""
    test_dict = {
        "image": f"data:image/png;base64,{sample_base64_image}",
        "nested": {
            "image": f"data:image/png;base64,{sample_base64_image}"
        },
        "list": [
            f"data:image/png;base64,{sample_base64_image}",
            {"image": f"data:image/png;base64,{sample_base64_image}"}
        ],
        "normal": "text"
    }

    def mock_save_base64_image(*args, **kwargs):
        return "images/test.png"

    monkeypatch.setattr('aiverify_veritastool.util.aiverify.save_base64_image', mock_save_base64_image)
    result = process_dict(test_dict, tmp_path)

    # Test image paths are correctly replaced
    assert result["image"] == "images/test.png"
    assert result["nested"]["image"] == "images/test.png"
    assert result["list"][0] == "images/test.png"
    assert result["list"][1]["image"] == "images/test.png"
    assert result["normal"] == "text"
    
    # Test artifacts field
    assert "artifacts" in result
    assert len(result["artifacts"]) == 4
    assert all(path == "images/test.png" for path in result["artifacts"])

def test_process_dict_no_images(tmp_path):
    """Test processing dictionary without base64 images"""
    test_dict = {
        "text": "hello",
        "nested": {
            "number": 123
        },
        "list": ["a", "b", {"text": "c"}]
    }

    result = process_dict(test_dict, tmp_path)

    # Verify original structure is maintained
    assert result["text"] == "hello"
    assert result["nested"]["number"] == 123
    assert result["list"] == ["a", "b", {"text": "c"}]
    
    # Verify no artifacts field when no images
    assert "artifacts" not in result
