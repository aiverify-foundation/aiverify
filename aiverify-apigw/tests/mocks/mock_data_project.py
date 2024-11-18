from faker import Faker
faker = Faker()
from aiverify_apigw.models import ProjectTemplateModel
from .mock_project_meta import create_mock_project_template_data_meta


def create_mock_project_templates(session, plugin_id: str | None = None):
    project_data = create_mock_project_template_data_meta().model_dump_json().encode('utf-8')
    project_template = ProjectTemplateModel(
        name=faker.name(),
        description=faker.text(max_nb_chars=256),
        data=project_data,
        created_at=faker.date_time_this_year(),
        updated_at=faker.date_time_this_year(),
        plugin_id=plugin_id,
    )
    session.add(project_template)
    session.flush()
    return project_template
