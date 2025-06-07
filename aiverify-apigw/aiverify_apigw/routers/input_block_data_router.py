from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import json
from ..lib.logging import logger
from ..lib.database import get_db_session
from ..models import PluginModel, InputBlockDataModel, InputBlockModel, InputBlockGroupDataModel
from ..schemas import InputBlockData, InputBlockGroupDataInput, InputBlockDataOutput, InputBlockDataUpdate, InputBlockGroupDataUpdate, InputBlockGroupDataOutput

router = APIRouter(prefix="/input_block_data", tags=["input_block_data"])


@router.get("/", response_model=List[InputBlockDataOutput])
def list_input_block_data(session: Session = Depends(get_db_session)):
    input_block_data = session.query(InputBlockDataModel).filter(InputBlockDataModel.group == None).all()
    return [InputBlockDataOutput.from_model(ibd) for ibd in input_block_data]


@router.post("/", response_model=InputBlockDataOutput)
def create_input_block_data(ibdata: InputBlockData, session: Session = Depends(get_db_session)):
    try:
        inputblock = session.query(InputBlockModel).filter(
            InputBlockModel.gid == ibdata.gid,
            InputBlockModel.cid == ibdata.cid,
            InputBlockModel.group == None, 
        ).first()
        if not inputblock:
            raise HTTPException(
                status_code=400, detail=f"InputBlock cid {ibdata.cid} not found")

        # if ibdata.group and len(ibdata.group) > 0: # if group name is specified, check for duplicates
        #     existing_entry = session.query(InputBlockDataModel).filter(
        #         InputBlockDataModel.gid == ibdata.gid,
        #         InputBlockDataModel.cid == ibdata.cid,
        #         InputBlockDataModel.group == ibdata.group
        #     ).first()

        #     if existing_entry:
        #         raise HTTPException(
        #             status_code=400,
        #             detail=f"A checklist with gid '{ibdata.gid}', cid '{ibdata.cid}', and group '{ibdata.group}' already exists."
        #         )

        now = datetime.now(timezone.utc)
        new_input_block_data = InputBlockDataModel(
            name=ibdata.name,
            gid=ibdata.gid,
            cid=ibdata.cid,
            # group=ibdata.group,
            data=json.dumps(ibdata.data).encode('utf-8'),
            inputblock=inputblock,
            created_at=now,
            updated_at=now
        )
        session.add(new_input_block_data)
        session.commit()
        session.refresh(new_input_block_data)
        return InputBlockDataOutput.from_model(new_input_block_data)
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.get("/{inputblock_id}", response_model=InputBlockDataOutput)
def read_input_block_data(inputblock_id: int, session: Session = Depends(get_db_session)):
    try:
        input_block_data = session.query(InputBlockDataModel).filter(
            InputBlockDataModel.id == inputblock_id, InputBlockDataModel.group == None).first()
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
            InputBlockDataModel.id == inputblock_id, InputBlockDataModel.group == None).first()
        if not input_block_data:
            raise HTTPException(
                status_code=404, detail="InputBlockData not found")

        input_block_data.name = ibdata.name
        # input_block_data.group = ibdata.group
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
            InputBlockDataModel.id == inputblock_id,
            InputBlockDataModel.group == None
        ).first()
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


@router.post("/groups", response_model=InputBlockGroupDataOutput)
def create_input_block_group_data(group_data: InputBlockGroupDataInput, session: Session = Depends(get_db_session)):
    logger.debug(f"create_input_block_group_data: {group_data}")
    try:
        # make sure gid exists
        plugin = session.query(PluginModel).filter(
            PluginModel.gid == group_data.gid,
        ).first()
        if not plugin:
            raise HTTPException(
                status_code=404, detail=f"Plugin gid {group_data.gid} not found")

        # validate all cids is valid
        for ib_data in group_data.input_blocks:
            # check for cid
            ib = next((x for x in plugin.inputblocks if x.cid == ib_data.cid), None)
            if not ib:
                raise HTTPException(
                    status_code=404, detail=f"Plugin cid {ib_data.cid} not found")

        input_blocks = []
        now = datetime.now(timezone.utc)
        for ib in [x for x in plugin.inputblocks if x.group == group_data.group and x.groupNumber]:
            ib_data = next((x for x in group_data.input_blocks if x.cid == ib.cid), None)
            input_block = InputBlockDataModel(
                name=ib.cid,
                gid=group_data.gid,
                cid=ib.cid,
                inputblock=ib,
                group_number=ib.groupNumber, # group number should be taken from plugin data
                data=json.dumps(ib_data.data if ib_data and ib_data.data else {}).encode('utf-8'),
            )
            input_blocks.append(input_block)
        input_blocks.sort(key=lambda ib: ib.group_number)
        
        new_group = InputBlockGroupDataModel(
            name=group_data.name,
            gid=group_data.gid,
            group=group_data.group,
            input_blocks=input_blocks,
            created_at=now,
            updated_at=now
        )

        session.add(new_group)
        session.commit()
        session.refresh(new_group)
        return InputBlockGroupDataOutput.from_model(new_group)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.warning(f"Internal error when saving input block group: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error {e}")


@router.get("/groups/", response_model=List[InputBlockGroupDataOutput])
def read_input_block_groups(session: Session = Depends(get_db_session)) -> List[InputBlockGroupDataOutput]:
    """
    Endpoint to retrieve all input block groups.
    """
    try:
        group_results = session.query(InputBlockGroupDataModel).all()
        group_outputs = [InputBlockGroupDataOutput.from_model(group) for group in group_results]
        return group_outputs
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@router.get("/groups/{gid}/{group}", response_model=List[InputBlockGroupDataOutput])
def read_input_block_groups_by_gid_and_group(gid: str, group: str, session: Session = Depends(get_db_session)) -> List[InputBlockGroupDataOutput]:
    """
    Endpoint to retrieve input block groups filtered by gid and group.
    """
    try:
        # check for valid gid
        plugin = session.query(PluginModel).filter(
            PluginModel.gid == gid,
        ).first()
        if not plugin:
            raise HTTPException(
                status_code=404, detail=f"Plugin gid {gid} not found")
        
        group_results = session.query(InputBlockGroupDataModel).filter(
            InputBlockGroupDataModel.gid == gid,
            InputBlockGroupDataModel.group == group
        ).all()
        
        group_outputs = [InputBlockGroupDataOutput.from_model(group) for group in group_results]
        return group_outputs
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@router.get("/groups/{group_data_id}", response_model=InputBlockGroupDataOutput)
def read_input_block_group(group_data_id: int, session: Session = Depends(get_db_session)) -> InputBlockGroupDataOutput:
    """
    Endpoint to retrieve a single input block group by its ID.
    """
    try:
        group = session.query(InputBlockGroupDataModel).filter(InputBlockGroupDataModel.id == group_data_id).first()
        if not group:
            raise HTTPException(status_code=404, detail=f"InputBlockGroup with id {group_data_id} not found")
        return InputBlockGroupDataOutput.from_model(group)
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    

@router.patch("/groups/{group_data_id}", response_model=InputBlockGroupDataOutput)
def update_input_block_group(group_data_id: int, group_data_update: InputBlockGroupDataUpdate, session: Session = Depends(get_db_session)) -> InputBlockGroupDataOutput:
    """
    Endpoint to update an existing input block group by its ID.
    """
    try:
        group = session.query(InputBlockGroupDataModel).filter(InputBlockGroupDataModel.id == group_data_id).first()
        if not group:
            raise HTTPException(status_code=404, detail=f"InputBlockGroup with id {group_data_id} not found")
        
        update_data = group_data_update.model_dump(exclude_unset=True)
        logger.debug(f"update_input_block_group update data: {update_data}")

        if "name" in update_data:
            group.name = update_data["name"]
        if "input_blocks" in update_data:
            for ib in group.input_blocks:
                ib_data = next((x for x in update_data["input_blocks"] if x["cid"] == ib.cid), None)
                if ib_data and "data" in ib_data:
                    ib.data = json.dumps(ib_data["data"]).encode('utf-8')
                # else:
                #     ib.data = json.dumps({}).encode('utf-8')
        group.updated_at = datetime.now(timezone.utc)
        
        session.commit()
        session.refresh(group)
        return InputBlockGroupDataOutput.from_model(group)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.warning(f"Error updating input block group: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@router.delete("/groups/{group_data_id}", response_model=None)
def delete_input_block_group(group_data_id: int, session: Session = Depends(get_db_session)) -> None:
    """
    Endpoint to delete an input block group by its ID.
    """
    try:
        group = session.query(InputBlockGroupDataModel).filter(InputBlockGroupDataModel.id == group_data_id).first()
        if not group:
            raise HTTPException(status_code=404, detail=f"InputBlockGroup with id {group_data_id} not found")
        
        session.delete(group)
        session.commit()
    except HTTPException as e:
        raise e
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
