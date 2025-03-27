from pydantic import Field, model_validator, Json
from typing import List, Optional, Literal, Any, Self
from datetime import datetime
import json
from ..models import TestResultModel
from ..lib.constants import ModelType, TestModelMode
from .base_model import MyBaseModel


class TestArguments(MyBaseModel):
    testDataset: str = Field(description="URI of test dataset")
    mode: Literal["upload", "api"] = Field(
        description="Mode of model used, upload for model file and api for model api"
    )
    modelType: Literal["classification", "regression"] = Field(description="AI model type")
    groundTruthDataset: Optional[str] = Field(default=None, description="URI of test dataset")
    groundTruth: Optional[str] = Field(default=None, description="Ground truth column name")
    algorithmArgs: Json[Any] = Field(
        description="Argument provided to the algorithm for running the tests. Test arguments should be defined in input.schema.json under each algorithm"
    )
    modelFile: Optional[str] = Field(default=None, description="URI of model file")

    @model_validator(mode="after")
    def check_mode(self) -> Self:
        if self.mode == "upload":
            assert self.modelFile is not None
        return self


class TestResult(MyBaseModel):
    testRunId: Optional[str] = None
    gid: str = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    cid: str = Field(
        description="Unique identifier for the algorithm within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    version: Optional[str] = Field(default=None, description="Algorithm version")
    startTime: datetime = Field(description="Start date time of test", strict=False)
    timeTaken: float = Field(description="Time taken to complete running the test in seconds.")
    testArguments: TestArguments = Field(description="Test arguments")
    output: str = Field(
        description="Output from algorithm running. Test output schema should be defined in output.schema.json under each algorithm"
    )
    artifacts: Optional[List[str]] = Field(
        default=None,
        description="List the test artifacts (e.g. images) produced by the algorithm, to be uploaded to API-GW",
    )

    @model_validator(mode="before")
    @classmethod
    def validate_to_json(cls, value: Any) -> Any:
        def _update_obj(obj):
            if "output" in obj and isinstance(obj["output"], dict):
                obj["output"] = json.dumps(obj["output"])
            if (
                "testArguments" in obj
                and "algorithmArgs" in obj["testArguments"]
                and isinstance(obj["testArguments"]["algorithmArgs"], dict)
            ):
                obj["testArguments"]["algorithmArgs"] = json.dumps(obj["testArguments"]["algorithmArgs"])
            return obj

        if isinstance(value, str):
            mydict = json.loads(value)
            _update_obj(mydict)
            return cls(**mydict)
        elif isinstance(value, dict):
            return _update_obj(value)
        return value


class TestResultOutput(TestResult):
    id: int  # test_result_id
    name: str  # name
    created_at: Optional[datetime] = Field(default=None, strict=False)
    updated_at: Optional[datetime] = Field(default=None, strict=False)

    @classmethod
    def from_model(cls, result: TestResultModel) -> "TestResultOutput":
        modelType = "regression" if result.model.model_type == ModelType.Regression else "classification"
        mode = "api" if result.model.mode == TestModelMode.API else "upload"
        algo_arguments = result.algo_arguments.decode("utf-8")
        test_argument = TestArguments(
            testDataset=result.test_dataset.filename,
            mode=mode,
            modelType=modelType,
            groundTruthDataset=result.ground_truth_dataset.filename,
            groundTruth=result.ground_truth,
            algorithmArgs=algo_arguments,
            modelFile=result.model.filename,
        )
        obj = TestResultOutput(
            id=result.id,
            name=result.name,
            created_at=result.created_at,
            updated_at=result.updated_at,
            gid=result.gid,
            cid=result.cid,
            version=result.version,
            startTime=result.start_time,
            timeTaken=result.time_taken,
            testArguments=test_argument,
            output=result.output.decode("utf-8"),
            artifacts=[artifact.filename for artifact in result.artifacts],
        )
        return obj


class TestResultUpdate(MyBaseModel):
    name: str = Field(description="Test Result Name", max_length=256, min_length=1)
