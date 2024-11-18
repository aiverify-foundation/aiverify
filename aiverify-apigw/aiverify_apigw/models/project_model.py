from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey
from typing import Optional
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

    plugin_id: Mapped[Optional[str]] = mapped_column(ForeignKey("plugin.gid"))

    # plugin = relationship("PluginModel", foreign_keys=[plugin_id])
    # base = relationship("ProjectBaseModel", foreign_keys=[id])

    # __mapper_args__ = {
    #     'polymorphic_identity': 'project_template',
    # }


class ProjectModel(BaseORMModel, ProjectBaseModel):
    __tablename__ = "project"

    report_title: Mapped[Optional[str]]
    company: Mapped[Optional[str]]

    # template ID should be using the format {gid}:{cid}, if not imported from any template, set to None
    template_id: Mapped[Optional[str]] = mapped_column(default=None)

    # __mapper_args__ = {
    #     'polymorphic_identity': 'project',
    # }
