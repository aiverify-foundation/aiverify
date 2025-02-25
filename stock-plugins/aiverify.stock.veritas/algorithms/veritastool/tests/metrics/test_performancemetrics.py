import os
import pickle
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)
import numpy as np
import pandas as pd
import pytest
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.metrics.performance_metrics import PerformanceMetrics
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.usecases.credit_scoring import CreditScoring
from aiverify_veritastool.util.errors import MyError

module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))
sys.path.append(module_path)
import selection
import uplift
import util
from sklearn.linear_model import LogisticRegression

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

# rejection inference
num_applicants = {"SEX": [5841, 5841], "MARRIAGE": [5841, 5841]}
base_default_rate = {"SEX": [0.5, 0.5], "MARRIAGE": [0.5, 0.5]}


# Create Model Container and Use Case Object
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
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    tran_row_num=[20, 40],
    tran_max_sample=10,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=10,
)
# cre_sco_obj.k = 1

import pickle
import sys

import numpy as np
import pandas as pd
import pytest
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.metrics.performance_metrics import PerformanceMetrics
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.usecases.customer_marketing import CustomerMarketing

# Load Customer Marketing Test Data
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


# Create Use Case Object
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
)

# Load Base Regression Test Data
file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'regression_dict.pickle')
input_file = open(file, "rb")
br = pickle.load(input_file)
input_file.close()
# Model Container Parameters
x_train = br["x_train"]
x_test = br["x_test"]
y_train = np.array(br["y_train"])
y_true = np.array(br["y_test"])
y_pred = np.array(br["y_pred"])
p_grp = {"sex": [1], "children": "maj_min"}

from sklearn.linear_model import LinearRegression

model_object = LinearRegression()
model_name = "base_regression"
model_type = "regression"

# fit the model for fairness diagnosis and transparency assessment
model_object.fit(x_train, y_train)

from aiverify_veritastool.usecases.base_regression import BaseRegression

# Create Model Container
container_br = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_train=y_train,
    x_train=x_train,
    x_test=x_test,
    model_object=model_object,
)
# Create Use Case Object
base_reg_obj = BaseRegression(
    model_params=[container_br],
    fair_threshold=80,
    perf_metric_name="mape",
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    tran_row_num=[1, 10, 25],
    tran_max_sample=10,
    tran_pdp_feature=["age", "bmi"],
)

import os
import pickle

import numpy as np
import pandas as pd
import pytest
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.usecases.predictive_underwriting import PredictiveUnderwriting

# Load Predictive Underwriting Test Data
file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'underwriting_dict.pickle')
input_file = open(file, "rb")
puw = pickle.load(input_file)
input_file.close()

# Model Contariner Parameters
y_true = np.array(puw["y_test"])
y_pred = np.array(puw["y_pred"])
y_train = np.array(puw["y_train"])
p_grp = {"gender": [1], "race": [1], "gender|race": "max_bias"}
up_grp = {"gender": [0], "race": [2, 3]}
x_train = puw["X_train"]
x_test = puw["X_test"]
y_prob = puw["y_prob"]

model = puw["model"]
model_name = "pred_underwriting"
model_type = "classification"

# Create Model Container
container_puw = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_prob,
    y_train,
    x_train=x_train,
    x_test=x_test,
    model_object=model,
    up_grp=up_grp,
)

# Create Use Case Object
pred_underwriting_obj = PredictiveUnderwriting(
    model_params=[container_puw],
    fair_threshold=80,
    fair_concern="inclusive",
    fair_priority="benefit",
    fair_impact="normal",
    fair_metric_type="difference",
    tran_row_num=[1, 2, 3],
    tran_max_sample=10,
    tran_max_display=10,
    tran_pdp_feature=["age", "payout_amount"],
)

# Setup fixture to test multi-class classification
from aiverify_veritastool.usecases.base_classification import BaseClassification


@pytest.fixture
def multi_class_setup():
    x_train_prop = cm_prop["X_train"].drop(["ID"], axis=1)
    x_test_prop = cm_prop["X_test"].drop(["ID"], axis=1)
    y_pred_prop = model_object_prop.predict(x_test_prop)
    p_grp_prop = {"isforeign": [0], "isfemale": [0]}
    model_type_prop = "classification"
    model_name_prop = "base_classification"
    container_clf = ModelContainer(
        y_true_prop,
        p_grp_prop,
        model_type_prop,
        model_name_prop,
        y_pred_prop,
        y_prob_prop,
        y_train_prop,
        x_train=x_train_prop,
        x_test=x_test_prop,
        model_object=model_object_prop,
        pos_label=None,
        neg_label=None,
    )
    yield container_clf


def test_execute_all_perf():
    # cre_sco_obj._compute_fairness(1)
    cre_sco_obj.evaluate()
    assert cre_sco_obj.perf_metric_obj.result is not None
    # cm_uplift_obj._compute_fairness(1)
    cm_uplift_obj.evaluate()
    assert cm_uplift_obj.perf_metric_obj.result is not None
    base_reg_obj.evaluate()
    assert base_reg_obj.perf_metric_obj.result is not None
    pred_underwriting_obj.evaluate()
    assert pred_underwriting_obj.perf_metric_obj.result is not None


# def test_translate_metric():
#     cre_sco_obj.feature_importance()
#     assert cre_sco_obj.feature_imp_values is not None
#     cm_uplift_obj.feature_importance()
#     assert cm_uplift_obj.feature_imp_values is not None


def test_compute_wape():
    expected_without_mask = 0.307
    result_without_mask = base_reg_obj.perf_metric_obj.result["perf_metric_values"][
        "wape"
    ][0]
    assert round(result_without_mask, 3) == round(expected_without_mask, 3)


def test_compute_mape():
    expected_without_mask = 0.419
    result_without_mask = base_reg_obj.perf_metric_obj.result["perf_metric_values"][
        "mape"
    ][0]
    assert round(result_without_mask, 3) == round(expected_without_mask, 3)


def test_compute_rmse():
    expected_without_mask = 6134.957
    result_without_mask = base_reg_obj.perf_metric_obj.result["perf_metric_values"][
        "rmse"
    ][0]
    assert round(result_without_mask, 3) == round(expected_without_mask, 3)


def test_loco_expected_selection_rate():
    cm_uplift_obj = CustomerMarketing(
        model_params=[container_rej, container_prop],
        fair_threshold=85.4,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="significant",
        perf_metric_name="expected_selection_rate",
        revenue=PROFIT_RESPOND,
        treatment_cost=COST_TREATMENT,
        tran_max_sample=10,
    )
    cm_uplift_obj.feature_importance(disable=["correlation"])
    assert (
        round(cm_uplift_obj.feature_imp_values["isforeign"]["isforeign"][1], 3) == 0.081
    )


def test_loco_compute_roc_auc_rejection_inference():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=0.43,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="significant",
        perf_metric_name="roc_auc",
        num_applicants=num_applicants,
        base_default_rate=base_default_rate,
        tran_max_sample=10,
    )
    cre_sco_obj.feature_importance(disable=["correlation"])
    assert round(cre_sco_obj.feature_imp_values["SEX"]["SEX"][1], 3) == -0.013


def test_loco_compute_roc_auc():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=0.43,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="significant",
        perf_metric_name="roc_auc",
        tran_max_sample=10,
    )
    cre_sco_obj.feature_importance(disable=["correlation"])
    assert round(cre_sco_obj.feature_imp_values["SEX"]["SEX"][1], 3) == -0.013


def test_compute_roc_auc():
    expected = 0.988
    result = pred_underwriting_obj.perf_metric_obj.result["perf_metric_values"][
        "roc_auc"
    ][0]
    assert round(result, 3) == round(expected, 3)


def test_compute_precision():
    expected = 0.982
    result = pred_underwriting_obj.perf_metric_obj.result["perf_metric_values"][
        "precision"
    ][0]
    assert round(result, 3) == round(expected, 3)


def test_compute_log_loss():
    expected = 0.128
    result = pred_underwriting_obj.perf_metric_obj.result["perf_metric_values"][
        "log_loss"
    ][0]
    assert round(result, 3) == round(expected, 3)


def test_multi_class(multi_class_setup):
    container_clf = multi_class_setup
    clf_obj = BaseClassification(
        model_params=[container_clf],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_name="demographic_parity",
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=10,
        tran_pdp_feature=["income", "age"],
        tran_pdp_target="TR",
    )
    clf_obj.evaluate(output=False)
    # Check result dict is not empty
    assert bool(clf_obj.perf_metric_obj.result)

    expected = 0.417
    result = clf_obj.perf_metric_obj.result["perf_metric_values"]["precision"][0]
    assert round(result, 3) == round(expected, 3)

    expected = 0.362
    result = clf_obj.perf_metric_obj.result["perf_metric_values"]["roc_auc"][0]
    assert round(result, 3) == round(expected, 3)

    expected = 1.854
    result = clf_obj.perf_metric_obj.result["perf_metric_values"]["log_loss"][0]
    assert round(result, 3) == round(expected, 3)


def test_check_perf_metric_name():
    msg = "[value_error]: perf_metric_name: given accurac, expected ['selection_rate', 'accuracy', 'balanced_acc', 'recall', 'precision', 'f1_score', 'tnr', 'fnr', 'npv', 'roc_auc', 'log_loss'] at check_perf_metric_name()\n"
    with pytest.raises(Exception) as toolkit_exit:
        pred_underwriting_obj = PredictiveUnderwriting(
            model_params=[container_puw],
            fair_threshold=80,
            fair_concern="inclusive",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accurac",
            tran_row_num=[1, 2, 3],
            tran_max_sample=10,
            tran_max_display=10,
            tran_pdp_feature=["age", "payout_amount"],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: perf_metric_name: given None, expected ['selection_rate', 'accuracy', 'balanced_acc', 'recall', 'precision', 'f1_score', 'tnr', 'fnr', 'npv', 'roc_auc', 'log_loss'] at check_perf_metric_name()\n"
    with pytest.raises(Exception) as toolkit_exit:
        pred_underwriting_obj = PredictiveUnderwriting(
            model_params=[container_puw],
            fair_threshold=80,
            fair_concern="inclusive",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name=None,
            tran_row_num=[1, 2, 3],
            tran_max_sample=10,
            tran_max_display=10,
            tran_pdp_feature=["age", "payout_amount"],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg
