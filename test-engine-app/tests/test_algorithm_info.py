import json

import pytest

from test_engine_app.processing.algorithm_info import AlgorithmInfo


class TestCollectionAlgorithmInfo:
    @pytest.mark.parametrize(
        "algorithm_id, algorithm_info, expected_input_schema, expected_output_schema, "
        "expected_algo_path, expected_require_ground_truth",
        [
            (
                "my_task_id",
                {
                    "data": "mydata",
                    "outputSchema": "myOutputSchema",
                    "requirements": "myAlgoRequirements",
                    "inputSchema": "myInputSchema"
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                "None",
                {
                    "data": "mydata",
                    "outputSchema": "myOutputSchema",
                    "requirements": "myAlgoRequirements",
                    "inputSchema": "myInputSchema"
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                "my_task_id",
                {},
                {},
                {},
                "",
                True
            ),
        ]
    )
    def test_init(self, mocker, algorithm_id, algorithm_info, expected_input_schema, expected_output_schema,
                  expected_algo_path, expected_require_ground_truth):
        """
        Tests init
        """
        with mocker.patch.object(json, "loads",
                                 return_value={
                                     'algoPath': 'my_algo_path',
                                     'requireGroundTruth': True,
                                 }):
            new_algorithm_info = AlgorithmInfo(algorithm_id, algorithm_info)
            assert new_algorithm_info.get_algorithm_path() == expected_algo_path
            assert new_algorithm_info.get_algorithm_input_schema() == expected_input_schema
            assert new_algorithm_info.get_algorithm_output_schema() == expected_output_schema
            assert new_algorithm_info.get_algorithm_require_ground_truth() == expected_require_ground_truth

    @pytest.mark.parametrize(
        "algorithm_id, algorithm_info, expected_input_schema, expected_output_schema, "
        "expected_algo_path, expected_require_ground_truth",
        [
            (
                None,
                {
                    "data": "mydata",
                    "outputSchema": "myOutputSchema",
                    "requirements": "myAlgoRequirements",
                    "inputSchema": "myInputSchema"
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                {},
                {
                    "data": "mydata",
                    "outputSchema": "myOutputSchema",
                    "requirements": "myAlgoRequirements",
                    "inputSchema": "myInputSchema"
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                [],
                {
                    "data": "mydata",
                    "outputSchema": "myOutputSchema",
                    "requirements": "myAlgoRequirements",
                    "inputSchema": "myInputSchema"
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                1234,
                {
                    "data": "mydata",
                    "outputSchema": "myOutputSchema",
                    "requirements": "myAlgoRequirements",
                    "inputSchema": "myInputSchema"
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                "my_task_id",
                None,
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                "my_task_id",
                "None",
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                "my_task_id",
                [],
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
            (
                "my_task_id",
                1234,
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                {
                    'algoPath': 'my_algo_path',
                    'requireGroundTruth': True,
                },
                "my_algo_path",
                True
            ),
        ]
    )
    def test_init_invalid_arguments(self, mocker, algorithm_id, algorithm_info, expected_input_schema,
                                    expected_output_schema, expected_algo_path, expected_require_ground_truth):
        """
        Tests init with invalid arguments
        """
        with (
            pytest.raises(Exception) as exc_info,
            mocker.patch.object(json, "loads",
                                     return_value={
                                         'algoPath': 'my_algo_path',
                                         'requireGroundTruth': True,
                                     })
        ):
            new_algorithm_info = AlgorithmInfo(algorithm_id, algorithm_info)
            assert new_algorithm_info.get_algorithm_path() == expected_algo_path
            assert new_algorithm_info.get_algorithm_input_schema() == expected_input_schema
            assert new_algorithm_info.get_algorithm_output_schema() == expected_output_schema
            assert new_algorithm_info.get_algorithm_require_ground_truth() == expected_require_ground_truth

        assert str(exc_info.value) == "The inputs do not meet the validation rules"

