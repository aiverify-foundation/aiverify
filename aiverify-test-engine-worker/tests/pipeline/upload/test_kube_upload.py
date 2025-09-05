import pytest
from aiverify_test_engine_worker.pipeline.upload.kube_upload import KubeUpload
from aiverify_test_engine_worker.pipeline.schemas import PipeStageEnum


# Fixture to create an instance of KubeUpload
@pytest.fixture
def kube_upload():
    pipe = KubeUpload()
    pipe.setup()
    return pipe


# Test pipe_stage property
class TestPipeStage:
    def test_pipe_stage(self, kube_upload):
        assert kube_upload.pipe_stage == PipeStageEnum.UPLOAD


# Test pipe_name property
class TestPipeName:
    def test_pipe_name(self, kube_upload):
        assert kube_upload.pipe_name == "kube_upload"


# Test execute method
class TestExecute:
    def test_execute(self, kube_upload, mock_pipeline_data):
        result = kube_upload.execute(mock_pipeline_data)
        assert result == mock_pipeline_data
