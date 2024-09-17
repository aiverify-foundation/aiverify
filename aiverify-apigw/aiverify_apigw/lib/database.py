from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def init_db():
    import os
    db_uri = os.getenv("APIGW_DB_URI", "sqlite://")
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
