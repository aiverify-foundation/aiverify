from pydantic import Field, ConfigDict, model_validator, field_validator
from typing import List, Optional, Self, Any
from datetime import datetime
from enum import StrEnum, auto
import json
from ..models import ProjectTemplateModel
from .base_model import MyBaseModel

from .load_examples import load_examples
project_template_examples = load_examples("project_template_examples.json")


class GlobalVariable(MyBaseModel):
    key: str = Field(description="Property key", min_length=1, max_length=128)
    value: str = Field(description="Property value", max_length=128)


class LayoutItemProperties(MyBaseModel):
    justifyContent: Optional[str] = Field(default=None)
    alignItems: Optional[str] = Field(default=None)
    textAlign: Optional[str] = Field(default=None)
    color: Optional[str] = Field(default=None)
    bgcolor: Optional[str] = Field(default=None)


class ReportWidget(MyBaseModel):
    widgetGID: str = Field(min_length=1, max_length=256)
    key: str = Field(min_length=1, max_length=128)
    layoutItemProperties: Optional[LayoutItemProperties] = None
    properties: Optional[dict] = None


class WidgetLayoutResizeHandleEmum(StrEnum):
    s = auto()
    w = auto()
    e = auto()
    n = auto()
    sw = auto()
    nw = auto()
    se = auto()
    ne = auto()


class WidgetLayout(MyBaseModel):
    model_config = ConfigDict(use_enum_values=True)
    i: str = Field(description="Unique identifier for the layout item", min_length=1, max_length=128)
    x: int = Field(description="X position of the layout item", ge=0, le=12)
    y: int = Field(description="Y position of the layout item", ge=0, le=36)
    w: int = Field(description="Width of the layout item", ge=0, le=12)
    h: int = Field(description="Height of the layout item", ge=0, le=36)
    maxW: Optional[int] = Field(description="Maximum width of the layout item", ge=0, le=12)
    maxH: Optional[int] = Field(description="Maximum height of the layout item", ge=0, le=36)
    minW: Optional[int] = Field(description="Minimum width of the layout item", ge=0, le=12)
    minH: Optional[int] = Field(description="Minimum height of the layout item", ge=0, le=36)
    static: bool = Field(description="Whether the layout item is static")
    isDraggable: Optional[bool] = False
    isResizable: Optional[bool] = False
    resizeHandles: Optional[List[WidgetLayoutResizeHandleEmum]] = Field(description="Resize handle", default=None, strict=False)
    isBounded: Optional[bool] = False

    @field_validator('resizeHandles', mode='before')
    @classmethod
    def convert_resize_handles(cls, value: Any) -> Any:
        if isinstance(value, list):
            for idx in range(len(value)):
                if isinstance(value[idx], str):
                    value[idx] = WidgetLayoutResizeHandleEmum(value[idx])
        return value

    @model_validator(mode='after')
    def validate_widget_layout(self) -> Self:
        if self.minW and self.maxW and self.minW > self.maxW:
            raise ValueError("minW has a larger value than maxW")
        if self.minH and self.maxH and self.minH > self.maxH:
            raise ValueError("minH has a larger value than maxH")
        return self


class ProjectTemplateInformation(MyBaseModel):
    name: str = Field(description="Project Name", max_length=256, min_length=1)
    description: Optional[str] = Field(description="Property value", max_length=4096, default=None)


class ProjectTemplateInformationOptional(MyBaseModel):
    name: Optional[str] = Field(description="Project Name", max_length=256, min_length=1, default=None)
    description: Optional[str] = Field(description="Property value", max_length=4096, default=None)


class Page(MyBaseModel):
    layouts: List[WidgetLayout]
    reportWidgets: List[ReportWidget] = Field(min_length=0, max_length=256)


class ProjectTemplateMeta(MyBaseModel):
    globalVars: Optional[List[GlobalVariable]] = Field(description="Global variables in report canvas", default=None)
    pages: List[Page] = Field(description="List of pages in report canvas", min_length=0, max_length=256, default=[])


class ProjectTemplateMetaOptional(MyBaseModel):
    globalVars: Optional[List[GlobalVariable]] = Field(description="Global variables in report canvas", default=None)
    pages: Optional[List[Page]] = Field(description="List of pages in report canvas", min_length=0, max_length=256, default=None)


class ProjectTemplateInput(ProjectTemplateMeta):
    projectInfo: ProjectTemplateInformation

    model_config = {
        "json_schema_extra": {
            "examples": project_template_examples
        }
    }


class ProjectTemplatePatchInput(ProjectTemplateMetaOptional):
    projectInfo: Optional[ProjectTemplateInformation] = None


class ProjectTemplateOutput(ProjectTemplateInput):
    id: int  # project template id
    fromPlugin: Optional[bool] = False
    created_at: Optional[datetime] = Field(default=None, strict=False)
    updated_at: Optional[datetime] = Field(default=None, strict=False)

    @classmethod
    def from_model(cls, result: ProjectTemplateModel) -> "ProjectTemplateOutput":
        meta = ProjectTemplateMeta.model_validate(json.loads(result.data.decode("utf-8")))
        return ProjectTemplateOutput(
            id=result.id,
            pages=meta.pages,
            globalVars=meta.globalVars,
            fromPlugin=result.from_plugin,
            projectInfo=ProjectTemplateInformation(name=result.name, description=result.description),
            created_at=result.created_at,
            updated_at=result.updated_at,
        )

