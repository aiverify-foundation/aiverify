import argparse

from aiverify_test_engine.plugins.enums.model_type import ModelType

from aiverify_blur_corruptions.algo import Plugin
from aiverify_blur_corruptions.algo_init import AlgoInit
from aiverify_blur_corruptions.utils import blur


def run():
    parser = build_parser()
    args = parser.parse_args()
    invoke_aiverify_blur_corruptions_plugin(args)


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
        choices=["all"] + [name.lower() for name in blur.CORRUPTION_FN],
        default=["all"],
        help="Specify the name(s) of corruption to run. Default: all",
    )

    def get_default(k: str) -> str:
        return " ".join([str(v) for v in blur.DEFAULT_PARAMS[k]])

    parser.add_argument(
        "--gaussian_blur_sigma",
        nargs="+",
        type=float,
        help=f"Gaussian Blur sigma. Default: {get_default('gaussian_blur_sigma')}",
    )
    parser.add_argument(
        "--glass_blur_max_delta",
        nargs="+",
        type=int,
        help=f"Glass Blur max delta. Default: {get_default('glass_blur_max_delta')}",
    )
    parser.add_argument(
        "--defocus_blur_radius",
        nargs="+",
        type=int,
        help=f"Defocus Blur radius. Default: {get_default('defocus_blur_radius')}",
    )
    parser.add_argument(
        "--horizontal_motion_blur_kernel_size",
        nargs="+",
        type=int,
        help=f"Horizontal Motion Blur kernel size. Default: {get_default('horizontal_motion_blur_kernel_size')}",
    )
    parser.add_argument(
        "--vertical_motion_blur_kernel_size",
        nargs="+",
        type=int,
        help=f"Vertical Motion Blur kernel size. Default: {get_default('vertical_motion_blur_kernel_size')}",
    )
    parser.add_argument(
        "--zoom_blur_zoom_factor",
        nargs="+",
        type=float,
        help=f"Zoom Blur zoom factor. Default: {get_default('zoom_blur_zoom_factor')}",
    )

    return parser


def invoke_aiverify_blur_corruptions_plugin(args: argparse.Namespace) -> None:
    # =====================================================================================
    # NOTE: Do not modify the code below
    # =====================================================================================
    # Perform Plugin Testing

    args.model_type = ModelType[args.model_type]

    user_defined_params = {
        "corruptions": args.corruptions,
        "gaussian_blur_sigma": args.gaussian_blur_sigma,
        "glass_blur_max_delta": args.glass_blur_max_delta,
        "defocus_blur_radius": args.defocus_blur_radius,
        "horizontal_motion_blur_kernel_size": args.horizontal_motion_blur_kernel_size,
        "vertical_motion_blur_kernel_size": args.vertical_motion_blur_kernel_size,
        "zoom_blur_zoom_factor": args.zoom_blur_zoom_factor,
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
