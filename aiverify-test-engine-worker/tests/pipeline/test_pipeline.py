import pytest
import os
from unittest.mock import Mock, patch
from aiverify_test_engine_worker.pipeline.pipeline import Pipeline
from aiverify_test_engine_worker.pipeline.schemas import PipeStageEnum
from aiverify_test_engine_worker.pipeline.pipe import PipeException


@pytest.fixture
def mock_env_vars(mocker):
    return mocker.patch.dict(os.environ, {
        "PIPELINE_DOWNLOAD": "mock_download",
        "PIPELINE_BUILD": "mock_build",
        "PIPELINE_VALIDATE_INPUT": "mock_validate_input",
        "PIPELINE_EXECUTE": "mock_execute",
        "PIPELINE_UPLOAD": "mock_upload",
        "PIPELINE_ERROR": "mock_error",
    })

# Fixture to create a Pipeline instance


@pytest.fixture
def pipeline(mock_env_vars):
    with patch.object(Pipeline, '_load_pipe_module', return_value=Mock()):
        yield Pipeline()


# Test _load_stages method
class TestLoadStages:
    def test_load_stages_success(self, pipeline):
        # Call _load_stages
        stages = pipeline._load_stages()

        # Assertions
        assert len(stages) == 5  # 5 stages in the mapping
        assert isinstance(stages[0][0], PipeStageEnum)


# Test run method
class TestRun:
    def test_run_success(self, pipeline, mock_pipeline_data):
        # Mock the stages and pipe instances
        mock_pipe_instance = Mock()
        mock_pipe_instance.execute.return_value = mock_pipeline_data
        # mock_pipe_instance.execute.return_value = mock_pipeline_data  # Return a new PipelineData instance
        pipeline.stages = [(PipeStageEnum.DOWNLOAD, mock_pipe_instance)]

        # Call run with task data
        task_data = mock_pipeline_data
        result = pipeline.run(task_data)

        # Assertions
        mock_pipe_instance.execute.assert_called_once_with(task_data)
        assert result == task_data

    def test_run_error(self, pipeline, mock_pipeline_data):
        # Mock the stages and pipe instances
        mock_pipe_instance = Mock()
        mock_pipe_instance.execute.side_effect = PipeException("Test error")
        pipeline.stages = [(PipeStageEnum.DOWNLOAD, mock_pipe_instance)]
        pipeline.error_pipe = Mock()

        # Call run with task data
        task_data = mock_pipeline_data
        with pytest.raises(PipeException, match="Test error"):
            pipeline.run(task_data)

        # Assertions
        pipeline.error_pipe.execute.assert_called_once_with(task_data)


# Test teardown method
class TestTeardown:
    def test_teardown(self, pipeline):
        # Mock the stages and pipe instances
        mock_pipe_instance = Mock()
        pipeline.stages = [(PipeStageEnum.DOWNLOAD, mock_pipe_instance)]

        # Call teardown
        pipeline.teardown()

        # Assertions
        mock_pipe_instance.teardown.assert_called_once()
