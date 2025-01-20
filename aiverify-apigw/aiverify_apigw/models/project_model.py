from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Table, Column
from typing import Optional, List

from .base_model import BaseORMModel
from .project_template_model import ProjectBaseModel, ProjectTemplateModel
from .test_model_model import TestModelModel
from .input_block_data_model import InputBlockDataModel
from .test_result_model import TestResultModel
from .user_model import UserModel


input_blocks_association_table = Table(
    "project_input_blocks_association",
    BaseORMModel.metadata,
    Column("project_id", ForeignKey("project.id")),
    Column("input_block_data_id", ForeignKey("inputblock_data.id")),
)

test_results_association_table = Table(
    "project_test_results_association",
    BaseORMModel.metadata,
    Column("project_id", ForeignKey("project.id")),
    Column("test_result_id", ForeignKey("test_result.id")),
)


class ProjectModel(BaseORMModel, ProjectBaseModel):
    __tablename__ = "project"

    report_title: Mapped[Optional[str]]
    company: Mapped[Optional[str]]

    # template ID should be using the format {gid}:{cid}, if not imported from any template, set to None
    template_id: Mapped[Optional[str]] = mapped_column(ForeignKey("project_template.id"))
    template: Mapped[Optional["ProjectTemplateModel"]] = relationship()

    test_model_id: Mapped[Optional[int]] = mapped_column(ForeignKey("test_model.id"))
    test_model: Mapped[Optional["TestModelModel"]] = relationship() # should be automatically set to None if referenced test model is delete

    # list of selected input blocks
    input_blocks_data: Mapped[List[InputBlockDataModel]] = relationship(secondary=input_blocks_association_table)
    # list of selected test results
    test_results: Mapped[List[TestResultModel]] = relationship(secondary=test_results_association_table)

    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"))
    user: Mapped[Optional["UserModel"]] = relationship()
