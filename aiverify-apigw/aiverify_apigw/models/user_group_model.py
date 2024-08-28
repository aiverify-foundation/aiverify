from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from .base_model import BaseORMModel

class UserGroupModel(BaseORMModel):
    __tablename__ = "user_group"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), index=True, nullable=False)

    def __repr__(self) -> str:
        return f"UserGroupModel(id={self.id}, name={self.name})"
