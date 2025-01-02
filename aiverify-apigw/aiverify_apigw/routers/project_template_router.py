from fastapi import APIRouter, HTTPException, Depends
from pydantic import Field
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
# from uuid import uuid4

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..models import ProjectTemplateModel
from ..schemas import ProjectTemplateInput, ProjectTemplatePatchInput, ProjectTemplateOutput, ProjectTemplateMeta, ProjectTemplateInformationOptional

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
            # id=str(uuid4()),
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
async def get_project_template_by_id(template_id: str, session: Session = Depends(get_db_session)):
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
async def patch_project_template(
    template_id: str, projectTemplate: ProjectTemplateInput, session: Session = Depends(get_db_session)
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


@router.patch("/{template_id}", response_model=ProjectTemplateOutput)
async def update_project_template(
    template_id: str, projectTemplate: ProjectTemplatePatchInput, session: Session = Depends(get_db_session)
):
    """
    Patch update a Project Template by ID
    """
    try:
        template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Project Template not found")
        if template.from_plugin:
            raise HTTPException(status_code=400, detail="Plugin templates are not allowed to be edited")
        
        update_data = projectTemplate.model_dump(exclude_unset=True)
        logger.debug(f"update_project_template update data: {update_data}")

        if "globalVars" in update_data or "pages" in update_data:
            update_meta = ProjectTemplateMeta.model_validate_json(template.data.decode("utf-8"))
            if "globalVars" in update_data:
                update_meta.globalVars = update_data["globalVars"]
            if "pages" in update_data:
                update_meta.pages = update_data["pages"]
            template.data = update_meta.model_dump_json().encode("utf-8")
        if "projectInfo" in update_data:
            template.name = update_data["projectInfo"]["name"]
            template.description = update_data["projectInfo"]["description"]
        template.updated_at = datetime.now(timezone.utc)

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
async def delete_project_template(template_id: str, session: Session = Depends(get_db_session)):
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
async def clone_project_template(template_id: str, projectInfo: Optional[ProjectTemplateInformationOptional]=None, session: Session = Depends(get_db_session)):
    """
    Clone a Project Template by ID
    """
    try:
        template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Project Template not found")

        now = datetime.now(timezone.utc)
        new_template = ProjectTemplateModel(
            # id=str(uuid4()),
            name=projectInfo.name if projectInfo and projectInfo.name else f"Copy of {template.name}",
            description=projectInfo.description if projectInfo and projectInfo.description else template.description,
            data=template.data,
            template_id=None,  # cloned templates are not linked to plugin template
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


class TemplateExportInput(ProjectTemplateInformationOptional):
    cid: str = Field(description="Exported template CID")
    filename: Optional[str] = Field(description="filename of zipfile to output. If left black will default to {{cid}}.zip", default=None)
    tags: Optional[List[str]] = Field(description="Project template tags", default=None)


@router.post("/export/{template_id}")
async def export_project_template(template_id: str, export_info: TemplateExportInput, session: Session = Depends(get_db_session)):
    """
    Export a Project Template by ID as a zip file
    """
    try:
        template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Project Template not found")

        import io
        import zipfile
        import json
        from fastapi.responses import Response

        # build template meta
        meta = {
            "cid": export_info.cid,
            "name": export_info.name if export_info.name else template.name,
            "description": export_info.description if export_info.description else template.description,
        }
        if export_info.tags:
            meta["tags"] = export_info.tags

        # Create a zip file
        output_zip = io.BytesIO()
        with zipfile.ZipFile(output_zip, 'w') as zipf:
            # Write the template data to a JSON file
            zipf.writestr(data=template.data, zinfo_or_arcname=f"{export_info.cid}.data.json")
            zipf.writestr(data=json.dumps(meta, indent=2), zinfo_or_arcname=f"{export_info.cid}.meta.json")

        # Return the zip file as an attachment
        output_zip.seek(0)
        return Response(content=output_zip.getvalue(), media_type='application/zip', headers={"Content-Disposition": f"attachment; filename=templates.zip"})

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error exporting project template with ID {template_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")

