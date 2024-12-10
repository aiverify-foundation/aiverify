from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from typing import Optional
from datetime import datetime

from .base_model import BaseORMModel
from .user_model import UserModel


class ProjectBaseModel:
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str]
    description: Mapped[Optional[str]]
    data: Mapped[bytes]
    created_at: Mapped[Optional[datetime]]
    updated_at: Mapped[Optional[datetime]]


class ProjectTemplateModel(BaseORMModel, ProjectBaseModel):
    __tablename__ = "project_template"

    template_id: Mapped[Optional[str]] = mapped_column(ForeignKey("template.id"))
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"))
    user: Mapped[Optional["UserModel"]] = relationship()

    @hybrid_property
    def from_plugin(self):
        return self.template_id is not None
