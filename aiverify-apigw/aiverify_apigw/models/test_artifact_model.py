from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from .base_model import BaseORMModel


class TestArtifactModel(BaseORMModel):
    __tablename__ = "test_artifact"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # filepath: Mapped[str]
    filename: Mapped[str]
    suffix: Mapped[str]
    mimetype: Mapped[Optional[str]]

    test_result_id: Mapped[int] = mapped_column(ForeignKey("test_result.id"))

    def __repr__(self) -> str:
        return (f"TestArtifactModel(id={self.id}, filename={self.filename}, "
                f"suffix={self.suffix}, mimetype={self.mimetype}, test_result_id={self.test_result_id})")
