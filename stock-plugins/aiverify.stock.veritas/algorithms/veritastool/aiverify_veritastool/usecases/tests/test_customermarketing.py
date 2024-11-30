import os
import pickle
import sys

import numpy as np
import pandas as pd

project_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
sys.path.insert(0, project_root)
import pytest
from veritastool.metrics.fairness_metrics import FairnessMetrics
from veritastool.metrics.performance_metrics import PerformanceMetrics
from veritastool.model.model_container import ModelContainer
from veritastool.principles.fairness import Fairness
from veritastool.usecases.customer_marketing import CustomerMarketing
from veritastool.util.errors import MyError

module_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../../../veritastool/examples/customer_marketing_example",
    )
)
sys.path.append(module_path)
import selection
import uplift
import util

# Load Credit Scoring Test Data
file_prop = os.path.join(
    project_root, "veritastool", "examples", "data", "mktg_uplift_acq_dict.pickle"
)
file_rej = os.path.join(
    project_root, "veritastool", "examples", "data", "mktg_uplift_rej_dict.pickle"
)
input_prop = open(file_prop, "rb")
input_rej = open(file_rej, "rb")
cm_prop = pickle.load(input_prop)
cm_rej = pickle.load(input_rej)

# Model Container Parameters
# Rejection Model
y_true_rej = cm_rej["y_test"]
y_pred_rej = cm_rej["y_test"]
y_train_rej = cm_rej["y_train"]
p_grp_rej = {"isforeign": [0], "isfemale": [0], "isforeign|isfemale": "maj_rest"}
x_train_rej = cm_rej["X_train"].drop(["ID"], axis=1)
x_test_rej = cm_rej["X_test"].drop(["ID"], axis=1)
y_prob_rej = pd.DataFrame(cm_rej["y_prob"], columns=["CN", "CR", "TN", "TR"])
data = {
    "FEATURE": ["income", "noproducts", "didrespond", "age", "isfemale", "isforeign"],
    "VALUE": [0.3, 0.2, 0.15, 0.1, 0.05, 0.03],
}

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
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="significant",
    perf_metric_name="expected_profit",
    fair_metric_name="auto",
    revenue=PROFIT_RESPOND,
    treatment_cost=COST_TREATMENT,
    tran_row_num=[20, 40],
    tran_max_sample=10,
    tran_pdp_feature=["age", "income"],
    tran_pdp_target="CR",
    tran_max_display=6,
    fair_is_pos_label_fav=False,
)
# cm_uplift_obj.k = 1


def test_check_input():
    cm_uplift_obj._model_type_to_metric_lookup[
        cm_uplift_obj.model_params[0].model_type
    ] = ("uplift", 4, 4)
    with pytest.raises(MyError) as toolkit_exit:
        cm_uplift_obj._check_input()
    assert toolkit_exit.type == MyError

    cm_uplift_obj._model_type_to_metric_lookup[
        cm_uplift_obj.model_params[0].model_type
    ] = ("uplift", 4, 2)
    # cm_uplift_obj.model_params[0].y_prob = None
    # with pytest.raises(MyError) as toolkit_exit:
    #     cm_uplift_obj._check_input()
    # assert toolkit_exit.type == MyError

    # cm_uplift_obj.model_params[0].model_type = 'uplift'
    # with pytest.raises(MyError) as toolkit_exit:
    #     cm_uplift_obj._check_input()
    # assert toolkit_exit.type == MyError

    cm_uplift_obj.model_params[0].model_type = "uplift"
    cm_uplift_obj.spl_params = {"revenue": "190", "treatment_cost": 20}
    with pytest.raises(MyError) as toolkit_exit:
        cm_uplift_obj._check_input()
    assert toolkit_exit.type == MyError

    cm_uplift_obj.spl_params = {"revenue": -190, "treatment_cost": 20}
    with pytest.raises(MyError) as toolkit_exit:
        cm_uplift_obj._check_input()
    assert toolkit_exit.type == MyError

    cm_uplift_obj.spl_params = {"revenue": 10, "treatment_cost": 20}
    with pytest.raises(MyError) as toolkit_exit:
        cm_uplift_obj._check_input()
    assert toolkit_exit.type == MyError


def test_get_confusion_matrix():
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
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="significant",
        perf_metric_name="expected_profit",
        fair_metric_name="auto",
        revenue=PROFIT_RESPOND,
        treatment_cost=COST_TREATMENT,
        tran_row_num=[20, 40],
        tran_max_sample=10,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
        fair_is_pos_label_fav=False,
    )
    # Model Container Parameters
    y_true_reshape = np.array(cm_uplift_obj.model_params[0].y_true).reshape(1, 1, -1)
    y_pred_reshape = np.array(cm_uplift_obj.model_params[0].y_pred).reshape(1, 1, -1)

    result = cm_uplift_obj._get_confusion_matrix_optimized(y_true_reshape, None, None)
    assert len(result) == 4
    assert np.all(np.equal(result[0], None))

    # cm_uplift_obj._model_type_to_metric_lookup[cm_uplift_obj.model_params[0].model_type] = ('classification', 2, 1)
    # result = cm_uplift_obj._get_confusion_matrix_optimized(y_true,y_pred, sample_weight = np.array([0.7 for x in range(len(y_pred))]))
    # assert result == (354.8999999999967, 42.700000000000024, 57.400000000000084, 70.00000000000013)

    result = cm_uplift_obj._get_confusion_matrix_optimized(
        y_true_reshape, None, None, curr_p_var="isforeign"
    )
    assert len(result) == 8
    assert np.all(np.equal(result[0], None))


def test_select_fairness_metric_name():
    # cm_uplift_obj.fair_metric_name = 'auto'
    # cm_uplift_obj.model_params[0].model_type = 'propensity'
    # cm_uplift_obj._select_fairness_metric_name()
    # assert cm_uplift_obj.fair_metric_name == 'ppv_parity'

    cm_uplift_obj.fair_metric_name = "disparate_impact"
    cm_uplift_obj._select_fairness_metric_name()
    assert cm_uplift_obj.fair_metric_name == "disparate_impact"

    cm_uplift_obj.fair_metric_name = "auto"
    cm_uplift_obj.model_params[0].model_type = "classification"
    cm_uplift_obj._select_fairness_metric_name()
    assert cm_uplift_obj.fair_metric_name == "npv_parity"

    # cm_uplift_obj.model_params[0].model_type = 'uplift'
    # cm_uplift_obj.fair_metric_name = 'mi_independence'
    # with pytest.raises(MyError) as toolkit_exit:
    # cm_uplift_obj._select_fairness_metric_name()
    # assert toolkit_exit.type == MyError


def test_get_e_lift():
    cm_uplift_obj.model_params[0].model_type = "classification"
    result = cm_uplift_obj._get_e_lift()
    assert result is None


def test_compute_pred_outcome():
    cm_uplift_obj.model_params[0].model_type = "classification"
    result = cm_uplift_obj._compute_pred_outcome(y_pred_new=None)
    assert result is None

    cm_uplift_obj.model_params[0].model_type = "uplift"
    result = cm_uplift_obj._compute_pred_outcome(y_pred_new=[None, None])
    assert result is None
