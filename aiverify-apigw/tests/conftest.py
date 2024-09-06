import os
os.environ["APIGW_DB_URI"] = "sqlite://"

import pytest

# from aiverify_apigw.lib.database import engine
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    "sqlite://",
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(scope="session", autouse=True)
def SessionLocal():
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    yield TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Setup the database at the start of the session and teardown at the end."""
    from aiverify_apigw.models import BaseORMModel
    BaseORMModel.metadata.create_all(bind=engine)
    yield
    # Drop all tables at the end of the test session
    BaseORMModel.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def db_session(SessionLocal):
    """Provide a transactional scope around a series of operations."""
    # Setup the session for each function
    session = SessionLocal()
    yield session
    # Rollback and close session after each function to ensure isolation
    session.rollback()
    session.close()


@pytest.fixture(scope="function")
def test_client(SessionLocal):
    from aiverify_apigw.__main__ import app
    from aiverify_apigw.lib.database import get_db_session
    from fastapi.testclient import TestClient

    # dependency overrides
    def override_get_db():
        db = None
        try:
            db = SessionLocal()
            yield db
        finally:
            if db:
                db.close()

    print(app.dependency_overrides)
    app.dependency_overrides[get_db_session] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

# Mock data fictures


@pytest.fixture(scope="function")
def mock_plugins(db_session):
    from .mocks.mock_data_plugin import create_mock_plugins
    from aiverify_apigw.models import PluginModel, AlgorithmModel, WidgetModel, InputBlockModel, TemplateModel, PluginComponentModel
    plugins = create_mock_plugins(db_session)
    yield plugins
    db_session.query(PluginModel).delete()
    db_session.query(AlgorithmModel).delete()
    db_session.query(WidgetModel).delete()
    db_session.query(InputBlockModel).delete()
    db_session.query(TemplateModel).delete()
    db_session.query(PluginComponentModel).delete()
    db_session.commit()
