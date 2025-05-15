from pydantic import Field
from typing import Optional, Any, Dict

import json
from ..lib.constants import TestModelMode, TestRunStatus
from ..models.test_run_model import TestRunModel
from .test_result import TestResultOutput
from .base_model import MyBaseModel


class TestRunInput(MyBaseModel):
    mode: TestModelMode = Field(strict=False)
    algorithmGID: str
    algorithmCID: str
    algorithmArgs: Dict[str, Any]
    testDatasetFilename: str
    groundTruthDatasetFilename: Optional[str] = None
    groundTruth: Optional[str] = None
    modelFilename: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "mode": "upload",
                    "algorithmGID": "aiverify.stock.accumulated_local_effect",
                    "algorithmCID": "aiverify_accumulated_local_effect",
                    "algorithmArgs": {},
                    "modelFilename": "sample_bc_credit_sklearn_linear.LogisticRegression.sav",
                    "testDatasetFilename": "sample_bc_credit_data.sav",
                    "groundTruthDatasetFilename": "sample_bc_credit_data.sav",
                    "groundTruth": "default"
                }
            ]
        }
    }


class TestRunOutput(TestRunInput):
    id: str # Test run unique identifier
    status: TestRunStatus = Field(description="Status of the test run", strict=False)
    progress: int = Field(default=0, ge=0, le=100)
    testResult: Optional[TestResultOutput] # only when status is success
    errorMessages: Optional[str] # only when status is error

    @classmethod
    def from_model(cls, test_run: TestRunModel) -> "TestRunOutput":
        return cls(
            id=str(test_run.id),
            mode=test_run.model.mode,
            algorithmGID=test_run.algorithm.gid,
            algorithmCID=test_run.algorithm.cid,
            algorithmArgs=json.loads(test_run.algo_arguments),
            testDatasetFilename=test_run.test_dataset.filename,
            groundTruthDatasetFilename=test_run.ground_truth_dataset.filename if test_run.ground_truth_dataset else None,
            groundTruth=test_run.ground_truth,
            modelFilename=test_run.model.filename if test_run.model.filename else "", # filename should never be None
            status=test_run.status,
            progress=test_run.progress,
            testResult=TestResultOutput.from_model(test_run.test_result) if test_run.status == TestRunStatus.Success and test_run.test_result else None,
            errorMessages=test_run.error_messages if test_run.status == TestRunStatus.Error else None
        )


class TestRunStatusUpdate(MyBaseModel):
    status: Optional[TestRunStatus] = Field(default=None, strict=False)
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    errorMessages: Optional[str] = None
