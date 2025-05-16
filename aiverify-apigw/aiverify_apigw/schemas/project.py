from pydantic import Field
from typing import Optional, List
from datetime import datetime
import json

from .project_template import ProjectTemplateMeta, ProjectTemplateMetaOptional
from ..models import ProjectModel
from .base_model import MyBaseModel


class ProjectInformation(MyBaseModel):
    name: str = Field(description="Project Name", max_length=256, min_length=1)
    description: Optional[str] = Field(description="Property value", max_length=4096, min_length=1, default=None)
    reportTitle: Optional[str] = Field(description="Property value", max_length=256, min_length=1, default=None)
    company: Optional[str] = Field(description="Property value", max_length=256, default=None)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "My Test Project",
                    "description": "My Test Project Description",
                    "reportTitle": "My Report Title",
                    "company": "Company ABC"
                }
            ]
        }
    }


class ProjectComponentSelection(MyBaseModel):
    gid: str = Field(
        description="Unique global identifier for the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    cid: str = Field(
        description="Unique identifier for the component within the plugin",
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9-._]*$",
    )
    id: Optional[int] = Field(description="ID of the algorithm or input block. Set to NULL if no selection", default=None)


class ProjectInput(ProjectTemplateMeta):
    projectInfo: ProjectInformation
    testModelId: Optional[int] = Field(description="Id of the AI model selected for this project. Set to NULL if no selected", default=None)
    inputBlocks: List[int] = Field(description="Input block selection", default=[])
    testResults: List[int] = Field(description="Test result selection", default=[])


class ProjectPatchInput(ProjectTemplateMetaOptional):
    projectInfo: Optional[ProjectInformation] = None
    testModelId: Optional[int] = Field(description="Id of the AI model selected for this project. Set to NULL if no selected", default=None)
    inputBlocks: Optional[List[int]] = Field(description="Input block selection", default=None)
    testResults: Optional[List[int]] = Field(description="Test result selection", default=None)


class ProjectOutput(ProjectTemplateMeta):
    id: int = Field(description="Project Id")
    templateId: Optional[int] = Field(description="Template this project is imported from or NULL if created from blank", default=None)
    projectInfo: ProjectInformation
    testModelId: Optional[int] = Field(description="Id of the AI model selected for this project. Set to NULL if no selected", default=None)
    inputBlocks: List[ProjectComponentSelection] = Field(description="Input block selection", default=[])
    testResults: List[ProjectComponentSelection] = Field(description="Test result selection", default=[])
    created_at: Optional[datetime] = Field(strict=False, default=None)
    updated_at: Optional[datetime] = Field(strict=False, default=None)

    @classmethod
    def from_model(cls, result: ProjectModel) -> "ProjectOutput":
        meta = ProjectTemplateMeta.model_validate(json.loads(result.data.decode("utf-8")))
        input_blocks = [ProjectComponentSelection(gid=ib.gid, cid=ib.cid, id=ib.id) for ib in result.input_blocks_data]
        test_results = [ProjectComponentSelection(gid=result.gid, cid=result.cid, id=result.id) for result in result.test_results]
        return ProjectOutput(
            id=result.id,
            pages=meta.pages,
            globalVars=meta.globalVars,
            projectInfo=ProjectInformation(name=result.name, description=result.description, reportTitle=result.report_title, company=result.company),
            templateId=result.template.id if result.template else None,
            testModelId=result.test_model.id if result.test_model else None,
            inputBlocks=input_blocks,
            testResults=test_results,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
