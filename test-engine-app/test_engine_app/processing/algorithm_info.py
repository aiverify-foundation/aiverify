import json
from typing import Dict

from test_engine_core.utils.validate_checks import is_empty_string


class AlgorithmInfo:
    """
    AlgorithmInfo data class focuses on storing algorithm registry returned information and allows data retrieval.
    """

    id: str
    data: Dict
    output_schema: Dict
    requirements: Dict
    input_schema: Dict

    def __init__(self, algorithm_id: str, algorithm_dict: Dict):
        if is_empty_string(algorithm_id) or not isinstance(algorithm_dict, Dict):
            raise RuntimeError("The inputs do not meet the validation rules")

        self.id = algorithm_id
        self.data = self._load_algorithm_info(algorithm_dict.get("data"))
        self.output_schema = self._load_algorithm_info(
            algorithm_dict.get("outputSchema")
        )
        self.requirements = self._load_algorithm_info(
            algorithm_dict.get("requirements")
        )
        self.input_schema = self._load_algorithm_info(algorithm_dict.get("inputSchema"))

    def get_algorithm_input_schema(self) -> Dict:
        """
        A method to return the algorithm input schema

        Returns:
            Dict: The algorithm input schema
        """
        return self.input_schema

    def get_algorithm_output_schema(self) -> Dict:
        """
        A method to return the algorithm output schema

        Returns:
            Dict: The algorithm output schema
        """
        return self.output_schema

    def get_algorithm_path(self) -> str:
        """
        A method to return the algorithm upload path

        Returns:
            str: The upload path of this algorithm or empty string
        """
        return self.data.get("algoPath", "")

    def get_algorithm_require_ground_truth(self) -> bool:
        """
        A method to return whether the algorithm requires ground truth

        Returns:
            bool: True if algorithm need ground truth, else False
        """
        return self.data.get("requireGroundTruth", True)

    def _load_algorithm_info(self, json_string: str) -> Dict:
        """
        A helper method to return the algorithm information for each parameter

        Args:
            json_string (str): The json string to be loaded as a Dict

        Returns:
            Dict: If json_string is not None, it will load the json string to Dict else return empty Dict.
        """
        if not is_empty_string(json_string):
            return json.loads(json_string)
        else:
            return dict()
