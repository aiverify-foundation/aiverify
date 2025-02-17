from pydantic import BaseModel, model_validator
from typing import Optional, Dict, Any, List
from enum import StrEnum, auto

class ModeEnum(StrEnum):
    UPLOAD = auto()
    API = auto()

class TestRunTask(BaseModel):
    id: str
    mode: ModeEnum
    algorithmId: str 
    algorithmHash: Optional[str] = None
    algorithmArgs: Dict[str, Any]
    testDataset: str
    testDatasetHash: Optional[str] = None
    groundTruthDataset: Optional[str] = None
    groundTruthDatasetHash: Optional[str] = None
    groundTruth: Optional[str] = None
    modelFile: Optional[str] = None
    modelFileHash: Optional[str] = None
    apiSchema: Optional[Dict[str, Any]] = None
    apiConfig: Optional[Dict[str, Any]] = None
    modelType: Optional[str] = None

    # @model_validator(mode='before')
    # @classmethod
    # def validate_mode(cls, data: Any) -> Dict[str, Any]:
    #     return data

    @model_validator(mode='after')
    def validate_mode_requirements(self):
        if self.mode == ModeEnum.UPLOAD and not self.modelFile:
            raise ValueError("modelFile is required when mode is UPLOAD")
        if self.mode == ModeEnum.API and (not self.apiSchema or not self.apiConfig):
            raise ValueError("apiSchema and apiConfig are required when mode is API")
        return self
    

class PipeStageEum(StrEnum):
    DOWNLOAD = auto()
    VALIDATE_INPUT = auto()
    PIPE_BUILD = auto()
    PIPE_EXECUTE = auto()
    VALIDATE_OUTPUT = auto()
    UPLOAD = auto()    

class PipelineData(BaseModel):
    task: TestRunTask
    intermediate_data: dict[PipeStageEum, Any] = {}
    output: Optional[dict[str,Any]] = None # test results output
    artifacts: Optional[List[str]] = None # list of artifact filenames
    error_message: Optional[str] = None # error message on error

