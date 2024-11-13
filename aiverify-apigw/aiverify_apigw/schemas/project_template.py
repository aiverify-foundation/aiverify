from pydantic import BaseModel, Field, model_validator
from typing_extensions import Self
from typing import List, Optional
from datetime import datetime
from enum import StrEnum, auto


class GlobalVariable(BaseModel):
    key: str = Field(description="Property key", min_length=1, max_length=128)
    value: str = Field(description="Property value", max_length=128)


class LayoutItemProperties(BaseModel):
    justifyContent: Optional[str] = Field(default=None)
    alignItems: Optional[str] = Field(default=None)
    textAlign: Optional[str] = Field(default=None)
    color: Optional[str] = Field(default=None)
    bgcolor: Optional[str] = Field(default=None)


class ReportWidget(BaseModel):
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


class WidgetLayout(BaseModel):
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
    resizeHandles: Optional[List[WidgetLayoutResizeHandleEmum]] = Field(description="Resize handle", default=None)
    isBounded: Optional[bool] = False

    @model_validator(mode='after')
    def validate_widget_layout(self) -> Self:
        if self.minW and self.maxW and self.minW > self.maxW:
            raise ValueError("minW has a larger value than maxW")
        if self.minH and self.maxH and self.minH > self.maxH:
            raise ValueError("minH has a larger value than maxH")
        return self


class ProjectInformation(BaseModel):
    name: str = Field(description="Property value", max_length=128)
    description: str = Field(description="Property value", max_length=256)
    reportTitle: str = Field(description="Property value", max_length=128)
    company: str = Field(description="Property value", max_length=128)


class Page(BaseModel):
    layouts: List[WidgetLayout]
    reportWidgets: List[ReportWidget] = Field(min_length=1, max_length=256)


class ProjectTemplateMeta(BaseModel):
    globalVars: Optional[List[GlobalVariable]] = None
    pages: List[Page] = Field(Page, min_length=1, max_length=256)


class ProjectTemplateInput(ProjectTemplateMeta):
    fromPlugin: Optional[bool] = False
    projectInfo: ProjectInformation


class ProjectTemplateOutput(ProjectTemplateInput):
    id: int  # project template id
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
