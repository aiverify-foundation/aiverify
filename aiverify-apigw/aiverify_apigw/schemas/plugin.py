from pydantic import BaseModel, Field, HttpUrl, TypeAdapter, AnyHttpUrl
from typing import Optional, List

from ..models import PluginModel
from .algorithm import AlgorithmOutput


class PluginMeta(BaseModel):
    gid: str = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    version: str = Field(description="Version of the plugin", min_length=1, max_length=256)
    name: str = Field(description="Plugin name", min_length=1, max_length=128)
    author: Optional[str] = Field(default=None, description="Plugin author", max_length=128)
    description: Optional[str] = Field(default=None, description="Plugin description", max_length=256)
    url: Optional[HttpUrl] = Field(
        default=None,
        description="URL of project page",
        max_length=2048,
    )


class PluginOutput(PluginMeta):
    meta: str = Field(description="Content from the plugin meta file")
    is_stock: bool = Field(description="Whether this is a stock plugin", default=False)
    zip_hash: Optional[str] = Field(description="File hash of plugin zip")
    algorithms: List[AlgorithmOutput] = Field(description="List of algorithms", default=[])

    @classmethod
    def from_model(cls, result: PluginModel) -> "PluginOutput":
        url = TypeAdapter(AnyHttpUrl).validate_python(result.url) if result.url else None
        obj = PluginOutput(
            gid=result.gid,
            version=result.version,
            name=result.name,
            is_stock=result.is_stock,
            author=result.author,
            description=result.description,
            url=url,
            meta=result.meta.decode("utf-8"),
            algorithms=[AlgorithmOutput.from_model(algo) for algo in result.algorithms],
            zip_hash=result.zip_hash,
        )
        return obj
