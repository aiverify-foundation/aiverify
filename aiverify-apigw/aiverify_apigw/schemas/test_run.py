from pydantic import BaseModel, Field
from typing import Optional, Any, Dict

import json
from ..lib.constants import TestModelMode, TestRunStatus
from ..models.test_run_model import TestRunModel
from .test_result import TestResultOutput


class TestRunInput(BaseModel):
    mode: TestModelMode
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
                    "algorithmCID": "aiverfy_accumulated_local_effect",
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
    status: TestRunStatus = Field(description="Status of the test run")
    testResult: Optional[TestResultOutput] # only when status is success
    errorMessage: Optional[str] # only when status is error

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
            testResult=TestResultOutput.from_model(test_run.test_result) if test_run.status == TestRunStatus.Success else None,
            errorMessage=test_run.error_messages if test_run.status == TestRunStatus.Error else None
        )
