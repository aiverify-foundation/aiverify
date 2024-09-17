from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, Form, Depends, Response
from typing import List
import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from pathlib import PurePath

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..lib.constants import TestDatasetFileType, TestDatasetStatus, TestModelMode, TestModelStatus
from ..lib.filestore import save_artifact, get_artifact, get_suffix
from ..lib.utils import guess_mimetype_from_filename
from ..schemas import TestResult
from ..models import AlgorithmModel, TestModelModel, TestResultModel, TestDatasetModel, TestArtifactModel

router = APIRouter(
    prefix="/test_result",
    tags=["test_result"]
)


# @router.get("/")
# async def read_test_results():
#     return {"message": "List of test results"}


@router.post("/upload")
async def upload_test_result(
    session: Session = Depends(get_db_session),
    test_result: TestResult = Form(...),
    artifacts: List[UploadFile] = []
):
    """Endpoint to upload test result"""
    logger.debug(f"upload_test_result: {test_result}")
    if artifacts:
        logger.debug(f"Number of artifacts: {len(artifacts)}")
    else:
        logger.debug("No artifacts")
    try:
        session.begin()
        # find algorithm
        stmt = (
            select(AlgorithmModel)
            .where(AlgorithmModel.gid == test_result.gid)
            .where(AlgorithmModel.cid == test_result.cid)
        )
        algorithm = session.scalar(stmt)
        if algorithm is None:
            raise HTTPException(status_code=400, detail=f"Algorithm {test_result.gid} not found")

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
                now = datetime.now()
                test_model = TestModelModel(
                    name=model_file.name,
                    mode=TestModelMode.Upload,
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
            now = datetime.now()
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
                return HTTPException(status_code=400, detail="Missing groundTruth")
            ground_truth_file = PurePath(test_arguments.testDataset)
            stmt = select(TestDatasetModel).filter_by(filename=ground_truth_file.name)
            ground_truth_dataset = session.scalar(stmt)
            if ground_truth_dataset is None:
                now = datetime.now()
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
            name=f"Test for {test_result.cid}",
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
        )
        session.add(test_result_model)
        session.flush()
        test_result_id = str(test_result_model.id)
        # test_result_id = "1"
        logger.debug(f"test_result_id: {test_result_id}")

        # Process uploaded files
        if artifacts and len(artifacts) > 0:
            for artifact_file in artifacts:
                if artifact_file.filename is None:
                    logger.warning(f"artifact filename not found, skipping")
                    continue
                filename = artifact_file.filename
                data = artifact_file.file.read()
                save_artifact(test_result_id, filename, data)
                artifact = TestArtifactModel(
                    filename=filename,
                    suffix=get_suffix(filename),
                    mimetype=artifact_file.content_type if artifact_file.content_type else guess_mimetype_from_filename(
                        filename),
                )
                # session.add(artifact)
                # session.flush()
                test_result_model.artifacts.append(artifact)

        # commit to DB
        # session.add(test_result_model)
        session.commit()

        logger.info(f"Test result uploaded: {test_result_model}")
        return test_result_id
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.warning(f"Test result upload error: {e}")
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Test result upload error: {e}")


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
