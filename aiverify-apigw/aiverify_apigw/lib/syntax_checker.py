import ast
from pathlib import Path
from .logging import logger


def validate_python_script(script_path: Path) -> bool:
    """A method to check the syntax of the input python files

    Args:
        scriptPath (Path): path to the script to validate
    """
    try:
        with open(script_path, "r") as f:
            source_code = f.read()
            ast.parse(source_code)
        return True
    except Exception as e:
        logger.debug(f"Invalid script {script_path}: {e}.")
        return False
