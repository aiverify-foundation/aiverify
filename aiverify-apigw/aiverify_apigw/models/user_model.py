from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base_model import BaseORMModel
from .user_group_model import UserGroupModel


class UserModel(BaseORMModel):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    userid: Mapped[str] = mapped_column(
        String(128), index=True, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(
        String(256), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(256), nullable=False)

    user_group_id: Mapped[int] = mapped_column(ForeignKey("user_group.id"))
    user_group: Mapped["UserGroupModel"] = relationship()

    def __repr__(self) -> str:
        return f"UserModel(id={self.id}, userid={self.userid}, name={self.name}, email={self.email}, user_group={self.user_group})"
