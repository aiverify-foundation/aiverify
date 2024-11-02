from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..lib.logging import logger
from ..lib.database import get_db_session
from ..lib.filestore import get_plugin_zip, get_plugin_algorithm_zip, backup_plugin
from ..lib.plugin_store import PluginStore, PluginStoreException
from ..lib.file_utils import sanitize_filename
from ..schemas import PluginOutput
from ..models import PluginModel, AlgorithmModel

router = APIRouter(prefix="/plugin", tags=["plugin"])


@router.get("/", response_model=List[PluginOutput])
async def read_plugins(session: Session = Depends(get_db_session)) -> List[PluginOutput]:
    """
    Endpoint to retrieve all plugins.
    """
    try:
        stmt = select(PluginModel)
        test_results = session.scalars(stmt).all()
        ar = []
        for result in test_results:
            # logger.debug(f"result: {result}")
            # logger.debug(f"algorithms: {result.algorithms}")
            obj = PluginOutput.from_model(result)
            ar.append(obj)
        return ar
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving plugin list: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{gid}", response_model=PluginOutput)
async def read_plugin(gid: str, session: Session = Depends(get_db_session)) -> PluginOutput:
    """
    Endpoint to retrieve a single plugin by gid.
    """
    try:
        stmt = select(PluginModel).filter_by(gid=gid)
        plugin = session.scalar(stmt)
        if plugin is None:
            raise HTTPException(status_code=404, detail="Plugin not found")
        return PluginOutput.from_model(plugin)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving plugin with gid {gid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{gid}", response_model=dict)
async def delete_plugin(gid: str, session: Session = Depends(get_db_session)) -> dict:
    """
    Endpoint to delete a plugin by gid.
    """
    try:
        stmt = select(PluginModel).filter_by(gid=gid)
        plugin = session.scalar(stmt)
        if plugin is None:
            raise HTTPException(status_code=404, detail="Plugin not found")
        if plugin.is_stock:
            raise HTTPException(status_code=400, detail="Not allowed to delete stock plugin")

        PluginStore.delete_plugin(gid)

        return {"message": "Plugin deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting plugin with gid {gid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/upload", response_model=PluginOutput)
async def upload_plugin(file: UploadFile = File(), session: Session = Depends(get_db_session)) -> PluginOutput:
    """
    Endpoint to upload a plugin in zip file format.
    """
    from pathlib import Path
    from zipfile import ZipFile
    import io
    import tempfile

    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .zip files are allowed.")

    try:
        zip_contents = await file.read()
        # Save the uploaded file to a temporary location
        with tempfile.TemporaryDirectory() as temp_dirname:
            temp_root_dir = Path(temp_dirname)
            temp_dir = temp_root_dir.joinpath("extracted")

            # unzip to temp dir
            # plugin_dir = temp_dir.joinpath(file.filename[:-4])
            with ZipFile(io.BytesIO(zip_contents)) as zip_ref:
                zip_ref.extractall(temp_dir)  # Extract to a folder named after the zip file without extension

            if temp_dir.joinpath("plugin.meta.json").exists():
                plugin_dir = temp_dir
            else:
                for sub_dir in temp_dir.iterdir():
                    if sub_dir.is_dir():
                        if sub_dir.joinpath("plugin.meta.json").exists():
                            plugin_dir = sub_dir
                            break
                else:
                    plugin_dir = None
                    # raise HTTPException(status_code=400, detail="plugin.meta.json not found in the uploaded zip file.")

            if not plugin_dir:
                # check whether is algo
                if temp_dir.joinpath("pyproject.toml").exists():
                    algo_dir = temp_dir
                else:
                    for sub_dir in temp_dir.iterdir():
                        if sub_dir.is_dir():
                            if sub_dir.joinpath("pyproject.toml").exists():
                                algo_dir = sub_dir
                                break
                    else:
                        raise HTTPException(status_code=400, detail="Invalid plugin zip file.")
                meta = PluginStore.validate_algorithm_directory(algo_dir)
                if meta is None or meta.gid is None:
                    raise HTTPException(status_code=400, detail="Invalid plugin zip file.")

                plugin = PluginStore.scan_algorithm_directory(algo_dir)
                session.add(plugin)
                return PluginOutput.from_model(plugin)
            else:
                # validate and read plugin
                meta = PluginStore.validate_plugin_directory(plugin_dir)
                gid = meta.gid

                stmt = select(PluginModel).filter_by(gid=gid)
                existing_plugin = session.scalar(stmt)
                is_stock = existing_plugin.is_stock if existing_plugin else False

                if existing_plugin:
                    # backup old plugin first
                    backup_dir = temp_root_dir.joinpath("backup").joinpath(sanitize_filename(meta.name))
                    backup_plugin(gid, backup_dir)
                    PluginStore.delete_plugin(gid)
                else:
                    backup_dir = None

                def restore_backup():
                    # restore old plugin on error
                    if backup_dir:
                        PluginStore.delete_plugin(gid)
                        PluginStore.scan_plugin_directory(backup_dir, is_stock=is_stock)

                try:
                    plugin = PluginStore.scan_plugin_directory(plugin_dir, is_stock=is_stock)
                    if plugin is None:
                        logger.error(f"Error scanning plugin directory {plugin_dir}")
                        restore_backup()
                        raise PluginStoreException("Unable to scan plugin ")
                    logger.debug(f"New plugin meta: {meta}")
                    # plugin = session.scalar(stmt)
                    session.add(plugin)
                    return PluginOutput.from_model(plugin)
                except PluginStoreException as e:
                    logger.error(f"Error scanning plugin directory {plugin_dir}: {e}")
                    restore_backup()
                    raise PluginStoreException(f"Plugin scan exception: {e}")

    except PluginStoreException as e:
        logger.error(f"Plugin exception: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error uploading plugin: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    # finally:
    # if plugin_folder.exists() and plugin_folder.is_dir():
    #     shutil.rmtree(plugin_folder)


@router.get("/download/{gid}", response_model=dict)
async def download_plugin(gid: str, session: Session = Depends(get_db_session)) -> Response:
    """
    Endpoint to download a plugin as a zip file.
    """
    try:
        stmt = select(PluginModel).filter_by(gid=gid)
        plugin = session.scalar(stmt)

        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")

        # Call the get_plugin_zip method from filestore to create the zip file
        zip_buffer = get_plugin_zip(gid)

        headers = {"Content-Disposition": f'attachment; filename="{sanitize_filename(plugin.gid)}.zip"'}
        return Response(content=zip_buffer, media_type="application/zip", headers=headers)

    except PluginStoreException as e:
        logger.error(f"Plugin exception: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error downloading plugin: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{gid}/algorithm/{cid}", response_model=dict)
async def download_plugin_algorithm(gid: str, cid: str, session: Session = Depends(get_db_session)) -> Response:
    """
    Endpoint to download a plugin as a zip file.
    """
    try:
        stmt = select(AlgorithmModel).filter_by(gid=gid).filter_by(cid=cid)
        algo = session.scalar(stmt)

        if not algo:
            raise HTTPException(status_code=404, detail="Algorithm not found")

        # Call the get_plugin_zip method from filestore to create the zip file
        zip_buffer = get_plugin_algorithm_zip(gid, algo.cid)

        headers = {"Content-Disposition": f'attachment; filename="{sanitize_filename(algo.cid)}.zip"'}
        return Response(content=zip_buffer, media_type="application/zip", headers=headers)

    except PluginStoreException as e:
        logger.error(f"Plugin exception: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error downloading plugin: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
