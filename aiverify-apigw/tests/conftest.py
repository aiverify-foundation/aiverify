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

    app.dependency_overrides[get_db_session] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


# Mock data fictures
@pytest.fixture(scope="function")
def mock_plugin_meta():
    from .mocks.mock_plugin_meta import create_mock_plugin_meta

    plugin = create_mock_plugin_meta()
    yield plugin


@pytest.fixture(scope="function")
def mock_plugins(db_session):
    from .mocks.mock_data_plugin import create_mock_plugins
    from aiverify_apigw.models import (
        PluginModel,
        AlgorithmModel,
        WidgetModel,
        InputBlockModel,
        InputBlockGroupDataModel,
        InputBlockDataModel,
        TemplateModel,
        PluginComponentModel,
        ProjectTemplateModel
    )

    db_session.query(PluginModel).delete()
    plugins = create_mock_plugins(db_session)
    db_session.commit()
    yield plugins
    db_session.query(PluginModel).delete()
    db_session.query(AlgorithmModel).delete()
    db_session.query(WidgetModel).delete()
    db_session.query(InputBlockModel).delete()
    db_session.query(InputBlockGroupDataModel).delete()
    db_session.query(InputBlockDataModel).delete()
    db_session.query(TemplateModel).delete()
    db_session.query(PluginComponentModel).delete()
    db_session.query(ProjectTemplateModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_non_stock_plugins(db_session):
    from .mocks.mock_data_plugin import create_mock_plugins
    from aiverify_apigw.models import (
        PluginModel,
        AlgorithmModel,
        WidgetModel,
        InputBlockModel,
        TemplateModel,
        PluginComponentModel,
        ProjectTemplateModel
    )

    db_session.query(PluginModel).delete()
    plugins = create_mock_plugins(db_session, is_stock=False)
    db_session.commit()
    yield plugins
    db_session.query(PluginModel).delete()
    db_session.query(AlgorithmModel).delete()
    db_session.query(WidgetModel).delete()
    db_session.query(InputBlockModel).delete()
    db_session.query(TemplateModel).delete()
    db_session.query(PluginComponentModel).delete()
    db_session.query(ProjectTemplateModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_test_results(db_session, mock_plugins):
    from .mocks.mock_test_result import create_mock_test_results
    from aiverify_apigw.models import TestResultModel, TestModelModel, TestDatasetModel, TestArtifactModel

    results = create_mock_test_results(db_session, mock_plugins)
    db_session.commit()
    yield results
    db_session.query(TestResultModel).delete()
    db_session.query(TestModelModel).delete()
    db_session.query(TestDatasetModel).delete()
    db_session.query(TestArtifactModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_project_template(db_session):
    from .mocks.mock_data_project import create_mock_project_templates
    from aiverify_apigw.models import ProjectTemplateModel
    project_template = create_mock_project_templates(db_session)
    db_session.commit()
    yield project_template
    # db_session.delete(project_template)
    db_session.query(ProjectTemplateModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_projects(db_session, mock_project_template):
    from .mocks.mock_data_project import create_mock_project
    from aiverify_apigw.models import ProjectModel
    project1 = create_mock_project(db_session, mock_project_template)
    project2 = create_mock_project(db_session)
    projects = [project1, project2]
    db_session.commit()
    yield projects
    db_session.query(ProjectModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_input_block_data(db_session, mock_plugins):
    from .mocks.mock_input_block_data import create_mock_input_block_data
    from aiverify_apigw.models import InputBlockDataModel

    results = create_mock_input_block_data(db_session, mock_plugins[0].inputblocks[0])
    db_session.commit()
    yield results
    db_session.query(InputBlockDataModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_input_block_group_data(db_session, mock_plugins):
    from .mocks.mock_input_block_data import create_mock_input_block_group_data
    from aiverify_apigw.models import InputBlockGroupDataModel
    inputblocks = [ib for ib in mock_plugins[0].inputblocks if ib.group is not None]
    results = create_mock_input_block_group_data(db_session, inputblocks)
    db_session.commit()
    yield results
    db_session.query(InputBlockGroupDataModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_test_datasets(db_session):
    from .mocks.mock_test_dataset import create_mock_test_datasets
    from aiverify_apigw.models import TestDatasetModel
    results = create_mock_test_datasets(db_session)
    db_session.commit()
    yield results
    db_session.query(TestDatasetModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_test_models(db_session):
    from .mocks.mock_test_model import create_mock_test_models
    from aiverify_apigw.models import TestModelModel
    results = create_mock_test_models(db_session)
    db_session.commit()
    yield results
    db_session.query(TestModelModel).delete()
    db_session.commit()


@pytest.fixture(scope="function")
def mock_test_runs(db_session, mock_plugins):
    from .mocks.mock_test_run import create_mock_test_runs
    from aiverify_apigw.models import TestResultModel, TestModelModel, TestDatasetModel, TestArtifactModel, TestRunModel

    results = create_mock_test_runs(db_session, mock_plugins)
    db_session.commit()
    yield results
    db_session.query(TestRunModel).delete()
    db_session.query(TestResultModel).delete()
    db_session.query(TestModelModel).delete()
    db_session.query(TestDatasetModel).delete()
    db_session.query(TestArtifactModel).delete()
    db_session.commit()

