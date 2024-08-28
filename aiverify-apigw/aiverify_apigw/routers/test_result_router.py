from datetime import date, datetime
from fileinput import filename
from click import DateTime
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from typing import Optional, List
import json
from sqlalchemy import select
from pathlib import PurePath

from ..lib.logging import logger
from ..lib.database import SessionLocal
from ..lib.constants import TestDatasetFileType, TestDatasetStatus, TestModelMode, TestModelStatus
from ..schemas import TestResult
from ..models import PluginModel, AlgorithmModel, TestModelModel, TestResultModel, TestDatasetModel, TestArtifactModel

router = APIRouter(
    prefix="/test_result",
    tags=["test_result"]
)


@router.get("/")
async def read_test_results():
    return {"message": "List of test results"}


@router.post("/upload")
async def upload_test_result(
    test_result: TestResult,
    artifacts: Optional[List[UploadFile]] = None
):
    try:
        with SessionLocal() as session:
            # find algorithm
            stmt = (
                select(AlgorithmModel)
                .join(AlgorithmModel.plugin)
                .where(PluginModel.gid == test_result.gid)
                .where(AlgorithmModel.cid == test_result.cid)
            )
            algorithm = session.scalar(stmt)
            if algorithm is None:
                return HTTPException(status_code=400, detail=f"Algorithm {test_result.gid} not found")
            
            # find model
            test_argument = test_result.test_arguments
            # todo: to support api in future
            if test_argument.mode == "api":
                return HTTPException(status_code=400, detail=f"Algorithm {test_result.gid} not found")
            else:
                if test_argument.modelFile is None:
                    return HTTPException(status_code=400, detail="modelFile not specified")
                model_file = PurePath(test_argument.modelFile)
                stmt = select(TestModelModel).filter_by(filename=model_file.name)
                test_model = session.scalar(stmt)
                if test_model is None:
                    now = datetime.now()
                    test_model = TestModelModel(
                        name = model_file.name,
                        mode = TestModelMode.Upload,
                        status = TestModelStatus.Valid,
                        filepath = test_argument.modelFile,
                        filename = model_file.name,
                        created_at = now,
                        updated_at = now,
                    )
                    session.add(test_model)
                    session.commit()
                    logger.info(f"Insert new model in db: {test_model}")

            # find dataset
            test_dataset_file = PurePath(test_argument.testDataset)
            stmt = select(TestDatasetModel).filter_by(filename=test_dataset_file.name)
            test_dataset = session.scalar(stmt)
            if test_dataset is None:
                now = datetime.now()
                test_dataset = TestDatasetModel(
                    name = test_dataset_file.name,
                    status = TestDatasetStatus.Valid,
                    filepath = test_argument.testDataset,
                    filename = test_dataset_file.name,
                    file_type = TestDatasetFileType.Folder if test_argument.testDataset.endswith("/") else TestDatasetFileType.Folder,
                )
                session.add(test_dataset)
                session.commit()
                logger.info(f"Insert new test dataaset in db: {test_dataset}")

            # find ground truth
            ground_truth_dataset = None
            if test_argument.groundTruthDataset:
                if test_argument.groundTruth is None:
                    return HTTPException(status_code=400, detail="Missing groundTruth")
                ground_truth_file = PurePath(test_argument.testDataset)
                stmt = select(TestDatasetModel).filter_by(filename=ground_truth_file.name)
                ground_truth_dataset = session.scalar(stmt)
                if ground_truth_dataset is None:
                    now = datetime.now()
                    ground_truth_dataset = TestDatasetModel(
                        name = ground_truth_file.name,
                        status = TestDatasetStatus.Valid,
                        filepath = test_argument.groundTruthDataset,
                        filename = ground_truth_file.name,
                        file_type = TestDatasetFileType.File
                    )
                    session.add(ground_truth_dataset)
                    session.commit()
                    logger.info(f"Insert new test dataaset in db: {ground_truth_dataset}")

            # todo: validate test_arguments and output


            # Create a new TestResultModel instance
            test_result_model = TestResultModel(
                gid=test_result.gid,
                cid=test_result.cid,
                algorithm=algorithm,
                version=test_result.version,
                # user
                model=test_model,
                test_dataset=test_dataset,
                ground_truth_dataset=ground_truth_dataset,
                ground_truth=test_argument.groundTruth,
                start_time=test_result.start_time,
                time_taken=test_result.time_taken,
                algo_arguments=json.dumps(test_result.test_arguments.algorithmArgs).encode('utf-8'),
                output=json.dumps(test_result.output).encode('utf-8'),
                # artifacts=artifact_paths
            )

            # Process uploaded files
            artifact_paths = []
            if artifacts:
                for artifact in artifacts:
                    file_location = f"some/directory/{artifact.filename}"
                    with open(file_location, "wb") as file:
                        file.write(artifact.file.read())
                    artifact_paths.append(file_location)


        # Here you would typically add the test_result_model to the database
        # For example: db_session.add(test_result_model)
        # db_session.commit()

        return JSONResponse(content={"message": "Test result uploaded successfully", "test_result_id": test_result_model.id})
    except Exception as e:
        logger.warning(f"Test result upload error: {e}")
        return HTTPException(status_code=400, detail="Test result upload error")
