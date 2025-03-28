from pydantic import Field
from typing import List, Optional, Literal, Annotated
import json
from ..models import WidgetModel
from .base_model import MyBaseModel


class WidgetMetaSize(MyBaseModel):
    minW: int = Field(description="Minimum widget width", ge=1, le=12)
    minH: int = Field(description="Minimum widget height", ge=1, le=36)
    maxW: int = Field(description="Maximum widget width", ge=1, le=12)
    maxH: int = Field(description="Maximum widget height", ge=1, le=36)


class WidgetMetaProperty(MyBaseModel):
    key: str = Field(description="Property key", min_length=1, max_length=128)
    helper: str = Field(description="Helper text for the property", max_length=256)
    default: Optional[str] = Field(default=None, description="Property default value", max_length=4096)


class WidgetMetaDependency(MyBaseModel):
    gid: Optional[str] = Field(
        default=None,
        description="GID of the dependency component plugin. If empty, assume component within same plugin.",
        max_length=128,
    )
    cid: str = Field(description="CID of the dependency component", min_length=1, max_length=128)
    version: Optional[str] = Field(
        default=None, description="Version of the component dependency required", min_length=1, max_length=256
    )


class WidgetMetaMockData(MyBaseModel):
    type: Literal["Algorithm", "InputBlock"] = Field(description="Type of sample data")
    gid: Optional[str] = Field(
        default=None,
        description="GID of sample data for component dependency. If empty, assume GID of same plugin",
        max_length=128,
    )
    cid: str = Field(description="CID of sample data for component dependency", min_length=1, max_length=128)
    datapath: str = Field(description="Path to the file containing sample data", min_length=1, max_length=256)
    data: Optional[dict] = Field(
        default=None,
        description="Actual mock data loaded from the datapath file"
    )


class WidgetMeta(MyBaseModel):
    cid: str = Field(
        description="Unique identifier for the widget within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    name: str = Field(description="Widget name", min_length=1, max_length=128)
    version: Optional[str] = Field(
        default=None,
        description="Version of the widget, default to plugin version if not specified",
        min_length=1,
        max_length=256,
    )
    author: Optional[str] = Field(default=None, description="Widget author", min_length=1, max_length=128)
    description: Optional[str] = Field(default=None, description="Widget description", max_length=256)
    widgetSize: WidgetMetaSize = Field(description="Describe the widget size in terms of canvas grid units", strict=False)
    properties: Optional[List[WidgetMetaProperty]] = Field(
        default=None, description="List of widget properties", max_length=256
    )
    tags: Optional[List[Annotated[str, Field(min_length=1, max_length=128)]]] = Field(
        default=None, description="Widget tags, used for searching", max_length=128
    )
    dependencies: Optional[List[WidgetMetaDependency]] = Field(
        default=None, description="Widget dependencies", max_length=256
    )
    mockdata: Optional[List[WidgetMetaMockData]] = Field(
        default=None, description="Sample data to be fed into the widget in canvas mode", max_length=256
    )
    dynamicHeight: Optional[bool] = Field(default=False, description="Whether this widget has dynamic height")


class WidgetOutput (WidgetMeta):
    gid: Optional[str] = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )

    @classmethod
    def from_model(cls, result: WidgetModel) -> "WidgetOutput":
        # Parse mock data if it exists
        mockdata = None
        if result.mockdata:
            try:
                mock_data_list = json.loads(result.mockdata.decode('utf-8'))
                mockdata = []
                for mock_item in mock_data_list:
                    if isinstance(mock_item, str):
                        mock_item = json.loads(mock_item)
                    
                    if 'data' in mock_item:
                        if isinstance(mock_item['data'], str):
                            try:
                                mock_item['data'] = json.loads(mock_item['data'])
                            except json.JSONDecodeError:
                                pass
                    
                    mockdata.append(WidgetMetaMockData.model_validate(mock_item))
            except Exception as e:
                import logging
                logging.error(f"Error parsing mock data for widget {result.cid}: {str(e)}")
        obj = cls(
            cid=result.cid,
            gid=result.plugin.gid,
            name=result.name,
            version=result.version,
            author=result.author,
            description=result.description,
            widgetSize=WidgetMetaSize.model_validate_json(result.widget_size.decode('utf-8')),
            properties=[WidgetMetaProperty.model_validate_json(prop) for prop in json.loads(
                result.properties.decode('utf-8'))] if result.properties else None,
            # tags=result.tags,
            dependencies=[WidgetMetaDependency.model_validate_json(dep) for dep in json.loads(
                result.dependencies.decode('utf-8'))] if result.dependencies else None,
            mockdata=mockdata,
            dynamicHeight=result.dynamic_height
        )
        return obj
