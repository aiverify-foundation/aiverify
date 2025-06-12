from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
import json

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..models import ProjectModel, ProjectTemplateModel, TestModelModel, InputBlockDataModel, TestResultModel
from ..schemas import ProjectOutput, ProjectInformation, ProjectInput, ProjectTemplateMeta, ProjectPatchInput, ProjectTemplateOutput, ProjectTemplateInformationOptional

router = APIRouter(prefix="/projects", tags=["project"])


@router.get("/", response_model=List[ProjectOutput])
async def get_all_projects(session: Session = Depends(get_db_session)):
    """
    Get all Projects
    """
    try:
        projects = session.query(ProjectModel).all()
        return [ProjectOutput.from_model(project) for project in projects]
    except Exception as e:
        logger.error(f"Error retrieving projects: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.post("/", response_model=ProjectOutput)
async def create_project(projectInfo: ProjectInformation, templateId: Optional[int] = None, session: Session = Depends(get_db_session)):
    """
    Create a new Project
    """
    try:
        now = datetime.now(timezone.utc)
        if templateId:
            template = session.query(ProjectTemplateModel).filter(ProjectTemplateModel.id == templateId).first()
            if not template:
                raise HTTPException(status_code=400, detail="Project Template not found")
            data = template.data
        else:
            template = None
            obj = {
                "pages": [],
                "globalVars": []
            }
            data = json.dumps(obj).encode("utf-8")
        new_project = ProjectModel(
            # id=str(uuid4()),
            name=projectInfo.name,
            description=projectInfo.description,
            report_title=projectInfo.reportTitle,
            company=projectInfo.company,
            template=template,
            data=data,
            created_at=now,
            updated_at=now
        )
        session.add(new_project)
        session.commit()
        session.refresh(new_project)
        return ProjectOutput.from_model(new_project)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.get("/{project_id}", response_model=ProjectOutput)
async def read_project(project_id: int, session: Session = Depends(get_db_session)):
    """
    Retrieve a project by its ID
    """
    try:
        project = session.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return ProjectOutput.from_model(project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving project with ID {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


def _update_input_blocks(session: Session, db_project: ProjectModel, inputBlocks: List[int]):
    # remove items not in project.inputBlocks
    for ib in list(db_project.input_blocks_data):
        id = next((item for item in inputBlocks if item == ib.id), -1)
        if id < 0:
            index = next((idx for idx, row in enumerate(db_project.input_blocks_data) if row.id == ib.id), -1)
            if index < 0:
                logger.error(f"Unable to find index for {ib}")
                continue
            db_project.input_blocks_data.pop(index)
    # add items not in db_project.input_blocks_data
    for id in inputBlocks:
        item = next((item for item in db_project.input_blocks_data if item.id == id), None)
        if item is None:
            db_ib = session.query(InputBlockDataModel).filter(InputBlockDataModel.id == id).first()
            if db_ib is None:
                raise HTTPException(status_code=400, detail=f"Input block {id} not found")
            db_project.input_blocks_data.append(db_ib)


def _update_test_results(session: Session, db_project: ProjectModel, testResults: List[int]):
    # remove items not in project.testResults
    for test_result in list(db_project.test_results):
        id = next((item for item in testResults if item == test_result.id), -1)
        if id < 0:
            index = next((idx for idx, row in enumerate(db_project.test_results) if row.id == test_result.id), -1)
            if index < 0:
                logger.error(f"Unable to find index for {test_result}")
                continue
            db_project.test_results.pop(index)
    # add items not in db_project.test_results
    for id in testResults:
        item = next((item for item in db_project.test_results if item.id == id), None)
        if item is None:
            db_result = session.query(TestResultModel).filter(TestResultModel.id == id).first()
            if db_result is None:
                raise HTTPException(status_code=400, detail=f"Test Result {id} not found")
            db_project.test_results.append(db_result)


@router.put("/{project_id}", response_model=ProjectOutput)
async def update_project(
    project_id: int, project: ProjectInput, session: Session = Depends(get_db_session)
):
    """
    Update an existing project by its ID
    """
    try:
        db_project = session.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if not db_project:
            raise HTTPException(status_code=404, detail="Project not found")

        if project.testModelId:
            test_model = session.query(TestModelModel).filter(TestModelModel.id == project.testModelId).first()
            if test_model is None:
                raise HTTPException(status_code=404, detail=f"Test model {project.testModelId} not found")
        else:
            test_model = None

        if project.inputBlocks and len(project.inputBlocks) > 0:
            _update_input_blocks(session, db_project, project.inputBlocks)
        else:
            db_project.input_blocks_data.clear() # if no input blocks, just clear the list

        if project.testResults and len(project.testResults) > 0:
            _update_test_results(session, db_project, project.testResults)
        else:
            db_project.test_results.clear() # if no input blocks, just clear the list

        # Update project fields
        meta = ProjectTemplateMeta(globalVars=project.globalVars, pages=project.pages)
        db_project.name = project.projectInfo.name
        db_project.description = project.projectInfo.description
        db_project.report_title = project.projectInfo.reportTitle
        db_project.company = project.projectInfo.company
        db_project.data = meta.model_dump_json().encode("utf-8")
        db_project.test_model = test_model
        db_project.updated_at = datetime.now(timezone.utc)

        session.commit()
        session.refresh(db_project)
        return ProjectOutput.from_model(db_project)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating project with ID {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")


@router.patch("/projects/{project_id}", response_model=ProjectOutput)
async def patch_update_project(
    project_id: int, project: ProjectPatchInput, session: Session = Depends(get_db_session)
):
    """
    Patch update a Project by ID
    """
    logger.debug(f"patch_update_project: {project}")
    try:
        db_project = session.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if db_project is None:
            raise HTTPException(status_code=404, detail="Project not found")

        update_data = project.model_dump(exclude_unset=True)
        logger.debug(f"patch_update_project update data: {update_data}")

        if "globalVars" in update_data or "pages" in update_data:
            update_meta = ProjectTemplateMeta.model_validate_json(db_project.data.decode("utf-8"))
            if "globalVars" in update_data:
                update_meta.globalVars = update_data["globalVars"]
            if "pages" in update_data:
                update_meta.pages = update_data["pages"]
            db_project.data = update_meta.model_dump_json().encode("utf-8")
        if "projectInfo" in update_data:
            if "name" in update_data["projectInfo"]:
                db_project.name = update_data["projectInfo"]["name"]
            if "description" in update_data["projectInfo"]:
                db_project.description = update_data["projectInfo"]["description"]
            if "reportTitle" in update_data["projectInfo"]:
                db_project.report_title = update_data["projectInfo"]["reportTitle"]
            if "company" in update_data["projectInfo"]:
                db_project.company = update_data["projectInfo"]["company"]
        if "testModelId" in update_data:
            if update_data["testModelId"]:
                test_model = session.query(TestModelModel).filter(TestModelModel.id == update_data["testModelId"]).first()
                if test_model is None:
                    raise HTTPException(status_code=400, detail=f"Test Model {update_data['testModelId']} not found")
                db_project.test_model = test_model
            else:
                db_project.test_model = None
        if "inputBlocks" in update_data:
            if update_data["inputBlocks"] and len(update_data["inputBlocks"]) > 0:
                _update_input_blocks(session, db_project, update_data["inputBlocks"])
            else:
                db_project.input_blocks_data.clear() # if no input blocks, just clear the list
        if "testResults" in update_data:
            if update_data["testResults"] and len(update_data["testResults"]) > 0:
                _update_test_results(session, db_project, update_data["testResults"])
            else:
                db_project.test_results.clear() # if no input blocks, just clear the list

        db_project.updated_at = datetime.now(timezone.utc)

        session.commit()
        session.refresh(db_project)
        return ProjectOutput.from_model(db_project)
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        logger.error(f"Error patch updating project with ID {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")


@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, session: Session = Depends(get_db_session)):
    try:
        db_project = session.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if db_project is None:
            raise HTTPException(status_code=404, detail=f"Project not found")
        
        session.delete(db_project)
        session.commit()
        return project_id
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting project with ID {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.post("/saveProjectAsTemplate/{project_id}", response_model=ProjectTemplateOutput)
async def save_project_as_template(project_id: int, projectInfo: Optional[ProjectTemplateInformationOptional] = None, session: Session = Depends(get_db_session)):
    """
    Save a project as a template
    """
    try:
        db_project = session.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if db_project is None:
            raise HTTPException(status_code=404, detail="Project not found")

        now = datetime.now(timezone.utc)
        template_data = db_project.data

        if projectInfo:
            name = projectInfo.name if projectInfo.name else db_project.name
            description = projectInfo.description if projectInfo.description else db_project.description
        else:
            name = db_project.name
            description = db_project.description

        new_template = ProjectTemplateModel(
            name=name,
            description=description,
            data=template_data,
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
        logger.error(f"Error saving project with ID {project_id} as template: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
