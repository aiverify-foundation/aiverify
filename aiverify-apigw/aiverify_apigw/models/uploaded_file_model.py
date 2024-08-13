from sqlalchemy import String, DateTime, Boolean, null
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from .base_model import BaseORMModel

class UploadedFileModel(BaseORMModel):
    __tablename__ = "uploaded_file"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    filepath: Mapped[str]
    filename: Mapped[str] = mapped_column(index=True, nullable=False)
    suffix: Mapped[str]
    mimetype: Mapped[Optional[str]]
    upload_at: Mapped[Optional[datetime]]


    def __repr__(self) -> str:
        return (f"UploadedFileModel(id={self.id}, filepath={self.filepath}, filename={self.filename}, "
                f"suffix={self.suffix}, mimetype={self.mimetype}, upload_at={self.upload_at})")
