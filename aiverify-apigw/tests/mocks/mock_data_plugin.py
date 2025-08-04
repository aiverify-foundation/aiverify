# mock_data_plugin.py
from faker import Faker
from typing import List
import json
from aiverify_apigw.models import PluginModel, AlgorithmModel, WidgetModel, InputBlockModel, TemplateModel, ProjectTemplateModel
from aiverify_apigw.lib.constants import InputBlockSize
from .mock_project_meta import create_mock_project_template_data_meta
faker = Faker()


model_types = ["classification", "regression"]


def _create_mock_algorithm(gid: str):
    cid = ".".join(faker.words()).lower()
    model_type = ",".join(faker.random_elements(elements=model_types, unique=True))
    return AlgorithmModel(
        id=f"{gid}:{cid}",
        cid=cid,
        name=faker.name(),
        version=faker.numerify("%!!.%!!.%!!"),
        author=faker.name(),
        description=faker.text(max_nb_chars=256),
        gid=gid,
        meta=b'{"key1":"value1"}',
        model_type=model_type,
        require_ground_truth=faker.boolean(),
        input_schema=b"""{
            "type": "object",
            "properties": {
                "arg1": { "type": "string" }
            }
        }
        """,
        output_schema=b"""{
            "type": "object",
            "properties": {
                "result": { "type": "number" }
            },
            "required": [ "result" ]
        }""",
        plugin_id=gid,
        algo_dir=f"algorithms/{faker.name()}/{faker.name()}",
        language="python",
        script="algo.py",
        module_name=faker.name(),
    )


def _create_mock_widgets(gid: str):
    cid = ".".join(faker.words()).lower()
    widget_size = {
            "minW": 1,
            "minH": 1,
            "maxW": faker.random_int(min=1, max=12),
            "maxH": faker.random_int(min=1, max=12),
        }
    name = faker.name()
    meta = {
        "cid": cid,
        "name": name,
        "widgetSize": widget_size
    }
    name = faker.name()
    meta = {
        "cid": cid,
        "name": name,
        "widgetSize": widget_size
    }
    properties = json.dumps([json.dumps({"key": faker.word(), "helper": faker.word()})]).encode("utf-8")
    # mockdata = json.dumps({"mockKey": faker.word(), "mockValue": faker.word()}).encode("utf-8")
    dependencies = json.dumps([json.dumps({"cid": faker.word()})]).encode("utf-8")
    return WidgetModel(
        id=f"{gid}:{cid}",
        cid=cid,
        name=faker.name(),
        version=faker.numerify("%!!.%!!.%!!"),
        author=name,
        description=faker.text(max_nb_chars=256),
        gid=gid,
        meta=json.dumps(meta).encode("utf-8"),
        widget_size=json.dumps(widget_size).encode("utf-8"),
        properties=properties,
        # mockdata=mockdata,
        dynamic_height=faker.boolean(),
        dependencies=dependencies,
        plugin_id=gid,
    )


def _create_mock_input_block(gid: str, group: str | None=None, group_number: int | None=None):
    cid = ".".join(faker.words()).lower()
    # group = faker.word()
    width = faker.random_element(elements=[InputBlockSize.xs, InputBlockSize.sm,
                                 InputBlockSize.md, InputBlockSize.lg, InputBlockSize.xl])
    fullscreen = faker.boolean()
    name=faker.name()
    meta = {
        "cid": cid,
        "name": name,
    }
    return InputBlockModel(
        id=f"{gid}:{cid}",
        cid=cid,
        name=name,
        version=faker.numerify("%!!.%!!.%!!"),
        author=faker.name(),
        description=faker.text(max_nb_chars=256),
        gid=gid,
        meta=json.dumps(meta).encode("utf-8"),
        group=group,
        groupNumber=group_number,
        width=width,
        fullscreen=fullscreen,
        plugin_id=gid,
    )


def _create_mock_template(gid: str):
    cid = ".".join(faker.words()).lower()
    name = faker.name()
    template = json.dumps({"templateKey": faker.word(), "templateValue": faker.word()}).encode("utf-8")
    project_data = create_mock_project_template_data_meta().model_dump_json().encode('utf-8')
    meta = {
        "cid": cid,
        "name": name,
    }
    model = TemplateModel(
        id=f"{gid}:{cid}",
        cid=cid,
        name=faker.name(),
        version=faker.numerify("%!!.%!!.%!!"),
        author=name,
        description=faker.text(max_nb_chars=256),
        gid=gid,
        meta=json.dumps(meta).encode("utf-8"),
        template=template,
        project_data=project_data,
        plugin_id=gid,
    )
    project_template = ProjectTemplateModel(
        name=model.name,
        description=model.description,
        data=model.project_data,
        created_at=faker.date_time_this_year(),
        updated_at=faker.date_time_this_year(),
    )
    model.project_template = project_template
    return (model, project_template)


def _create_mock_plugin(num_algo: int | None = None, num_widgets: int | None = None, num_input_blocks: int | None = None, num_templates: int | None = None, is_stock: bool = True):
    gid = ".".join(faker.words()).lower()
    if num_algo is None:
        num_algo = faker.random_int(min=1, max=3)
    algorithms = [_create_mock_algorithm(gid) for i in range(num_algo)]
    if num_widgets is None:
        num_widgets = faker.random_int(min=2, max=4)
    widgets = [_create_mock_widgets(gid) for i in range(num_widgets)]
    if num_input_blocks is None:
        num_input_blocks = faker.random_int(min=2, max=4)
    group = faker.word()
    inputblocks = [_create_mock_input_block(gid) for i in range(num_input_blocks)] + [_create_mock_input_block(gid, group, i + 1) for i in range(num_input_blocks)]
    if num_templates is None:
        num_templates = faker.random_int(min=1, max=2)
    templates = []
    for i in range(num_templates):
        model, project_template = _create_mock_template(gid)
        templates.append(model)
    meta = {
        "gid": gid,
        "version": faker.numerify("%!!.%!!.%!!"),  # Generates a semantic version string
        "name": faker.company(),  # Generates a fake company name
        "author": faker.name(),  # Generates a fake author name
        "description": faker.text(max_nb_chars=256),  # Generates a fake description text
        # "url": faker.url(), # Generates a fake url
    }
    return PluginModel(
        gid=gid,
        version=meta["version"],
        name=meta["name"],
        author=meta["author"],
        description=meta["description"],
        # url=meta["url"],
        meta=json.dumps(meta).encode("utf-8"),
        is_stock=is_stock,
        algorithms=algorithms,
        widgets=widgets,
        inputblocks=inputblocks,
        templates=templates,
    )


def create_mock_plugins(session, num_plugins: int = 2, is_stock: bool = True):
    """Create and save mock PluginModel instances with AlgorithmModel children."""

    plugins: List[PluginModel] = []
    for i in range(num_plugins):
        plugin = _create_mock_plugin(num_algo=None, is_stock=is_stock)
        plugins.append(plugin)
    session.add_all(plugins)
    session.flush()
    session.expunge_all()
    session.expunge_all()
    return plugins
