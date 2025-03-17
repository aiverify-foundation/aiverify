import re
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from pathlib import Path
from typing import Dict, List, Any

from aiverify_veritastool.util.waterfall import waterfall


def plot_perf_dynamic(threshold, perf, selection_rate, zf_name):
    """Plot performance dynamics chart."""
    fig, ax1 = plt.subplots(figsize=(8, 4))
    color = "tab:red"
    ax1.set_xlabel("Threshold")
    ax1.set_ylabel("Perf", color=color)
    ax1.plot(threshold, perf, color=color)
    ax1.tick_params(axis="y", labelcolor=color)
    ax1.grid()
    ax2 = ax1.twinx()  # instantiate a second axes that shares the same x-axis
    color = "#02124D"
    ax2.set_ylabel("Selection Rate", color=color)  # we already handled the x-label with ax1
    ax2.plot(threshold, selection_rate, color=color)
    ax2.tick_params(axis="y", labelcolor=color)
    fig.tight_layout()  # otherwise the right y-label is slightly clipped
    filename = zf_name + "_" + "performanceLineChart" + ".png"
    plt.savefig(filename)
    plt.close()
    return filename


def plot_piechart(data1, label, zf_name, key):
    """Plot pie chart for distribution data."""
    plt.figure(figsize=(6, 6))
    cmap = sns.diverging_palette(220, 10, as_cmap=True)
    plt.pie(
        data1,
        textprops={"fontsize": 14, "color": "black"},
        explode=None,
        normalize=True,
        labels=label,
        colors=cmap(np.linspace(0, 1, len(data1))),
        autopct="%.2f%%",
        pctdistance=0.6,
        labeldistance=1.05,
        shadow=False,
        startangle=0,
        radius=1.2,
        frame=False,
    )
    if key is not None:
        filename = zf_name + "_" + "featureDistributionPieChartMap" + "_" + key + ".png"
    else:
        filename = zf_name + "_" + "classDistributionPieChart" + ".png"
    plt.savefig(filename)
    plt.close()
    return filename


def plot_calibration(bin_true_prob, bin_pred_prob, zf_name):
    """Plot calibration curve."""
    plt.figure(figsize=(7, 7))
    ax1 = plt.subplot2grid((3, 1), (0, 0), rowspan=2)

    ax1.plot([0, 1], [0, 1], "k:", label="perfectly calibrated")
    ax1.plot(bin_pred_prob, bin_true_prob, "s-", color="#02124D", label="model")

    ax1.set_ylabel("Fraction of Positives", fontsize=14)
    ax1.set_ylim([-0.05, 1.05])
    ax1.legend(loc="lower right", fontsize=12)
    ax1.set_title("Model Calibration (reliability curve)", fontsize=16)

    plt.tight_layout()
    filename = zf_name + "_" + "calibrationCurveLineChart" + ".png"
    plt.savefig(filename)
    plt.close()
    return filename


def plot_heatmap(corr_values, feature_names, zf_name):
    """Plot correlation heatmap."""
    plt.figure(figsize=(9, 8))
    ax = sns.heatmap(
        corr_values, vmin=-1, vmax=1, center=0, cmap=sns.diverging_palette(20, 220, n=200), square=True, annot=True
    )
    ax.set_xticklabels(feature_names, rotation=45, horizontalalignment="right")
    ax.set_yticklabels(feature_names, rotation=0, horizontalalignment="right")
    filename = zf_name + "_" + "correlationHeatMapChart" + ".png"
    plt.savefig(filename)
    plt.close()
    return filename


def plot_weighted_confusion_matrix(matrix, name1, name2, zf_name):
    """Plot weighted confusion matrix."""
    if matrix is None:
        return None

    # Check if any key values are None
    required_keys = ["tn", "fp", "fn", "tp"]
    if any(matrix.get(key) is None for key in required_keys):
        return None

    sub_list1 = []
    sub_list2 = []
    weighted_confusion_matrix_list = []
    sub_list1.append(matrix["tn"])
    sub_list1.append(matrix["fp"])
    sub_list2.append(matrix["fn"])
    sub_list2.append(matrix["tp"])
    weighted_confusion_matrix_list.append(sub_list1)
    weighted_confusion_matrix_list.append(sub_list2)

    # plot weighted_confusion_matrix
    ax = sns.heatmap(
        weighted_confusion_matrix_list, fmt=".20g", cmap=sns.diverging_palette(20, 220, n=5000), square=True, annot=True
    )
    ax.set_xticklabels(name1, rotation=0, horizontalalignment="center")
    ax.set_yticklabels(name2, rotation=90, horizontalalignment="center")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    filename = zf_name + "_" + "weightedConfusionHeatMapChart" + ".png"
    plt.savefig(filename)
    plt.close()
    return filename


def plot_contour(zf_name, key, fair_metric_name, perf_metric_name, th_a, th_b, perf, fair, best_th):
    """Plot contour for fairness vs performance tradeoffs."""
    plt.figure(figsize=(9, 8))
    plt.xlabel(key + " Threshold Privileged", fontsize=16)
    plt.ylabel(key + " Threshold Unprivileged", fontsize=16)
    plt.xlim(np.min(th_a), np.max(th_a))
    plt.ylim(np.min(th_b), np.max(th_b))

    # Performance contour
    bal_acc_lns = plt.contourf(th_a, th_b, perf, levels=20)

    # Performance colorbar
    cbar = plt.colorbar(bal_acc_lns)
    cbar.set_label("Model Performance (" + perf_metric_name + ")", fontsize=14)

    # Fairness contour - completely separate from other plotting operations
    has_fairness_contour = False
    try:
        # Store the contour object specifically
        fairness_contour = plt.contour(th_a, th_b, fair, colors="white", levels=10)

        # Only try to label if contours were created
        if fairness_contour.collections:
            plt.clabel(fairness_contour, inline=1, fmt="%1.2f", fontsize=14)
            has_fairness_contour = True
    except Exception:
        # Catch any exception that might occur during contour creation or labeling
        pass

    # Calculate best points
    idx1 = np.unravel_index(perf.argmax(), perf.shape)
    best_th_a, best_th_b = th_a[idx1[1]], th_b[idx1[0]]

    # Handle constrained points
    constrained_bal_acc = np.copy(perf)
    try:
        constrained_bal_acc[np.where(fair <= -0.000)] = 0
    except Exception:
        # If fair array has issues, just use the unconstrained version
        pass

    # Only calculate constrained best point if there are valid points
    has_constrained_point = np.max(constrained_bal_acc) > 0
    if has_constrained_point:
        idx2 = np.unravel_index(constrained_bal_acc.argmax(), constrained_bal_acc.shape)
        best_con_th_a, best_con_th_b = th_a[idx2[1]], th_b[idx2[0]]

    # Plot the points
    plt.scatter(best_th_a, best_th_b, c="b", marker="d", s=100, zorder=2)
    plt.scatter(best_th, best_th, c="r", marker="x", s=100, zorder=2)

    if has_constrained_point:
        plt.scatter(best_con_th_a, best_con_th_b, c="purple", marker="*", s=100, zorder=2)

    # Create legend manually with plt.Line2D objects
    legend_elements = [
        plt.Line2D(
            [0], [0], marker="d", color="w", markerfacecolor="b", markersize=10, label="max " + perf_metric_name
        ),
        plt.Line2D(
            [0], [0], marker="x", color="w", markerfacecolor="r", markersize=10, label="single TH " + perf_metric_name
        ),
    ]

    if has_constrained_point:
        legend_elements.append(
            plt.Line2D(
                [0],
                [0],
                marker="*",
                color="w",
                markerfacecolor="purple",
                markersize=10,
                label=fair_metric_name + " " + perf_metric_name,
            )
        )

    if has_fairness_contour:
        # Create a white line for fairness contour in the legend
        legend_elements.append(plt.Line2D([0], [0], color="white", lw=2, label=fair_metric_name))

    # Create legend with custom elements
    lgnd = plt.legend(handles=legend_elements, framealpha=0.3, facecolor="black", fontsize=12, loc="upper right")

    # Set legend text color
    for text in lgnd.get_texts():
        text.set_color("white")

    # Save and close
    filename = zf_name + "_" + "featureTradeoffContourMap" + "_" + key + ".png"
    plt.savefig(filename)
    plt.close()

    return filename


def plot_permutation_importance(zf_name, feature_score_list, title=None, footnote=None):
    """Plot permutation importance chart."""
    features = []
    importance = []
    for feature_score in feature_score_list:
        features.append(feature_score["feature"])
        importance.append(feature_score["score"])
    features = list(reversed(features))  # Ensure features and importance are in the same order
    importance = list(reversed(importance))
    plt.figure(figsize=(15, 10))
    plt.xticks(fontsize=18)
    plt.yticks(fontsize=18)
    plt.xlabel("Percentage Importance", fontsize=22)
    plt.ylabel("Features", fontsize=22)
    if title is not None:
        plt.title(title, fontsize=28, fontweight="bold")
    if footnote is not None:
        plt.figtext(0.5, 0.01, footnote, ha="right", fontsize=18)

    plt.barh(features, importance, color="#437694")
    filename = zf_name + "_permutationImportance.png"
    plt.savefig(filename)
    plt.close()
    return filename


def plot_waterfall(zf_name, model_id, local_interpretability_id, local_interpretability):
    """Plot waterfall chart for local interpretability."""
    efx = local_interpretability["efx"]
    fx = local_interpretability["fx"]

    feature_info_list = local_interpretability["feature_info"]
    feature_names = np.array([j["Feature_name"] for j in feature_info_list])
    shap_values = np.array([j["Shap"] for j in feature_info_list])
    feature_values = np.array(
        [j["Value"] if j["Value"] != "" and j["Value"] is not None else np.nan for j in feature_info_list]
    )

    txt = zf_name + "_waterfall_{model_id:d}_{local_interpretability_id:d}.png"
    waterfall_filename = txt.format(model_id=model_id, local_interpretability_id=local_interpretability_id)

    waterfall(efx, fx, shap_values, feature_values, feature_names, waterfall_filename, max_display=10, show=False)
    return waterfall_filename


def generate_veritas_images(jsonObject: Dict[str, Any], output_dir: Path) -> tuple[List[str], Dict[str, Any]]:
    """
    Generate images from Veritas JSON data and save them to output directory.

    Parameters
    ----------
    jsonObject : Dict[str, Any]
        Veritas model artifact data
    output_dir : Path
        Directory to save images

    Returns
    -------
    tuple[List[str], Dict[str, Any]]
        - List of image file paths
        - Dictionary with report_plots structure to be added to the JSON output
    """
    # Create images directory
    image_dir = output_dir / "images"
    image_dir.mkdir(exist_ok=True)

    # Path prefix for image files
    image_prefix = str(image_dir / "veritas")

    # Create a dictionary to store image paths by category
    image_files = {
        "fairness": {
            "report_plots": {
                "calibration": [],
                "correlation": [],
                "distribution": [],
                "confusion_matrix": [],
                "performance": [],
                "features": {},
            }
        },
        "transparency": {"report_plots": {"permutation_importance": [], "waterfall": []}},
    }

    # Create a dictionary for the output JSON structure
    report_plots_structure = {
        "fairness": {
            "report_plots": {
                "calibration": [],
                "correlation": [],
                "distribution": [],
                "confusion_matrix": [],
                "performance": [],
                "features": {},
            }
        },
        "transparency": {"report_plots": {"permutation_importance": [], "waterfall": []}},
    }

    fairness = jsonObject.get("fairness", {})
    transparency = jsonObject.get("transparency", {})

    if not fairness:
        return []  # Return empty list if there's no fairness data

    fairness_init = fairness.get("fairness_init", {})
    fair_metric_name = fairness_init.get("fair_metric_name", "")
    perf_metric_name = fairness_init.get("perf_metric_name", "")
    fair_metric_name = re.sub("_", " ", fair_metric_name)
    perf_metric_name = re.sub("_", " ", perf_metric_name)

    # Process calibration curve
    calibration_curve = fairness.get("calibration_curve")
    if calibration_curve:
        img_path = plot_calibration(calibration_curve["prob_true"], calibration_curve["prob_pred"], image_prefix)
        if img_path:
            image_files["fairness"]["report_plots"]["calibration"].append(img_path)
            # Store relative path for the report_plots structure
            relative_path = str(Path(img_path).relative_to(output_dir))
            report_plots_structure["fairness"]["report_plots"]["calibration"].append(relative_path)

    # Process correlation matrix
    correlation_matrix = fairness.get("correlation_matrix")
    if correlation_matrix:
        img_path = plot_heatmap(correlation_matrix["corr_values"], correlation_matrix["feature_names"], image_prefix)
        if img_path:
            image_files["fairness"]["report_plots"]["correlation"].append(img_path)
            relative_path = str(Path(img_path).relative_to(output_dir))
            report_plots_structure["fairness"]["report_plots"]["correlation"].append(relative_path)

    # Process class distribution
    class_distribution = fairness.get("class_distribution")
    if class_distribution:
        class_distribution_list = []
        class_distribution_label = []
        for key in class_distribution:
            class_distribution_list.append(class_distribution[key])
            class_distribution_label.append(key)
        img_path = plot_piechart(class_distribution_list, class_distribution_label, image_prefix, None)
        if img_path:
            image_files["fairness"]["report_plots"]["distribution"].append(img_path)
            relative_path = str(Path(img_path).relative_to(output_dir))
            report_plots_structure["fairness"]["report_plots"]["distribution"].append(relative_path)

    # Process weighted confusion matrix
    weighted_confusion_matrix = fairness.get("weighted_confusion_matrix")
    if weighted_confusion_matrix:
        img_path = plot_weighted_confusion_matrix(
            weighted_confusion_matrix, ["Negative", "Positive"], ["Negative", "Positive"], image_prefix
        )
        if img_path:
            image_files["fairness"]["report_plots"]["confusion_matrix"].append(img_path)
            relative_path = str(Path(img_path).relative_to(output_dir))
            report_plots_structure["fairness"]["report_plots"]["confusion_matrix"].append(relative_path)

    # Process performance dynamics
    perf_dynamic = fairness.get("perf_dynamic")
    if perf_dynamic:
        img_path = plot_perf_dynamic(
            perf_dynamic["threshold"], perf_dynamic["perf"], perf_dynamic["selection_rate"], image_prefix
        )
        if img_path:
            image_files["fairness"]["report_plots"]["performance"].append(img_path)
            relative_path = str(Path(img_path).relative_to(output_dir))
            report_plots_structure["fairness"]["report_plots"]["performance"].append(relative_path)

    # Process features
    features_dict = fairness.get("features")
    if features_dict:
        for key in features_dict:
            feature = features_dict[key]

            # Initialize feature entry in the dictionary
            if key not in image_files["fairness"]["report_plots"]["features"]:
                image_files["fairness"]["report_plots"]["features"][key] = {"distribution": [], "tradeoff": []}

            # Initialize feature entry in the report_plots structure
            if key not in report_plots_structure["fairness"]["report_plots"]["features"]:
                report_plots_structure["fairness"]["report_plots"]["features"][key] = {
                    "distribution": [],
                    "tradeoff": [],
                }

            # Plot feature distribution
            feature_distribution = feature.get("feature_distribution")
            if feature_distribution:
                feature_distribution_list = []
                feature_distribution_label = []
                for k in feature_distribution:
                    feature_distribution_list.append(feature_distribution[k])
                    feature_distribution_label.append(k)

                img_path = plot_piechart(feature_distribution_list, feature_distribution_label, image_prefix, key)
                if img_path:
                    image_files["fairness"]["report_plots"]["features"][key]["distribution"].append(img_path)
                    relative_path = str(Path(img_path).relative_to(output_dir))
                    report_plots_structure["fairness"]["report_plots"]["features"][key]["distribution"].append(
                        relative_path
                    )

            # Plot tradeoff contour
            tradeoff = feature.get("tradeoff")
            if tradeoff:
                fair_metric_name = tradeoff.get("fair_metric_name", "")
                perf_metric_name = tradeoff.get("perf_metric_name", "")
                fair_metric_name = re.sub("_", " ", fair_metric_name)
                perf_metric_name = re.sub("_", " ", perf_metric_name)

                th_a = tradeoff.get("th_x")
                th_b = tradeoff.get("th_y")
                perf = np.array(tradeoff.get("perf", []))
                fair = np.array(tradeoff.get("fair", []))
                best_th = tradeoff.get("max_perf_single_th", [0])[0]

                if th_a and th_b and perf.size > 0 and fair.size > 0:
                    img_path = plot_contour(
                        image_prefix, key, fair_metric_name, perf_metric_name, th_a, th_b, perf, fair, best_th
                    )
                    if img_path:
                        image_files["fairness"]["report_plots"]["features"][key]["tradeoff"].append(img_path)
                        relative_path = str(Path(img_path).relative_to(output_dir))
                        report_plots_structure["fairness"]["report_plots"]["features"][key]["tradeoff"].append(
                            relative_path
                        )

    # Process transparency
    if transparency:
        # Plot permutation importance
        permutation = transparency.get("permutation")
        if permutation and permutation.get("score"):
            img_path = plot_permutation_importance(
                image_prefix, permutation["score"], permutation.get("title"), permutation.get("footnote")
            )
            if img_path:
                image_files["transparency"]["report_plots"]["permutation_importance"].append(img_path)
                relative_path = str(Path(img_path).relative_to(output_dir))
                report_plots_structure["transparency"]["report_plots"]["permutation_importance"].append(relative_path)

        # Plot waterfall charts
        model_list = transparency.get("model_list", [])
        for model in model_list:
            for local_interpretability in model.get("local_interpretability", []):
                img_path = plot_waterfall(
                    image_prefix, model["id"], local_interpretability["id"], local_interpretability
                )
                if img_path:
                    image_files["transparency"]["report_plots"]["waterfall"].append(img_path)
                    relative_path = str(Path(img_path).relative_to(output_dir))
                    report_plots_structure["transparency"]["report_plots"]["waterfall"].append(relative_path)

    # Flatten the nested dictionary and convert image paths to be relative to output_dir
    flattened_image_files = []

    # Add fairness images
    for category in image_files["fairness"]["report_plots"]:
        if category == "features":
            for feature_key, feature_data in image_files["fairness"]["report_plots"]["features"].items():
                for subcategory in feature_data:
                    for path in feature_data[subcategory]:
                        flattened_image_files.append(str(Path(path).relative_to(output_dir)))
        else:
            for path in image_files["fairness"]["report_plots"][category]:
                flattened_image_files.append(str(Path(path).relative_to(output_dir)))

    # Add transparency images
    for category in image_files["transparency"]["report_plots"]:
        for path in image_files["transparency"]["report_plots"][category]:
            flattened_image_files.append(str(Path(path).relative_to(output_dir)))

    return flattened_image_files, report_plots_structure
