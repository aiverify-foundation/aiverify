from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator, AnyUrl, Json
from datetime import datetime
from typing import Optional, List, Any
from typing_extensions import Self
import json

from ..lib.constants import TestModelMode, ModelType
from ..lib.validators import gid_cid_regex
from ..models.test_result_model import TestResultModel

router = APIRouter(
    prefix="/test_result",
    tags=["test_result"]
)

# schemas
class TestArgument(BaseModel):
    testDataset: AnyUrl
    groundTruthDataset: Optional[AnyUrl]
    groundTruth: str = Field(max_length=128)
    modelFile: Optional[str]
    algorithmArgs: Json
    mode: TestModelMode
    modelType: ModelType

    @model_validator(mode="after")
    def check_mode(self) -> Self:
        if self.mode == TestModelMode.Upload:
            assert self.modelFile is not None
        return self


class TestResultUpload(BaseModel):
    gid: str = Field(max_length=128, pattern=gid_cid_regex)
    cid: str = Field(max_length=128, pattern=gid_cid_regex)
    version: Optional[str] = Field(max_length=128)
    start_time: datetime 
    time_taken: float = Field(ge=0)
    test_arguments: TestArgument
    output: Json  # output from algos
    artifacts: Optional[List[str]]


@router.get("/")
async def read_test_results():
    return {"message": "List of test results"}

from fastapi import UploadFile, File
from fastapi.responses import JSONResponse

@router.post("/upload")
async def upload_test_result(
    test_result: TestResultUpload,
    artifacts: Optional[List[UploadFile]] = None
):
    # Process uploaded files
    artifact_paths = []
    if artifacts:
        for artifact in artifacts:
            file_location = f"some/directory/{artifact.filename}"
            with open(file_location, "wb") as file:
                file.write(artifact.file.read())
            artifact_paths.append(file_location)

    # todo: validate test_arguments and output

    # Create a new TestResultModel instance
    test_result_model = TestResultModel(
        gid=test_result.gid,
        cid=test_result.cid,
        version=test_result.version,
        start_time=test_result.start_time,
        time_taken=test_result.time_taken,
        algo_arguments=json.dumps(test_result.test_arguments).encode('utf-8'),
        output=json.dumps(test_result.output).encode('utf-8'),
        artifacts=artifact_paths
    )

    # Here you would typically add the test_result_model to the database
    # For example: db_session.add(test_result_model)
    # db_session.commit()

    return JSONResponse(content={"message": "Test result uploaded successfully", "test_result_id": test_result_model.id})


