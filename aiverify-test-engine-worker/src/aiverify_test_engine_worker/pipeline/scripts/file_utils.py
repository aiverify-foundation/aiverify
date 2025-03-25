from pathlib import Path
from typing import List


def find_file_in_directory(dir_path: Path, filename: str, max_levels: int = 1):
    if not dir_path.is_dir():
        return None

    if dir_path.joinpath(filename).exists():
        return dir_path.joinpath(filename)

    dirlist: List[Path] = [dir_path]
    level_left = max_levels
    while level_left > 0:
        level_left = level_left - 1
        dirlist_copy = dirlist.copy()
        dirlist = []
        for curr_dir in dirlist_copy:
            for subdir in curr_dir.iterdir():
                if not subdir.is_dir():
                    continue
                dirlist.append(subdir)
                if subdir.joinpath(filename).exists():
                    return subdir.joinpath(filename)
    return None
