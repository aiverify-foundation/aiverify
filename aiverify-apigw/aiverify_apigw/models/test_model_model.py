from sqlalchemy import String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from .base_model import BaseORMModel
from .uploaded_file_model import UploadedFileModel
from ..lib.constants import TestModelFileType, TestModelMode, TestModelStatus, ModelType


class TestModelModel(BaseORMModel):
    __tablename__ = "test_model"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[Optional[str]]
    mode: Mapped[TestModelMode] = mapped_column(
        Enum(TestModelMode), nullable=False)
    file_type: Mapped[Optional[TestModelFileType]] = mapped_column(
        Enum(TestModelFileType))  # only if mode == upload
    model_type: Mapped[ModelType] = mapped_column(Enum(ModelType), nullable=False)
    status: Mapped[TestModelStatus] = mapped_column(
        Enum(TestModelStatus), nullable=False)
    size: Mapped[Optional[float]]
    serializer: Mapped[Optional[str]]  # only if mode == upload
    model_format: Mapped[Optional[str]]  # only if mode == upload
    # relative to datepath. if not uploaded, leave as null
    datapath_id: Mapped[Optional[int]] = mapped_column(ForeignKey("uploaded_file.id"))
    datapath: Mapped[Optional["UploadedFileModel"]] = relationship("UploadedFileModel", cascade="save-update") # relative to datepath. if not uploaded, leave as null
    filepath: Mapped[Optional[str]] = mapped_column(
        String(2048))  # only if mode == upload
    filename: Mapped[Optional[str]] = mapped_column(
        String(2048), index=True)  # only if mode == upload
    model_api: Mapped[Optional[bytes]]  # serialized json, only if model == api
    error_message: Mapped[Optional[str]]  # only for status == invalid
    # date times
    created_at: Mapped[Optional[datetime]]
    updated_at: Mapped[Optional[datetime]]

    def __repr__(self) -> str:
        if self.status != TestModelStatus.Valid:
            return f"TestModelModel(id={self.id}, name={self.name}, status={self.status}, description={self.description}, error_message={self.error_message})"

        match self.mode:
            case TestModelMode.Upload:
                return (f"TestModelModel(id={self.id}, name={self.name}, description={self.description}, mode={self.mode}, "
                        f"file_type={self.file_type}, model_type={self.model_type}, status={self.status}, size={self.size}, "
                        f"serializer={self.serializer}, model_format={self.model_format}, datapath={self.datapath}, "
                        f"filepath={self.filepath}, filename={self.filename},  "
                        f"created_at={self.created_at}, updated_at={self.updated_at})")
            case TestModelMode.API:
                return (f"TestModelModel(id={self.id}, name={self.name}, description={self.description}, mode={self.mode}, "
                        f"model_type={self.model_type}, status={self.status}, size={self.size}, "
                        f"datapath={self.datapath}, model_api={self.model_api.decode('utf-8')}, "
                        f"created_at={self.created_at}, updated_at={self.updated_at})")
