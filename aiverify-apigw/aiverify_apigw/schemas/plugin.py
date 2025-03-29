from pydantic import Field, HttpUrl, TypeAdapter, AnyHttpUrl
from typing import Optional, List
from datetime import datetime

from ..models import PluginModel
from .algorithm import AlgorithmOutput
from .widget import WidgetOutput
from .input_block import InputBlockOutput
from .template import TemplateOutput
from .base_model import MyBaseModel


class PluginMeta(MyBaseModel):
    gid: str = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    version: str = Field(description="Version of the plugin", min_length=1, max_length=256)
    name: str = Field(description="Plugin name", min_length=1, max_length=256)
    author: Optional[str] = Field(default=None, description="Plugin author", max_length=245)
    description: Optional[str] = Field(default=None, description="Plugin description", max_length=4096)
    url: Optional[HttpUrl] = Field(
        default=None,
        description="URL of project page",
        max_length=2048,
        strict=False
    )


class PluginOutput(PluginMeta):
    meta: str = Field(description="Content from the plugin meta file")
    is_stock: bool = Field(description="Whether this is a stock plugin", default=False)
    zip_hash: Optional[str] = Field(description="File hash of plugin zip")
    algorithms: List[AlgorithmOutput] = Field(description="List of algorithms", default=[], strict=False)
    widgets: List[WidgetOutput] = Field(description="List of widgets", default=[], strict=False)
    input_blocks: List[InputBlockOutput] = Field(description="List of input blocks", default=[], strict=False)
    templates: List[TemplateOutput] = Field(description="List of templates", default=[], strict=False)
    created_at: Optional[datetime] = Field(default=None, strict=False)
    updated_at: Optional[datetime] = Field(default=None, strict=False)

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
            widgets=[WidgetOutput.from_model(widget) for widget in result.widgets],
            input_blocks=[InputBlockOutput.from_model(ib) for ib in result.inputblocks],
            templates=[TemplateOutput.from_model(template) for template in result.templates],
            zip_hash=result.zip_hash,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
        return obj
