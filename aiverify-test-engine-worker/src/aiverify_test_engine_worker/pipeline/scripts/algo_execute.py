from aiverify_test_engine.utils.json_utils import (
    remove_numpy_formats,
    validate_json,
    # validate_test_result_schema,
)
from aiverify_test_engine.plugins.enums.pipeline_plugin_type import PipelinePluginType
from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_test_engine.interfaces.itestresult import ITestArguments, ITestResult
from aiverify_test_engine.interfaces.ipipeline import IPipeline
from aiverify_test_engine.interfaces.ialgorithm import IAlgorithm
from aiverify_test_engine.interfaces.imodel import IModel
from aiverify_test_engine.interfaces.idata import IData
from aiverify_test_engine.plugins.plugins_manager import PluginManager
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from pathlib import Path
import argparse
import sys
import importlib.util
import inspect
import json
import time
import copy
from zipfile import ZipFile
from typing import Dict
from .algorithm_utils import validate_algorithm
import logging
from datetime import datetime
import requests
logging.basicConfig(
    format='%(levelname)-8s [%(filename)s:%(lineno)d] %(message)s')
logger = logging.getLogger(__name__)


def load_algorithm_class(algo_path: Path) -> tuple[Path, type[IAlgorithm], dict, dict, dict]:
    algo_script, input_schema_file, output_schema_file, algo_meta_file = validate_algorithm(
        algo_path)
    module_name = algo_script.parent.name
    # load module
    logger.debug(f"algo module: {module_name}")
    module = importlib.import_module(f"{module_name}.algo")
    # find Plugin class
    plugin_class: type[IAlgorithm] | None = None
    for name, obj in inspect.getmembers(module):
        try:
            if name != 'IAlgorithm' and issubclass(obj, IAlgorithm):
                plugin_class = obj
                break
        except:
            pass
    if plugin_class is None:
        logger.critical(f"IAlgorithm subclass not defined in module")
        exit(-1)
    try:
        with open(input_schema_file, "r") as fp:
            input_schema = json.load(fp)
    except:
        logger.critical(f"Invalid input schema")
        exit(-1)
    try:
        with open(output_schema_file, "r") as fp:
            output_schema = json.load(fp)
    except:
        logger.critical(f"Invalid output schema")
        exit(-1)
    try:
        with open(algo_meta_file, "r") as fp:
            algo_meta = json.load(fp)
    except:
        logger.critical(f"Invalid algorithm meta")
        exit(-1)
    return (algo_script, plugin_class, input_schema, output_schema, algo_meta)


def load_algo_init_class(algo_script: Path):
    module_name = algo_script.parent.name
    # load module
    module = importlib.import_module(f"{module_name}.algo_init")
    # find Plugin class
    for name, obj in inspect.getmembers(module):
        try:
            if name == 'AlgoInit':
                algo_class = obj
                logger.debug(f"algo_class: {algo_class}")
                return algo_class
        except:
            pass
    return None


def load_plugin_manager():
    # Discover available core plugins
    spec = importlib.util.find_spec("aiverify_test_engine")
    if spec is None or spec.origin is None:
        logger.critical("Unable to find aiverify_test_engine module spec")
        exit(-1)
    core_modules_path = Path(spec.origin).parent
    logger.debug(f"core_modules_path: {core_modules_path}")
    PluginManager.discover(str(core_modules_path))
    logger.debug(
        f"[DETECTED_PLUGINS]: {PluginManager.get_printable_plugins()}")
    return core_modules_path


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Execute algorithm with specified parameters.")

    parser.add_argument("--test_run_id", type=str, help="Test run identifier")
    parser.add_argument("--algo_path", required=True,
                        type=Path, help="Path to the algorithm file.")
    parser.add_argument("--data_path", required=True,
                        type=Path, help="Path to the data file.")
    parser.add_argument("--model_path", required=True,
                        type=Path, help="Path to the model file.")
    parser.add_argument("--ground_truth_path", type=Path,
                        help="Path to the ground truth data file.")
    parser.add_argument(
        "--ground_truth",
        required="--ground_truth_path" in sys.argv,
        help="The ground truth column name in the data. Required if ground_truth_path is set."
    )
    parser.add_argument(
        "--model_type",
        required=True,
        choices=["classification", "regression", "uplift"],
        help="The type of model."
    )
    parser.add_argument(
        "--algorithm_args",
        type=json.loads,
        required=True,
        help="JSON string of arguments for the algorithm."
    )
    parser.add_argument("--apigw_url", type=str,
                        help="URL of apigw to report updates")
    parser.add_argument(
        "--upload_output_to_apigw",
        action="store_true",
        help="If set, results will be uploaded to the specified apigw URL (requires --apigw_url)"
    )

    parser.add_argument("--output_zip", type=Path,
                        help="Path to output zip file, default saved under algo_path")
    parser.add_argument(
        "-v", "--verbose",
        action="count",
        default=0,
        help="Increase verbosity level. Use -v for INFO, -vv for DEBUG."
    )

    args = parser.parse_args()

    # Post-parsing validation
    if args.upload_output_to_apigw and not args.apigw_url:
        parser.error(
            "--apigw_url is required when --upload_output_to_apigw is set.")
    if args.apigw_url and not args.upload_output_to_apigw:
        logger.warning(
            "--apigw_url is set but --upload_output_to_apigw is not. URL will be used only for progress update.")

    if args.verbose > 0:
        if args.verbose == 1:
            logger.setLevel(logging.INFO)
        else:
            logger.setLevel(logging.DEBUG)

    if not args.algo_path.is_dir():
        logger.critical(f"Invalid algo_path: {args.algo_path}")
        exit(-1)
    if not args.data_path.exists():
        logger.critical(f"Invalid data_path: {args.data_path}")
        exit(-1)
    if not args.model_path.exists():
        logger.critical(f"Invalid model_path: {args.model_path}")
        exit(-1)
    if not args.ground_truth_path.exists():
        logger.critical(f"Invalid ground_truth_path: {args.ground_truth_path}")
        exit(-1)

    # convert to ModelType
    args.model_type = ModelType[args.model_type.upper()]

    if args.apigw_url:
        ProcessCallback.apigw_url = args.apigw_url

    return args


class ProcessCallback:
    apigw_url: str | None = None

    def __init__(self, test_run_id) -> None:
        self.test_run_id = test_run_id

    # @classmethod
    def progress_callback(self, completion_value: int):
        """
        A callback function to print the current progress completion

        Args:
            completion_value (int): Current progress completion
        """
        logger.info(
            f"[Test Run ID {self.test_run_id}] Progress Update: {completion_value}")
        if not self.__class__.apigw_url:
            # logger.error("API Gateway URL is not set.")
            return

        import requests
        url = f"{self.__class__.apigw_url}/test_runs/{self.test_run_id}"
        payload = {"progress": completion_value}

        try:
            requests.patch(url, json=payload)
            # logger.debug(f"Progress reported successfully: {completion_value}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to report progress: {e}")


def run():

    args = parse_arguments()
    # print(f"Executing algorithm {args.algo_path}")
    algo_script, plugin_class, input_schema, output_schema, algo_meta = load_algorithm_class(
        args.algo_path)
    algo_src_path = algo_script.parent.absolute()

    # validate input arguments
    if not validate_json(args.algorithm_args, input_schema):
        logger.critical(f"Invalid input arguments")
        exit(-1)

    # load plugin manager
    core_modules_path = load_plugin_manager()

    (data_instance, data_serializer, data_errmsg) = PluginManager.get_instance(
        PluginType.DATA, **{"filename": args.data_path.absolute().as_posix()}
    )
    logger.debug(
        f"validate dataset. data_instance:{data_instance}, data_serializer: {data_serializer}, errmsg: {data_errmsg}")
    if not isinstance(data_instance, IData):
        logger.critical(f"Invalid dataset instance")
        exit(-1)

    # try to load the model instance
    run_as_pipeline = False
    try:
        (model_instance, model_serializer, model_errmsg) = PluginManager.get_instance(
            PluginType.PIPELINE, **{"pipeline_path": args.model_path.absolute().as_posix()}
        )
        logger.debug(
            f"validate pipeline. model_instance:{model_instance}, model_serializer: {model_serializer}, errmsg: {model_errmsg}")
        if not isinstance(model_instance, IPipeline):
            logger.critical(f"Invalid pipeline file")
            exit(-1)

        run_as_pipeline = True
        initial_data_instance = copy.deepcopy(data_instance)
        initial_model_instance = copy.deepcopy(model_instance)

        try:
            # veritastool handles data transformation internally
            if (
                model_instance.get_pipeline_plugin_type() == PipelinePluginType.SKLEARN
                and algo_meta.get("cid") != "veritastool"
            ):
                # Perform data transformation
                current_dataset = data_instance.get_data()
                current_pipeline = model_instance.get_pipeline()
                data_transformation_stages = current_pipeline[:-1]
                transformed_dataset = data_transformation_stages.transform(
                    current_dataset
                )
                transformed_pipeline = current_pipeline[-1]
                # Set new transformed pipeline and dataset
                data_instance.set_data(transformed_dataset)
                model_instance.set_pipeline(transformed_pipeline)
        except Exception as e:
            logger.error(f"Unable to transform pipeline data: {e}")
            # probaby not best way to handle, but for now just ignore when data transformation exception

    except:  # if exception, not pipeline
        (model_instance, model_serializer, model_errmsg) = PluginManager.get_instance(
            PluginType.MODEL, **{"filename": args.model_path.absolute().as_posix()}
        )
        logger.debug(
            f"validate model. model_instance:{model_instance}, model_serializer: {model_serializer}, errmsg: {model_errmsg}")
        if not isinstance(model_instance, IModel):
            logger.critical(f"Invalid model file")
            exit(-1)
        initial_data_instance = None
        initial_model_instance = None

    # load ground truth
    if args.ground_truth_path:
        (ground_truth_data_instance, ground_truth_data_serializer, ground_truth_data_errmsg) = PluginManager.get_instance(
            PluginType.DATA, **{"filename": args.ground_truth_path.absolute().as_posix()}
        )
        logging.debug(
            f"validate ground truth dataset. data_instance:{ground_truth_data_instance}, data_serializer: {ground_truth_data_serializer}, errmsg: {ground_truth_data_errmsg}")
        if not isinstance(ground_truth_data_instance, IData):
            logger.critical(f"Invalid dataset instance")
            exit(-1)
        # Leave only the ground truth feature in self._ground_truth_instance and
        # Remove ground truth feature from the data instance
        # is_ground_truth_instance_success = (
        #     ground_truth_data_instance.keep_ground_truth(args.ground_truth)
        # )
        data_instance.remove_ground_truth(args.ground_truth)
        # if not is_ground_truth_instance_success:
        #     logger.debug(
        #         "ERROR: Unable to retain only ground truth in ground truth instance. (Check "
        #         "if "
        #         "ground "
        #         "truth feature exists in the data specified in ground truth path file.)"
        #     )
        #     exit(-1)

    # set the input arguments
    input_arguments: Dict = copy.deepcopy(args.algorithm_args)
    input_arguments["ground_truth"] = args.ground_truth
    input_arguments["model_type"] = args.model_type
    input_arguments["logger"] = logger
    callback = ProcessCallback(args.test_run_id)
    input_arguments["progress_callback"] = callback.progress_callback
    input_arguments["project_base_path"] = algo_src_path

    logger.debug(f"input_arguments: {input_arguments}")

    # Remove old output folder if present
    output_folder: Path = args.algo_path.joinpath("output")
    if output_folder.exists():
        import shutil
        shutil.rmtree(output_folder)

    # Run the plugin with the arguments and instances
    logger.debug("Creating an instance of the Plugin...")
    start_time = time.time()
    plugin = plugin_class(
        (data_instance, data_serializer),  # type: ignore
        (model_instance, model_serializer),  # type: ignore
        (ground_truth_data_instance, ground_truth_data_serializer),  # type: ignore
        initial_data_instance,
        initial_model_instance,
        **input_arguments,
    )
    # Generate the results using this plugin
    logger.debug("Generating the results with the plugin...")
    plugin.generate()
    time_taken = time.time() - start_time

    # Get the task results and convert to json friendly and validate against the output schema
    logger.debug("Converting numpy formats if exists...")
    results = remove_numpy_formats(plugin.get_results())

    logger.debug("Verifying results with output schema...")
    if not isinstance(results, Dict) or not validate_json(results, output_schema):
        logger.critical(f"Invalid results: {results}")
        exit(-1)

    # Create output folder to store results
    output_folder.mkdir(parents=True, exist_ok=True)
    json_file_path = output_folder.joinpath("results.json")

    algo_init_class = load_algo_init_class(algo_script)
    output_generated = False
    if algo_init_class:
        # hacky way to use AlgoInit class to generate result
        logger.debug(f"Using AlgoInit class instance to generate result")
        try:
            algo_init_instance = algo_init_class(
                run_as_pipeline,
                core_modules_path,
                str(args.data_path),
                str(args.model_path),
                str(args.ground_truth_path),
                **input_arguments,
            )
            algo_init_instance._start_time = start_time
            algo_init_instance._time_taken = time_taken
            algo_init_instance._generate_output_file(results, json_file_path)
            if args.test_run_id:
                with open(json_file_path, "r") as fp:
                    output_dict = json.load(fp)
                output_dict["testRunId"] = args.test_run_id
                output_json = json.dumps(output_dict)
                with open(json_file_path, "w") as fp:
                    fp.write(output_json)
            output_generated = True
        except Exception as e:
            logger.error(f"Error generating result using AlgoInit class: {e}")
            pass

    if not output_generated:
        logger.debug(f"Fallback on own method to generate results")
        # Prepare test arguments
        test_arguments = ITestArguments(
            groundTruth=args.ground_truth,
            modelType=args.model_type.name,
            testDataset=str(args.data_path),  # type: ignore
            modelFile=str(args.model_path),  # type: ignore
            groundTruthDataset=str(args.ground_truth_path),  # type: ignore
            algorithmArgs=args.algorithm_args,
            mode="upload",
        )
        logger.debug(f"test_arguments: {test_arguments}")

        # Create the output result
        output = ITestResult(
            gid=algo_meta["gid"],
            cid=algo_meta["cid"],
            version=algo_meta.get("version"),
            startTime=datetime.fromtimestamp(start_time),
            timeTaken=round(time_taken, 4),
            testArguments=test_arguments,
            output=results,
            artifacts=None,
        )
        # logger.debug(f"output: {type(output)} {output}")
        output_dict = output.model_dump()
        # logger.debug(f"output_dict: {json.dumps(output_dict, indent=2, default=str)}")
        # if validate_test_result_schema(output_dict) is False:
        #     raise RuntimeError("Failed test result schema validation")
        if args.test_run_id:
            output_dict["testRunId"] = args.test_run_id
        output_json = json.dumps(output_dict, default=str)
        with open(json_file_path, "w") as json_file:
            json_file.write(output_json)

    output_zip_path: Path = args.output_zip if args.output_zip else args.algo_path.joinpath(
        "output.zip")

    output_zip_path.parent.mkdir(parents=True, exist_ok=True)

    # Create a zip file of all files in the output_folder
    with ZipFile(output_zip_path, "w") as zipf:
        for file_path in output_folder.rglob("**/*"):
            if file_path.is_file():
                zipf.write(file_path, file_path.relative_to(output_folder))
            elif file_path.is_dir():
                zipf.mkdir(file_path.relative_to(output_folder).as_posix())

    logger.info("Algorithm run method completed successfully.")

    if args.upload_output_to_apigw:
        upload_url = f"{args.apigw_url}/test_results/upload_zip"

        try:
            with open(output_zip_path, 'rb') as zip_file:
                # Prepare the files dictionary for the POST request
                files = {'file': zip_file}

                # Send the POST request to upload the zip file
                response = requests.post(upload_url, files=files)

                # Check if the upload was successful
                if response.status_code == 200:
                    logger.debug(
                        f"Successfully uploaded zip file to {upload_url}")
                else:
                    logger.error(
                        f"Failed to upload zip file. Status code: {response.status_code}, Response: {response.text}")

        except FileNotFoundError:
            logger.error(f"Zip file not found at: {output_zip_path}")
        except Exception as e:
            logger.exception(f"Unexpected error while uploading zip: {e}")


if __name__ == "__main__":

    try:
        args = parse_arguments()
    except Exception as e:
        logger.critical(f"Failed to parse arguments: {e}")
        exit(-1)

    if args.upload_output_to_apigw:
        # Run with error reporting
        try:
            run()
        except Exception:
            import traceback
            error_message = traceback.format_exc()
            logger.debug(f"Update Pipeline error to API GW")

            update_obj = {
                "status": "error",
                "errorMessages": f"Failed to run algorithm: {error_message}",
            }

            apigw_url = args.apigw_url
            test_run_id = args.test_run_id

            if apigw_url and test_run_id:
                update_url = f"{apigw_url}/test_runs/{test_run_id}"
                logger.debug(f"Post error to {update_url}: {update_obj}")
                try:
                    requests.patch(update_url, json=update_obj)
                    logger.info("Error successfully reported to API Gateway.")
                except Exception as api_error:
                    logger.warning(
                        f"Failed to report error to API Gateway: {api_error}")
            else:
                logger.warning(
                    "Missing apigw_url or test_run_id; cannot send error update.")

            exit(-1)
    else:
        run()
