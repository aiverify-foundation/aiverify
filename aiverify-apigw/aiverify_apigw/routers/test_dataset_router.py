from fastapi import APIRouter, HTTPException, UploadFile, Form, Depends, Response
from typing import List, Annotated, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import tempfile
import shutil
import json
from pathlib import Path, PurePath

from ..lib.logging import logger
from ..lib.constants import TestDatasetFileType, TestDatasetStatus
from ..lib.file_utils import check_valid_filename, check_file_size
from ..lib.filestore import save_test_dataset as fs_save_test_dataset, get_test_dataset as fs_get_test_dataset, delete_test_dataset as fs_delete_test_dataset
from ..lib.database import get_db_session
from ..schemas.test_dataset import TestDataset, TestDatasetUpdate
from ..models import TestDatasetModel, TestResultModel
from ..lib.test_engine import TestEngineValidator, TestEngineValidatorException

router = APIRouter(prefix="/test_datasets", tags=["test_datasets"])


@router.post("/upload", response_model=List[TestDataset])
async def upload_dataset_files(
    files: List[UploadFile],
    session: Session = Depends(get_db_session)
) -> List[TestDataset]:
    """
    Endpoint to upload dataset files.
    """
    logger.debug(f"upload_dataset_files, files: {files}")

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No file upload")

    # validate all the models first
    try:
        model_list: List[TestDatasetModel] = []
        with tempfile.TemporaryDirectory() as tmpdirname:
            with session.begin():
                tmpdir = Path(tmpdirname)
                for index, file in enumerate(files):
                    if not file.filename or not file.size:
                        raise HTTPException(status_code=400, detail=f"Invalid File")
                    if not check_valid_filename(file.filename):
                        raise HTTPException(status_code=400, detail=f"Invalid filename {file.filename}")
                    if not check_file_size(file.size):
                        raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds maximum upload size")

                    # check for duplicate filenames
                    filename = file.filename
                    filepath = PurePath(filename)
                    file_counter = 1
                    while session.query(TestDatasetModel).filter(TestDatasetModel.filename == filename).count() > 0:
                        filename = f"{filepath.stem}_{file_counter}{filepath.suffix}"
                        file_counter = file_counter + 1

                    dataset_path = tmpdir.joinpath(filename)
                    now = datetime.now(timezone.utc)
                    with open(dataset_path, "wb") as fp:
                        fp.write(file.file.read())
                    test_dataset = TestDatasetModel(
                        name=filename,
                        description=None,
                        file_type=TestDatasetFileType.File,
                        filename=filename,
                        size=file.size,
                        created_at=now,
                        updated_at=now
                    )
                    try:
                        (data_format, serializer, num_rows, num_cols,
                         dataColumns) = TestEngineValidator.validate_dataset(dataset_path)
                        test_dataset.status = TestDatasetStatus.Valid
                        test_dataset.data_format = data_format
                        test_dataset.serializer = serializer
                        test_dataset.num_rows = num_rows
                        test_dataset.num_cols = num_cols
                        test_dataset.data_columns = json.dumps(dataColumns).encode("utf-8")
                    except TestEngineValidatorException as e:
                        logger.debug(f"Dataset validation error: {e}")
                        test_dataset.status = TestDatasetStatus.Invalid
                        test_dataset.error_message = str(e)
                        raise HTTPException(status_code=400, detail=f"Unsupported Dataset")

                    if test_dataset.status == TestDatasetStatus.Valid:
                        try:
                            filehash = fs_save_test_dataset(dataset_path)
                        except Exception as e:
                            # if save error, set dataset to invalid
                            logger.error(f"Error saving dataset file: {e}")
                            test_dataset.status = TestDatasetStatus.Invalid
                            test_dataset.error_message = f"Error saving test dataset to file: {e}"
                            raise HTTPException(status_code=400, detail=f"Error saving test dataset files")
                        else:
                            logger.debug(f"filehash: {filehash}")
                            test_dataset.zip_hash = filehash

                        model_list.append(test_dataset)
                        session.add(test_dataset)

        return [TestDataset.from_model(dataset) for dataset in model_list]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading dataset files: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/upload_folder", response_model=TestDataset)
def upload_dataset_folder(
    files: List[UploadFile],
    foldername: Annotated[str, Form(description="Folder filename", min_length=1, max_length=128)],
    subfolders: Annotated[Any, Form(description="Subfolders (e.g. './', './variables') of each file uploaded relative to model folder. If this field is empty, all files uploaded are placed in the model uploaded folder. Otherewise, there must be an entry for each file uploaded. Use './' to denote if the file is not under any subfolder.")] = None,
    session: Session = Depends(get_db_session)
):
    """
    Endpoint to upload multiple files that belong to one TestModel.
    """
    logger.debug(f"upload_model_files, foldername: {foldername}, subfolders: {subfolders}, files: {files}")

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # validate foldername
    if not check_valid_filename(foldername):
        raise HTTPException(status_code=400, detail=f"Invalid foldername: {foldername}")

    # check for duplicate filenames
    filename = foldername
    filepath = PurePath(foldername)
    file_counter = 1
    while session.query(TestDatasetModel).filter(TestDatasetModel.filename == filename).count() > 0:
        filename = f"{filepath.stem}_{file_counter}{filepath.suffix}"
        file_counter = file_counter + 1

    try:
        # validate subfolders
        if subfolders and len(subfolders) > 0:
            subfolders_list = subfolders.split(",")
            if len(subfolders_list) != len(files):
                raise HTTPException(status_code=400, detail="subfolders list must be same size as files list")
            base_path = Path(filename)
            for folder in subfolders_list:
                if folder == "./" or len(folder) == 0:
                    continue
                try:
                    test_path = base_path.joinpath(folder)
                    if not check_valid_filename(test_path.name):
                        raise HTTPException(status_code=400, detail=f"Invalid subfolder name: {folder}")
                    test_path.relative_to(base_path)
                except ValueError:
                    # folder not resolved as subpath of folder path
                    raise HTTPException(status_code=400, detail=f"Invalid subfolder path {folder}")
        else:
            subfolders_list = None

        total_size = 0
        with tempfile.TemporaryDirectory() as tmpdirname:
            tmpdir = Path(tmpdirname)
            tmp_dataset_folder = tmpdir.joinpath(filename)
            tmp_dataset_folder.mkdir(parents=True)
            # write the uploaded files to tmp model folder
            for idx, file in enumerate(files):
                if not file.filename or not file.size:
                    raise HTTPException(status_code=400, detail=f"Invalid File")
                if not check_valid_filename(file.filename):
                    raise HTTPException(status_code=400, detail=f"Invalid filename {file.filename}")
                if not check_file_size(file.size):
                    raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds maximum upload size")
                if subfolders_list:
                    folder_path = tmp_dataset_folder.joinpath(subfolders_list[idx])
                    folder_path.mkdir(parents=True, exist_ok=True)
                    dataset_path = folder_path.joinpath(file.filename)
                else:
                    dataset_path = tmp_dataset_folder.joinpath(file.filename)
                try:
                    # double check to make sure final file under model folder
                    dataset_path.relative_to(tmp_dataset_folder)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid filename {file.filename}")
                with open(dataset_path, "wb") as fp:
                    fp.write(file.file.read())
                total_size += file.size

            now = datetime.now(timezone.utc)
            test_dataset = TestDatasetModel(
                name=filename,
                description=None,
                file_type=TestDatasetFileType.Folder,
                filename=filename,
                size=total_size,
                created_at=now,
                updated_at=now
            )

            tmp_dataset_validate_folder = tmpdir.joinpath(filename + ".valdate")
            # copy to tmp directory for validation
            shutil.copytree(tmp_dataset_folder, tmp_dataset_validate_folder)

            # validate the dataset
            try:
                (data_format, serializer, num_rows, num_cols,
                 data_columns) = TestEngineValidator.validate_dataset(tmp_dataset_validate_folder)
                test_dataset.status = TestDatasetStatus.Valid
                test_dataset.data_format = data_format
                test_dataset.serializer = serializer
                test_dataset.num_rows = num_rows
                test_dataset.num_cols = num_cols
                test_dataset.data_columns = json.dumps(data_columns).encode("utf-8")
            except TestEngineValidatorException as e:
                logger.debug(f"Dataset validation error: {e}")
                test_dataset.status = TestDatasetStatus.Invalid
                test_dataset.error_message = str(e)
                raise HTTPException(status_code=400, detail=f"Unsupported Dataset")

            if test_dataset.status == TestDatasetStatus.Valid:
                # save to fs
                try:
                    filehash = fs_save_test_dataset(tmp_dataset_folder)
                except Exception as e:
                    # if save error, set dataset to invalid
                    logger.error(f"Error saving dataset folder: {e}")
                    test_dataset.status = TestDatasetStatus.Invalid
                    test_dataset.error_message = f"Error saving model: {e}"
                    raise HTTPException(status_code=400, detail=f"Error saving test dataset to folder")
                else:
                    test_dataset.zip_hash = filehash

                session.add(test_dataset)
                session.commit()
            # session.refresh(test_model)

            return TestDataset.from_model(test_dataset)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading dataset files: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=List[TestDataset])
def list_datasets(session: Session = Depends(get_db_session)):
    """
    Endpoint to return a list of TestDataset.
    """
    try:
        datasets = session.query(TestDatasetModel).all()
        return [TestDataset.from_model(dataset) for dataset in datasets]
    except Exception as e:
        logger.error(f"Error retrieving dataset list: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{dataset_id}", response_model=TestDataset)
def read_dataset(dataset_id: int, session: Session = Depends(get_db_session)):
    """
    Endpoint to return a TestDataset queried by dataset_id.
    """
    try:
        dataset = session.query(TestDatasetModel).filter(TestDatasetModel.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return TestDataset.from_model(dataset)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving dataset with id {dataset_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{dataset_id}/download", response_class=Response)
def download_dataset(dataset_id: int, session: Session = Depends(get_db_session)):
    """
    Endpoint to download a specific test model by its ID.
    """
    try:
        test_dataset = session.query(TestDatasetModel).filter(TestDatasetModel.id == dataset_id).first()
        if not test_dataset:
            raise HTTPException(status_code=404, detail="Test dataset not found")

        if test_dataset.status != TestDatasetStatus.Valid:
            raise HTTPException(status_code=400, detail="Dataset is invalid")

        if test_dataset.filename is None or test_dataset.file_type is None:
            raise HTTPException(status_code=400, detail="Dataset file has not been uploaded")

        model_content = fs_get_test_dataset(test_dataset.filename)

        if test_dataset.file_type == TestDatasetFileType.File:
            headers = {"Content-Disposition": f'attachment; filename="{test_dataset.filename}"'}
            return Response(content=model_content, media_type="application/octet-stream", headers=headers)
        else:
            headers = {"Content-Disposition": f'attachment; filename="{test_dataset.filename}.zip"'}
            return Response(content=model_content, media_type="application/zip", headers=headers)
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset file not found")
    except Exception as e:
        logger.error(f"Error downloading test model with ID {dataset_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{dataset_id}", response_model=TestDataset)
def update_dataset(dataset_id: int, dataset_update: TestDatasetUpdate, session: Session = Depends(get_db_session)):
    """
    Endpoint to update a specific test dataset by its ID.
    """
    try:
        test_dataset = session.query(TestDatasetModel).filter(TestDatasetModel.id == dataset_id).first()
        if not test_dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        if test_dataset.status != TestDatasetStatus.Valid:
            raise HTTPException(status_code=400, detail="Dataset is invalid")

        if dataset_update.name:
            test_dataset.name = dataset_update.name
        if dataset_update.description:
            test_dataset.description = dataset_update.description
        if dataset_update.dataColumns:
            if test_dataset.data_columns is None:
                raise HTTPException(status_code=400, detail="Dataset does not have column information")
            data_columns: List[dict] = json.loads(test_dataset.data_columns.decode('utf-8'))
            for update_col in dataset_update.dataColumns:
                for col in data_columns:
                    if col["name"] == update_col.name:
                        col["label"] = update_col.label
                        break
            test_dataset.data_columns = json.dumps(data_columns).encode('utf-8')

        test_dataset.updated_at = datetime.now(timezone.utc)

        session.commit()
        session.refresh(test_dataset)
        return TestDataset.from_model(test_dataset)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dataset with ID {dataset_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{dataset_id}", response_model=dict)
def delete_dataset(dataset_id: int, session: Session = Depends(get_db_session)):
    """
    Endpoint to delete a TestDataset by dataset_id.
    """
    try:
        dataset = session.query(TestDatasetModel).filter(TestDatasetModel.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        if session.query(TestResultModel).filter(TestResultModel.test_dataset_id == dataset.id).count() > 0:
            raise HTTPException(
                status_code=404, detail="Test dataset cannot be deleted if there are test results referencing this dataset")

        if dataset.filename and dataset.file_type is not None:
            fs_delete_test_dataset(dataset.filename)

        session.delete(dataset)
        session.commit()
        return {"message": "Dataset deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting dataset with id {dataset_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
