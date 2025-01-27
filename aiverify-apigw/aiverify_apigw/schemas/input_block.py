from pydantic import BaseModel, Field
from typing import List, Optional, Annotated
from datetime import datetime
import json

from ..models import InputBlockModel, InputBlockDataModel
from ..lib.constants import InputBlockSize

sample_data: dict = {
    "elaboration-2.1.1": "Documented as part of company's software development process.",
    "completed-2.1.1": "Yes"
}
sample_cid: str = "explainability_process_checklist"


class InputBlockMeta(BaseModel):
    cid: str = Field(
        description="Unique identifier for the input block within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(description="Input Block name", min_length=1, max_length=256)
    version: Optional[str] = Field(
        default=None,
        description="Version of the input block, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    author: Optional[str] = Field(default=None, description="Input block author", min_length=1, max_length=256)
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Input block tags, used for searching", max_length=128
    )
    description: Optional[str] = Field(default=None, description="Input Block description", max_length=4096)
    group: Optional[str] = Field(default=None, description="Input Block group", min_length=1, max_length=256)
    groupNumber: Optional[int] = Field(default=None, description="Input Block group number")
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


class InputBlockData(BaseModel):
    gid: str = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    cid: str = Field(
        description="Unique identifier for the input block within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(
        description="Name for this input block data",
        min_length=1,
        max_length=128,
    )
    data: dict = Field(description="User data")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": sample_cid,
                    "gid": "aiverify.stock.process_checklist",
                    "cid": sample_cid,
                    "data": sample_data
                }
            ]
        }
    }


class InputBlockDataUpdate(BaseModel):
    name: str = Field(
        description="Name for this input block data",
        min_length=1,
        max_length=128,
    )
    data: dict = Field(description="User data")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": sample_cid,
                    "data": sample_data
                }
            ]
        }
    }


class InputBlockDataOutput(InputBlockData):
    id: int = Field(description="Input block data id")
    created_at: Optional[datetime] = Field(description="Time created")
    updated_at: Optional[datetime] = Field(description="Time updated")

    @classmethod
    def from_model(cls, result: InputBlockDataModel) -> "InputBlockDataOutput":
        return InputBlockDataOutput(
            id=result.id,
            gid=result.gid,
            cid=result.cid,
            name=result.name,
            data=json.loads(result.data.decode("utf-8")),
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
