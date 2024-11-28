import argparse
import json

from aiverify_test_engine.plugins.enums.model_type import ModelType
from aiverify_veritastool.algo_init import AlgoInit

parser = argparse.ArgumentParser(description="Run the Veritas fairness assessment with specified parameters.")


def run():
    parse_input_args()
    invoke_veritas_fairness_plugin()


def parse_input_args():
    global parser

    # Core data and model arguments
    parser.add_argument("--data_path", required=True, help="Path to the test data file")
    parser.add_argument("--model_path", required=True, help="Path to the model file")
    parser.add_argument("--ground_truth_path", required=True, help="Path to the ground truth data")
    parser.add_argument("--ground_truth", required=True, help="Ground truth column name")
    parser.add_argument(
        "--run_pipeline",
        action=argparse.BooleanOptionalAction,
        help="Whether to run the test as a pipeline (default: False).",
    )
    parser.add_argument(
        "--model_type", required=True, choices=["CLASSIFICATION", "REGRESSION", "UPLIFT"], help="Model type to evaluate"
    )
    parser.add_argument(
        "--core_modules_path",
        default="",
        help="Path to the core modules (default: empty).",
    )

    # Desired use case
    parser.add_argument(
        "--use_case",
        default="base_classification",
        choices=[
            "base_classification",
            "base_regression",
            "credit_scoring",
            "fairness_classification",
            "customer_marketing",
            "predictive_underwriting",
        ],
        help="Use case to evaluate",
    )

    # Model configuration
    parser.add_argument("--training_data_path", default="", help="Path to training data (optional)")
    parser.add_argument("--training_ground_truth_path", default="", help="Path to training ground truth (optional)")
    parser.add_argument("--training_ground_truth", default="", help="Training ground truth column name (optional)")
    parser.add_argument("--model_name", default="auto", help="Name for the model artifact")
    parser.add_argument(
        "--probability_threshold", type=float, default=0.5, help="Threshold for converting probabilities to predictions"
    )

    # Fairness parameters
    parser.add_argument("--protected_features", default=None, nargs="+", help="List of protected feature column names")
    parser.add_argument(
        "--privileged_groups",
        type=json.loads,
        default=None,
        help="JSON dict mapping protected features to privileged values",
    )
    parser.add_argument(
        "--unprivileged_groups",
        type=json.loads,
        default=None,
        help="JSON dict mapping protected features to unprivileged values (optional)",
    )
    parser.add_argument("--fair_threshold", type=float, default=80, help="Fairness threshold value (0-100)")
    parser.add_argument("--fair_metric", default="auto", help="Primary fairness metric to use")
    parser.add_argument(
        "--fair_concern",
        default="eligible",
        choices=["eligible", "inclusive", "both"],
        help="Fairness concern to apply",
    )
    parser.add_argument(
        "--fair_priority",
        default="benefit",
        choices=["benefit", "harm"],
        help='Used to pick the fairness metric according to the Fairness Tree methodology. Could be "benefit" or "harm"',
    )
    parser.add_argument(
        "--fair_impact",
        default="normal",
        choices=["normal", "significant", "selective"],
        help='Used to pick the fairness metric according to the Fairness Tree methodology. Could be "normal" or "significant" or "selective"',
    )

    # Label configuration
    parser.add_argument("--positive_label", nargs="+", default=[1], help="Label values considered favorable")
    parser.add_argument(
        "--negative_label",
        nargs="+",
        default=None,
        help="Label values considered unfavorable (required for uplift models)",
    )

    # Performance metric
    parser.add_argument("--performance_metric", default="balanced_acc", help="Primary performance metric to use")

    # Transparency parameters
    parser.add_argument(
        "--transparency_rows", nargs="+", type=int, default=[1], help="Row numbers to analyze for transparency"
    )
    parser.add_argument(
        "--transparency_max_samples", type=int, default=1, help="Maximum samples for transparency analysis"
    )
    parser.add_argument(
        "--transparency_features", nargs="+", default=[], help="Features to analyze for partial dependence plots"
    )


def invoke_veritas_fairness_plugin():
    # Parse arguments
    args = parser.parse_args()

    # Determine the value of run_pipeline
    if args.run_pipeline is None:
        run_pipeline = False  # Default to False if not provided
    else:
        run_pipeline = args.run_pipeline

    # Determine run pipeline mode
    run_pipeline = False if args.run_pipeline is None else args.run_pipeline

    # Map string argument to ModelType enum
    model_type = ModelType[args.model_type]

    # Prepare input arguments dictionary
    input_arguments = {
        "protected_features": args.protected_features,
        "privileged_groups": args.privileged_groups,
        "unprivileged_groups": args.unprivileged_groups,
        "model_name": args.model_name,
        "probability_threshold": args.probability_threshold,
        "positive_label": args.positive_label,
        "negative_label": args.negative_label,
        "fair_threshold": args.fair_threshold,
        "fair_metric": args.fair_metric,
        "fair_concern": args.fair_concern,
        "fair_priority": args.fair_priority,
        "fair_impact": args.fair_impact,
        "performance_metric": args.performance_metric,
        "transparency_rows": args.transparency_rows,
        "transparency_max_samples": args.transparency_max_samples,
        "transparency_features": args.transparency_features,
        "training_data_path": args.training_data_path,
        "training_ground_truth_path": args.training_ground_truth_path,
        "training_ground_truth": args.training_ground_truth,
    }

    print("*" * 20)
    print(
        f"Running Veritas assessment with:\n"
        f"Data Path: {args.data_path}\n"
        f"Model Path: {args.model_path}\n"
        f"Ground Truth Path: {args.ground_truth_path}\n"
        f"Ground Truth: {args.ground_truth}\n"
        f"Run Pipeline: {run_pipeline}\n"
        f"Model Type: {model_type}\n"
        f"Core Modules Path: {args.core_modules_path}\n"
        f"Protected Features: {args.protected_features}\n"
        f"Training Data Path: {args.training_data_path}\n"
        f"Training Ground Truth Path: {args.training_ground_truth_path}\n"
    )
    print("*" * 20)

    try:
        # Create and run AlgoInit instance
        plugin_test = AlgoInit(
            run_pipeline,
            args.core_modules_path,
            args.data_path,
            args.model_path,
            args.ground_truth_path,
            args.ground_truth,
            model_type,
            input_arguments,
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running Veritas assessment: {str(exception)}")
        raise


if __name__ == "__main__":
    run()
