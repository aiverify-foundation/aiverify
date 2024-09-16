from sqlalchemy.orm import DeclarativeBase


class BaseORMModel(DeclarativeBase):
    pass
    # id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
