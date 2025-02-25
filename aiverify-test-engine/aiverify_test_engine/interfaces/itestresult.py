from datetime import datetime
from typing import List, Optional

from aiverify_test_engine.utils.url_utils import get_absolute_path
from pydantic import AnyUrl, BaseModel, ConfigDict, Field, FileUrl, field_validator


class ITestArguments(BaseModel):
    testDataset: AnyUrl | FileUrl = Field(..., description="URI of test dataset")
    mode: str = Field(
        ...,
        description="Mode of model used, upload for model file and api for model api",
        pattern="^(upload|api)$",
    )
    modelType: str = Field(
        ..., description="AI model type", pattern="^(classification|regression)$"
    )
    groundTruthDataset: Optional[AnyUrl | FileUrl] = Field(
        None, description="URI of ground truth dataset"
    )
    groundTruth: Optional[str] = Field(None, description="Ground truth column name")
    algorithmArgs: Optional[dict] = Field(
        None,
        description="Arguments provided to the algorithm for running the tests. Test arguments should be defined in input.schema.json under each algorithm",  # noqa: E501
    )
    modelFile: Optional[AnyUrl | FileUrl] = Field(None, description="URI of model file")

    @field_validator("modelType", mode="before")
    @classmethod
    def validate_model_type(cls, value):
        return value.lower()

    @field_validator("testDataset", "groundTruthDataset", "modelFile", mode="before")
    @classmethod
    def validate_uri(cls, value):
        return get_absolute_path(value)


class ITestResult(BaseModel):
    """
    AI Verify algorithm test result schema
    """

    gid: str = Field(
        ...,
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    cid: str = Field(
        ...,
        description="Unique identifier for the algorithm within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    version: Optional[str] = Field(None, description="Algorithm version")
    startTime: datetime = Field(..., description="Start date time of test")
    timeTaken: float = Field(
        ..., description="Time taken to complete running the test in seconds."
    )
    testArguments: ITestArguments = Field(..., description="Test arguments")
    output: Optional[dict] = Field(
        None,
        description="Output from algorithm running. Test output schema should be defined in output.schema.json under each algorithm",  # noqa: E501
    )
    artifacts: Optional[List[str]] = Field(
        None,
        description="List the test artifacts (e.g., images) produced by the algorithm, to be uploaded to API-GW",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "/aiverify.algorithm.testresult.schema.json",
            "title": "Algorithm Output Schema",
            "description": "AI Verify algorithm output schema",
        }
    )
