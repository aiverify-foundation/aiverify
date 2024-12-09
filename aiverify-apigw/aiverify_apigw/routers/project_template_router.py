from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..models import ProjectTemplateModel
from ..schemas import ProjectTemplateInput, ProjectTemplateOutput, ProjectTemplateMeta

router = APIRouter(prefix="/project_templates", tags=["project_template"])


@router.get("/", response_model=List[ProjectTemplateOutput])
async def get_all_project_templates(session: Session = Depends(get_db_session)):
    """
    Get all Project Templates
    """
    try:
        project_templates = session.query(ProjectTemplateModel).all()
        return [ProjectTemplateOutput.from_model(template) for template in project_templates]
    except Exception as e:
        return HTTPException(status_code=500, detail=f"Internal error {e}")


@router.post("/", response_model=ProjectTemplateOutput)
async def create_project_template(
    projectTemplate: ProjectTemplateInput, session: Session = Depends(get_db_session)
):
    """
    Create a new Project Template
    """
    try:
        meta = ProjectTemplateMeta(globalVars=projectTemplate.globalVars, pages=projectTemplate.pages)
        now = datetime.now()
        new_template = ProjectTemplateModel(
            name=projectTemplate.projectInfo.name,
            description=projectTemplate.projectInfo.description,
            data=meta.model_dump_json().encode("utf-8"),
            created_at=now,
            updated_at=now
        )
        session.add(new_template)
        session.commit()
        session.refresh(new_template)
        return ProjectTemplateOutput.from_model(new_template)
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating project template: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.get("/{template_id}", response_model=ProjectTemplateOutput)
async def get_project_template_by_id(template_id: int, session: Session = Depends(get_db_session)):
    """
    Get a Project Template by ID
    """
    try:
        template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Project Template not found")
        return ProjectTemplateOutput.from_model(template)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving project template with ID {template_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.put("/{template_id}", response_model=ProjectTemplateOutput)
async def update_project_template(
    template_id: int, projectTemplate: ProjectTemplateInput, session: Session = Depends(get_db_session)
):
    """
    Update a Project Template by ID
    """
    try:
        template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Project Template not found")
        if template.from_plugin:
            raise HTTPException(status_code=400, detail="Plugin templates are not allowed to be edited")

        meta = ProjectTemplateMeta(globalVars=projectTemplate.globalVars, pages=projectTemplate.pages)
        template.name = projectTemplate.projectInfo.name
        template.description = projectTemplate.projectInfo.description
        template.data = meta.model_dump_json().encode("utf-8")
        template.updated_at = datetime.now()

        session.commit()
        session.refresh(template)
        return ProjectTemplateOutput.from_model(template)
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating project template with ID {template_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.delete("/{template_id}")
async def delete_project_template(template_id: int, session: Session = Depends(get_db_session)):
    """
    Delete a Project Template by ID
    """
    try:
        template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Project Template not found")

        if template.from_plugin:
            raise HTTPException(status_code=400, detail="Plugin templates are not allowed to be deleted")

        session.delete(template)
        session.commit()
        return template_id
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting project template with ID {template_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.post("/clone/{template_id}", response_model=ProjectTemplateOutput)
async def clone_project_template(template_id: int, session: Session = Depends(get_db_session)):
    """
    Clone a Project Template by ID
    """
    try:
        template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Project Template not found")

        now = datetime.now()
        new_template = ProjectTemplateModel(
            name=f"Copy of {template.name}",
            description=template.description,
            data=template.data,
            plugin_id=None,  # cloned templates are not linked to plugins
            created_at=now,
            updated_at=now
        )
        session.add(new_template)
        session.commit()
        session.refresh(new_template)
        return ProjectTemplateOutput.from_model(new_template)

    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        logger.error(f"Error cloning project template with ID {template_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")
