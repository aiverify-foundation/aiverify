from venv import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def init_db():
    import os

    if "APIGW_DB_URI" in os.environ:
        db_uri = os.environ["APIGW_DB_URI"]
    else:
        from .filestore import base_data_dir

        db_uri = f"sqlite:///{base_data_dir}/database.db"
    logger.debug(f"db_uri: {db_uri}")
    engine = create_engine(db_uri, echo=False, connect_args={"check_same_thread": False})
    return engine


engine = init_db()

SessionLocal = sessionmaker(engine)


def get_db_session():
    """Dependency to provide a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
