from faker import Faker
faker = Faker()
from aiverify_apigw.models import ProjectTemplateModel, ProjectModel
from .mock_project_meta import create_mock_project_template_data_meta


def create_mock_project_templates(session, template_id: str | None = None):
    project_data = create_mock_project_template_data_meta().model_dump_json().encode('utf-8')
    project_template = ProjectTemplateModel(
        name=faker.name(),
        description=faker.text(max_nb_chars=256),
        data=project_data,
        created_at=faker.date_time_this_year(),
        updated_at=faker.date_time_this_year(),
        template_id=template_id,
    )
    session.add(project_template)
    session.flush()
    return project_template


def create_mock_project(session, template: ProjectTemplateModel | None=None):
    project = ProjectModel(
        name=faker.name(),
        description=faker.text(max_nb_chars=256),
        data=b'{}',  # Assuming empty JSON data for mock
        template= template,
        report_title=faker.sentence(),
        company=faker.company(),
        created_at=faker.date_time_this_year(),
        updated_at=faker.date_time_this_year(),
        user_id=None  # Assuming no user is associated in the mock
    )
    session.add(project)
    session.flush()
    return project