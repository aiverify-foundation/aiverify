from pydantic import BaseModel, model_validator
from typing import Optional, Dict, Any
from enum import StrEnum, auto
from pathlib import Path


class ModeEnum(StrEnum):
    UPLOAD = auto()
    API = auto()


class TestRunTask(BaseModel):
    id: str
    mode: ModeEnum
    algorithmGID: str
    algorithmCID: str
    algorithmHash: Optional[str] = None
    algorithmArgs: Dict[str, Any]
    testDataset: str
    testDatasetHash: Optional[str] = None
    groundTruthDataset: Optional[str] = None
    groundTruthDatasetHash: Optional[str] = None
    groundTruth: Optional[str] = None
    modelFile: str
    modelFileHash: Optional[str] = None
    apiSchema: Optional[Dict[str, Any]] = None
    apiConfig: Optional[Dict[str, Any]] = None
    modelType: str

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


class PipeStageEnum(StrEnum):
    DOWNLOAD = auto()
    PIPELINE_BUILD = auto()
    VALIDATE_INPUT = auto()
    PIPELINE_EXECUTE = auto()
    VALIDATE_OUTPUT = auto()
    UPLOAD = auto()
    PIPELINE_ERROR = auto()


class PipelineData(BaseModel):
    task: TestRunTask
    algorithm_path: Path = Path()  # path to the algorithm folder
    algorithm_id: str = ""  # algorithm id
    algorithm_script_path: Path = Path()
    input_schema_path: Path = Path()
    output_schema_path: Path = Path()
    data_path: Path = Path()
    model_path: Path = Path()
    ground_truth_path: Path | None = None
    to_build: bool = False  # whether or not to run build
    intermediate_data: dict[str, Any] = {}
    output_zip: Path = Path()  # test results output
    error_message: Optional[str] = None  # error message on error
