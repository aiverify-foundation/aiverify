import os
import pickle
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)
import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LinearRegression, LogisticRegression
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.principles.transparency import Transparency
from aiverify_veritastool.usecases.base_classification import BaseClassification
from aiverify_veritastool.usecases.base_regression import BaseRegression
from aiverify_veritastool.usecases.credit_scoring import CreditScoring
from aiverify_veritastool.usecases.customer_marketing import CustomerMarketing
from aiverify_veritastool.util.errors import *
from aiverify_veritastool.util.errors import MyError

module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))
sys.path.append(module_path)
import selection
import uplift
import util

# creating a credit scoring use case
file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'credit_score_dict.pickle')
input_file = open(file, "rb")
cs = pickle.load(input_file)
cs["X_train"]["MARRIAGE"] = cs["X_train"]["MARRIAGE"].replace([0, 3], 1)
cs["X_test"]["MARRIAGE"] = cs["X_test"]["MARRIAGE"].replace([0, 3], 1)
y_true = np.array(cs["y_test"])
y_pred = np.array(cs["y_pred"])
y_train = np.array(cs["y_train"])
p_grp = {"SEX": [1], "MARRIAGE": [1]}
up_grp = {"SEX": [2], "MARRIAGE": [2]}
x_train = cs["X_train"]
x_test = cs["X_test"]
model_name = "credit scoring"
model_type = "classification"
y_prob = cs["y_prob"]
model_object = LogisticRegression(C=0.1)
model_object.fit(x_train, y_train)
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
    model_object=model_object,
    up_grp=up_grp,
)
cre_sco_obj = CreditScoring(
    model_params=[container],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    tran_row_num=[20, 40],
    tran_max_sample=1000,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=10,
)
model_num = 0

container1 = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_prob,
    y_train=None,
    x_train=None,
    x_test=x_test,
    model_object=model_object,
    up_grp=up_grp,
)
cre_sco_obj1 = CreditScoring(
    model_params=[container1],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    fair_metric_name="disparate_impact",
    fair_metric_type="difference",
    tran_row_num=[20, 40],
    tran_max_sample=1000,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=5,
    tran_processed_data=x_train,
    tran_processed_label=[y_train],
)
assert cre_sco_obj1.tran_input_features["check_input_flag"] == 0

container1 = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_prob,
    y_train,
    x_train=x_train,
    x_test=x_test,
    model_object=model_object,
    up_grp=up_grp,
)
cre_sco_obj1 = CreditScoring(
    model_params=[container1],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    fair_metric_name="disparate_impact",
    fair_metric_type="difference",
    tran_row_num=[20, 40],
    tran_max_sample=1000,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=5,
    tran_processed_data=None,
    tran_processed_label=None,
)
assert cre_sco_obj1.tran_input_features["check_input_flag"] == 1

container1 = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_prob,
    y_train,
    x_train=None,
    x_test=x_test,
    model_object=model_object,
    up_grp=up_grp,
)
cre_sco_obj1 = CreditScoring(
    model_params=[container1],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    fair_metric_name="disparate_impact",
    fair_metric_type="difference",
    tran_row_num=[20, 40],
    tran_max_sample=1000,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=5,
    tran_processed_data=x_train,
    tran_processed_label=None,
)
assert cre_sco_obj1.tran_input_features["check_input_flag"] == 2

container1 = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_prob,
    y_train=None,
    x_train=x_train,
    x_test=x_test,
    model_object=model_object,
    up_grp=up_grp,
)
cre_sco_obj1 = CreditScoring(
    model_params=[container1],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    fair_metric_name="disparate_impact",
    fair_metric_type="difference",
    tran_row_num=[20, 40],
    tran_max_sample=1000,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=5,
    tran_processed_data=None,
    tran_processed_label=[y_train],
)
assert cre_sco_obj1.tran_input_features["check_input_flag"] == 2

container1 = ModelContainer(
    y_true,
    p_grp,
    model_type,
    model_name,
    y_pred,
    y_prob,
    y_train=None,
    x_train=None,
    x_test=x_test,
    model_object=model_object,
    up_grp=up_grp,
)
cre_sco_obj1 = CreditScoring(
    model_params=[container1],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    fair_metric_name="disparate_impact",
    fair_metric_type="difference",
    tran_row_num=[20, 40],
    tran_max_sample=1000,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=5,
    tran_processed_data=None,
    tran_processed_label=None,
)
assert cre_sco_obj1.tran_input_features["check_input_flag"] == 2

# creating a customer marketing use case
file_prop = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle')
file_rej = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_rej_dict.pickle')

input_prop = open(file_prop, "rb")
input_rej = open(file_rej, "rb")
cm_prop = pickle.load(input_prop)
cm_rej = pickle.load(input_rej)
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
    tran_max_sample=1000,
    tran_pdp_feature=["age", "income"],
    tran_pdp_target="CR",
    tran_max_display=6,
)


def test_check_tran_row_num():
    msg = "[type_error]: tran_row_num: given <class 'int'>, expected list or numpy array or pandas series at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=2,
            tran_max_sample=100,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_row_num: given <class 'str'>, expected integer values at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=["a", 2],
            tran_max_sample=100,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_row_num: given 50000, expected Index within range 1 - 22500 at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[50000],
            tran_max_sample=100,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_row_num: given -500, expected Index within range 1 - 22500 at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[1, 2, -500],
            tran_max_sample=100,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=pd.Series(np.array([1, 20.0, 50.2])),
        tran_max_sample=100,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    assert cre_sco_obj.tran_row_num == [1, 20, 50]


def test_check_tran_max_sample():
    msg = "[value_error]: tran_max_sample: given 50000, expected Value between range 1 - 22500 at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=50000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_max_sample: given <class 'list'>, expected int or float at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=[25],
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_max_sample: given 1000.56, expected Float value between 0 and 1 at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000.56,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


def test_check_tran_pdp_feature():
    msg = "[type_error]: tran_pdp_feature: given <class 'str'>, expected list at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature="abc",
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_pdp_feature: given LimitBal, expected Feature value within available feature list at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LimitBal"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_pdp_feature: given a, expected Feature value within available feature list at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL", "a", "b", "c"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_pdp_feature: given <class 'int'>, expected list of string at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=[1, "LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


def test_check_tran_pdp_target():
    # incorrect pdp target for a binary class model will give no error
    try:
        with pytest.raises(Exception) as toolkit_exit:
            cre_sco_obj = CreditScoring(
                model_params=[container],
                fair_threshold=80,
                fair_concern="eligible",
                fair_priority="benefit",
                fair_impact="normal",
                perf_metric_name="accuracy",
                tran_row_num=[20, 40],
                tran_pdp_target=5,
                tran_max_display=10,
            )
    except:
        assert True

    # creating a multi-class use case
    file_prop = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle')
    input_prop = open(file_prop, "rb")
    cm_prop = pickle.load(input_prop)
    y_true = cm_prop["y_test"]
    y_train = cm_prop["y_train"]
    model_obj = cm_prop["model"]
    model_name = "base_classification"
    model_type = "classification"
    y_prob = pd.DataFrame(cm_prop["y_prob"], columns=["CN", "CR", "TN", "TR"])
    p_grp = {"isforeign": [0], "isfemale": [0], "isforeign|isfemale": "maj_rest"}
    x_train = cm_prop["X_train"].drop(["ID"], axis=1)
    x_test = cm_prop["X_test"].drop(["ID"], axis=1)
    clf = cm_prop["model"]
    clf = clf.fit(x_train, y_train)
    y_pred = clf.predict(x_test)
    clf_container = ModelContainer(
        y_true,
        p_grp,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=clf,
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
    )

    # incorrect pdp target for a multi class model
    msg = "[value_error]: tran_pdp_target: given 5, expected Target value from model class labels - ['CN' 'CR' 'TN' 'TR'] at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        clf_obj = BaseClassification(
            model_params=[clf_container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            fair_metric_type="difference",
            perf_metric_name="accuracy",
            tran_row_num=[12, 42],
            tran_max_sample=1000,
            tran_pdp_feature=["income", "age"],
            tran_pdp_target=5,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_pdp_target: given <class 'list'>, expected str/int at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        clf_obj = BaseClassification(
            model_params=[clf_container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            fair_metric_type="difference",
            perf_metric_name="accuracy",
            tran_row_num=[12, 42],
            tran_max_sample=1000,
            tran_pdp_feature=["income", "age"],
            tran_pdp_target=[1],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


def test_check_tran_max_display():
    msg = "[value_error]: tran_max_display: given -9, expected Value between range 2 - 23 at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=-9,
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_max_display: given <class 'str'>, expected int at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display="top5",
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=50,
    )
    assert cre_sco_obj.tran_max_display == 23

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=0,
    )
    assert cre_sco_obj.tran_max_display == 23

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=15.4,
    )
    assert cre_sco_obj.tran_max_display == 15


def test_check_tran_features():
    msg = "[type_error]: tran_features: given <class 'list'>, expected str at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
            tran_features=[1],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_features: given <class 'dict'>, expected list at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
            tran_features={},
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_features: given abc, expected Feature value within available feature list at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
            tran_features=["abc"],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


def test_check_tran_processed_data():
    msg = "[type_error]: tran_processed_data: given <class 'list'>, expected Dataframe at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        container1 = ModelContainer(
            y_true,
            p_grp,
            model_type,
            model_name,
            y_pred,
            y_prob,
            y_train=None,
            x_train=None,
            x_test=x_test,
            model_object=model_object,
            up_grp=up_grp,
        )
        cre_sco_obj1 = CreditScoring(
            model_params=[container1],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            fair_metric_name="disparate_impact",
            fair_metric_type="difference",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=5,
            tran_processed_data=[],
            tran_processed_label=[y_train],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_processed_label: given <class 'dict'>, expected list at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        container1 = ModelContainer(
            y_true,
            p_grp,
            model_type,
            model_name,
            y_pred,
            y_prob,
            y_train=None,
            x_train=None,
            x_test=x_test,
            model_object=model_object,
            up_grp=up_grp,
        )
        cre_sco_obj1 = CreditScoring(
            model_params=[container1],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            fair_metric_name="disparate_impact",
            fair_metric_type="difference",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=5,
            tran_processed_data=x_train,
            tran_processed_label={},
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: tran_processed_label: given <class 'int'>, expected np.ndarray or pd.Series or list at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        container1 = ModelContainer(
            y_true,
            p_grp,
            model_type,
            model_name,
            y_pred,
            y_prob,
            y_train=None,
            x_train=None,
            x_test=x_test,
            model_object=model_object,
            up_grp=up_grp,
        )
        cre_sco_obj1 = CreditScoring(
            model_params=[container1],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            fair_metric_name="disparate_impact",
            fair_metric_type="difference",
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=5,
            tran_processed_data=x_train,
            tran_processed_label=[1],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_processed_label: given 1000, expected length equal to length of processed data : 500 at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        container1 = ModelContainer(
            y_true,
            p_grp,
            model_type,
            model_name,
            y_pred,
            y_prob,
            y_train=None,
            x_train=None,
            x_test=x_test,
            model_object=model_object,
            up_grp=up_grp,
        )
        cre_sco_obj1 = CreditScoring(
            model_params=[container1],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            fair_metric_name="disparate_impact",
            fair_metric_type="difference",
            tran_row_num=[20, 40],
            tran_max_sample=100,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=5,
            tran_processed_data=x_train[:500],
            tran_processed_label=[y_train[:1000]],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: tran_processed_label: given 1, expected length equal to length of model params : 2 at _tran_check_input()\n"
    with pytest.raises(Exception) as toolkit_exit:
        container_rej1 = ModelContainer(
            y_true=y_true_rej,
            y_pred=y_pred_rej,
            y_prob=y_prob_rej,
            y_train=None,
            p_grp=p_grp_rej,
            x_train=None,
            x_test=x_test_rej,
            model_object=model_object_rej,
            model_name=model_name_rej,
            model_type=model_type_rej,
            pos_label=["TR", "CR"],
            neg_label=["TN", "CN"],
        )

        container_prop1 = container_rej1.clone(
            y_true=y_true_prop,
            y_pred=y_pred_prop,
            y_prob=y_prob_prop,
            y_train=None,
            model_object=model_object_prop,
            pos_label=["TR", "CR"],
            neg_label=["TN", "CN"],
        )

        cm_uplift_obj1 = CustomerMarketing(
            model_params=[container_rej1, container_prop1],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="significant",
            perf_metric_name="expected_profit",
            fair_metric_name="auto",
            revenue=PROFIT_RESPOND,
            treatment_cost=COST_TREATMENT,
            tran_row_num=[20, 40],
            tran_max_sample=1000,
            tran_pdp_feature=["age", "income"],
            tran_pdp_target="CR",
            tran_max_display=4,
            tran_features=["noproducts"],
            tran_processed_data=x_train_rej[:1000],
            tran_processed_label=[y_train_rej[:1000]],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


def test_data_sampling():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=100,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=16,
    )
    cre_sco_obj._data_sampling()
    assert np.any(cre_sco_obj.tran_processed_data.index + 1 == 20)
    assert np.any(cre_sco_obj.tran_processed_data.index + 1 == 40)

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_max_sample=2,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=16,
    )
    cre_sco_obj._data_sampling()
    assert np.any(
        cre_sco_obj.model_params[0].y_train[cre_sco_obj.tran_processed_data.index] == 0
    )
    assert np.any(
        cre_sco_obj.model_params[0].y_train[cre_sco_obj.tran_processed_data.index] == 1
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=0.2,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )

    cre_sco_obj._data_sampling()
    assert cre_sco_obj.tran_processed_data.shape == (4502, 23)

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=500,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )

    cre_sco_obj._data_sampling()
    assert cre_sco_obj.tran_processed_data.shape == (502, 23)

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )

    cre_sco_obj._data_sampling()
    assert cre_sco_obj.tran_processed_data.shape == (22500, 23)


def test_top_features():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    assert set(cre_sco_obj.tran_top_features[0]["Feature_name"].tolist()[:10]) == {
        "LIMIT_BAL",
        "BILL_AMT1",
        "BILL_AMT2",
        "BILL_AMT5",
        "PAY_AMT1",
        "PAY_AMT2",
        "BILL_AMT3",
        "BILL_AMT6",
        "PAY_AMT4",
        "PAY_AMT3",
    }

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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=4,
    )
    cm_uplift_obj._data_prep(model_num=0)
    cm_uplift_obj._data_prep(model_num=1)
    assert set(cm_uplift_obj.tran_top_features[0]["Feature_name"].tolist()[:4]) == {
        "isforeign",
        "income",
        "age",
        "noproducts",
    }
    assert set(cm_uplift_obj.tran_top_features[1]["Feature_name"].tolist()[:4]) == {
        "income",
        "age",
        "isforeign",
        "didrespond",
    }


def test_global():
    cre_sco_obj._data_prep()
    cre_sco_obj._global()
    assert cre_sco_obj.tran_results["model_list"][0]["summary_plot"] is not None
    assert cre_sco_obj.tran_results["model_list"][0]["plot"]["summary"].any() != 0
    assert (
        type(cre_sco_obj.tran_results["model_list"][0]["summary_plot"].encode("utf-8"))
        == bytes
    )
    assert (
        type(cre_sco_obj.tran_results["model_list"][0]["plot"]["summary"]) == np.ndarray
    )


def test_local():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._local(n=40)
    assert (
        round(
            cre_sco_obj.tran_results["model_list"][0]["local_interpretability"][0][
                "efx"
            ],
            2,
        )
        == 0.75
    )
    assert (
        type(cre_sco_obj.tran_results["model_list"][0]["plot"]["local_plot"][40])
        == np.ndarray
    )

    cm_uplift_obj._tran_compile()
    assert (
        cm_uplift_obj.model_params[model_num].model_object.classes_[
            cm_uplift_obj.tran_results["model_list"][0]["plot"]["class_index"][40]
        ]
        == "TN"
    )

    container_rej1 = ModelContainer(
        y_true=y_true_rej,
        y_pred=y_pred_rej,
        y_prob=y_prob_rej,
        y_train=None,
        p_grp=p_grp_rej,
        x_train=x_train_rej,
        x_test=x_test_rej,
        model_object=model_object_rej,
        model_name=model_name_rej,
        model_type=model_type_rej,
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
    )

    container_prop1 = container_rej1.clone(
        y_true=y_true_prop,
        y_pred=y_pred_prop,
        y_prob=y_prob_prop,
        y_train=None,
        model_object=model_object_prop,
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
    )

    cm_uplift_obj1 = CustomerMarketing(
        model_params=[container_rej1, container_prop1],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="significant",
        perf_metric_name="expected_profit",
        fair_metric_name="auto",
        revenue=PROFIT_RESPOND,
        treatment_cost=COST_TREATMENT,
        tran_row_num=[5, 3],
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
        tran_processed_data=x_train_rej[:1000],
        tran_processed_label=[y_train_rej[:1000], y_train_prop[:1000]],
    )
    cm_uplift_obj1.explain(model_num=2)
    assert (
        cm_uplift_obj1.model_params[1].model_object.classes_[
            cm_uplift_obj1.tran_results["model_list"][1]["plot"]["class_index"][3]
        ]
        == "CN"
    )
    assert (
        cm_uplift_obj1.model_params[1].model_object.classes_[
            cm_uplift_obj1.tran_results["model_list"][1]["plot"]["class_index"][5]
        ]
        == "CR"
    )


def test_compute_partial_dependence():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_partial_dependence()
    assert cre_sco_obj.tran_results["model_list"][0]["plot"]["pdp_plot"] is not None
    assert len(cre_sco_obj.tran_results["model_list"][0]["plot"]["pdp_plot"]) == 2
    assert (
        cre_sco_obj.tran_results["model_list"][0]["partial_dependence_plot"] is not None
    )
    assert (
        len(cre_sco_obj.tran_results["model_list"][0]["partial_dependence_plot"]) == 2
    )
    assert (
        type(
            cre_sco_obj.tran_results["model_list"][0]["partial_dependence_plot"][
                "LIMIT_BAL"
            ].encode("utf-8")
        )
        == bytes
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_partial_dependence()
    assert cre_sco_obj.tran_pdp_feature_processed[0][0] == "LIMIT_BAL"
    assert cre_sco_obj.tran_pdp_feature_processed[0][1] == "BILL_AMT1"

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_partial_dependence()
    assert cre_sco_obj.tran_pdp_feature_processed[0][0] == "LIMIT_BAL"
    assert cre_sco_obj.tran_pdp_feature_processed[0][1] == "BILL_AMT1"

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["AGE"],
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_partial_dependence()
    assert cre_sco_obj.tran_pdp_feature_processed[0][0] == "AGE"
    assert cre_sco_obj.tran_pdp_feature_processed[0][1] == "LIMIT_BAL"

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_partial_dependence()
    assert cre_sco_obj.tran_pdp_feature_processed[0][0] == "MARRIAGE"
    assert cre_sco_obj.tran_pdp_feature_processed[0][1] == "SEX"

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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_max_display=6,
    )
    cm_uplift_obj._data_prep()
    cm_uplift_obj._compute_partial_dependence()
    assert cm_uplift_obj.tran_pdp_target == "TR"


def test_compute_permutation_importance():
    # testing for binary classification
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=8,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_permutation_importance()
    assert (
        list(np.round_(np.array(cre_sco_obj.permutation_importance["diff"]), 1))[0]
        == 0.1
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_permutation_importance()
    assert len(cre_sco_obj.tran_results["permutation"]["score"]) == 10
    assert cre_sco_obj.tran_results["permutation"]["score"] is not None

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_max_display=20,
    )
    cre_sco_obj._data_prep()
    cre_sco_obj._compute_permutation_importance()
    assert len(cre_sco_obj.tran_results["permutation"]["score"]) == 20
    assert cre_sco_obj.tran_results["permutation"]["score"] is not None

    # testing for regression
    file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'regression_dict.pickle')
    input_file = open(file, "rb")
    br = pickle.load(input_file)
    x_train = br["x_train"]
    x_test = br["x_test"]
    y_train = np.array(br["y_train"])
    y_true = np.array(br["y_test"])
    y_pred = np.array(br["y_pred"])
    p_grp = {"sex": [1], "children": "maj_min"}
    model_object = LinearRegression()
    model_name = "base_regression"
    model_type = "regression"
    model_object.fit(x_train, y_train)
    reg_container = ModelContainer(
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
    base_reg_obj = BaseRegression(
        model_params=[reg_container],
        fair_threshold=80,
        perf_metric_name="mape",
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        tran_row_num=[1, 10, 25],
        tran_max_sample=1,
        tran_pdp_feature=["age", "bmi"],
    )
    base_reg_obj.explain()

    # testing for multiclass model
    # creating a multi-class use case
    file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle')
    input_prop = open(file_prop, "rb")
    cm_prop = pickle.load(input_prop)
    y_true = cm_prop["y_test"]
    y_train = cm_prop["y_train"]
    model_obj = cm_prop["model"]
    model_name = "base_classification"
    model_type = "classification"
    y_prob = pd.DataFrame(cm_prop["y_prob"], columns=["CN", "CR", "TN", "TR"])
    p_grp = {"isforeign": [0], "isfemale": [0], "isforeign|isfemale": "maj_rest"}
    x_train = cm_prop["X_train"].drop(["ID"], axis=1)
    x_test = cm_prop["X_test"].drop(["ID"], axis=1)
    clf = cm_prop["model"]
    clf = clf.fit(x_train, y_train)
    y_pred = clf.predict(x_test)
    clf_container = ModelContainer(
        y_true,
        p_grp,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=clf,
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
    )
    # Create Use Case Object
    clf_obj = BaseClassification(
        model_params=[clf_container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="difference",
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=1000,
        tran_pdp_feature=["income", "age"],
        tran_pdp_target="TR",
        tran_features=["income", "isforeign", "age", "isfemale"],
        tran_max_display=4,
    )
    clf_obj._data_prep()
    clf_obj._compute_permutation_importance()


def test_data_prep():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=100,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj._data_prep()
    assert cre_sco_obj.tran_flag["data_sampling_flag"] is True
    assert cre_sco_obj.tran_flag[model_num]["data_prep_flag"] is True

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=100,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    cre_sco_obj._data_prep()
    for i in cre_sco_obj.tran_features:
        assert i in [
            "LIMIT_BAL",
            "SEX",
            "MARRIAGE",
            "PAY_1",
            "BILL_AMT1",
            "BILL_AMT2",
            "BILL_AMT5",
            "PAY_AMT1",
            "PAY_AMT2",
            "BILL_AMT3",
        ]
    assert len(cre_sco_obj.tran_features) == 10

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=100,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=5,
        tran_features=[
            "MARRIAGE",
            "SEX",
            "LIMIT_BAL",
            "PAY_1",
            "BILL_AMT1",
            "BILL_AMT5",
            "PAY_AMT2",
            "BILL_AMT3",
        ],
    )
    cre_sco_obj._data_prep()
    for i in cre_sco_obj.tran_features:
        assert i in [
            "LIMIT_BAL",
            "BILL_AMT1",
            "SEX",
            "BILL_AMT3",
            "PAY_AMT2",
            "MARRIAGE",
            "BILL_AMT5",
            "PAY_1",
        ]
    assert len(cre_sco_obj.tran_features) == 8

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=100,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=5,
        tran_features=[
            "MARRIAGE",
            "SEX",
            "LIMIT_BAL",
            "PAY_1",
            "BILL_AMT3",
            "BILL_AMT5",
            "PAY_1",
            "BILL_AMT3",
        ],
    )
    cre_sco_obj._data_prep()
    assert len(cre_sco_obj.tran_features) == 6


def test_explain():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=100,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=16,
    )

    msg = "[value_error]: model_num: given 5, expected one of the following integers: [1] at explain()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj.explain(model_num=5)
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: model_num: given <class 'list'>, expected int at explain()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj.explain(model_num=[1])
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[value_error]: local_row_num: given 50000, expected An integer value within the index range 1-22500 at explain()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj.explain(local_row_num=50000)
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: local_row_num: given <class 'list'>, expected An integer value within the index range 1-22500 at explain()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj.explain(local_row_num=[10])
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    msg = "[type_error]: disable: given <class 'dict'>, expected list at explain()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cre_sco_obj.explain(disable={})
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    cre_sco_obj.explain(local_row_num=20)
    assert cre_sco_obj.tran_flag[0]["interpret"] is True
    cre_sco_obj.explain()
    assert cre_sco_obj.tran_flag[0]["interpret"] is True

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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
    )
    msg = "[value_error]: model_num: given 5, expected one of the following integers: [1, 2] at explain()\n"
    with pytest.raises(Exception) as toolkit_exit:
        cm_uplift_obj.explain(model_num=5)
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain(local_row_num=17.5)
    assert (
        cre_sco_obj.tran_results["model_list"][0]["local_interpretability"][-1]["id"]
        == 17
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain()  # disable = None
    assert cre_sco_obj.tran_flag[0]["interpret"] is True
    assert cre_sco_obj.tran_flag[0]["partial_dep"] is True
    assert cre_sco_obj.tran_flag[0]["perm_imp"] is True
    assert (
        cre_sco_obj.tran_results["model_list"][0]["local_interpretability"] is not None
    )
    assert cre_sco_obj.tran_results["model_list"][model_num]["summary_plot"] is not None
    assert (
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["pdp_plot"]
        is not None
    )
    assert cre_sco_obj.tran_results["permutation"]["score"] is not None

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain(disable=["abc", "interpret", "def"])
    assert cre_sco_obj.tran_flag[0]["interpret"] is False
    assert cre_sco_obj.tran_flag[0]["partial_dep"] is True
    assert cre_sco_obj.tran_flag[0]["perm_imp"] is True
    assert cre_sco_obj.tran_results["model_list"][0]["local_interpretability"] == []
    assert cre_sco_obj.tran_results["model_list"][model_num]["summary_plot"] == ""
    assert (
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["pdp_plot"]
        is not None
    )
    assert cre_sco_obj.tran_results["permutation"]["score"] is not None

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain(disable=["interpret"])
    assert cre_sco_obj.tran_flag[0]["interpret"] is False
    assert cre_sco_obj.tran_flag[0]["partial_dep"] is True
    assert cre_sco_obj.tran_flag[0]["perm_imp"] is True
    assert cre_sco_obj.tran_results["model_list"][0]["local_interpretability"] == []
    assert cre_sco_obj.tran_results["model_list"][model_num]["summary_plot"] == ""
    assert (
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["pdp_plot"]
        is not None
    )
    assert cre_sco_obj.tran_results["permutation"]["score"] is not None

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain(disable=["partial_dep", "perm_imp"])
    assert cre_sco_obj.tran_flag[0]["interpret"] is True
    assert cre_sco_obj.tran_flag[0]["partial_dep"] is False
    assert cre_sco_obj.tran_flag[0]["perm_imp"] is False
    assert (
        cre_sco_obj.tran_results["model_list"][0]["local_interpretability"] is not None
    )
    assert cre_sco_obj.tran_results["model_list"][model_num]["summary_plot"] is not None
    assert cre_sco_obj.tran_results["model_list"][model_num]["plot"]["pdp_plot"] == {}
    assert cre_sco_obj.tran_results["permutation"]["score"] == ""

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain(disable=["interpret", "partial_dep", "perm_imp"])
    assert cre_sco_obj.tran_flag[0]["interpret"] is False
    assert cre_sco_obj.tran_flag[0]["partial_dep"] is False
    assert cre_sco_obj.tran_flag[0]["perm_imp"] is False
    assert cre_sco_obj.tran_results["model_list"][0]["local_interpretability"] == []
    assert cre_sco_obj.tran_results["model_list"][model_num]["summary_plot"] == ""
    assert cre_sco_obj.tran_results["model_list"][model_num]["plot"]["pdp_plot"] == {}
    assert cre_sco_obj.tran_results["permutation"]["score"] == ""

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain(local_row_num=17, disable=["interpret", "partial_dep"])
    assert (
        cre_sco_obj.tran_results["model_list"][0]["local_interpretability"][-1]["id"]
        == 17
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    cre_sco_obj.explain(local_row_num=60)
    assert (
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["local_plot"][60]
        == ""
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain(local_row_num=60)
    assert np.any(
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["local_plot"][60]
        != ""
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    cre_sco_obj.explain()
    cre_sco_obj.explain(local_row_num=883)
    assert (
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["local_plot"][883]
        == ""
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj.explain()
    cre_sco_obj.explain(local_row_num=883)
    assert np.any(
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["local_plot"][883]
        != ""
    )

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    cre_sco_obj.explain()
    cre_sco_obj.explain(local_row_num=52)
    assert 52 not in list(
        cre_sco_obj.tran_results["model_list"][model_num]["plot"]["local_plot"].keys()
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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
    )
    cm_uplift_obj._data_prep(model_num=1)
    cm_uplift_obj.explain(local_row_num=52)
    assert 52 in list(
        cm_uplift_obj.tran_results["model_list"][1]["plot"]["local_plot"].keys()
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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
        tran_features=["age", "income"],
    )
    cm_uplift_obj._data_prep(model_num=1)
    cm_uplift_obj.explain(local_row_num=52)
    assert 52 in list(
        cm_uplift_obj.tran_results["model_list"][1]["plot"]["local_plot"].keys()
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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
    )
    cm_uplift_obj._data_prep(model_num=1)
    cm_uplift_obj.explain(local_row_num=1)
    assert 1 not in list(
        cm_uplift_obj.tran_results["model_list"][1]["plot"]["local_plot"].keys()
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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
    )
    cm_uplift_obj.explain()
    cm_uplift_obj.explain(local_row_num=52)
    assert 52 in list(
        cm_uplift_obj.tran_results["model_list"][1]["plot"]["local_plot"].keys()
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
        tran_max_sample=1000,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=6,
        tran_features=["age", "income"],
    )
    cm_uplift_obj.explain()
    cm_uplift_obj.explain(local_row_num=52)
    assert 52 in list(
        cm_uplift_obj.tran_results["model_list"][1]["plot"]["local_plot"].keys()
    )

    container1 = ModelContainer(
        None,
        None,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model_object,
        up_grp=up_grp,
    )
    cre_sco_obj1 = CreditScoring(
        model_params=[container1],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_max_sample=2,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
    )
    cre_sco_obj1.explain()
    assert cre_sco_obj1.tran_results["permutation"]["score"] == ""


def test_tran_compile():
    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    cre_sco_obj._tran_compile()
    assert cre_sco_obj.tran_flag[0]["interpret"] is True
    assert cre_sco_obj.tran_flag[0]["partial_dep"] is True
    assert cre_sco_obj.tran_flag[0]["perm_imp"] is True

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
        tran_row_num=[20, 8000.9],
        tran_max_sample=500,
        tran_pdp_feature=["age", "income"],
        tran_pdp_target="CR",
        tran_max_display=4,
    )
    cm_uplift_obj._tran_compile()
    assert cm_uplift_obj.tran_flag["data_sampling_flag"] is True
    assert cm_uplift_obj.tran_flag[0]["data_prep_flag"] is True
    assert cm_uplift_obj.tran_flag[1]["data_prep_flag"] is True
    assert cm_uplift_obj.tran_flag[0]["interpret"] is True
    assert cm_uplift_obj.tran_flag[1]["interpret"] is True
    assert cm_uplift_obj.tran_flag[0]["partial_dep"] is True
    assert cm_uplift_obj.tran_flag[1]["partial_dep"] is True
    assert cm_uplift_obj.tran_flag[0]["perm_imp"] is True
    assert cm_uplift_obj.tran_flag[1]["perm_imp"] is True

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    a = cre_sco_obj._tran_compile(disable=["interpret", "partial_dep", "perm_imp"])
    assert a is None

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    a = cre_sco_obj._tran_compile(disable=["interpret"])
    assert a["model_list"][model_num]["local_interpretability"] is None
    assert a["model_list"][model_num]["summary_plot"] is None
    assert a["model_list"][model_num]["summary_plot_data_table"] is None

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    a = cre_sco_obj._tran_compile(disable=["partial_dep"])
    assert a["model_list"][model_num]["partial_dependence_plot"] is None

    cre_sco_obj = CreditScoring(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=50,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        tran_features=["MARRIAGE", "SEX", "LIMIT_BAL", "PAY_1"],
    )
    a = cre_sco_obj._tran_compile(disable=["perm_imp"])
    assert a["permutation"] is None

    container2 = ModelContainer(
        None,
        None,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model_object,
        up_grp=up_grp,
    )
    cre_sco_obj2 = CreditScoring(
        model_params=[container2],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        fair_metric_name="disparate_impact",
        fair_metric_type="difference",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=5,
        tran_processed_data=None,
        tran_processed_label=None,
    )
    a2 = cre_sco_obj2._tran_compile()
    assert a2["permutation"] is None

    container1 = ModelContainer(
        y_true,
        p_grp,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train=None,
        x_train=None,
        x_test=x_test,
        model_object=model_object,
        up_grp=up_grp,
    )
    cre_sco_obj1 = CreditScoring(
        model_params=[container1],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        fair_metric_name="disparate_impact",
        fair_metric_type="difference",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=5,
        tran_processed_data=None,
        tran_processed_label=None,
    )
    a = cre_sco_obj1._tran_compile()
    assert a is None

    container1 = ModelContainer(
        y_true,
        p_grp,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=None,
        up_grp=up_grp,
    )
    cre_sco_obj1 = CreditScoring(
        model_params=[container1],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        fair_metric_name="disparate_impact",
        fair_metric_type="difference",
        tran_row_num=[20, 40],
        tran_max_sample=1000,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=5,
    )
    a = cre_sco_obj1._tran_compile()
    assert a is None
