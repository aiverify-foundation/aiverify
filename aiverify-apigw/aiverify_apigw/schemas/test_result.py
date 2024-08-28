from pydantic import BaseModel, Field, Json, model_validator
from typing import List, Optional, Literal, Any, Self
from datetime import datetime


class TestArguments(BaseModel):
    testDataset: str = Field(
        description="URI of test dataset"
    )
    mode: Literal['upload', 'api'] = Field(
        description="Mode of model used, upload for model file and api for model api"
    )
    modelType: Literal['classification', 'regression'] = Field(
        description="AI model type"
    )
    groundTruthDataset: Optional[str] = Field(
        default=None,
        description="URI of test dataset"
    )
    groundTruth: Optional[str] = Field(
        default=None,
        description="Ground truth column name"
    )
    algorithmArgs: Json[Any] = Field(
        description="Argument provided to the algorithm for running the tests. Test arguments should be defined in input.schema.json under each algorithm"
    )
    modelFile: Optional[str] = Field(
        default=None,
        description="URI of model file"
    )

    @model_validator(mode="after")
    def check_mode(self) -> Self:
        if self.mode == 'upload':
            assert self.modelFile is not None
        return self


class TestResult(BaseModel):
    gid: str = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r'^[a-zA-Z0-9][a-zA-Z0-9-._]*$'
    )
    cid: str = Field(
        description="Unique identifier for the algorithm within the plugin",
        min_length=1,
        max_length=128,
        pattern=r'^[a-zA-Z0-9][a-zA-Z0-9-._]*$'
    )
    version: Optional[str] = Field(
        description="Algorithm version"
    )
    start_time: datetime = Field(
        description="Start date time of test"
    )
    time_taken: float = Field(
        description="Time taken to complete running the test in seconds."
    )
    test_arguments: TestArguments = Field(
        description="Test arguments"
    )
    output: Json[Any] = Field(
        description="Output from algorithm running. Test output schema should be defined in output.schema.json under each algorithm"
    )
    artifacts: Optional[List[str]] = Field(
        description="List the test artifacts (e.g. images) produced by the algorithm, to be uploaded to API-GW"
    )
