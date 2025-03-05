from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
import os
from sqlalchemy.orm import Session
import valkey
import json
from uuid import UUID

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..lib.constants import TestModelMode, TestRunStatus
from ..lib.utils import validate_json_schema
from ..schemas import TestRunInput, TestRunOutput
from ..models import TestRunModel, TestModelModel, AlgorithmModel, TestDatasetModel

router = APIRouter(prefix="/test_runs", tags=["test_run"])


# create valkey client
TASK_STREAM_NAME = "aiverify:worker:task_queue"
TASK_GROUP_NAME = "aiverify_workers"
host = os.getenv("VALKEY_HOST_ADDRESS", "127.0.0.1")
port = int(os.getenv("VALKEY_PORT", 6379))
client = valkey.Valkey(host=host, port=port, db=0)
# client.ping()

_group_init_flag: bool = True


def _check_server_active():
    global _group_init_flag
    try:
        client.ping()
        if _group_init_flag:
            _group_init_flag = False
            init_group()
        return True
    except:
        return False


def init_group():
    from valkey.exceptions import ResponseError
    try:
        client.xgroup_create(
            name=TASK_STREAM_NAME,
            groupname=TASK_GROUP_NAME,
            mkstream=True,
        )
        # client.xautoclaim(
        #     name=TASK_STREAM_NAME,
        #     groupname=TASK_GROUP_NAME,
        #     consumername='worker',
        #     count=1
        # )
        logger.info(f"Created STREAM {TASK_STREAM_NAME}")
    except ResponseError:
        pass


@router.post("/server_active")
async def server_active() -> bool:
    return _check_server_active()


@router.post("/run_test")
async def run_test(input_data: TestRunInput, session: Session = Depends(get_db_session)) -> TestRunOutput:
    logger.debug(f"run_test input_data: {input_data}")
    if not _check_server_active():
        raise HTTPException(status_code=500, detail="Task queue not active")

    # query for required instances in DB    
    algo = session.query(AlgorithmModel).filter(AlgorithmModel.gid == input_data.algorithmGID, AlgorithmModel.cid == input_data.algorithmCID).first()
    if algo is None:
        raise HTTPException(status_code=404, detail="Algorithm not found with the provided GID and CID")
    
    logger.debug(f"algo: {algo}, input schema: {algo.input_schema}")
    if algo.script is None:
        raise HTTPException(status_code=400, detail="Unable to detect executable script in algorithm")
    
    if not validate_json_schema(input_data.algorithmArgs, json.loads(algo.input_schema.decode("utf-8"))):
        raise HTTPException(status_code=400, detail="Invalid algorithm arguments")
    
    model = session.query(TestModelModel).filter(TestModelModel.filename == input_data.modelFilename).first()
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found with the provided modelId")
    else:
        logger.debug(f"model: {model}")
        # check if valid model to run
        if model.mode != TestModelMode.Upload:
            raise HTTPException(status_code=400, detail="Currently only support Upload model models")
        if model.size is None or model.size == 0:
            raise HTTPException(status_code=400, detail="Model file not uploaded")
        
    test_dataset = session.query(TestDatasetModel).filter(TestDatasetModel.filename == input_data.testDatasetFilename).first()
    if test_dataset is None:
        raise HTTPException(status_code=404, detail="Test dataset not found with the provided testDatasetId")
    else:
        # check if test dataset has uploaded file
        if test_dataset.size is None or test_dataset.size == 0:
            raise HTTPException(status_code=400, detail="Test Dataset file not uploaded")
    
    ground_truth_dataset = None
    if input_data.groundTruthDatasetFilename:
        ground_truth_dataset = session.query(TestDatasetModel).filter(TestDatasetModel.filename == input_data.groundTruthDatasetFilename).first()
        if ground_truth_dataset is None:
            raise HTTPException(status_code=404, detail="Test dataset not found with the provided groundTruthDatasetId")
        else:
            # check if test dataset has uploaded file
            if ground_truth_dataset.size is None or ground_truth_dataset.size == 0:
                raise HTTPException(status_code=400, detail="Ground truth dataset file not uploaded")
            
    # create new TestRunModel and save to DB
    now = datetime.now(timezone.utc)
    test_run = TestRunModel(
        status=TestRunStatus.Pending,
        algorithm=algo,
        algo_arguments=json.dumps(input_data.algorithmArgs).encode("utf-8"),
        model=model,
        test_dataset=test_dataset,
        ground_truth_dataset=ground_truth_dataset,
        created_at=now,
        updated_at=now
    )
    session.add(test_run)
    session.commit()
    logger.info(f"New test run created with ID: {test_run.id}")

    # create new task for task queue
    task = {
        "id": str(test_run.id),
        "mode": "upload", # for now only support upload
        "algorithmGID": algo.gid,
        "algorithmCID": algo.cid,
        "algorithmHash": algo.zip_hash,
        "algorithmArgs": input_data.algorithmArgs,
        "modelFile": model.filename,
        "modelFileHash": model.zip_hash,
        "modelType": model.model_type.value.lower(),
        "testDataset": test_dataset.filename,
        "testDatasetHash": test_dataset.zip_hash,

    }
    if ground_truth_dataset:
        task["groundTruthDataset"] = ground_truth_dataset.filename
        task["groundTruthDatasetHash"] = ground_truth_dataset.zip_hash
        task["groundTruth"] = input_data.groundTruth

    task_str = json.dumps(task)
    logger.debug(f"Add new Task: {task_str}")

    client.xadd(TASK_STREAM_NAME, fields={"task": task_str})

    return TestRunOutput.from_model(test_run)


@router.get("/{test_run_id}", response_model=TestRunOutput)
def get_test_run(test_run_id: str, session: Session = Depends(get_db_session)) -> TestRunOutput:
    test_run = session.query(TestRunModel).filter(TestRunModel.id == UUID(test_run_id)).first()
    if not test_run:
        raise HTTPException(status_code=404, detail="Test run not found")
    return TestRunOutput.from_model(test_run)
