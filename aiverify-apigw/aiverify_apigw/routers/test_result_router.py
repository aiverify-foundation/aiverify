from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, Form, Depends, Response
from typing import List, Optional, Annotated, Any
import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from pathlib import PurePath
from pydantic import Json

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..lib.constants import TestDatasetFileType, TestDatasetStatus, TestModelMode, TestModelStatus
from ..lib.filestore import save_artifact, get_artifact, get_suffix
from ..lib.utils import guess_mimetype_from_filename
from ..schemas import TestResult, TestResultOutput, TestResultUpdate
from ..schemas.load_examples import test_result_examples
from ..models import AlgorithmModel, TestModelModel, TestResultModel, TestDatasetModel, TestArtifactModel

router = APIRouter(
    prefix="/test_result",
    tags=["test_result"]
)


# @router.get("/")
# async def read_test_results():
#     return {"message": "List of test results"}

async def _save_test_result(session:Session, test_result: TestResult, artifact_set: dict[str,UploadFile]):
    # find algorithm
    stmt = (
        select(AlgorithmModel)
        .where(AlgorithmModel.gid == test_result.gid)
        .where(AlgorithmModel.cid == test_result.cid)
    )
    algorithm = session.scalar(stmt)
    if algorithm is None:
        raise HTTPException(status_code=400, detail=f"Algorithm {test_result.gid} not found")
    
    now = datetime.now()

    # find model
    test_arguments = test_result.test_arguments
    # todo: to support api in future
    if test_arguments.mode == "api":
        raise HTTPException(status_code=400, detail=f"Algorithm {test_result.gid} not found")
    else:
        if test_arguments.modelFile is None:
            raise HTTPException(status_code=400, detail="modelFile not specified")
        model_file = PurePath(test_arguments.modelFile)
        stmt = select(TestModelModel).filter_by(filename=model_file.name)
        test_model = session.scalar(stmt)
        if test_model is None:
            test_model = TestModelModel(
                name=model_file.name,
                mode=TestModelMode.Upload,
                model_type=test_arguments.modelType,
                status=TestModelStatus.Valid,
                filepath=test_arguments.modelFile,
                filename=model_file.name,
                created_at=now,
                updated_at=now,
            )
            # session.add(test_model)
            # session.flush()
            logger.info(f"Insert new model in db: {test_model}")

    # find dataset
    test_dataset_file = PurePath(test_arguments.testDataset)
    stmt = select(TestDatasetModel).filter_by(filename=test_dataset_file.name)
    test_dataset = session.scalar(stmt)
    if test_dataset is None:
        test_dataset = TestDatasetModel(
            name=test_dataset_file.name,
            status=TestDatasetStatus.Valid,
            filepath=test_arguments.testDataset,
            filename=test_dataset_file.name,
            file_type=TestDatasetFileType.Folder if test_arguments.testDataset.endswith(
                "/") else TestDatasetFileType.Folder,
        )
        # session.add(test_dataset)
        # session.flush()
        logger.info(f"Insert new test dataaset in db: {test_dataset}")

    # find ground truth
    ground_truth_dataset = None
    if test_arguments.groundTruthDataset:
        if test_arguments.groundTruth is None:
            raise HTTPException(status_code=400, detail="Missing groundTruth")
        ground_truth_file = PurePath(test_arguments.testDataset)
        stmt = select(TestDatasetModel).filter_by(filename=ground_truth_file.name)
        ground_truth_dataset = session.scalar(stmt)
        if ground_truth_dataset is None:
            ground_truth_dataset = TestDatasetModel(
                name=ground_truth_file.name,
                status=TestDatasetStatus.Valid,
                filepath=test_arguments.groundTruthDataset,
                filename=ground_truth_file.name,
                file_type=TestDatasetFileType.File
            )
            # session.add(ground_truth_dataset)
            # session.flush()
            logger.info(f"Insert new test dataaset in db: {ground_truth_dataset}")

    # todo: validate test_arguments and output

    # Create a new TestResultModel instance
    test_result_model = TestResultModel(
        # id=1,
        name=f"Result for {test_result.cid}",
        gid=test_result.gid,
        cid=test_result.cid,
        algorithm=algorithm,
        version=test_result.version,
        # user
        model=test_model,
        test_dataset=test_dataset,
        ground_truth_dataset=ground_truth_dataset,
        ground_truth=test_arguments.groundTruth,
        start_time=test_result.start_time,
        time_taken=test_result.time_taken,
        algo_arguments=json.dumps(test_arguments.algorithmArgs).encode('utf-8'),
        output=json.dumps(test_result.output).encode('utf-8'),
        created_at=now,
        updated_at=now,
    )
    session.add(test_result_model)
    session.flush()
    test_result_id = str(test_result_model.id)
    # test_result_id = "1"
    logger.debug(f"test_result_id: {test_result_id}")

    # Process uploaded files
    if test_result.artifacts and len(test_result.artifacts) > 0:
        for filename in test_result.artifacts:
            if filename not in artifact_set:
                logger.warn(f"Unable to find artifact filename {filename} in uploaded files, skipping")
                continue
            artifact_file = artifact_set[filename]
            data = artifact_file.file.read()
            save_artifact(test_result_id, filename, data)
            artifact = TestArtifactModel(
                filename=filename,
                suffix=get_suffix(filename),
                mimetype=artifact_file.content_type if artifact_file.content_type else guess_mimetype_from_filename(
                    filename),
            )
            test_result_model.artifacts.append(artifact)

    logger.debug(f"Number of saved artifacts: {len(test_result_model.artifacts)}")
    logger.info(f"Test result uploaded: {test_result_model}")
    urls = [f"/test_result/{test_result_id}/artifacts/{artifact.filename}" for artifact in test_result_model.artifacts]
    return [f"/test_result/{test_result_id}"] + urls

@router.post("/upload")
async def upload_test_result(
    test_result: Annotated[Any, Form(examples=test_result_examples)],
    session: Session = Depends(get_db_session),
    artifacts: List[UploadFile] = []
) -> List[str]:
    """Endpoint to upload test result"""
    logger.debug(f"upload_test_result, test_result {type(test_result)}: {test_result}")
    # logger.debug(f"upload_test_result test_results: {test_results}")
    if artifacts:
        logger.debug(f"Number of artifacts files: {len(artifacts)}")
    else:
        logger.debug("No artifacts")
    try:
        obj = json.loads(test_result)
        if isinstance(obj, dict):
            result_dicts = [obj]
        elif isinstance(obj, list):
            result_dicts = obj
        else:
            raise HTTPException(status_code=422)
        results = [TestResult(**result) for result in result_dicts]
    except Exception as e:
        print("Exception: ", e)
        raise HTTPException(status_code=422)
    artifact_set = dict[str,UploadFile]()
    if artifacts and len(artifacts) > 0:
        for artifact in artifacts:
            if artifact.filename:
                artifact_set[artifact.filename] = artifact

    all_urls = []
    for result in results:
        try:
            session.begin()
            urls = await _save_test_result(session=session, test_result=result, artifact_set=artifact_set)
            all_urls.extend(urls)
            session.commit()
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.warning(f"Test result upload error: {e}")
            session.rollback()
            raise HTTPException(status_code=400, detail=f"Test result upload error: {e}")
    return all_urls

@router.get("/{test_result_id}/artifacts/{filename}")
async def get_test_result_artifact(
    test_result_id: str,
    filename: str,
    session: Session = Depends(get_db_session),
):
    """
    Endpoint to retrieve an artifact file by test_result_id and filename.
    """
    try:
        stmt = (
            select(TestArtifactModel)
            .where(TestArtifactModel.test_result_id == test_result_id)
            .where(TestArtifactModel.filename == filename)
        )
        artifact = session.scalar(stmt)
        if artifact is None:
            raise HTTPException(status_code=400, detail=f"Test artifact {
                                filename} not found in test result {test_result_id}")

        try:
            data = get_artifact(test_result_id, filename)
        except Exception as e:
            logger.warning(f"Unable to read artifact file {filename} for test result {test_result_id}: {e}")
            raise HTTPException(status_code=500, detail="Unable to retrieve artifact file")

        headers = {
            "Content-Disposition": f"inline; filename=\"{filename}\""
        }
        # use application/octet-stream for unknown content type
        # media_type = mimetypes.types_map[artifact.suffix] if artifact.suffix in mimetypes.types_map else "application/octet-stream"
        return Response(content=data, media_type=artifact.mimetype, headers=headers)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving artifact: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=List[TestResultOutput])
async def read_test_results(session: Session = Depends(get_db_session)) -> List[TestResultOutput]:
    """
    Endpoint to retrieve all test results.
    """
    try:
        stmt = select(TestResultModel)
        test_results = session.scalars(stmt).all()
        ar = []
        for result in test_results:
            obj = TestResultOutput.from_model(result)
            ar.append(obj)
        return ar
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving test results: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{test_result_id}", response_model=TestResultOutput)
async def read_test_result(test_result_id: int, session: Session = Depends(get_db_session)) -> TestResultOutput:
    """
    Endpoint to retrieve a test result by its ID.
    """
    try:
        stmt = select(TestResultModel).where(TestResultModel.id == test_result_id)
        result = session.scalar(stmt)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Test result not found")
        return TestResultOutput.from_model(result)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving test result with ID {test_result_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{test_result_id}", response_model=TestResultOutput)
async def update_test_result(test_result_id: int, update_data: TestResultUpdate, session: Session = Depends(get_db_session)) -> TestResultOutput:
    """
    Endpoint to update a test result's name by its ID.
    """
    try:
        session.begin()
        stmt = select(TestResultModel).where(TestResultModel.id == test_result_id)
        result = session.scalar(stmt)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Test result not found")

        result.name = update_data.name
        session.commit()
        session.refresh(result)
        return TestResultOutput.from_model(result)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating test result with ID {test_result_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{test_result_id}")
async def delete_test_result(test_result_id: int, session: Session = Depends(get_db_session)):
    """
    Endpoint to delete a test result by its ID.
    """
    try:
        session.begin()
        stmt = select(TestResultModel).where(TestResultModel.id == test_result_id)
        result = session.scalar(stmt)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Test result not found")

        session.delete(result)
        session.commit()
        return Response(status_code=200)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting test result with ID {test_result_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
