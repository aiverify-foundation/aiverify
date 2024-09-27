from uu import decode
from pydantic import BaseModel, Field, HttpUrl, TypeAdapter, AnyHttpUrl
from typing import Optional

from ..models import PluginModel


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


class PluginOutput(PluginMeta):
    meta: str = Field(
        description="Content from the plugin meta file"
    )

    @classmethod
    def from_model(cls, result: PluginModel) -> "PluginOutput":
        url = TypeAdapter(AnyHttpUrl).validate_python(result.url) if result.url else None
        obj = PluginOutput(
            gid = result.gid,
            version=result.version,
            name=result.name,
            author=result.author,
            description=result.description,
            url=url,
            meta=result.meta.decode("utf-8")
        )
        return obj
