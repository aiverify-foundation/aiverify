import os
import pickle
import sys

project_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
sys.path.insert(0, project_root)
import numpy as np
import pandas as pd
import pytest

# from veritastool.custom.LRwrapper import LRwrapper
from sklearn.linear_model import LogisticRegression
from veritastool.metrics.fairness_metrics import FairnessMetrics
from veritastool.metrics.performance_metrics import PerformanceMetrics
from veritastool.model.model_container import ModelContainer
from veritastool.principles.fairness import Fairness
from veritastool.usecases.credit_scoring import CreditScoring
from veritastool.util.errors import MyError

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
num_applicants = {"SEX": [5841, 5841], "MARRIAGE": [5841, 5841]}
base_default_rate = {"SEX": [0.5, 0.5], "MARRIAGE": [0.5, 0.5]}
# model_object = LRwrapper(model_object)


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

cre_sco_obj = CreditScoring(
    model_params=[container],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    perf_metric_name="accuracy",
    num_applicants=num_applicants,
    base_default_rate=base_default_rate,
    tran_row_num=[20, 40],
    tran_max_sample=10,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=10,
)


def test_check_input():
    cre_sco_obj._model_type_to_metric_lookup[cre_sco_obj.model_params[0].model_type] = (
        "classification",
        4,
        2,
    )
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj._check_input()
    assert toolkit_exit.type == MyError
    cre_sco_obj._model_type_to_metric_lookup[cre_sco_obj.model_params[0].model_type] = (
        "classification",
        2,
        1,
    )
    # cre_sco_obj.model_params[0].y_pred = None
    # with pytest.raises(MyError) as toolkit_exit:
    #     cre_sco_obj._check_input()
    # assert toolkit_exit.type == MyError


def test_check_special_params():
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
    num_applicants = 1
    base_default_rate = 2
    # model_object = LRwrapper(model_object)

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
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=0.43,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    # cre_sco_obj.spl_params = {'num_applicants': 1, 'base_default_rate': 2}

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
    num_applicants = {"SEX": ["3500", 5000], "MARRIAGE": [3500, 5000]}
    base_default_rate = {"SEX": [0.10, 0.05], "MARRIAGE": [0.10, 0.05]}
    # model_object = LRwrapper(model_object)

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
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
    # cre_sco_obj.spl_params  = {'num_applicants': {'SEX': ['3500', '5000'], 'MARRIAGE': [3500, 5000]},
    # 'base_default_rate': {'SEX': [0.1, 0.05], 'MARRIAGE': [0.1, 0.05]}}
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
    base_default_rate = {"SEX": ["0.10", 0.05], "MARRIAGE": [0.10, 0.05]}
    # model_object = LRwrapper(model_object)

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
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
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
    num_applicants = {"SEX": [-3500, 5000], "MARRIAGE": [3500, 5000]}
    base_default_rate = {"SEX": [0.10, 0.05], "MARRIAGE": [0.10, 0.05]}
    # model_object = LRwrapper(model_object)

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

    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
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
    base_default_rate = {"SEX": [-0.10, 0.05], "MARRIAGE": [0.10, 0.05]}
    # model_object = LRwrapper(model_object)

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

    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
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
    num_applicants = {"SEX": [3500, 5000, 3500], "MARRIAGE": [3500, 5000, 3500]}
    base_default_rate = {"SEX": [-0.10, 0.05], "MARRIAGE": [0.10, 0.05]}
    # model_object = LRwrapper(model_object)

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
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
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
    base_default_rate = {"SEX": [0.1, 0.05, 0.1], "MARRIAGE": [0.1, 0.05, 0.1]}
    # model_object = LRwrapper(model_object)

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

    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
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
    base_default_rate = {"SEX": [0.001, 0.005], "MARRIAGE": [0.001, 0.005]}
    # model_object = LRwrapper(model_object)

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
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError
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
    # model_object = LRwrapper(model_object)

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
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj = CreditScoring(
            model_params=[container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            fair_metric_name="mi_independence",
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=["LIMIT_BAL"],
            tran_max_display=10,
        )
    assert toolkit_exit.type == MyError


def test_get_confusion_matrix():
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
    num_applicants = {"SEX": [3500.0, 5000.0], "MARRIAGE": [3500.0, 5000.0]}
    base_default_rate = {"SEX": [0.10, 0.05], "MARRIAGE": [0.10, 0.05]}
    # model_object = LRwrapper(model_object)

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
    y_true_reshape = np.array(cre_sco_obj.model_params[0].y_true).reshape(1, 1, -1)
    y_pred_reshape = np.array(cre_sco_obj.model_params[0].y_pred).reshape(1, 1, -1)
    result = cre_sco_obj._get_confusion_matrix_optimized(y_true_reshape, None, None)
    assert len(result) == 4
    assert np.all(np.equal(result[0], None))

    result = cre_sco_obj._get_confusion_matrix_optimized(
        y_true_reshape, None, None, curr_p_var="SEX"
    )
    assert len(result) == 8
    assert np.all(np.equal(result[0], None))

    cre_sco_obj.spl_params = {
        "num_applicants": {"SEX": [3500, 5000], "MARRIAGE": [3500, 5000]},
        "base_default_rate": {"SEX": [0.1, 0.05], "MARRIAGE": [0.1, 0.05]},
    }
    result = cre_sco_obj._get_confusion_matrix_optimized(
        y_true_reshape, y_pred_reshape, None
    )
    assert len(result) == 4
    assert tuple(round(a.item(), 1) for a in result) == (5039, 819, 840, 802)
    cre_sco_obj._rejection_inference_flag = {"SEX": False, "MARRIAGE": False}
    cre_sco_obj.spl_params = {
        "num_applicants": {"SEX": [3500, 5000], "MARRIAGE": [3500, 5000]},
        "base_default_rate": {"SEX": [0.1, 0.05], "MARRIAGE": [0.1, 0.05]},
    }
    result = cre_sco_obj._get_confusion_matrix_optimized(
        y_true=y_true_reshape,
        y_pred=y_pred_reshape,
        sample_weight=np.array([0.7 for x in range(len(y_pred))]),
        curr_p_var="SEX",
        feature_mask=cre_sco_obj.feature_mask,
    )
    assert len(result) == 8
    #     assert result == (113.4000000000003,
    #  18.199999999999992,
    #  30.79999999999998,
    #  45.500000000000036,
    #  241.49999999999852,
    #  24.499999999999986,
    #  26.599999999999984,
    #  24.499999999999986)
    assert tuple(round(a.item(), 1) for a in result) == (
        1309.7,
        255.5,
        275.8,
        273,
        2217.6,
        317.8,
        312.2,
        288.4,
    )
