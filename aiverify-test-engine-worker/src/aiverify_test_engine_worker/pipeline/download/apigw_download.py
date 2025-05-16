from ..pipe import Pipe, PipeException
from ..schemas import PipelineData, PipeStageEnum
from ...lib.filecache import FileCache, algo_cache, model_cache, dataset_cache
from ...lib.logging import logger

from pathlib import Path
import os


class ApigwDownload(Pipe):
    @property
    def pipe_stage(self) -> PipeStageEnum:
        return PipeStageEnum.DOWNLOAD

    @property
    def pipe_name(self) -> str:
        return "apigw_download"

    def setup(self):
        self.apigw_url = os.getenv("APIGW_URL", "http://127.0.0.1:4000")
        # self.algo_cache = FileCache(subdir_name="algorithms")

    def _download_from_apigw(self, cache: FileCache, url: str, target_filename: str, file_hash: str | None):
        import urllib.request
        from urllib.error import URLError, HTTPError
        import tempfile

        # Create a temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # logger.debug(f"Created temporary directory: {temp_dir}")
            temp_path = Path(temp_dir).resolve()

            try:
                # Open the URL and get the response
                logger.debug(f"Downloading file from {url}")
                with urllib.request.urlopen(url) as response:
                    # Extract the filename from the response headers
                    content_disposition = response.getheader('Content-Disposition')
                    if content_disposition:
                        # Extract filename from Content-Disposition header
                        filename = content_disposition.split('filename=')[-1].strip('"\'')
                    else:
                        # Fallback: Extract filename from the URL
                        filename = os.path.basename(url)

                    # Define the full path to save the file
                    file_path = temp_path.joinpath(filename)

                    # Save the downloaded content to the file
                    with open(file_path, 'wb') as f:
                        f.write(response.read())

                    logger.debug(f"File downloaded and saved as: {file_path}")

            except HTTPError as e:
                raise PipeException(f"HTTP Error: {e.code} - {e.reason}")
            except URLError as e:
                raise PipeException(f"URL Error: {e.reason}")
            except Exception as e:
                raise PipeException(f"An unexpected error occurred: {e}")

            # Store in cache
            return cache.store_cache(file_path, target_filename, file_hash)

    def _download_algo(self, task_data: PipelineData):
        # check filecache
        algo_dir = algo_cache.get_cached(task_data.algorithm_id, task_data.task.algorithmHash)
        # logger.debug(f"algo_dir: {algo_dir}")

        if not algo_dir:  # download from apigw
            url = f"{self.apigw_url}/plugins/{task_data.task.algorithmGID}/algorithms/{task_data.task.algorithmCID}"
            algo_dir = self._download_from_apigw(algo_cache, url, task_data.algorithm_id, task_data.task.algorithmHash)
            task_data.to_build = True  # run build after download
        else:
            # already in cache
            task_data.to_build = False
            logger.debug(f"Algorithm {task_data.algorithm_id} already in cache")

        task_data.algorithm_path = algo_dir

    def _download_model(self, filename: str, file_hash: str | None):
        # check filecache
        model_path = model_cache.get_cached(filename, file_hash)
        # logger.debug(f"model_path: {model_path}")

        if not model_path:  # download from apigw
            url = f"{self.apigw_url}/storage/models/{filename}"
            return self._download_from_apigw(model_cache, url, filename, file_hash)
        else:
            # already in cache
            logger.debug(f"Model {model_path} already in cache")
            return model_path

    def _download_dataset(self, filename: str, file_hash: str | None):
        # check filecache
        dataset_path = dataset_cache.get_cached(filename, file_hash)
        # logger.debug(f"model_path: {model_path}")

        if not dataset_path:  # download from apigw
            url = f"{self.apigw_url}/storage/datasets/{filename}"
            return self._download_from_apigw(dataset_cache, url, filename, file_hash)
        else:
            # already in cache
            logger.debug(f"Dataset {dataset_path} already in cache")
            return dataset_path

    def execute(self, task_data: PipelineData) -> PipelineData:
        # Implementation of the download logic
        logger.debug(f"Execute Download task {task_data}")

        self._download_algo(task_data)
        task_data.model_path = self._download_model(task_data.task.modelFile, task_data.task.modelFileHash)
        task_data.data_path = self._download_dataset(task_data.task.testDataset, task_data.task.testDatasetHash)
        if task_data.task.groundTruthDataset:
            task_data.ground_truth_path = self._download_dataset(
                task_data.task.groundTruthDataset, task_data.task.groundTruthDatasetHash)
            
        # check if any of the algo arguments require dataset download
        if task_data.task.algorithmArgs:
            for key in task_data.task.algorithmArgs.keys():
                value = task_data.task.algorithmArgs[key]
                if isinstance(value, str) and value.startswith("_dataset_:"):
                    ds = value[len("_dataset_:"):]
                    p = self._download_dataset(ds, None)
                    task_data.task.algorithmArgs[key] = p.absolute().as_posix()

        # data.intermediate_data[self.pipe_stage] = {
        #     "hello": "world"
        # }
        return task_data
