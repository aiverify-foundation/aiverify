from pydantic import BaseModel, Field
from typing import List, Optional, Annotated
from ..models import InputBlockModel
from ..lib.constants import InputBlockSize


class InputBlockMeta(BaseModel):
    cid: str = Field(
        description="Unique identifier for the input block within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(description="Input Block name", min_length=1, max_length=128)
    version: Optional[str] = Field(
        default=None,
        description="Version of the input block, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    author: Optional[str] = Field(default=None, description="Input block author", min_length=1, max_length=128)
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Input block tags, used for searching", max_length=128
    )
    description: Optional[str] = Field(default=None, description="Input Block description", max_length=256)
    group: Optional[str] = Field(default=None, description="Input Block group", min_length=1, max_length=128)
    width: Optional[InputBlockSize] = Field(
        default="md", description="Width of Input Block dialog"
    )
    fullScreen: Optional[bool] = Field(default=False, description="Width of Input Block dialog")


class InputBlockOutput(InputBlockMeta):
    gid: Optional[str] = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )

    @classmethod
    def from_model(cls, result: InputBlockModel) -> "InputBlockOutput":
        obj = cls(
            cid=result.cid,
            gid=result.plugin.gid,
            name=result.name,
            version=result.version,
            author=result.author,
            tags=[str(tag.name) for tag in result.tags] if result.tags else None,
            description=result.description,
            group=result.group,
            width=result.width,
            fullScreen=result.fullscreen
        )
        return obj
