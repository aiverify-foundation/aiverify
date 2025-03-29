from pydantic import Field
from typing import Optional, List
from datetime import datetime
import json

from .base_model import MyBaseModel
from ..lib.constants import TestDatasetFileType, TestDatasetStatus
from ..models.test_dataset_model import TestDatasetModel


class TestDatasetColumnUpdate(MyBaseModel):
    name: str = Field(description="Name of column to update", min_length=1, max_length=256)
    label: str = Field(description="Update column label", max_length=4096)


class TestDatasetUpdate(MyBaseModel):
    name: Optional[str] = Field(description="Name of the model", min_length=1, max_length=256, default=None)
    description: Optional[str] = Field(description="Description of the model", max_length=4096, default=None)
    dataColumns: Optional[List[TestDatasetColumnUpdate]] = Field(description="Update column labels", default=None)


class TestDatasetColumn(MyBaseModel):
    name: str = Field(description="Column name", min_length=1, max_length=256)
    datatype: str = Field(description="Column data type")
    label: Optional[str] = Field(description="Column friendly label")


class TestDataset(MyBaseModel):
    id: int = Field(description="Unique identifier for the dataset")
    name: str = Field(description="Name of the dataset", min_length=1, max_length=256)
    description: Optional[str] = Field(description="Description of the dataset", max_length=4096)
    # dataset file
    fileType: Optional[TestDatasetFileType] = Field(description="File type of dataset upload", default=None, strict=False)
    filename: Optional[str] = Field(description="Filename of the dataset upload", max_length=2048, default=None)
    zip_hash: Optional[str] = Field(description="File hash of plugin zip")
    size: Optional[int] = Field(description="Size of the dataset file", default=None)
    serializer: Optional[str] = Field(description="Serializer used for the dataset upload", default=None)
    dataFormat: Optional[str] = Field(description="Format of the dataset upload", default=None)
    numRows: Optional[int] = Field(description="Number of rows in this dataset", default=None)
    numCols: Optional[int] = Field(description="Number of columns in this dataset", default=None)
    dataColumns: Optional[List[TestDatasetColumn]] = Field(description="Column information for this dataset", default=None)
    # status
    status: TestDatasetStatus = Field(description="Status of the test dataset upload", strict=False)
    errorMessages: Optional[str] = Field(description="Error messages related to the dataset", max_length=2048, default=None)
    created_at: Optional[datetime] = Field(description="Timestamp when the dataset was created", default=None, strict=False)
    updated_at: Optional[datetime] = Field(description="Timestamp when the dataset was last updated", default=None, strict=False)

    @classmethod
    def from_model(cls, testdataset: TestDatasetModel) -> "TestDataset":
        if testdataset.data_columns:
            dslist = json.loads(testdataset.data_columns.decode('utf-8'))
            dataColumns = [TestDatasetColumn.model_validate(ds) for ds in dslist]
        else:
            dataColumns = None
        return cls(
            id=testdataset.id,
            name=testdataset.name,
            description=testdataset.description,
            fileType=testdataset.file_type,
            filename=testdataset.filename,
            zip_hash=testdataset.zip_hash,
            size=testdataset.size,
            serializer=testdataset.serializer,
            dataFormat=testdataset.data_format,
            numRows=testdataset.num_rows,
            numCols=testdataset.num_cols,
            dataColumns=dataColumns,
            status=testdataset.status,
            errorMessages=testdataset.error_message,
            created_at=testdataset.created_at,
            updated_at=testdataset.updated_at
        )
