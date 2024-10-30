from pydantic import BaseModel, Field
from typing import List, Optional, Annotated


class TemplateMeta(BaseModel):
    cid: str = Field(
        description="Unique identifier for the template within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(description="Template name", min_length=1, max_length=128)
    description: Optional[str] = Field(default=None, description="Template description", max_length=256)
    author: Optional[str] = Field(default=None, description="Template author", max_length=128)
    version: Optional[str] = Field(
        default=None,
        description="Version of the template, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Template tags, used for searching", max_length=128
    )
