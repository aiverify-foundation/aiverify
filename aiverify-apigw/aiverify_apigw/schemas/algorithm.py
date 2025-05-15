from pydantic import Field
from typing import List, Optional, Annotated
from enum import StrEnum
import json

from ..models import AlgorithmModel
from .base_model import MyBaseModel


class AlgorithmMeta(MyBaseModel):
    class ModelTypeEnum(StrEnum):
        CLASSIFICATION = "classification"
        REGRESSION = "regression"
        UPLIFT = "uplift"

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
    name: str = Field(description="Algorithm name", min_length=1, max_length=256)
    modelType: List[ModelTypeEnum] = Field(description="AI model type", min_length=1, max_length=3, strict=False)
    version: Optional[str] = Field(
        default=None,
        description="Version of the algorithm, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    author: Optional[str] = Field(default=None, description="Algorithm author", min_length=1, max_length=256)
    description: Optional[str] = Field(default=None, description="Plugin description", max_length=4096)
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Tags describing this algorithm", max_length=100
    )
    requireGroundTruth: Optional[bool] = Field(default=True, description="Does this algorithm requires ground truth?")


class AlgorithmOutput(AlgorithmMeta):
    language: Optional[str] = Field(description="Algorithm language", default=None)
    script: Optional[str] = Field(description="Algorithm language", default=None)
    module_name: Optional[str] = Field(description="Algorithm language", default=None)
    inputSchema: Optional[dict] = Field(description="Algorithm input schema", default=None)
    outputSchema: Optional[dict] = Field(description="Algorithm output schema", default=None)
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
            inputSchema=json.loads(result.input_schema.decode("utf-8")),
            outputSchema=json.loads(result.output_schema.decode("utf-8")),
            zip_hash=result.zip_hash,
        )
        return obj
