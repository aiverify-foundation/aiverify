import math
import os
import pickle
import sys
from copy import deepcopy

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

project_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
sys.path.insert(0, project_root)
from veritastool.model.model_container import ModelContainer
from veritastool.usecases.credit_scoring import CreditScoring

# from veritastool.util.utility import check_datatype, check_value, convert_to_set, check_label, get_cpu_count, check_multiprocessing
from veritastool.util.errors import MyError
from veritastool.util.utility import (
    check_multiprocessing,
    check_value,
    convert_to_set,
    get_cpu_count,
)

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

# sample feature_imp
feature_imp = pd.DataFrame(
    data={
        "features": ["EDUCATION", "SEX", "MARRIAGE", "AGE"],
        "values": [0.04, 0.08, 0.03, 0.02],
    }
)

# Load Credit Scoring Test Data
file = os.path.join(
    project_root, "veritastool", "examples", "data", "credit_score_dict.pickle"
)
input_file = open(file, "rb")
cs = pickle.load(input_file)

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
num_applicants = {"SEX": [3500, 5000], "MARRIAGE": [3500, 5000]}
base_default_rate = {"SEX": [0.10, 0.05], "MARRIAGE": [0.10, 0.05]}

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


def test_check_datatype():
    f_container = deepcopy(container)
    msg = ""

    # f_container.y_true = None
    # msg += '[type_error]: y_true: given <class \'NoneType\'>, expected [<class \'list\'>, <class \'numpy.ndarray\'>, <class \'pandas.core.series.Series\'>] at check_datatype()\n'

    f_container.y_pred = tuple(f_container.y_pred)
    msg += "[type_error]: y_pred: given <class 'tuple'>, expected [<class 'NoneType'>, <class 'list'>, <class 'numpy.ndarray'>, <class 'pandas.core.series.Series'>] at check_datatype()\n"

    f_container.p_grp = {"SEX": np.array([[1]]), "MARRIAGE": [[1]]}
    msg += "[type_error]: p_grp values: given <class 'numpy.ndarray'>, expected list or str at check_datatype()\n"

    # f_container._input_validation_lookup['sample_weight_train'] = [None, (0, np.inf)]
    # msg += '[type_error]: sample_weight_train: given <class \'str\'>, expected None at check_datatype()\n'

    f_container._input_validation_lookup["new_variable"] = [(list,), str]
    msg += "[type_error]: new_variable: given None, expected [<class 'list'>] at check_datatype()\n"

    f_container._input_validation_lookup["new_variable2"] = [None, str]
    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        check_datatype(f_container)
    # print(toolkit_error.type)
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


def test_check_value():
    f_container = deepcopy(container)
    msg = ""

    # when the length is 1, check_value will not be performed for this variable
    f_container.new_variable2 = "random_var"
    f_container._input_validation_lookup["new_variable2"] = [
        str,
    ]

    # change y_prob
    f_container.y_prob[0] = 10
    msg += "[value_error]: y_prob: given range [0.004324126464885938 : 10.0] , expected (-0.01, 1.01) at check_value()\n"

    # change protected_features_cols columns
    f_container.protected_features_cols["new_column"] = 1
    msg += "[column_value_error]: protected_features_cols: given ['MARRIAGE', 'SEX'] expected ['MARRIAGE', 'SEX', 'new_column'] at check_value()\n"

    # change feature_imp
    # f_container.feature_imp['new_column'] = 1
    # msg += '[length_error]: feature_imp: given length 3, expected length 2 at check_value()\n'

    # change model type
    f_container.model_type = "random_type"
    msg += "[value_error]: model_type: given random_type, expected ['classification', 'regression', 'uplift'] at check_value()\n"

    # change pos_label
    f_container.pos_label = [[1, "pos"]]
    msg += "[value_error]: pos_label: given ['1', 'pos'], expected [0, 1] at check_value()\n"

    # change p_grp
    f_container.p_grp = {"SEX": [1], "MARRIAGE": [1], "RELIGION": [1]}
    msg += "[value_error]: p_grp: given ['MARRIAGE', 'RELIGION', 'SEX'], expected ['MARRIAGE', 'SEX'] at check_value()\n"

    # change p_var
    f_container.p_var = ["SEX", 123]
    msg += "[value_error]: p_var: given <class 'int'>, expected <class 'str'> at check_value()\n"

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        check_value(f_container)
    assert toolkit_exit.type == MyError
    # print('====== test_check_value() =======\n')
    # print(toolkit_exit.value.message)
    # print('====== test_check_value() expected msg =======\n')
    # print(msg)
    assert toolkit_exit.value.message == msg

    f_container2 = deepcopy(container)
    msg = ""
    # f_container2

    # change _input_validation_lookup, remove 2nd element to skip check value
    f_container2._input_validation_lookup["y_prob"] = [
        (list, np.ndarray, pd.Series, pd.DataFrame),
        (-0.01, 1.01, 10),
    ]
    f_container2._input_validation_lookup["p_var"] = [
        (list,),
    ]

    # change p_var
    f_container2.p_grp = {"SEX": [1, 2, 3], "MARRIAGE": [1]}
    msg += (
        "[value_error]: p_grp SEX: given [1, 2, 3], expected [1, 2] at check_value()\n"
    )

    # change feature_imp
    # f_container2.feature_imp = pd.DataFrame(data = {'features': ['EDUCATION', 'SEX', 'MARRIAGE', 'AGE'], 'values': ['important', 0.08, 0.03, 0.02]})
    # msg += '[column_value_error]: feature_imp: given object expected float64 at check_value()\n'

    f_container2.fair_neutral_tolerance = 0.1
    f_container2._input_validation_lookup["fair_neutral_tolerance"] = [
        (int, float),
        (0, 0.01),
    ]
    msg += "[value_error]: fair_neutral_tolerance: given 0.1, expected (0, 0.01) at check_value()\n"

    f_container2.new_var = "new_variable"
    f_container2._input_validation_lookup["new_var"] = [(str,), (0, 1)]
    msg += "[value_error]: new_var: given a range of (0, 1), expected a range for <class 'str'> at check_value()\n"

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        check_value(f_container2)
    assert toolkit_exit.type == MyError
    # print('====== test_check_value() =======\n')
    # print(toolkit_exit.value.message)
    # print('====== test_check_value()2 expected msg =======\n')
    # print(msg)
    print(toolkit_exit.value.message)
    print("msg")
    print(msg)
    assert toolkit_exit.value.message == msg


def test_convert_to_set():
    assert convert_to_set("s") == {
        "s",
    }
    assert convert_to_set(1) == {
        1,
    }
    assert convert_to_set({1, 2, 3}) == {1, 2, 3}
    assert convert_to_set((1, 2)) == {1, 2}
    a = [1, 2, 3, 4, 5, 5, 5]
    assert convert_to_set(a) == {1, 2, 3, 4, 5}


def test_get_cpu_count():
    assert get_cpu_count() > 0


def test_check_multiprocessing():
    cpu_count = math.floor(get_cpu_count() / 2)
    assert check_multiprocessing(-1) == 1
    assert check_multiprocessing(0) == cpu_count
    assert check_multiprocessing(1) == 1
    assert check_multiprocessing(2) == min(cpu_count, 2)
    assert check_multiprocessing(8) == min(cpu_count, 8)
    assert check_multiprocessing(32) == min(cpu_count, 32)


@pytest.fixture
def new_clf_setup():
    from veritastool.usecases.base_classification import BaseClassification

    # Load Base Classification Test Data
    file_prop = os.path.join(
        project_root, "veritastool", "examples", "data", "mktg_uplift_acq_dict.pickle"
    )
    input_prop = open(file_prop, "rb")
    cm_prop = pickle.load(input_prop)
    input_prop.close()

    # Model Container Parameters
    y_true = cm_prop["y_test"]
    y_train = cm_prop["y_train"]
    model_name = "base_classification"
    model_type = "classification"
    y_prob = pd.DataFrame(cm_prop["y_prob"], columns=["CN", "CR", "TN", "TR"])
    p_grp = {"isforeign": [0], "isfemale": [0], "isforeign|isfemale": "maj_rest"}
    x_train = cm_prop["X_train"].drop(["ID"], axis=1)
    x_test = cm_prop["X_test"].drop(["ID"], axis=1)
    clf = cm_prop["model"]
    clf = clf.fit(x_train, y_train)
    y_pred = clf.predict(x_test)

    container_clf = ModelContainer(
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
        pos_label=["CR"],
        neg_label=["CN"],
    )
    clf_obj = BaseClassification(
        model_params=[container_clf],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="difference",
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=10,
        tran_pdp_feature=["income", "age"],
        tran_pdp_target="TR",
    )

    yield container_clf, clf_obj


def test_check_data_unassigned(new_clf_setup):
    container_clf, _ = new_clf_setup

    # Check y_true, y_pred arrays shape
    labels_unassigned, counts_unassigned = np.unique(
        container_clf.y_true, return_counts=True
    )
    assert np.array_equal(labels_unassigned, [0, 1])
    assert np.array_equal(counts_unassigned, [3734, 2277])

    labels_unassigned, counts_unassigned = np.unique(
        container_clf.y_pred, return_counts=True
    )
    assert np.array_equal(labels_unassigned, [0, 1])
    assert np.array_equal(counts_unassigned.sum(), 6011)

    # Check y_prob probabilistic array & x_test, protected_features_cols dataframe shape
    assert container_clf.y_prob.shape == container_clf.y_prob.shape
    assert container_clf.x_test.shape[0] == container_clf.y_prob.shape[0]
    assert (
        container_clf.protected_features_cols.shape[0] == container_clf.y_prob.shape[0]
    )


# def test_test_function_cs():
#     test_function_cs()

# def test_test_function_cm():
#     test_function_cm()
