from datetime import datetime

import pytest
from aiverify_test_engine.interfaces.itestresult import ITestArguments, ITestResult
from pydantic import AnyUrl, ValidationError


def test_valid_ittestarguments():
    valid_data = {
        "testDataset": "http://example.com/test-dataset",
        "mode": "upload",
        "modelType": "classification",
        "groundTruthDataset": "http://example.com/ground-truth-dataset",
        "groundTruth": "label",
        "algorithmArgs": {"arg1": "value1"},
        "modelFile": "http://example.com/model-file",
    }

    arguments = ITestArguments(**valid_data)
    assert str(arguments.testDataset) == valid_data["testDataset"]
    assert arguments.mode == valid_data["mode"]
    assert arguments.modelType == valid_data["modelType"]
    assert str(arguments.groundTruthDataset) == valid_data["groundTruthDataset"]
    assert arguments.groundTruth == valid_data["groundTruth"]
    assert arguments.algorithmArgs == valid_data["algorithmArgs"]
    assert str(arguments.modelFile) == valid_data["modelFile"]


def test_valid_ittestresult():
    valid_data = {
        "gid": "valid-id-123",
        "cid": "valid-cid-123",
        "version": "1.0.0",
        "startTime": datetime.now(),
        "timeTaken": 5.5,
        "testArguments": {
            "testDataset": "http://example.com/test-dataset",
            "mode": "upload",
            "modelType": "classification",
        },
        "output": {"accuracy": 0.95},
        "artifacts": ["artifact1.png", "artifact2.png"],
    }

    result = ITestResult(**valid_data)
    assert result.gid == valid_data["gid"]
    assert result.cid == valid_data["cid"]
    assert result.version == valid_data["version"]
    assert result.startTime == valid_data["startTime"]
    assert result.timeTaken == valid_data["timeTaken"]
    assert (
        str(result.testArguments.testDataset)
        == valid_data["testArguments"]["testDataset"]
    )


def test_model_type_lowercase():
    valid_data = {
        "testDataset": "http://example.com/test-dataset",
        "mode": "upload",
        "modelType": "Classification",
    }

    arguments = ITestArguments(**valid_data)
    assert arguments.modelType == "classification"


def test_path_to_uri():
    valid_data = {
        "testDataset": "example/test-dataset",
        "mode": "upload",
        "modelType": "classification",
    }

    arguments = ITestArguments(**valid_data)
    assert isinstance(arguments.testDataset, AnyUrl)


def test_invalid_mode_ittestarguments():
    invalid_data = {
        "testDataset": "http://example.com/test-dataset",
        "mode": "invalid_mode",
        "modelType": "classification",
    }

    with pytest.raises(ValidationError) as exc_info:
        ITestArguments(**invalid_data)

    assert "mode" in str(exc_info.value)


def test_invalid_model_type_ittestarguments():
    invalid_data = {
        "testDataset": "http://example.com/test-dataset",
        "mode": "upload",
        "modelType": "invalid_type",
    }

    with pytest.raises(ValidationError) as exc_info:
        ITestArguments(**invalid_data)

    assert "modelType" in str(exc_info.value)


def test_invalid_gid_ittestresult():
    invalid_data = {
        "gid": "",  # Invalid GID
        "cid": "valid-cid-123",
        "startTime": datetime.now(),
        "timeTaken": 5.5,
        "testArguments": {
            "testDataset": "http://example.com/test-dataset",
            "mode": "upload",
            "modelType": "classification",
        },
    }

    with pytest.raises(ValidationError) as exc_info:
        ITestResult(**invalid_data)

    assert "gid" in str(exc_info.value)


def test_invalid_cid_ittestresult():
    invalid_data = {
        "gid": "valid-id-123",
        "cid": "",  # Invalid CID
        "startTime": datetime.now(),
        "timeTaken": 5.5,
        "testArguments": {
            "testDataset": "http://example.com/test-dataset",
            "mode": "upload",
            "modelType": "classification",
        },
    }

    with pytest.raises(ValidationError) as exc_info:
        ITestResult(**invalid_data)

    assert "cid" in str(exc_info.value)


if __name__ == "__main__":
    pytest.main()
