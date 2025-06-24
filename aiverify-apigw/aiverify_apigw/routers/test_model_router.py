from fastapi import APIRouter, HTTPException, UploadFile, Form, Depends, Response
from typing import List, Annotated, Any, Literal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import tempfile
import shutil
from pathlib import Path, PurePath

from ..lib.logging import logger
from ..lib.constants import ModelType, TestModelMode, TestModelFileType, TestModelStatus
from ..lib.file_utils import check_valid_filename, check_file_size
from ..lib.filestore import save_test_model as fs_save_test_model, delete_test_model as fs_delete_test_model, get_test_model as fs_get_test_model
from ..lib.database import get_db_session
from ..schemas import TestModel, TestModelUpdate, load_examples
from ..models import TestModelModel, TestResultModel
from ..lib.test_engine import TestEngineValidator, TestEngineValidatorException

router = APIRouter(prefix="/test_models", tags=["test_models"])


file_upload_form_example = [
    "classification"
]

model_api_examples = load_examples("model_api_examples.json")


@router.post("/upload", response_model=List[TestModel])
async def upload_model_files(
    files: List[UploadFile],
    model_types: Annotated[Any, Form(examples=[file_upload_form_example], description="Model type (regression, classification) of each model file uploaded")],
    session: Session = Depends(get_db_session)
) -> List[TestModel]:
    """
    Endpoint to upload model files.
    """
    logger.debug(f"upload_model_files, files: {files}, model_types: {model_types}")
    if not model_types:
        raise HTTPException(status_code=400, detail=f"Invalid parameters")

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No file upload")

    try:
        model_types_array = model_types.split(",")
        if len(files) != len(model_types_array):
            raise HTTPException(
                status_code=400, detail=f"Number of model files information must be equal to number of files uploaded")

        model_types_list = [ModelType(type) for type in model_types_array]
        print(model_types_list)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error validating form data: {e}")

    # validate all the models first
    try:
        model_list: List[TestModelModel] = []
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
                    while session.query(TestModelModel).filter(TestModelModel.filename == filename).count() > 0:
                        filename = f"{filepath.stem}_{file_counter}{filepath.suffix}"
                        file_counter = file_counter + 1

                    model_path = tmpdir.joinpath(filename)
                    now = datetime.now(timezone.utc)
                    with open(model_path, "wb") as fp:
                        fp.write(file.file.read())
                    test_model = TestModelModel(
                        name=filename,
                        description=None,
                        mode=TestModelMode.Upload,
                        model_type=model_types_list[index],
                        file_type=TestModelFileType.File,
                        filename=filename,
                        size=file.size,
                        # status=TestModelStatus.Pending,
                        # errorMessages=None,
                        created_at=now,
                        updated_at=now
                    )
                    try:
                        (model_format, serializer) = TestEngineValidator.validate_model(model_path)
                        test_model.status = TestModelStatus.Valid
                        test_model.model_format = model_format
                        test_model.serializer = serializer
                    except TestEngineValidatorException as e:
                        logger.debug(f"Model validation error: {e}")
                        test_model.status = TestModelStatus.Invalid
                        test_model.error_message = str(e)
                        raise HTTPException(status_code=400, detail=f"Unsupported Model Files")

                    if test_model.status == TestModelStatus.Valid:
                        try:
                            filehash = fs_save_test_model(model_path)
                        except Exception as e:
                            # if save error, set model to invalid
                            logger.error(f"Error saving model file: {e}")
                            test_model.status = TestModelStatus.Invalid
                            test_model.error_message = f"Error saving test model to file: {e}"
                            raise HTTPException(status_code=400, detail=f"Error saving model files")
                        else:
                            logger.debug(f"filehash: {filehash}")
                            test_model.zip_hash = filehash

                        model_list.append(test_model)
                        session.add(test_model)

        return [TestModel.from_model(model) for model in model_list]

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error uploading model files: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/upload_folder", response_model=TestModel)
def upload_folder(
    files: List[UploadFile],
    model_type: Annotated[ModelType, Form(description="Model type (regression, classification) of the model uploaded")],
    file_type: Annotated[Literal[TestModelFileType.Folder, TestModelFileType.Pipeline], Form(description="File type (folder, pipeline) of the folder uploaded")],
    foldername: Annotated[str, Form(description="Folder filename", min_length=1, max_length=128)],
    subfolders: Annotated[Any, Form(description="Subfolders (e.g. './', './variables') of each file uploaded relative to model folder. If this field is empty, all files uploaded are placed in the model uploaded folder. Otherewise, there must be an entry for each file uploaded. Use './' to denote if the file is not under any subfolder.")] = None,
    session: Session = Depends(get_db_session)
):
    """
    Endpoint to upload multiple files that belong to one TestModel.
    """
    logger.debug(
        f"upload_model_files, foldername: {foldername}, subfolders: {subfolders}, model_type: {model_type}, file_type: {file_type}, files: {files}")

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # validate foldername
    if not check_valid_filename(foldername):
        raise HTTPException(status_code=400, detail=f"Invalid foldername: {foldername}")

    # check for duplicate filenames
    filename = foldername
    filepath = PurePath(foldername)
    file_counter = 1
    while session.query(TestModelModel).filter(TestModelModel.filename == filename).count() > 0:
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
            tmp_model_folder = tmpdir.joinpath(filename)
            tmp_model_folder.mkdir(parents=True)
            # write the uploaded files to tmp model folder
            for idx, file in enumerate(files):
                if not file.filename or not file.size:
                    raise HTTPException(status_code=400, detail=f"Invalid File")
                if not check_valid_filename(file.filename):
                    raise HTTPException(status_code=400, detail=f"Invalid filename {file.filename}")
                if not check_file_size(file.size):
                    raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds maximum upload size")
                if subfolders_list:
                    folder_path = tmp_model_folder.joinpath(subfolders_list[idx])
                    folder_path.mkdir(parents=True, exist_ok=True)
                    model_path = folder_path.joinpath(file.filename)
                else:
                    model_path = tmp_model_folder.joinpath(file.filename)
                try:
                    model_path.relative_to(tmp_model_folder)  # double check to make sure final file under model folder
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid filename {file.filename}")
                with open(model_path, "wb") as fp:
                    fp.write(file.file.read())
                total_size += file.size

            now = datetime.now(timezone.utc)
            test_model = TestModelModel(
                name=filename,
                description=None,
                mode=TestModelMode.Upload,
                model_type=model_type,
                file_type=file_type,
                filename=filename,
                size=total_size,
                created_at=now,
                updated_at=now
            )

            tmp_model_validate_folder = tmpdir.joinpath(filename + ".valdate")
            # tmp_model_validate_folder.mkdir(parents=True)
            # copy to tmp directory for validation
            shutil.copytree(tmp_model_folder, tmp_model_validate_folder)

            # validate the model
            try:
                (model_format, serializer) = TestEngineValidator.validate_model(tmp_model_validate_folder, is_pipline=file_type == 'pipeline')
                test_model.status = TestModelStatus.Valid
                test_model.model_format = model_format
                test_model.serializer = serializer
            except TestEngineValidatorException as e:
                logger.debug(f"Model validation error: {e}")
                test_model.status = TestModelStatus.Invalid
                test_model.error_message = str(e)
                raise HTTPException(status_code=400, detail=f"Unsupported Model Folder")

            if test_model.status == TestModelStatus.Valid:
                # save to fs
                try:
                    filehash = fs_save_test_model(tmp_model_folder)
                except Exception as e:
                    # if save error, set model to invalid
                    logger.error(f"Error saving model folder: {e}")
                    test_model.status = TestModelStatus.Invalid
                    test_model.error_message = f"Error saving model: {e}"
                    raise HTTPException(status_code=400, detail=f"Error saving model files to folder")
                else:
                    test_model.zip_hash = filehash

                session.add(test_model)
                session.commit()
                # session.refresh(test_model)

            return TestModel.from_model(test_model)

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error uploading model files: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=List[TestModel])
def list_test_models(session: Session = Depends(get_db_session)):
    """
    Endpoint to list all test models.
    """
    try:
        test_models = session.query(TestModelModel).all()
        return [TestModel.from_model(model) for model in test_models]
    except Exception as e:
        logger.error(f"Error retrieving test models: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{model_id}", response_model=TestModel)
def read_test_model(model_id: int, session: Session = Depends(get_db_session)):
    """
    Endpoint to read a specific test model by its ID.
    """
    try:
        test_model = session.query(TestModelModel).filter(TestModelModel.id == model_id).first()
        if not test_model:
            raise HTTPException(status_code=404, detail="Test model not found")
        return TestModel.from_model(test_model)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving test model with ID {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/download/{model_id}", response_class=Response)
def download_test_model(model_id: int, session: Session = Depends(get_db_session)):
    """
    Endpoint to download a specific test model by its ID.
    """
    try:
        test_model = session.query(TestModelModel).filter(TestModelModel.id == model_id).first()
        if not test_model:
            raise HTTPException(status_code=404, detail="Test model not found")

        if test_model.status != TestModelStatus.Valid:
            raise HTTPException(status_code=400, detail="Model is invalid")

        if test_model.mode != TestModelMode.Upload or test_model.filename is None or test_model.file_type is None:
            raise HTTPException(status_code=400, detail="Model file has not been uploaded")

        model_content = fs_get_test_model(test_model.filename)

        if test_model.file_type == TestModelFileType.File:
            headers = {"Content-Disposition": f'attachment; filename="{test_model.filename}"'}
            return Response(content=model_content, media_type="application/octet-stream", headers=headers)
        else:
            headers = {"Content-Disposition": f'attachment; filename="{test_model.filename}.zip"'}
            return Response(content=model_content, media_type="application/zip", headers=headers)
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model file not found")
    except Exception as e:
        logger.error(f"Error downloading test model with ID {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{model_id}", response_model=TestModel)
def update_test_model(model_id: int, model_update: TestModelUpdate, session: Session = Depends(get_db_session)):
    """
    Endpoint to update a specific test model by its ID.
    """
    try:
        test_model = session.query(TestModelModel).filter(TestModelModel.id == model_id).first()
        if not test_model:
            raise HTTPException(status_code=404, detail="Test model not found")

        if test_model.status != TestModelStatus.Valid:
            raise HTTPException(status_code=400, detail="Model is invalid")

        if model_update.name:
            test_model.name = model_update.name
        if model_update.description:
            test_model.description = model_update.description
        if model_update.modelType:
            test_model.model_type = model_update.modelType
        if model_update.modelAPI:
            if test_model.mode != TestModelMode.API:
                raise HTTPException(status_code=400, detail="Cannot update modelAPI field is mode is not API")
            test_model.model_api = model_update.modelAPI.model_dump_json().encode("utf-8")
        if model_update.parameterMappings:
            if test_model.mode != TestModelMode.API:
                raise HTTPException(status_code=400, detail="Cannot update parameterMappings field is mode is not API")
            test_model.parameter_mappings = model_update.parameterMappings.model_dump_json().encode('utf-8')
        test_model.updated_at = datetime.now(timezone.utc)

        session.commit()
        session.refresh(test_model)
        return TestModel.from_model(test_model)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating test model with ID {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{model_id}", response_model=dict)
def delete_test_model(model_id: int, session: Session = Depends(get_db_session)):
    """
    Endpoint to delete a specific test model by its ID.
    """
    try:
        test_model = session.query(TestModelModel).filter(TestModelModel.id == model_id).first()
        if not test_model:
            raise HTTPException(status_code=404, detail="Test model not found")

        if session.query(TestResultModel).filter(TestResultModel.model_id == test_model.id).count() > 0:
            raise HTTPException(
                status_code=404, detail="Test model cannot be deleted if there are test results referencing this model")

        if test_model.mode == TestModelMode.Upload and test_model.filename and test_model.file_type is not None:
            fs_delete_test_model(test_model.filename)

        session.delete(test_model)
        session.commit()
        return {"detail": "Test model deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting test model with ID {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# @router.post("/modelapi", response_model=TestModel)
# def create_test_model_api(input_data: Annotated[
#         TestModelAPIInput,
#         Body(
#             openapi_examples=model_api_examples
#         )
# ],
#         session: Session = Depends(get_db_session)):
#     """
#     Endpoint to create a new TestModelModel from TestModelAPIInput.
#     """
#     try:
#         now = datetime.now(timezone.utc)
#         test_model = TestModelModel(
#             name=input_data.name,
#             description=input_data.description,
#             mode=TestModelMode.API,
#             model_type=input_data.modelType,
#             model_api=input_data.modelAPI.model_dump_json().encode("utf-8"),
#             parameter_mappings=input_data.parameterMappings.model_dump_json().encode('utf-8') if input_data.parameterMappings else None,
#             status=TestModelStatus.Valid,
#             created_at=now,
#             updated_at=now
#         )

#         session.add(test_model)
#         session.commit()
#         return TestModel.from_model(test_model)
#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         logger.error(f"Error creating test model: {e}")
#         raise HTTPException(status_code=500, detail="Internal server error")


# @router.get("/exportModelAPI/{model_id}", response_model=ModelAPIExportSchema, response_model_exclude_unset=True)
# def export_test_model(model_id: int, session: Session = Depends(get_db_session)):
#     """
#     Endpoint to read a specific test model by its ID.
#     """
#     try:
#         test_model = session.query(TestModelModel).filter(TestModelModel.id == model_id).first()
#         if not test_model:
#             raise HTTPException(status_code=404, detail="Test model not found")
#         if test_model.status != TestModelStatus.Valid:
#             raise HTTPException(status_code=400, detail="Invalid model")
#         if test_model.mode != TestModelMode.API:
#             raise HTTPException(status_code=400, detail="Test model is not API mode")

#         if test_model.model_api is None:  # should not happen
#             raise HTTPException(status_code=500, detail="Invalid model API setting")
#         model_api = ModelAPIType.model_validate_json(test_model.model_api.decode('utf-8'))
#         openapi_schema = model_api.exportModelAPI()
#         exported_model = ModelAPIExportSchema(
#             requestConfig=model_api.requestConfig,
#             response=model_api.response,
#             openapiSchema=openapi_schema,
#             # parameterMappings=ModelAPIParametersMapping.model_validate_json(test_model.parameter_mappings.decode('utf-8')) if test_model.parameter_mappings else None,
#         )
#         if test_model.parameter_mappings:
#             mappings = ModelAPIParametersMapping.model_validate_json(test_model.parameter_mappings.decode('utf-8'))
#             if mappings.requestBody:
#                 exported_model.requestBody = mappings.requestBody
#             if mappings.parameters:
#                 exported_model.parameters = mappings.parameters
#         return exported_model
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error retrieving test model with ID {model_id}: {e}")
#         raise HTTPException(status_code=500, detail="Internal server error")
