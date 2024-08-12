import re

gid_cid_regex = "^[a-zA-Z0-9][a-zA-Z0-9-._]*$"


def validate_gid_cid(value: str):
    pattern = re.compile(gid_cid_regex)
    if not pattern.match(value):
        return False
    return True
