# Core Packages
import json
import os
import re
import sys
import zipfile

# Third Party
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

from waterfall import waterfall


# plot perf_dynamic
def plot_perf_dynamic(threshold, perf, selection_rate, zf_name):
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
    image_file_list.append(filename)
    plt.close()


# plot piechart
def plot_piechart(data1, label, zf_name, key):
    plt.figure(figsize=(6, 6))
    cmap = sns.diverging_palette(220, 10, as_cmap=True)
    plt.pie(
        data1,
        textprops={"fontsize": 14, "color": "black"},
        # explode=[0.02, 0.02],
        explode=None,
        normalize=True,
        labels=label,
        # colors=['#437694', '#D7E5ED'],
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
    image_file_list.append(filename)


# Calibration curve
def plot_calibration(bin_true_prob, bin_pred_prob, zf_name):
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
    image_file_list.append(filename)


# plot heatmap
def plot_heatmap(corr_values, feature_names, zf_name):
    plt.figure(figsize=(9, 8))
    ax = sns.heatmap(
        corr_values, vmin=-1, vmax=1, center=0, cmap=sns.diverging_palette(20, 220, n=200), square=True, annot=True
    )
    ax.set_xticklabels(feature_names, rotation=45, horizontalalignment="right")
    ax.set_yticklabels(feature_names, rotation=0, horizontalalignment="right")
    filename = zf_name + "_" + "correlationHeatMapChart" + ".png"
    plt.savefig(filename)
    plt.close()
    image_file_list.append(filename)


# plot heatmap
def plot_weighted_confusion_matrix(matrix, name1, name2, zf_name):
    if matrix is None:
        return
    else:
        if matrix["tn"] is None or matrix["fp"] or matrix["fn"] is None or matrix["tp"] is None:
            return

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
    print(str(matrix))
    print("values: ---------- ", str(weighted_confusion_matrix_list))
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
    image_file_list.append(filename)


# Plot contour
def plot_contour(zf_name, key, fair_metric_name, perf_metric_name):
    plt.figure(figsize=(9, 8))
    #     plt.title('Fairness vs. Performance Tradeoffs', fontsize=18)
    plt.xlabel(key + " Threshold Privileged", fontsize=16)
    plt.ylabel(key + " Threshold Unprivileged", fontsize=16)
    plt.xlim(np.min(th_a), np.max(th_a))
    plt.ylim(np.min(th_b), np.max(th_b))

    bal_acc_lns = plt.contourf(th_a, th_b, perf, levels=20)  # gender_metrics_split_sweep.bal_acc => perf

    eo_lns = plt.contour(th_a, th_b, fair, colors="white", levels=10)  # gender_metrics_split_sweep.equal_opp => fair
    eo_lns.collections[-1].set_label(fair_metric_name)

    cbar = plt.colorbar(bal_acc_lns)
    cbar.set_label("Model Performance (" + perf_metric_name + ")", fontsize=14)
    plt.clabel(eo_lns, inline=1, fmt="%1.2f", fontsize=14)

    idx1 = np.unravel_index(perf.argmax(), perf.shape)
    best_th_a, best_th_b = th_a[idx1[1]], th_b[idx1[0]]

    constrained_bal_acc = np.copy(perf)
    constrained_bal_acc[np.where(fair <= -0.000)] = 0
    idx2 = np.unravel_index(constrained_bal_acc.argmax(), constrained_bal_acc.shape)
    best_con_th_a, best_con_th_b = th_a[idx1[1]], th_b[idx1[0]]
    best_con_th_a, best_con_th_b = th_a[idx2[1]], th_b[idx2[0]]
    # Mark maximums
    # plt.plot([0, 1], [0, 1], c='gray', ls=':', label='single threshold')
    plt.scatter(best_th_a, best_th_b, c="b", marker="d", s=100, label="max" + " " + perf_metric_name, zorder=2)
    plt.scatter(best_th, best_th, c="r", marker="x", s=100, label="single TH" + " " + perf_metric_name, zorder=2)
    plt.scatter(
        best_con_th_a,
        best_con_th_b,
        c="purple",
        marker="*",
        s=100,
        label=fair_metric_name + " " + perf_metric_name,
        zorder=2,
    )
    lgnd = plt.legend(framealpha=0.3, facecolor="black", fontsize=12, loc="upper right")
    for text in lgnd.get_texts():
        text.set_color("white")
    filename = zf_name + "_" + "featureTradeoffContourMap" + "_" + key + ".png"
    plt.savefig(filename)
    plt.close()
    image_file_list.append(filename)


def plot_permutation_importance(zf_name, feature_score_list, title=None, footnote=None):
    features = []
    importance = []
    for feature_score in feature_score_list:
        features.append(feature_score["feature"])
        importance.append(feature_score["score"])
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
    image_file_list.append(filename)


def plot_waterfall(zf_name, model_id, local_interpretability_id, local_interpretability):
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
    image_file_list.append(waterfall_filename)


############################ begin ############################

image_file_list = []

# load JSON file
filename = sys.argv[1]
with zipfile.ZipFile(filename, "r") as zf:
    jsonObject = json.load(zf.open(zf.namelist()[0]))
    image_dir = os.path.dirname(os.path.dirname(zf.filename)) + "/image/"
    basename = os.path.basename(zf.filename).split(".")[0]
    image_prefix = image_dir + basename
    zf_name = image_prefix

fairness = jsonObject["fairness"]
transparency = jsonObject["transparency"]


fairness_init = fairness["fairness_init"]
fair_metric_name = fairness_init["fair_metric_name"]
perf_metric_name = fairness_init["perf_metric_name"]
fair_metric_name = re.sub("_", " ", fair_metric_name)
perf_metric_name = re.sub("_", " ", perf_metric_name)

calibration_curve = fairness["calibration_curve"]
correlation_matrix = fairness["correlation_matrix"]
class_distribution = fairness["class_distribution"]
class_distribution_list = []
class_distribution_label = []
if class_distribution is not None:
    for key in class_distribution:
        class_distribution_list.append(class_distribution[key])
        class_distribution_label.append(key)
weighted_confusion_matrix = fairness["weighted_confusion_matrix"]

plot_weighted_confusion_matrix(weighted_confusion_matrix, ["Negative", "Positive"], ["Negative", "Positive"], zf_name)
perf_dynamic = fairness["perf_dynamic"]
# plot_weighted_confusion_matrix(weighted_confusion_matrix_list, ['Negative', 'Positive'], ['Negative', 'Positive'], zf_name)

# plot class distribution
plot_piechart(class_distribution_list, class_distribution_label, zf_name, None)

# plot calibration
if calibration_curve:
    plot_calibration(calibration_curve["prob_true"], calibration_curve["prob_pred"], zf_name)

# plot corr_values heatmap
if correlation_matrix:
    plot_heatmap(correlation_matrix["corr_values"], correlation_matrix["feature_names"], zf_name)

# plot perf dynamic
if perf_dynamic is not None:
    plot_perf_dynamic(perf_dynamic["threshold"], perf_dynamic["perf"], perf_dynamic["selection_rate"], zf_name)
# features
features_dict = fairness["features"]
if features_dict is not None:
    for key in features_dict:
        feature = features_dict[key]
        tradeoff = feature["tradeoff"]
        if tradeoff is None:
            continue
        fair_metric_name = tradeoff["fair_metric_name"]
        perf_metric_name = tradeoff["perf_metric_name"]
        fair_metric_name = re.sub("_", " ", fair_metric_name)
        perf_metric_name = re.sub("_", " ", perf_metric_name)
        th_a = tradeoff["th_x"]
        th_b = tradeoff["th_y"]
        perf = np.array(tradeoff["perf"])
        fair = np.array(tradeoff["fair"])
        best_th = tradeoff["max_perf_single_th"][0]
        feature_distribution_list = []
        feature_distribution_label = []
        for k in feature["feature_distribution"]:
            feature_distribution_list.append(features_dict[key]["feature_distribution"][k])
            feature_distribution_label.append(k)
        # plot feature_distribution
        plot_piechart(feature_distribution_list, feature_distribution_label, zf_name, key)
        # plot contour
        # plot_contour(zf_name, key, fair_metric_name, perf_metric_name)

# transparency
if transparency is not None:
    permutation = transparency["permutation"]
    if permutation is not None and permutation["score"] is not None:
        plot_permutation_importance(zf_name, permutation["score"], permutation["title"], permutation["footnote"])

    model_list = transparency["model_list"]
    seq = 0
    for model in model_list:
        for local_interpretability in model["local_interpretability"]:
            plot_waterfall(zf_name, model["id"], local_interpretability["id"], local_interpretability)
            seq += 1

print(json.dumps(image_file_list))
