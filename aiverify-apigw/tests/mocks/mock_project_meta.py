from faker import Faker
from aiverify_apigw.schemas import ProjectTemplateMeta
faker = Faker()


def create_mock_project_template_data_meta():
    pages = [
        {
            "layouts": [
                {
                    "i": faker.uuid4(),
                    "x": faker.random_int(min=0, max=12),
                    "y": faker.random_int(min=0, max=36),
                    "w": faker.random_int(min=1, max=12),
                    "h": faker.random_int(min=1, max=36),
                    "maxW": faker.random_int(min=1, max=12),
                    "maxH": faker.random_int(min=1, max=36),
                    "minW": 1,
                    "minH": 1,
                    "static": faker.boolean(),
                    "isDraggable": faker.boolean(),
                    "isResizable": faker.boolean(),
                    "resizeHandles": faker.random_elements(elements=["s", "w", "e", "n", "sw", "nw", "se", "ne"], unique=True),
                    "isBounded": faker.boolean()
                }
            ],
            "reportWidgets": [
                {
                    "widgetGID": faker.uuid4(),
                    "key": faker.word(),
                    "layoutItemProperties": {
                        "justifyContent": faker.word(),
                        "alignItems": faker.word(),
                        "textAlign": faker.word(),
                        "color": faker.color_name(),
                        "bgcolor": faker.color_name()
                    },
                    "properties": {
                        faker.word(): faker.word()
                    }
                }
            ]
        }
    ]

    global_vars = [
        {
            "key": faker.word(),
            "value": faker.word()
        }
    ]

    meta = {
        "pages": pages,
        "globalVars": global_vars
    }

    return ProjectTemplateMeta(**meta)
    # return meta
