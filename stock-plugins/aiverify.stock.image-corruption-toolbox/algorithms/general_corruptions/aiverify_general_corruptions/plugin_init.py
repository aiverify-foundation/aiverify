import argparse

from aiverify_test_engine.plugins.enums.model_type import ModelType

from aiverify_general_corruptions.algo import Plugin
from aiverify_general_corruptions.algo_init import AlgoInit
from aiverify_general_corruptions.utils import general


def run():
    parser = build_parser()
    args = parser.parse_args()
    invoke_aiverify_general_corruptions_plugin(args)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the plugin test with specified parameters.")

    parser.add_argument("--data_path", required=True, help="Path to the data file/folder.")
    parser.add_argument(
        "--model_path",
        required=True,
        help="Path to the model file/folder. "
        "The model should have a `predict` method that takes a batch of image file path and returns a batch prediction.",
    )
    parser.add_argument(
        "--model_type",
        required=True,
        choices=[model_type.name for model_type in Plugin._supported_algorithm_model_type],
        help="Model type.",
    )
    parser.add_argument("--ground_truth_path", help="Path to the ground truth CSV file with image path and label.")
    parser.add_argument("--ground_truth", help="The ground truth label in the ground truth file.")
    parser.add_argument("--file_name_label", help="The file name label in the ground truth file.")
    parser.add_argument("--core_modules_path", help="Path to the core modules. Detects automatically if not provided.")
    parser.add_argument("--set_seed", type=int, help="Set seed value for reproducibility.")
    parser.add_argument(
        "--corruptions",
        nargs="+",
        choices=["all"] + [name.lower() for name in general.CORRUPTION_FN],
        default=["all"],
        help="Specify the name(s) of corruption to run. Default: all",
    )

    def get_default(k: str) -> str:
        return " ".join([str(v) for v in general.DEFAULT_PARAMS[k]])

    parser.add_argument(
        "--gaussian_noise_sigma",
        nargs="+",
        type=float,
        help=f"Gaussian Noise sigma. Default: {get_default('gaussian_noise_sigma')}",
    )
    parser.add_argument(
        "--poisson_noise_scale",
        nargs="+",
        type=float,
        help=f"Poisson Noise scale. Default: {get_default('poisson_noise_scale')}",
    )
    parser.add_argument(
        "--salt_and_pepper_noise_amount",
        nargs="+",
        type=float,
        help=f"Salt and Pepper Noise amount. Default: {get_default('salt_and_pepper_noise_amount')}",
    )

    return parser


def invoke_aiverify_general_corruptions_plugin(args: argparse.Namespace) -> None:
    # =====================================================================================
    # NOTE: Do not modify the code below
    # =====================================================================================
    # Perform Plugin Testing

    args.model_type = ModelType[args.model_type]

    user_defined_params = {
        "corruptions": args.corruptions,
        "gaussian_noise_sigma": args.gaussian_noise_sigma,
        "poisson_noise_scale": args.poisson_noise_scale,
        "salt_and_pepper_noise_amount": args.salt_and_pepper_noise_amount,
    }
    # Debugging prints
    print("*" * 20)
    print(f"Running with the following arguments:")
    for k, v in vars(args).items():
        print(f"{k}: {v}")
    print("*" * 20)

    try:
        # Create an instance of AlgoInit with defined paths and arguments and Run.
        plugin_test = AlgoInit(
            run_as_pipeline=True,
            data_path=args.data_path,
            model_path=args.model_path,
            model_type=args.model_type,
            ground_truth_path=args.ground_truth_path,
            ground_truth=args.ground_truth,
            file_name_label=args.file_name_label,
            set_seed=args.set_seed,
            core_modules_path=args.core_modules_path,
            **user_defined_params,
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")


if __name__ == "__main__":
    run()
