from fastapi import APIRouter, HTTPException, Response

from ..lib.logging import logger
from ..lib.file_utils import check_valid_filename
from ..lib.filestore import get_test_model as fs_get_test_model, get_test_dataset as fs_get_test_dataset

router = APIRouter(prefix="/storage", tags=["storage"])


@router.get("/models/{filename}", response_class=Response)
def download_test_model(filename: str):
    """
    Endpoint to download a specific test model file by filename.
    """
    if not check_valid_filename(filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    try:
        model_content = fs_get_test_model(filename)

        if not filename.lower().endswith('.zip'):
            headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
            return Response(content=model_content, media_type="application/octet-stream", headers=headers)
        else:
            headers = {"Content-Disposition": f'attachment; filename="{filename}.zip"'}
            return Response(content=model_content, media_type="application/zip", headers=headers)
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model file not found")
    except Exception as e:
        logger.error(f"Error downloading test model with filename {filename}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@router.get("/datasets/{filename}", response_class=Response)
def download_test_dataset(filename: str):
    """
    Endpoint to download a specific test model file by filename.
    """
    if not check_valid_filename(filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    try:
        model_content = fs_get_test_dataset(filename)

        if not filename.lower().endswith('.zip'):
            headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
            return Response(content=model_content, media_type="application/octet-stream", headers=headers)
        else:
            headers = {"Content-Disposition": f'attachment; filename="{filename}.zip"'}
            return Response(content=model_content, media_type="application/zip", headers=headers)
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset file not found")
    except Exception as e:
        logger.error(f"Error downloading test dataset with filename {filename}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")