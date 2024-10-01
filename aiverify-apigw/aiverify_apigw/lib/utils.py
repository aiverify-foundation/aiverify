import mimetypes
from .file_utils import get_suffix


def guess_mimetype_from_filename(filename: str):
    suffix = get_suffix(filename)
    mimetype = mimetypes.types_map[suffix] if suffix in mimetypes.types_map else None
    return mimetype
