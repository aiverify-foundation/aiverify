import argparse

from aiverify_test_engine.plugins.enums.model_type import ModelType

from aiverify_digital_corruptions.algo_init import AlgoInit
from aiverify_digital_corruptions.utils import digital

parser = argparse.ArgumentParser(description="Run the plugin test with specified parameters.")


def run():
    parse_input_args()
    invoke_aiverify_digital_corruptions_plugin()


def parse_input_args():
    global parser

    parser.add_argument("--data_path", required=True, help="Path to the data file.")
    parser.add_argument("--model_path", required=True, help="Path to the model file.")
    parser.add_argument("--ground_truth_path", required=True, help="Path to the ground truth data file.")
    parser.add_argument(
        "--ground_truth",
        required=True,
        help="The ground truth column name in the data.",
    )
    parser.add_argument(
        "--run_pipeline",
        action=argparse.BooleanOptionalAction,
        help="Whether to run the test as a pipeline (default: False).",
    )
    parser.add_argument(
        "--model_type",
        required=True,
        choices=["CLASSIFICATION", "REGRESSION"],
        help="The type of model (CLASSIFICATION or REGRESSION).",
    )
    parser.add_argument(
        "--core_modules_path",
        default="",
        help="Path to the core modules (default: empty).",
    )
    parser.add_argument(
        "--set_seed",
        default=0,
        type=int,
        help="Seed value",
    )
    parser.add_argument(
        "--annotated_ground_truth_path",
        default="",
        help="Path to the annotated labels file.",
    )
    parser.add_argument("--file_name_label", default="", help="The label of the file name.")
    parser.add_argument(
        "--corruptions",
        nargs="+",
        choices=["all"] + [name.lower() for name in digital.CORRUPTION_FN],
        default=["all"],
        help="Specify the name(s) of digital corruption function to run. Default: 'all'",
    )
    parser.add_argument(
        "--brightness_down_factor",
        nargs="+",
        type=float,
        help="Customize the factor value(s) for the Brightness Down corruption function.",
    )
    parser.add_argument(
        "--brightness_up_factor",
        nargs="+",
        type=float,
        help="Customize the factor value(s) for the Brightness Up corruption function.",
    )
    parser.add_argument(
        "--contrast_down_factor",
        nargs="+",
        type=float,
        help="Customize the factor value(s) for the Contrast Down corruption function.",
    )
    parser.add_argument(
        "--contrast_up_factor",
        nargs="+",
        type=float,
        help="Customize the factor value(s) for the Contrast Up corruption function.",
    )
    parser.add_argument(
        "--saturate_down_factor",
        nargs="+",
        type=float,
        help="Customize the factor value(s) for the Saturate Down corruption function.",
    )
    parser.add_argument(
        "--saturate_up_factor",
        nargs="+",
        type=float,
        help="Customize the factor value(s) for the Saturate Up corruption function.",
    )
    parser.add_argument(
        "--random_perspective_sigma",
        nargs="+",
        type=float,
        help="Customize the sigma value(s) for the Random Perspective corruption function.",
    )
    parser.add_argument(
        "--jpeg_compression_quality",
        nargs="+",
        type=int,
        help="Customize the quality value(s) for the JPEG Compression corruption function.",
    )


def invoke_aiverify_digital_corruptions_plugin():
    # =====================================================================================
    # NOTE: Do not modify the code below
    # =====================================================================================
    # Perform Plugin Testing

    # Parse the arguments
    args = parser.parse_args()

    # Determine the value of run_pipeline
    if args.run_pipeline is None:
        run_pipeline = False  # Default to False if not provided
    else:
        run_pipeline = args.run_pipeline

    # Map string argument to ModelType enum
    model_type = ModelType[args.model_type]

    if "all" in args.corruptions:
        args.corruptions = list(digital.CORRUPTION_FN)
    else:
        # This step is required to (1) sanitize user input (2) make sure algorithm names are in correct format & order
        args.corruptions = [name for name in digital.CORRUPTION_FN if name.lower() in args.corruptions]

    user_defined_params = {
        "corruptions": args.corruptions,
        "brightness_down_factor": args.brightness_down_factor,
        "brightness_up_factor": args.brightness_up_factor,
        "contrast_down_factor": args.contrast_down_factor,
        "contrast_up_factor": args.contrast_up_factor,
        "saturate_down_factor": args.saturate_down_factor,
        "saturate_up_factor": args.saturate_up_factor,
        "random_perspective_sigma": args.random_perspective_sigma,
        "jpeg_compression_quality": args.jpeg_compression_quality,
    }

    plugin_argument_values = {
        "set_seed": args.set_seed,
        "annotated_ground_truth_path": args.annotated_ground_truth_path,
        "file_name_label": args.file_name_label,
        **user_defined_params,
    }

    print("*" * 20)
    # Debugging prints
    print(
        f"Running with the following arguments:\n"
        f"Data Path: {args.data_path}\n"
        f"Model Path: {args.model_path}\n"
        f"Ground Truth Path: {args.ground_truth_path}\n"
        f"Ground Truth: {args.ground_truth}\n"
        f"Run Pipeline: {run_pipeline}\n"
        f"Model Type: {model_type}\n"
        f"Core Modules Path: {args.core_modules_path}\n"
        f"Seed Value: {args.set_seed}\n"
        f"Annotated Ground Truth Path: {args.annotated_ground_truth_path}\n"
        f"File Name Label: {args.file_name_label}\n",
        f"User Defined Parameters: {user_defined_params}",
    )
    print("*" * 20)

    try:
        # Create an instance of AlgoInit with defined paths and arguments and Run.
        plugin_test = AlgoInit(
            run_pipeline,
            args.core_modules_path,
            args.data_path,
            args.model_path,
            args.ground_truth_path,
            args.ground_truth,
            model_type,
            plugin_argument_values,
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")


if __name__ == "__main__":
    run()
