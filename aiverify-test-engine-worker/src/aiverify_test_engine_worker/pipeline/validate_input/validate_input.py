from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.logging import logger
from ..scripts.algorithm_utils import validate_algorithm, AlgorithmValidationError

import os
import json
from jsonschema import validate
from jsonschema.exceptions import ValidationError


class ValidateInput(Pipe):

    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.VALIDATE_INPUT

    @property
    def pipe_name(self) -> str:
        return "validate_input"

    def setup(self):
        self.python_bin = os.getenv("PYTHON", "python3")

    def execute(self, task_data: PipelineData) -> PipelineData:
        logger.debug(f"Validate input data {task_data.task.algorithmArgs}")
        try:
            # Get algorithm path from pipeline data
            algorithm_path = task_data.algorithm_path

            # input_schema_path = None
            # if algorithm_path.joinpath(INPUT_SCHEMA_FILENAME).exists():
            #     input_schema_path = algorithm_path.joinpath(INPUT_SCHEMA_FILENAME)
            # else:
            #     for subdir in algorithm_path.iterdir():
            #         if not subdir.is_dir():
            #             continue
            #         if algorithm_path.joinpath(subdir).joinpath(INPUT_SCHEMA_FILENAME).exists():
            #             input_schema_path = algorithm_path.joinpath(subdir).joinpath(INPUT_SCHEMA_FILENAME)
            #             break
            # input_schema_path = FileCache.find_file_in_directory(algorithm_path, INPUT_SCHEMA_FILENAME, 2)
            algo_script_path, input_schema_path, output_schema_path, algo_meta = validate_algorithm(algorithm_path)
            task_data.algorithm_script_path = algo_script_path
            task_data.input_schema_path = input_schema_path
            task_data.output_schema_path = output_schema_path

            # logger.debug(f"Input schame file found: {input_schema_path}")
            with open(input_schema_path, "r") as fp:
                try:
                    schema = json.load(fp)
                    # logger.debug(f"schema: {schema}")
                except json.JSONDecodeError:
                    raise PipeException(f"Algorithm {task_data.algorithm_id} has invalid input schema")
                try:
                    validate(task_data.task.algorithmArgs, schema)
                    # validate("AIDAS", schema)
                except ValidationError as e:
                    raise PipeException(f"Input arguments is invalid: {str(e)}")

            return task_data

        except PipeException:
            raise
        except AlgorithmValidationError as e:
            raise PipeException(f"Invalid algorithm: {e}")
        except Exception as e:
            raise PipeException(f"Unexpected error during input argument validation: {str(e)}")
