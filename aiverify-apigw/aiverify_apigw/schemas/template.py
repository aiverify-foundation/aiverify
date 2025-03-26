from pydantic import Field
from typing import List, Optional, Annotated
from ..models import TemplateModel
from .base_model import MyBaseModel


class TemplateMeta(MyBaseModel):
    cid: str = Field(
        description="Unique identifier for the template within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(description="Template name", min_length=1, max_length=256)
    description: Optional[str] = Field(default=None, description="Template description", max_length=4096)
    author: Optional[str] = Field(default=None, description="Template author", max_length=256)
    version: Optional[str] = Field(
        default=None,
        description="Version of the template, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Template tags, used for searching", max_length=128
    )


class TemplateOutput(TemplateMeta):
    gid: Optional[str] = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )

    @classmethod
    def from_model(cls, result: TemplateModel) -> "TemplateOutput":
        obj = cls(
            cid=result.cid,
            gid=result.plugin.gid,
            name=result.name,
            description=result.description,
            author=result.author,
            version=result.version,
            tags=[str(tag.name) for tag in result.tags] if result.tags else None
        )
        return obj
