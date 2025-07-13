from pydantic import Field
from typing import List, Optional, Annotated
from datetime import datetime
import json

from .base_model import MyBaseModel
from ..models import InputBlockModel, InputBlockDataModel, InputBlockGroupDataModel
from ..lib.constants import InputBlockSize

sample_data: dict = {
    "elaboration-2.1.1": "Documented as part of company's software development process.",
    "completed-2.1.1": "Yes"
}
sample_cid: str = "explainability_process_checklist"
sample_gid: str = "aiverify.stock.process_checklist"


class InputBlockMeta(MyBaseModel):
    cid: str = Field(
        description="Unique identifier for the input block within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(description="Input Block name",
                      min_length=1, max_length=256)
    version: Optional[str] = Field(
        default=None,
        description="Version of the input block, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    author: Optional[str] = Field(
        default=None, description="Input block author", min_length=1, max_length=256)
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Input block tags, used for searching", max_length=128
    )
    description: Optional[str] = Field(
        default=None, description="Input Block description", max_length=4096)
    group: Optional[str] = Field(
        default=None, description="Input Block group", min_length=1, max_length=256)
    groupNumber: Optional[int] = Field(
        default=None, description="Input Block group number")
    width: Optional[InputBlockSize] = Field(
        default=InputBlockSize.md, description="Width of Input Block dialog",
        strict=False
    )
    fullScreen: Optional[bool] = Field(
        default=False, description="Width of Input Block dialog")


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
            tags=[str(tag.name)
                  for tag in result.tags] if result.tags else None,
            description=result.description,
            group=result.group,
            groupNumber=result.groupNumber,
            width=result.width,
            fullScreen=result.fullscreen
        )
        return obj


class InputBlockData(MyBaseModel):
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
    # group: Optional[str] = Field(  # Added the group field with validation
    #     description="Unique group identifier to ensure each group contains unique checklists",
    #     min_length=1,
    #     max_length=128,
    #     default=None
    # )
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


class InputBlockDataUpdate(MyBaseModel):
    name: str = Field(
        description="Name for this input block data",
        min_length=1,
        max_length=128,
    )
    data: dict = Field(description="User data")
    # group: str = Field(
    #     description="Group name for this input block data",
    #     min_length=1,
    #     max_length=128,
    # )

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
    created_at: Optional[datetime] = Field(description="Time created", strict=False)
    updated_at: Optional[datetime] = Field(description="Time updated", strict=False)

    @classmethod
    def from_model(cls, result: InputBlockDataModel) -> "InputBlockDataOutput":
        return InputBlockDataOutput(
            id=result.id,
            gid=result.gid,
            cid=result.cid,
            name=result.name,
            # group=result.group,
            # groupNumber=result.groupNumber,
            data=json.loads(result.data.decode("utf-8")),
            created_at=result.created_at,
            updated_at=result.updated_at,
        )


class InputBlockGroupChild(MyBaseModel):
    cid: str = Field(
        description="Unique identifier for the input block within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    groupNumber: Optional[int] = None
    name: str
    data: dict = Field(description="User data")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "cid": sample_cid,
                    "data": sample_data
                }
            ]
        }
    }

    id: int = Field(description="Input block data id")

    @classmethod
    def from_model(cls, result: InputBlockDataModel) -> "InputBlockGroupChild":
        return InputBlockGroupChild(
            id=result.id,
            cid=result.cid,
            name=result.inputblock.name,
            data=json.loads(result.data.decode("utf-8")),
            groupNumber=result.group_number, 
        )


class InputBlockGroupChildInput(MyBaseModel):
    cid: str = Field(
        description="Unique identifier for the input block within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    data: dict = Field(description="User data")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "cid": sample_cid,
                    "data": sample_data
                }
            ]
        }
    }


class InputBlockGroupData(MyBaseModel):
    name: str = Field(description="User defined name of the input block group", min_length=1, max_length=256)
    group: str = Field(description="input block group as defined in the input block meta", min_length=1, max_length=256)
    gid: str = Field(description="GID of the input block group", min_length=1, max_length=128)
    input_blocks: List[InputBlockGroupChild]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Sample Process Checklist Group",
                    "group": "AI Verify Process Checklists",
                    "gid": sample_gid,
                    "input_blocks": [
                        {
                            "cid": sample_cid,
                            "data": sample_data,
                        }
                    ]
                }
            ]
        }
    }


class InputBlockGroupDataInput(MyBaseModel):
    name: str = Field(description="User defined name of the input block group", min_length=1, max_length=256)
    group: str = Field(description="input block group as defined in the input block meta", min_length=1, max_length=256)
    gid: str = Field(description="GID of the input block group", min_length=1, max_length=128)
    input_blocks: List[InputBlockGroupChildInput]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Sample Process Checklist Group",
                    "group": "AI Verify Process Checklists",
                    "gid": sample_gid,
                    "input_blocks": [
                        {
                            "cid": sample_cid,
                            "data": sample_data,
                        }
                    ]
                }
            ]
        }
    }


class InputBlockGroupChildUpdate(MyBaseModel):
    cid: str = Field(
        description="Unique identifier for the input block within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    data: dict = Field(description="User data")
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "cid": sample_cid,
                    "data": sample_data
                }
            ]
        }
    }


class InputBlockGroupDataUpdate(MyBaseModel):
    name: Optional[str] = Field(description="Name of the input block group", min_length=1, max_length=256, default=None)
    input_blocks: Optional[List[InputBlockGroupChildUpdate]] = None


class InputBlockGroupDataOutput(InputBlockGroupData):
    id: int = Field(description="Input block group data id")
    created_at: Optional[datetime] = Field(description="Time created", strict=False)
    updated_at: Optional[datetime] = Field(description="Time updated", strict=False)

    @classmethod
    def from_model(cls, result: InputBlockGroupDataModel) -> "InputBlockGroupDataOutput":
        input_blocks = [InputBlockGroupChild.from_model(ib) for ib in result.input_blocks]
        return InputBlockGroupDataOutput(
            id=result.id,
            name=result.name,
            gid=result.gid,
            group=result.group,
            input_blocks=input_blocks,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
