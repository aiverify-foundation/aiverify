import os
import pickle
import sys
from copy import deepcopy

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from tqdm.auto import tqdm

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)
from aiverify_veritastool.config.constants import Constants
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.metrics.performance_metrics import PerformanceMetrics
from aiverify_veritastool.metrics.tradeoff import TradeoffRate
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.usecases.credit_scoring import CreditScoring
from aiverify_veritastool.usecases.customer_marketing import CustomerMarketing
from aiverify_veritastool.util.utility import check_datatype, check_value


module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))
sys.path.append(module_path)
import selection
import uplift
import util

bins = Constants().tradeoff_threshold_bins

# Load Credit Scoring Test Data
file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'credit_score_dict.pickle')
input_file = open(file, "rb")
cs = pickle.load(input_file)
input_file.close()

# Reduce into two classes
cs["X_train"]["MARRIAGE"] = cs["X_train"]["MARRIAGE"].replace([0, 3], 1)
cs["X_test"]["MARRIAGE"] = cs["X_test"]["MARRIAGE"].replace([0, 3], 1)
# Model Contariner Parameters
y_true = np.array(cs["y_test"])
y_pred = np.array(cs["y_pred"])
y_train = np.array(cs["y_train"])
p_grp = {"SEX": [1], "MARRIAGE": [1]}
up_grp = {"SEX": [2], "MARRIAGE": [2]}
x_train = cs["X_train"]
x_test = cs["X_test"]
model_name = "credit_scoring"
model_type = "classification"
y_prob = cs["y_prob"]

model_obj = LogisticRegression(C=0.1)
model_obj.fit(x_train, y_train)


# Create Model Container
container = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_prob,
    y_train,
    x_train=x_train,
    x_test=x_test,
    model_object=model_obj,
    up_grp=up_grp,
)
# Create Use Case Object
cre_sco_obj = CreditScoring(
    model_params=[container],
    fair_threshold=0.43,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="significant",
    perf_metric_name="accuracy",
    fair_metric_name="disparate_impact",
    fair_metric_type="ratio",
    tran_row_num=[20, 40],
    tran_max_sample=10,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=10,
)

tradeoff_obj = TradeoffRate(cre_sco_obj)
tradeoff_obj.sigma = 0
tradeoff_obj.compute_tradeoff(n_threads=2, tdff_pbar=tqdm(total=85))


def test_tradeoff():
    cre_sco_obj_copy = deepcopy(cre_sco_obj)
    cre_sco_obj_copy.fair_neutral_tolerance = 0.000001
    cre_sco_obj_copy.tradeoff(output=False, n_threads=4)
    assert cre_sco_obj_copy.tradeoff_status == 1


def test_cs_TradeoffRate():
    f_cre_sco_obj = deepcopy(cre_sco_obj)
    f_cre_sco_obj.fair_metric_name = "log_loss_parity"
    f_cre_sco_obj.fair_metric_type = "difference"
    assert TradeoffRate(f_cre_sco_obj) is not None


def test_compute_tradeoff():
    f_tradeoff_obj = deepcopy(tradeoff_obj)
    f_tradeoff_obj.sample_weight = np.random.choice(10, 7500, replace=True)
    f_tradeoff_obj.compute_tradeoff(n_threads=2, tdff_pbar=tqdm(total=85))
    assert type(f_tradeoff_obj.result) == dict
    assert set(f_tradeoff_obj.result.keys()) == {"SEX", "MARRIAGE"}
    assert set(f_tradeoff_obj.result["SEX"].keys()) == {
        "fair_metric_name",
        "perf_metric_name",
        "fair",
        "perf",
        "th_x",
        "th_y",
        "max_perf_point",
        "max_perf_single_th",
        "max_perf_neutral_fair",
    }
    assert f_tradeoff_obj.result["SEX"]["fair_metric_name"] == "disparate_impact"
    assert f_tradeoff_obj.result["SEX"]["perf_metric_name"] == "balanced_acc"

    assert f_tradeoff_obj.result["SEX"]["fair"].shape == (bins, bins)
    assert f_tradeoff_obj.result["SEX"]["perf"].shape == (bins, bins)
    assert f_tradeoff_obj.result["SEX"]["th_x"].shape == (bins,)
    assert f_tradeoff_obj.result["SEX"]["th_y"].shape == (bins,)

    min_th = Constants().classify_min_threshold
    max_th = Constants().classify_max_threshold
    assert f_tradeoff_obj.result["SEX"]["th_x"].min() == min_th
    assert f_tradeoff_obj.result["SEX"]["th_x"].max() == max_th
    assert f_tradeoff_obj.result["SEX"]["th_y"].min() == min_th
    assert f_tradeoff_obj.result["SEX"]["th_y"].max() == max_th


def test_compute_max_perf():
    perf_values = tradeoff_obj.result["SEX"]["perf"]
    fair_values = tradeoff_obj.result["SEX"]["fair"]
    best_th1, best_th2, best_th3 = TradeoffRate._compute_max_perf(
        tradeoff_obj, perf_values, fair_values
    )

    assert len(best_th1) == 3
    assert abs(best_th1[0] - 0.4458917835671342) <= 0.008
    assert abs(best_th1[1] - 0.4458917835671342) <= 0.008
    assert abs(best_th1[2] - 0.673503351932726) <= 0.008

    assert len(best_th2) == 3
    assert abs(best_th2[0] - 0.4314629258517033) <= 0.008
    assert abs(best_th2[1] - 0.4218436873747495) <= 0.008
    assert abs(best_th2[2] - 0.6878432284510114) <= 0.008

    assert len(best_th3) == 3
    assert abs(best_th3[0] - 0.4042084168336673) <= 0.008
    assert abs(best_th3[1] - 0.4434869739478957) <= 0.008
    assert abs(best_th3[2] - 0.6831016376940576) <= 0.008


def test_compute_bal_accuracy_grid():
    balanced_acc = tradeoff_obj._compute_bal_accuracy_grid()
    print("max", balanced_acc.max())
    assert balanced_acc.shape == (bins, bins)
    assert round(balanced_acc.max(), 3) == 0.688
    assert np.unravel_index(balanced_acc.argmax(), balanced_acc.shape) == (156, 173)


def test_compute_f1_grid():
    f1_score = tradeoff_obj._compute_f1_grid()
    assert f1_score.shape == (bins, bins)
    assert round(f1_score.max(), 3) == 0.888
    assert np.unravel_index(f1_score.argmax(), f1_score.shape) == (37, 47)


def test_compute_equal_opportunity_tr():
    equal_opportunity = tradeoff_obj._compute_equal_opportunity_tr()
    assert equal_opportunity.shape == (bins, bins)
    assert round(equal_opportunity.max(), 3) == 0.708
    assert np.unravel_index(equal_opportunity.argmax(), equal_opportunity.shape) == (
        499,
        0,
    )


def test_compute_disparate_impact_tr():
    disparate_impact = tradeoff_obj._compute_disparate_impact_tr()
    assert disparate_impact.shape == (bins, bins)
    assert round(disparate_impact.max(), 3) == 4.795
    assert np.unravel_index(disparate_impact.argmax(), disparate_impact.shape) == (
        0,
        499,
    )


def test_compute_demographic_parity_tr():
    demographic_parity = tradeoff_obj._compute_demographic_parity_tr()
    assert demographic_parity.shape == (bins, bins)
    assert round(demographic_parity.max(), 3) == 0.666
    assert np.unravel_index(demographic_parity.argmax(), demographic_parity.shape) == (
        499,
        0,
    )


def test_compute_false_omission_rate_parity_tr():
    for_parity = tradeoff_obj._compute_false_omission_rate_parity_tr()
    assert for_parity.shape == (bins, bins)
    assert round(for_parity.max(), 3) == 4.76
    assert np.unravel_index(for_parity.argmax(), for_parity.shape) == (499, 0)


def test_compute_false_discovery_rate_parity_tr():
    fdr_parity = tradeoff_obj._compute_false_discovery_rate_parity_tr()
    assert fdr_parity.shape == (bins, bins)
    assert round(fdr_parity.max(), 3) == 0.075
    assert np.unravel_index(fdr_parity.argmax(), fdr_parity.shape) == (497, 0)


def test_compute_positive_predictive_parity_tr():
    ppv_parity = tradeoff_obj._compute_positive_predictive_parity_tr()
    assert ppv_parity.shape == (bins, bins)
    assert round(ppv_parity.max(), 3) == 0.049
    assert np.unravel_index(ppv_parity.argmax(), ppv_parity.shape) == (0, 459)


def test_compute_negative_predictive_parity_tr():
    npv_parity = tradeoff_obj._compute_negative_predictive_parity_tr()
    assert npv_parity.shape == (bins, bins)
    assert round(npv_parity.max(), 3) == 6.961
    assert np.unravel_index(npv_parity.argmax(), npv_parity.shape) == (0, 499)


def test_compute_fnr_parity_tr():
    fnr_parity = tradeoff_obj._compute_fnr_parity_tr()
    assert fnr_parity.shape == (bins, bins)
    assert round(fnr_parity.max(), 3) == 0.738
    assert np.unravel_index(fnr_parity.argmax(), fnr_parity.shape) == (0, 499)


def test_compute_fpr_parity_tr():
    fpr_parity = tradeoff_obj._compute_fpr_parity_tr()
    assert fpr_parity.shape == (bins, bins)
    assert round(fpr_parity.max(), 3) == 0.546
    assert np.unravel_index(fpr_parity.argmax(), fpr_parity.shape) == (497, 0)


def test_compute_equalized_odds_tr():
    equal_odds = tradeoff_obj._compute_equalized_odds_tr()
    assert equal_odds.shape == (bins, bins)
    assert round(equal_odds.max(), 3) == 0.627
    assert np.unravel_index(equal_odds.argmax(), equal_odds.shape) == (499, 0)


def test_compute_calibration_by_group_tr():
    calibration_by_group = tradeoff_obj._compute_calibration_by_group_tr()
    assert calibration_by_group.shape == (bins, bins)
    assert round(calibration_by_group.max(), 3) == 2.343
    assert np.unravel_index(
        calibration_by_group.argmax(), calibration_by_group.shape
    ) == (499, 0)


def test_compute_tnr_parity_tr():
    tnr_parity_tr = tradeoff_obj._compute_tnr_parity_tr()
    assert tnr_parity_tr.shape == (bins, bins)
    assert round(tnr_parity_tr.max(), 3) == 0.595
    assert np.unravel_index(tnr_parity_tr.argmax(), tnr_parity_tr.shape) == (0, 498)


def test_compute_negative_equalized_odds_tr():
    negative_equalized_odds_tr = tradeoff_obj._compute_negative_equalized_odds_tr()
    assert negative_equalized_odds_tr.shape == (bins, bins)
    assert round(negative_equalized_odds_tr.max(), 3) == 0.667
    assert np.unravel_index(
        negative_equalized_odds_tr.argmax(), negative_equalized_odds_tr.shape
    ) == (0, 499)


# Load Phase 1-Customer Marketing Uplift Model Data, Results and Related Functions
file_prop = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle')
file_rej = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_rej_dict.pickle')
input_prop = open(file_prop, "rb")
input_rej = open(file_rej, "rb")
cm_prop = pickle.load(input_prop)
cm_rej = pickle.load(input_rej)

input_prop.close()
input_rej.close()

# Model Container Parameters
# Rejection Model
y_true_rej = cm_rej["y_test"]
y_pred_rej = cm_rej["y_test"]
y_train_rej = cm_rej["y_train"]
p_grp_rej = {"isforeign": [0], "isfemale": [0], "isforeign|isfemale": "maj_rest"}
x_train_rej = cm_rej["X_train"].drop(["ID"], axis=1)
x_test_rej = cm_rej["X_test"].drop(["ID"], axis=1)
y_prob_rej = pd.DataFrame(cm_rej["y_prob"], columns=["CN", "CR", "TN", "TR"])

# Propensity Model
y_true_prop = cm_prop["y_test"]
y_pred_prop = cm_prop["y_test"]
y_train_prop = cm_prop["y_train"]
y_prob_prop = pd.DataFrame(cm_prop["y_prob"], columns=["CN", "CR", "TN", "TR"])

PROFIT_RESPOND = 190
COST_TREATMENT = 20

model_object_rej = cm_rej["model"]
model_name_rej = "custmr_marketing"
model_type_rej = "uplift"
model_object_prop = cm_prop["model"]
model_type_prop = "uplift"

# fit the models as it's a pre-requisite for transparency analysis
model_object_rej.fit(x_train_rej, y_train_rej)
model_object_prop.fit(x_train_rej, y_train_prop)

container_rej = ModelContainer(
    y_true=y_true_rej,
    y_pred=y_pred_rej,
    y_prob=y_prob_rej,
    y_train=y_train_rej,
    p_grp=p_grp_rej,
    x_train=x_train_rej,
    x_test=x_test_rej,
    model_object=model_object_rej,
    model_name=model_name_rej,
    model_type=model_type_rej,
    pos_label=["TR", "CR"],
    neg_label=["TN", "CN"],
)

container_prop = container_rej.clone(
    y_true=y_true_prop,
    y_pred=y_pred_prop,
    y_prob=y_prob_prop,
    y_train=y_train_prop,
    model_object=model_object_prop,
    pos_label=["TR", "CR"],
    neg_label=["TN", "CN"],
)

cm_uplift_obj = CustomerMarketing(
    model_params=[container_rej, container_prop],
    fair_threshold=0.2,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="significant",
    perf_metric_name="expected_profit",
    fair_metric_name="rejected_harm",
    revenue=PROFIT_RESPOND,
    treatment_cost=COST_TREATMENT,
    tran_row_num=[20, 40],
    tran_max_sample=10,
    tran_pdp_feature=["age", "income"],
    tran_pdp_target="CR",
    tran_max_display=6,
)

cm_tradeoff_obj = TradeoffRate(cm_uplift_obj)
cm_tradeoff_obj.sigma = 0
cm_tradeoff_obj.compute_tradeoff(n_threads=2, tdff_pbar=tqdm(total=85))


def test_CM_tradeoff():
    f_cm_uplift_obj = deepcopy(cm_uplift_obj)
    f_cm_uplift_obj.perf_metric_name = "expected_selection_rate"
    f_cm_uplift_obj.tradeoff(output=False, n_threads=4)
    assert f_cm_uplift_obj.tradeoff_status == 1


def test_compute_emp_lift_tr():
    emp_lift_tr = cm_tradeoff_obj._compute_emp_lift_tr()
    assert emp_lift_tr.shape == (bins, bins)
    assert round(emp_lift_tr.max(), 3) == 0.645
    assert np.unravel_index(emp_lift_tr.argmax(), emp_lift_tr.shape) == (468, 485)
