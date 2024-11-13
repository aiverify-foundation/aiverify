from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from typing import Optional, List
from datetime import datetime

from .base_model import BaseORMModel


class ProjectBaseModel:
    # __tablename__ = "project_base"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    description: Mapped[Optional[str]]
    data: Mapped[bytes]
    created_at: Mapped[Optional[datetime]]
    updated_at: Mapped[Optional[datetime]]
    # type: Mapped[str]

    # __mapper_args__ = {
    #     'polymorphic_identity': 'project_base',
    #     'polymorphic_on': "type"
    # }


class ProjectTemplateModel(BaseORMModel, ProjectBaseModel):
    __tablename__ = "project_template"

    # id: Mapped[int] = mapped_column(ForeignKey("project_base.id"), primary_key=True)
    # id: Mapped[int] = mapped_column(primary_key=True)
    # name: Mapped[str]
    # description: Mapped[Optional[str]]
    # data: Mapped[bytes]
    # created_at: Mapped[Optional[datetime]]
    # updated_at: Mapped[Optional[datetime]]

    plugin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("plugin.gid"))
    projects: Mapped[List["ProjectModel"]] = relationship()

    # plugin = relationship("PluginModel", foreign_keys=[plugin_id])
    # base = relationship("ProjectBaseModel", foreign_keys=[id])

    # __mapper_args__ = {
    #     'polymorphic_identity': 'project_template',
    # }


class ProjectModel(BaseORMModel, ProjectBaseModel):
    __tablename__ = "project"

    # id: Mapped[int] = mapped_column(ForeignKey("project_base.id"), primary_key=True)
    # id: Mapped[int] = mapped_column(primary_key=True)
    # name: Mapped[str]
    # description: Mapped[Optional[str]]
    # data: Mapped[bytes]
    # created_at: Mapped[Optional[datetime]]
    # updated_at: Mapped[Optional[datetime]]

    report_title: Mapped[Optional[str]]
    company: Mapped[Optional[str]]

    template_id: Mapped[Optional[int]] = mapped_column(ForeignKey("project_template.id"))

    # __mapper_args__ = {
    #     'polymorphic_identity': 'project',
    # }
