import argparse

from aiverify_shap_toolbox.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

parser = argparse.ArgumentParser(description="Run the plugin test with specified parameters.")


def run():
    parse_input_args()
    invoke_shap_toolbox_plugin()


def parse_input_args():
    global parser

    parser.add_argument("--data_path", required=True, help="Path to the data file.")
    parser.add_argument("--model_path", required=True, help="Path to the model file.")
    parser.add_argument("--ground_truth_path", required=True, help="Path to the ground truth data file.")
    parser.add_argument(
        "--background_path",
        required=True,
        help="Path to the background path data file.",
    )
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
        "--explain_type",
        required=True,
        choices=["global", "local"],
        help="Type of Explainability (global or local)",
    )
    parser.add_argument(
        "--background_samples",
        default=0,
        type=int,
        help="The integer value of background samples.",
    )
    parser.add_argument(
        "--data_samples",
        default=0,
        type=int,
        help="The integer value of data samples.",
    )


def invoke_shap_toolbox_plugin():
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
        f"Background samples value: {args.background_samples}\n"
        f"Data samples value: {args.data_samples}\n"
        f"explain Type: {args.explain_type}\n"
        f"background Path: {args.background_path}\n"
    )
    print("*" * 20)

    plugin_argument_values = {
        "explain_type": args.explain_type,
        "background_path": args.background_path,
        "background_samples": args.background_samples,
        "data_samples": args.data_samples,
    }

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
