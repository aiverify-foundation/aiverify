from enum import StrEnum, auto


class TestModelFileType(StrEnum):
    File = auto()
    Folder = auto()
    Pipeline = auto()


class TestModelMode(StrEnum):
    Upload = auto()
    API = auto()


class TestModelStatus(StrEnum):
    Pending = auto()
    Valid = auto()
    Invalid = auto()
    Cancelled = auto()


class ModelType(StrEnum):
    Classification = auto()
    Regression = auto()


class TestDatasetFileType(StrEnum):
    File = auto()
    Folder = auto()


class TestDatasetStatus(StrEnum):
    Pending = auto()
    Valid = auto()
    Invalid = auto()
    Cancelled = auto()


class InputBlockSize(StrEnum):
    xs = auto()
    sm = auto()
    md = auto()
    lg = auto()
    xl = auto()
