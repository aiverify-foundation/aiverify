from pathlib import Path

from .file_utils import find_file_in_directory

INPUT_SCHEMA_FILENAME = "input.schema.json"
OUTPUT_SCHEMA_FILENAME = "output.schema.json"
ALGO_CLASS_FILENAME = "algo.py"
ALGO_META_FILENAME = "algo.meta.json"


class AlgorithmValidationError(Exception):
    pass


def validate_algorithm(algo_path: Path):
    """Simple algorithm path validation.

    Args:
        algo_path (Path): Path to algorithm directory

    Raises:
        AlgorithmValidationError

    Returns:
        (algo_script, input_schema_file, output_schema_file)
    """
    algo_script = find_file_in_directory(algo_path, ALGO_CLASS_FILENAME)
    if algo_script is None:
        raise AlgorithmValidationError(f"Algorihm script {ALGO_CLASS_FILENAME} not found")
    input_schema_file = find_file_in_directory(algo_path, INPUT_SCHEMA_FILENAME)
    if input_schema_file is None:
        raise AlgorithmValidationError(f"Input schema file {INPUT_SCHEMA_FILENAME} not found")
    output_schema_file = find_file_in_directory(algo_path, OUTPUT_SCHEMA_FILENAME)
    if output_schema_file is None:
        raise AlgorithmValidationError(f"Output schema file {INPUT_SCHEMA_FILENAME} not found")
    algo_meta_file = find_file_in_directory(algo_path, ALGO_META_FILENAME)
    if algo_meta_file is None:
        raise AlgorithmValidationError(f"Output schema file {ALGO_META_FILENAME} not found")

    return (algo_script, input_schema_file, output_schema_file, algo_meta_file)
