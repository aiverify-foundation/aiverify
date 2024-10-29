from pydantic import BaseModel, Field
from typing import List, Optional, Annotated
from ..models import AlgorithmModel
from enum import StrEnum


class AlgorithmMeta(BaseModel):
    class ModelTypeEnum(StrEnum):
        CLASSIFICATION = "classification"
        REGRESSION = "regression"

    cid: str = Field(
        description="Unique identifier for the algorithm within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    gid: Optional[str] = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(description="Algorithm name", min_length=1, max_length=128)
    modelType: List[ModelTypeEnum] = Field(description="AI model type", min_length=1, max_length=2)
    version: Optional[str] = Field(
        default=None,
        description="Version of the algorithm, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    author: Optional[str] = Field(default=None, description="Algorithm author", min_length=1, max_length=128)
    description: Optional[str] = Field(default=None, description="Plugin description", max_length=256)
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Tags describing this algorithm", max_length=100
    )
    requireGroundTruth: Optional[bool] = Field(default=True, description="Does this algorithm requires ground truth?")


class AlgorithmOutput(AlgorithmMeta):
    language: Optional[str] = Field(description="Algorithm language", default=None)
    script: Optional[str] = Field(description="Algorithm language", default=None)
    module_name: Optional[str] = Field(description="Algorithm language", default=None)
    zip_hash: Optional[str] = Field(description="File hash of algorithm zip")

    @classmethod
    def from_model(cls, result: AlgorithmModel) -> "AlgorithmOutput":
        obj = AlgorithmOutput(
            cid=result.cid,
            gid=result.gid,
            name=result.name,
            modelType=[cls.ModelTypeEnum(mtype) for mtype in result.model_type.split(",")],
            version=result.version,
            author=result.author,
            description=result.description,
            tags=[str(tag.name) for tag in result.tags],
            requireGroundTruth=result.require_ground_truth,
            language=result.language,
            script=result.script,
            module_name=result.module_name,
            zip_hash=result.zip_hash,
        )
        return obj
