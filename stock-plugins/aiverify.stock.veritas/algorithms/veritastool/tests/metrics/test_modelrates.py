import os
import pickle
import sys

import numpy as np
import pandas as pd

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)
from aiverify_veritastool.metrics.modelrates import ModelRateClassify, ModelRateUplift
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.usecases.customer_marketing import CustomerMarketing

module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))
sys.path.append(module_path)
import selection
import uplift
import util

# Load Credit Scoring Test Data
file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'credit_score_dict.pickle')
input_file = open(file, "rb")
cs = pickle.load(input_file)

y_true = np.array(cs["y_test"])
y_prob = cs["y_prob"]


def test_ModelRateClassify_init():
    print(len(y_true))
    print(len(y_prob))
    sample_weight = np.random.choice(10, 7500, replace=True)
    modelrate_obj = ModelRateClassify(y_true, y_prob, sample_weight=sample_weight)
    assert modelrate_obj.tpr([0.5])[0] <= 0.7 and modelrate_obj.tpr([0.5])[0] >= 0.6
    assert modelrate_obj.fpr([0.5])[0] <= 0.37 and modelrate_obj.fpr([0.5])[0] >= 0.30
    assert modelrate_obj.ppv([0.5])[0] <= 0.92 and modelrate_obj.ppv([0.5])[0] >= 0.82
    assert modelrate_obj.forr([0.5])[0] <= 2 and modelrate_obj.forr([0.5])[0] >= 1.75
    assert (
        modelrate_obj.selection_rate([0.5])[0] <= 0.65
        and modelrate_obj.selection_rate([0.5])[0] >= 0.5
    )
    assert (
        round(modelrate_obj.base_selection_rate, 2) <= 0.79
        and round(modelrate_obj.base_selection_rate, 2) >= 0.77
    )


def test_compute_rates():
    ModelRateClassify.compute_rates(y_true, y_prob, sample_weight=None)
    (
        ths,
        tpr,
        fpr,
        ppv,
        forr,
        base_selection_rate,
        selection_rate,
    ) = ModelRateClassify.compute_rates(y_true, y_prob, sample_weight=None)

    assert ths.shape == (2174,)
    assert tpr.shape == (2174,)
    assert round(tpr.mean(), 3) == 0.642
    assert fpr.shape == (2174,)
    assert round(fpr.mean(), 3) == 0.403
    assert ppv.shape == (2174,)
    assert round(ppv.mean(), 3) == 0.863
    assert forr.shape == (2174,)
    assert round(forr.mean(), 3) == 9.395
    assert base_selection_rate == 0.7788
    assert selection_rate.shape == (2174,)
    assert round(selection_rate.mean(), 3) == 0.589


def test_ModelRateUplift_init():
    # Load Phase 1-Customer Marketing Uplift Model Data, Results and Related Functions
    file_prop = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle')
    file_rej = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_rej_dict.pickle')
    input_prop = open(file_prop, "rb")
    input_rej = open(file_rej, "rb")
    cm_prop = pickle.load(input_prop)
    cm_rej = pickle.load(input_rej)
    # Model Container Parameters
    # Rejection Model
    y_true_rej = cm_rej["y_test"]
    y_pred_rej = cm_rej["y_test"]
    y_train_rej = cm_rej["y_train"]
    p_grp_rej = {"isforeign": [0], "isfemale": [0]}
    x_train_rej = cm_rej["X_train"].drop(["ID"], axis=1)
    x_test_rej = cm_rej["X_test"].drop(["ID"], axis=1)
    y_prob_rej = pd.DataFrame(cm_rej["y_prob"], columns=["CN", "CR", "TN", "TR"])
    data = {
        "FEATURE": [
            "income",
            "noproducts",
            "didrespond",
            "age",
            "isfemale",
            "isforeign",
        ],
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
        predict_op_name="predict_proba",
    )

    container_prop = container_rej.clone(
        y_true=y_true_prop,
        y_pred=y_pred_prop,
        y_prob=y_prob_prop,
        y_train=y_train_prop,
        model_object=model_object_prop,
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
        predict_op_name="predict_proba",
    )

    cm_uplift_obj = CustomerMarketing(
        model_params=[container_rej, container_prop],
        fair_threshold=0.2,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="significant",
        perf_metric_name="expected_profit",
        revenue=PROFIT_RESPOND,
        treatment_cost=COST_TREATMENT,
        tran_row_num=[20, 40],
        tran_max_sample=10,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
    )

    modelrateuplift_obj = ModelRateUplift(
        [model.y_true for model in cm_uplift_obj.model_params],
        cm_uplift_obj.pred_outcome,
        cm_uplift_obj.e_lift,
        cm_uplift_obj.feature_mask["isforeign"],
        cm_uplift_obj.spl_params["treatment_cost"],
        cm_uplift_obj.spl_params["revenue"],
        cm_uplift_obj.proportion_of_interpolation_fitting,
        2,
    )

    assert round(modelrateuplift_obj.harm([0])[0], 3) == 0.002
    assert round(modelrateuplift_obj.profit([0])[0], 3) == -40451.399
    assert round(modelrateuplift_obj.emp_lift_tr([0])[0], 3) == 0
    assert round(modelrateuplift_obj.emp_lift_cn([0])[0], 3) == 0
