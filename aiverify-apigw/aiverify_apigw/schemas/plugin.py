from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


class PluginMeta(BaseModel):
    gid: str = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r'^[a-zA-Z0-9][a-zA-Z0-9-._]*$'
    )
    version: str = Field(
        description="Version of the plugin",
        min_length=1,
        max_length=256
    )
    name: str = Field(
        description="Plugin name",
        min_length=1,
        max_length=128
    )
    author: Optional[str] = Field(
        default=None,
        description="Plugin author",
        max_length=128
    )
    description: Optional[str] = Field(
        default=None,
        description="Plugin description",
        max_length=256
    )
    url: Optional[HttpUrl] = Field(
        default=None,
        description="URL of project page",
        max_length=2048,
    )
