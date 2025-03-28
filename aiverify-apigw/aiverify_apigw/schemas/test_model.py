from pydantic import Field
from typing import Optional
from datetime import datetime

from .model_api import ModelAPIType, ModelAPIParametersMapping
from ..models.test_model_model import TestModelModel
from ..lib.constants import TestModelMode, TestModelFileType, TestModelStatus, ModelType
from .base_model import MyBaseModel


class TestModelAPIInput(MyBaseModel):
    name: str = Field(description="Name of the model", min_length=1, max_length=256)
    description: Optional[str] = Field(description="Description of the model", max_length=4096)
    modelType: ModelType = Field(description="Type of the model", strict=False)
    modelAPI: ModelAPIType = Field(description="Model API configuration", strict=False)
    parameterMappings: Optional[ModelAPIParametersMapping] = Field(description="Parameter mappings", default=None)


class TestModelUpdate(MyBaseModel):
    name: Optional[str] = Field(description="Name of the model", min_length=1, max_length=256, default=None)
    description: Optional[str] = Field(description="Description of the model", max_length=4096, default=None)
    modelType: Optional[ModelType] = Field(description="Type of the model", default=None, strict=False)
    modelAPI: Optional[ModelAPIType] = Field(description="Model API Configuration", default=None, strict=False)
    parameterMappings: Optional[ModelAPIParametersMapping] = Field(description="Parameter mappings", default=None)


class TestModel(MyBaseModel):
    id: int = Field(description="Unique identifier for the model")
    name: str = Field(description="Name of the model", min_length=1, max_length=256)
    description: Optional[str] = Field(description="Description of the model", max_length=4096)
    mode: TestModelMode = Field(description="Mode to indicate whether it's upload or api", strict=False)
    modelType: ModelType = Field(description="Type of the model", strict=False)
    # model file
    fileType: Optional[TestModelFileType] = Field(description="File type of model upload", default=None, strict=False)
    filename: Optional[str] = Field(description="Filename of the model upload", max_length=2048, default=None)
    zip_hash: Optional[str] = Field(description="File hash of plugin zip")
    size: Optional[int] = Field(description="Size of the model file", default=None)
    serializer: Optional[str] = Field(description="Serializer used for the model upload", default=None)
    modelFormat: Optional[str] = Field(description="Format of the model upload", default=None)
    # model api
    modelAPI: Optional[ModelAPIType] = Field(description="Model API, if mode == API", default=None, strict=False)
    parameterMappings: Optional[ModelAPIParametersMapping] = Field(description="Parameter mappings if mode == API", default=None)
    # status
    status: TestModelStatus = Field(description="Status of the model file", strict=False)
    errorMessages: Optional[str] = Field(description="Error messages related to the model", max_length=2048, default=None)
    created_at: Optional[datetime] = Field(description="Timestamp when the model was created", default=None, strict=False)
    updated_at: Optional[datetime] = Field(description="Timestamp when the model was last updated", default=None, strict=False)

    # @model_validator(mode='after')
    # def validate_model(self) -> Self:
    #     if self.mode == TestModelMode.API and not self.modelAPI:
    #         raise ValueError("modelAPI field is required if type is API")
    #     if self.mode != TestModelMode.API and not self.filename:
    #         raise ValueError("filename is required if type is not API")
    #     return self

    @classmethod
    def from_model(cls, model: TestModelModel) -> "TestModel":
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            mode=model.mode,
            modelType=model.model_type,
            fileType=model.file_type,
            filename=model.filename,
            zip_hash=model.zip_hash,
            size=model.size,
            serializer=model.serializer,
            modelFormat=model.model_format,
            modelAPI=ModelAPIType.model_validate_json(model.model_api.decode('utf-8')) if model.model_api else None,
            parameterMappings=ModelAPIParametersMapping.model_validate_json(model.parameter_mappings.decode('utf-8')) if model.parameter_mappings else None,
            status=model.status,
            errorMessages=model.error_message,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
