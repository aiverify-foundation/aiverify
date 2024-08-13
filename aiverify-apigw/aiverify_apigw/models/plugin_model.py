from sqlalchemy.orm import Mapped, mapped_column, validates, relationship
from sqlalchemy import String, Boolean, ForeignKey, Table, Column
from sqlalchemy.ext.hybrid import hybrid_property
from typing import Optional, List

from yaml import full_load
from .base_model import BaseORMModel
from ..lib.validators import validate_gid_cid
from ..lib.constants import ModelType, InputBlockSize


class PluginModel(BaseORMModel):
    __tablename__ = 'plugin'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gid: Mapped[str] = mapped_column(
        String(128), index=True, unique=True, nullable=False)
    version: Mapped[str] = mapped_column(String(256), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    author: Mapped[str] = mapped_column(String(128))
    description: Mapped[str]
    url: Mapped[str]
    algorithms: Mapped[List["AlgorithmModel"]] = relationship(
        back_populates="plugin", cascade="all, delete-orphan")
    widgets: Mapped[List["WidgetModel"]] = relationship(
        back_populates="plugin", cascade="all, delete-orphan")
    inputblocks: Mapped[List["InputBlockModel"]] = relationship(
        back_populates="plugin", cascade="all, delete-orphan")
    templates: Mapped[List["TemplateModel"]] = relationship(
        back_populates="plugin", cascade="all, delete-orphan")

    @validates("gid")
    def my_validate_gid_cid(self, key, value):
        if not validate_gid_cid(value):
            raise ValueError("Invalid GID or CID")
        return value

    def __repr__(self) -> str:
        return (f"PluginModel(id={self.id}, gid={self.gid}, version={self.version}, name={self.name}, "
                f"author={self.author}, description={self.description}, url={self.url})")


association_table = Table(
    "component_tag_association",
    BaseORMModel.metadata,
    Column("tag_id", ForeignKey("component_tag.id"), primary_key=True),
    Column("component_id", ForeignKey("plugin_component.id"), primary_key=True),
)


class PluginComponentModel(BaseORMModel):
    __tablename__ = 'plugin_component'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cid: Mapped[str] = mapped_column(
        String(128), index=True, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[str]
    version: Mapped[Optional[str]]
    author: Mapped[Optional[str]]
    description: Mapped[Optional[str]]
    tags: Mapped[List["ComponentTagModel"]] = relationship(
        secondary=association_table, back_populates="components")
    gid: Mapped[str] = mapped_column(ForeignKey("plugin.gid"))
    schema: Mapped[bytes]  # schema serialized

    __mapper_args__ = {
        "polymorphic_identity": "employee",
        "polymorphic_on": "type",
    }


class ComponentTagModel(BaseORMModel):
    __tablename__ = 'component_tag'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), index=True, unique=True)
    components: Mapped[List["PluginComponentModel"]] = relationship(
        secondary=association_table, back_populates="tags")

    @validates("name")
    def validate_name(self, key, value):
        if not value.isalnum():
            raise ValueError("Tag name must be alphanumeric")
        return value.lower()


class AlgorithmModel(PluginComponentModel):
    __tablename__ = "algorithm"
    id: Mapped[int] = mapped_column(ForeignKey(
        "plugin_component.id"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": "algorithm",
    }

    model_type: Mapped[str] = mapped_column(String, nullable=False)
    require_ground_truth: Mapped[bool] = mapped_column(Boolean, default=True)

    plugin_id: Mapped[int] = mapped_column(ForeignKey('plugin.id'))
    plugin: Mapped["PluginModel"] = relationship(back_populates="algorithms")

    @hybrid_property
    def algorithm_id(self):
        return f"{self.gid}:{self.cid}"

    @validates("model_type")
    def validates_model_type(self, key, value):
        try:
            model_types = [
                ModelType(v.strip().lower()).value for v in value.split(",")]
            return ",".join(model_types)
        except:
            ValueError(f"invalid model type defined {value}")


class InputBlockModel(PluginComponentModel):
    __tablename__ = 'inputblock'

    __mapper_args__ = {
        "polymorphic_identity": "inputblock",
    }

    id: Mapped[int] = mapped_column(ForeignKey(
        "plugin_component.id"), primary_key=True)

    group: Mapped[str]
    width: Mapped[InputBlockSize] = mapped_column(
        String, default=InputBlockSize.md)
    fullscreen: Mapped[bool]

    plugin_id: Mapped[int] = mapped_column(ForeignKey('plugin.id'))
    plugin: Mapped["PluginModel"] = relationship(back_populates="inputblocks")

    @hybrid_property
    def inputblock_id(self):
        return f"{self.gid}:{self.cid}"


algo_association_table = Table(
    "widget_algorithm_association",
    BaseORMModel.metadata,
    Column("widget_id", ForeignKey("widget.id")),
    Column("algorithm_id", ForeignKey("algorithm.id")),
)

ib_association_table = Table(
    "widget_inputblock_association",
    BaseORMModel.metadata,
    Column("widget_id", ForeignKey("widget.id")),
    Column("inputblock_id", ForeignKey("inputblock.id")),
)


class WidgetModel(PluginComponentModel):
    __tablename__ = 'widget'

    __mapper_args__ = {
        "polymorphic_identity": "widget",
    }

    id: Mapped[int] = mapped_column(ForeignKey(
        "plugin_component.id"), primary_key=True)

    widget_size: Mapped[bytes]  # serialized json for widgetSize
    properties: Mapped[Optional[bytes]]  # seralized json of widget properties
    mockdata: Mapped[Optional[bool]]  # serialized json of mock data
    dynamic_height: Mapped[bool] = mapped_column(Boolean, default=False)

    # dependencies
    algorithms: Mapped[List["AlgorithmModel"]] = relationship(
        secondary=algo_association_table)
    inputblocks: Mapped[List["InputBlockModel"]] = relationship(
        secondary=ib_association_table)

    plugin_id: Mapped[int] = mapped_column(ForeignKey('plugin.id'))
    plugin: Mapped["PluginModel"] = relationship(back_populates="widgets")

    @hybrid_property
    def widget_id(self):
        return f"{self.gid}:{self.cid}"


class TemplateModel(PluginComponentModel):
    __tablename__ = 'template'

    __mapper_args__ = {
        "polymorphic_identity": "template",
    }

    id: Mapped[int] = mapped_column(ForeignKey(
        "plugin_component.id"), primary_key=True)
    template: Mapped[bytes]

    plugin_id: Mapped[int] = mapped_column(ForeignKey('plugin.id'))
    plugin: Mapped["PluginModel"] = relationship(back_populates="templates")

    @hybrid_property
    def template_id(self):
        return f"{self.gid}:{self.cid}"
