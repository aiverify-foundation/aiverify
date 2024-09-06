from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from typing import Optional, List

from .base_model import BaseORMModel
from .user_model import UserModel
from .test_model_model import TestModelModel
from .test_dataset_model import TestDatasetModel
from .test_artifact_model import TestArtifactModel
from .plugin_model import AlgorithmModel
from ..lib.validators import validate_gid_cid


class TestResultModel(BaseORMModel):
    __tablename__ = "test_result"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    gid: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    cid: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    algorithm_id: Mapped[int] = mapped_column(ForeignKey("algorithm.id"))
    algorithm: Mapped["AlgorithmModel"] = relationship()
    version: Mapped[Optional[str]] = mapped_column(String(256))
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"))
    user: Mapped[Optional["UserModel"]] = relationship()
    model_id: Mapped[int] = mapped_column(ForeignKey("test_model.id"))
    model: Mapped["TestModelModel"] = relationship()
    test_dataset_id: Mapped[int] = mapped_column(ForeignKey("test_dataset.id"))
    test_dataset: Mapped["TestDatasetModel"] = relationship(foreign_keys=[test_dataset_id])
    ground_truth_dataset_id: Mapped[int] = mapped_column(ForeignKey("test_dataset.id"))
    ground_truth_dataset: Mapped["TestDatasetModel"] = relationship(foreign_keys=[ground_truth_dataset_id])
    ground_truth: Mapped[str]  # only if has ground truth dataset
    start_time: Mapped[datetime]
    time_taken: Mapped[float]  # time taken in seconds
    algo_arguments: Mapped[bytes]  # serialized json, arguments pass as input to algo
    output: Mapped[bytes]  # serialized json, output from algos
    artifacts: Mapped[List["TestArtifactModel"]] = relationship("TestArtifactModel", cascade="all, delete")

    @validates("gid", "cid")
    def my_validate_gid_cid(self, key, value):
        if not validate_gid_cid(value):
            raise ValueError("Invalid GID or CID")
        return value

    def __repr__(self) -> str:
        if self.artifacts:
            artifacts = ", ".join([artifact.filename for artifact in self.artifacts])
        else:
            artifacts = None
        return f"TestResultModel(id={self.id}, gid={self.gid}, cid={self.cid}, version={self.version}, user={self.user}, start_time={self.start_time}, time_taken={self.time_taken}, algo_arguments={self.algo_arguments.decode('utf-8')}, output={self.output.decode('utf-8')}, artifacts={artifacts})"
