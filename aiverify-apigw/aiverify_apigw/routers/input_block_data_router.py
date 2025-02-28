from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import json
from ..lib.database import get_db_session
from ..models import InputBlockDataModel, InputBlockModel
from ..schemas import InputBlockData, InputBlockDataOutput, InputBlockDataUpdate

router = APIRouter(prefix="/input_block_data", tags=["input_block_data"])


@router.get("/", response_model=List[InputBlockDataOutput])
def list_input_block_data(session: Session = Depends(get_db_session)):
    input_block_data = session.query(InputBlockDataModel).all()
    return [InputBlockDataOutput.from_model(ibd) for ibd in input_block_data]


@router.post("/", response_model=InputBlockDataOutput)
def create_input_block_data(ibdata: InputBlockData, session: Session = Depends(get_db_session)):
    try:
        inputblock = session.query(InputBlockModel).filter(
            InputBlockModel.gid == ibdata.gid,
            InputBlockModel.cid == ibdata.cid
        ).first()
        if not inputblock:
            raise HTTPException(
                status_code=400, detail=f"InputBlock cid {ibdata.cid} not found")

        existing_entry = session.query(InputBlockDataModel).filter(
            InputBlockDataModel.gid == ibdata.gid,
            InputBlockDataModel.cid == ibdata.cid,
            InputBlockDataModel.group == ibdata.group
        ).first()

        if existing_entry:
            raise HTTPException(
                status_code=400,
                detail=f"A checklist with gid '{ibdata.gid}', cid '{ibdata.cid}', and group '{ibdata.group}' already exists."
            )

        now = datetime.now(timezone.utc)
        new_input_block_data = InputBlockDataModel(
            name=ibdata.name,
            gid=ibdata.gid,
            cid=ibdata.cid,
            group=ibdata.group,
            data=json.dumps(ibdata.data).encode('utf-8'),
            inputblock=inputblock,
            created_at=now,
            updated_at=now
        )
        session.add(new_input_block_data)
        session.commit()
        session.refresh(new_input_block_data)
        return InputBlockDataOutput.from_model(new_input_block_data)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.get("/{inputblock_id}", response_model=InputBlockDataOutput)
def read_input_block_data(inputblock_id: int, session: Session = Depends(get_db_session)):
    try:
        input_block_data = session.query(InputBlockDataModel).filter(
            InputBlockDataModel.id == inputblock_id).first()
        if not input_block_data:
            raise HTTPException(
                status_code=404, detail="InputBlockData not found")
        return InputBlockDataOutput.from_model(input_block_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.put("/{inputblock_id}", response_model=InputBlockDataOutput)
def update_input_block_data(inputblock_id: int, ibdata: InputBlockDataUpdate, session: Session = Depends(get_db_session)):
    try:
        input_block_data = session.query(InputBlockDataModel).filter(
            InputBlockDataModel.id == inputblock_id).first()
        if not input_block_data:
            raise HTTPException(
                status_code=404, detail="InputBlockData not found")

        input_block_data.name = ibdata.name
        input_block_data.group = ibdata.group
        input_block_data.data = json.dumps(ibdata.data).encode('utf-8')
        input_block_data.updated_at = datetime.now(timezone.utc)

        session.commit()
        session.refresh(input_block_data)
        return InputBlockDataOutput.from_model(input_block_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.delete("/{inputblock_id}")
def delete_input_block_data(inputblock_id: int, session: Session = Depends(get_db_session)):
    try:
        input_block_data = session.query(InputBlockDataModel).filter(
            InputBlockDataModel.id == inputblock_id).first()
        if not input_block_data:
            raise HTTPException(
                status_code=404, detail="InputBlockData not found")

        session.delete(input_block_data)
        session.commit()
        return inputblock_id
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error {e}")
