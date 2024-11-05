import argparse

from aiverify_accumulated_local_effect.algo_init import AlgoInit
from aiverify_test_engine.plugins.enums.model_type import ModelType

parser = argparse.ArgumentParser(description="Run the plugin test with specified parameters.")


def run():
    parse_input_args()
    invoke_accumulated_local_effect_plugin()


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


def invoke_accumulated_local_effect_plugin():
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
        f"Core Modules Path: {args.core_modules_path}"
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
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")


if __name__ == "__main__":
    run()
