from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Annotated


class AlgorithmMeta(BaseModel):
    cid: str = Field(
        description="Unique identifier for the algorithm within the plugin",
        min_length=1,
        max_length=128,
        pattern=r'^[a-zA-Z0-9][a-zA-Z0-9-._]*$'
    )
    name: str = Field(
        description="Algorithm name",
        min_length=1,
        max_length=128
    )
    modelType: List[Literal['classification', 'regression']] = Field(
        description="AI model type",
        min_length=1,
        max_length=2
    )
    version: Optional[str] = Field(
        default=None,
        description="Version of the algorithm, default to plugin version if not specified",
        min_length=1,
        max_length=256
    )
    author: Optional[str] = Field(
        default=None,
        description="Algorithm author",
        min_length=1,
        max_length=128
    )
    description: Optional[str] = Field(
        default=None,
        description="Plugin description",
        max_length=256
    )
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None,
        description="Tags describing this algorithm",
        max_length=100
    )
    requireGroundTruth: Optional[bool] = Field(
        default=True,
        description="Does this algorithm requires ground truth?"
    )
