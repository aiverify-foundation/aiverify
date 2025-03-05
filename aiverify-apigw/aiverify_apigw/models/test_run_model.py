from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
import uuid

from .base_model import BaseORMModel
from .user_model import UserModel
from .test_model_model import TestModelModel
from .test_dataset_model import TestDatasetModel
from .test_result_model import TestResultModel
from .plugin_model import AlgorithmModel
from ..lib.constants import TestRunStatus


class TestRunModel(BaseORMModel):
    __tablename__ = "test_run"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[Optional[bytes]] # task id in queue
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"))
    user: Mapped[Optional["UserModel"]] = relationship()
    status: Mapped[TestRunStatus] = mapped_column(default=TestRunStatus.Pending, index=True, nullable=False)
    algorithm_id: Mapped[int] = mapped_column(ForeignKey("algorithm.id"))
    algorithm: Mapped["AlgorithmModel"] = relationship()
    algo_arguments: Mapped[bytes]  # serialized json, arguments pass as input to algo
    model_id: Mapped[int] = mapped_column(ForeignKey("test_model.id"), nullable=False)
    model: Mapped["TestModelModel"] = relationship()
    test_dataset_id: Mapped[int] = mapped_column(ForeignKey("test_dataset.id"))
    test_dataset: Mapped["TestDatasetModel"] = relationship(foreign_keys=[test_dataset_id])
    ground_truth_dataset_id: Mapped[Optional[int]] = mapped_column(ForeignKey("test_dataset.id"))
    ground_truth_dataset: Mapped["TestDatasetModel"] = relationship(foreign_keys=[ground_truth_dataset_id])
    ground_truth: Mapped[Optional[str]]  # only if has ground truth dataset
    test_result_id: Mapped[Optional[int]] = mapped_column(ForeignKey("test_result.id"))
    test_result: Mapped["TestResultModel"] = relationship()
    progress: Mapped[int] = mapped_column(default=0)
    error_messages: Mapped[Optional[str]]
    created_at: Mapped[Optional[datetime]]
    updated_at: Mapped[Optional[datetime]]

    def __repr__(self) -> str:
        return (
            f"TestRunModel(id={self.id}, user_id={self.user_id}, status={self.status}, "
            f"algorithm_id={self.algorithm_id}, model_id={self.model_id}, "
            f"test_dataset_id={self.test_dataset_id}, ground_truth_dataset_id={self.ground_truth_dataset_id}, "
            f"ground_truth={self.ground_truth}, test_result_id={self.test_result_id}, "
            f"error_messages={self.error_messages}, created_at={self.created_at}, updated_at={self.updated_at})"
        )
