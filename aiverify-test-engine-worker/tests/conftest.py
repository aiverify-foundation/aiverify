import pytest
from aiverify_test_engine_worker.pipeline.schemas import PipelineData, TestRunTask
from pathlib import Path


@pytest.fixture
def mock_test_run_task():
    return TestRunTask(
        id="mock_id",
        mode="upload",
        algorithmGID="mock_algorithmGID",
        algorithmCID="mock_algorithmCID",
        algorithmHash="mock_algorithmHash",
        algorithmArgs={},
        testDataset="mock_testDataset",
        testDatasetHash="mock_testDatasetHash",
        groundTruthDataset="mock_groundTruthDataset",
        groundTruthDatasetHash="mock_groundTruthDatasetHash",
        groundTruth="mock_groundTruth",
        modelFile="mock_modelFile",
        modelFileHash="mock_modelFileHash",
        apiSchema={},
        apiConfig={},
        modelType="mock_modelType"
    )


@pytest.fixture
def mock_pipeline_data(mock_test_run_task):
    return PipelineData(
        task=mock_test_run_task,
        algorithm_path=Path("/mock/algorithm"),
        algorithm_id="mock_algorithm_id",
        algorithm_script_path=Path("/mock/algorithm/script"),
        input_schema_path=Path("/mock/input/schema"),
        output_schema_path=Path("/mock/output/schema"),
        data_path=Path("/mock/data"),
        model_path=Path("/mock/model"),
        ground_truth_path=Path("/mock/data"),
        to_build=False,
        intermediate_data={},
        output_zip=Path("/mock/output.zip"),
        error_message=None
    )
