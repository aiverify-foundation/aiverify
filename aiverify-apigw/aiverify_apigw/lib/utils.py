import mimetypes
from .file_utils import get_suffix
from jsonschema import validate
from typing import Dict


def guess_mimetype_from_filename(filename: str):
    suffix = get_suffix(filename)
    mimetype = mimetypes.types_map[suffix] if suffix in mimetypes.types_map else None
    return mimetype


def validate_json_schema(instance: Dict, schema: Dict) -> bool:
    try:
        validate(instance=instance, schema=schema)
        return True
    except:
        return False