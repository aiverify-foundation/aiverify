from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..schemas import PluginOutput
from ..models import PluginModel

router = APIRouter(
    prefix="/plugin",
    tags=["plugin"]
)


@router.get("/", response_model=List[PluginOutput])
async def read_test_results(session: Session = Depends(get_db_session)) -> List[PluginOutput]:
    """
    Endpoint to retrieve all test results.
    """
    try:
        stmt = select(PluginModel)
        test_results = session.scalars(stmt).all()
        ar = []
        for result in test_results:
            obj = PluginOutput.from_model(result)
            ar.append(obj)
        return ar
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving plugin list: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
