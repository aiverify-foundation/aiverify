from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..models.base_model import BaseORMModel


def init_db():
    import os
    db_uri = os.getenv("APIGW_DB_URI", "sqlite://")
    engine = create_engine(db_uri, echo=True)
    BaseORMModel.metadata.create_all(engine)
    return engine


engine = init_db()

SessionLocal = sessionmaker(engine)
