import os
import pickle
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)
import matplotlib
import numpy as np
from sklearn.linear_model import LinearRegression
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.usecases.base_regression import BaseRegression

matplotlib.use("Agg")
import pytest
from aiverify_veritastool.util.errors import *

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
model_object = LinearRegression()
model_name = "base_regression"
model_type = "regression"
model_object.fit(x_train, y_train)

# Create Model Container
container = ModelContainer(
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
    model_params=[container],
    fair_threshold=80,
    perf_metric_name="mape",
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    tran_row_num=[1, 10, 25],
    tran_max_sample=1,
    tran_pdp_feature=["age", "bmi"],
)

base_reg_obj.compile()
base_reg_obj.evaluate()
base_reg_obj.tradeoff()
base_reg_obj.feature_importance()


def test_rootcause(capfd):
    # Check that print statement is shown for regression rootcause
    base_reg_obj.rootcause()
    captured = capfd.readouterr()
    assert (
        captured.out
        == "Root cause analysis is not supported for regression use cases.\n"
    )


def test_feature_imp_corr(capfd):
    base_reg_obj.feature_imp_status_corr = False
    base_reg_obj.feature_importance()

    # Check _print_correlation_analysis
    captured = capfd.readouterr()
    assert "* No surrogate detected based on correlation analysis" in captured.out

    # Check correlation_threshold
    base_reg_obj.feature_imp_status_corr = False
    base_reg_obj.feature_importance(correlation_threshold=0.6)
    assert base_reg_obj.feature_imp_status_corr is True
    assert base_reg_obj.correlation_threshold == 0.6

    # Disable correlation analysis
    base_reg_obj.feature_imp_status_corr = False
    base_reg_obj.feature_importance(disable=["correlation"])
    captured = capfd.readouterr()
    assert "Correlation matrix skipped" in captured.out


def test_compute_correlation():
    # Check top 3 features
    assert len(base_reg_obj.corr_top_3_features) <= 6
    # Check surrogate features
    assert bool(base_reg_obj.surrogate_features["sex"]) is False


@pytest.mark.parametrize(
    "p_grp", [({"sex": [1], "children": "max_bias"}), ({"sex": "max_bias"})]
)
def test_policy_max_bias(p_grp):
    p_grp_policy = p_grp
    container = ModelContainer(
        y_true,
        p_grp_policy,
        model_type,
        model_name,
        y_pred,
        y_train=y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model_object,
    )
    base_reg_obj = BaseRegression(
        model_params=[container],
        fair_threshold=80,
        perf_metric_name="mape",
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        tran_row_num=[1, 10, 25],
        tran_max_sample=1,
        tran_pdp_feature=["age", "bmi"],
    )

    if "children" in p_grp:
        assert base_reg_obj.model_params[0].p_grp["children"][0] == [5]
        assert base_reg_obj.model_params[0].up_grp["children"][0] == [4]
    else:
        assert base_reg_obj.model_params[0].p_grp["sex"][0] == [1]
        assert base_reg_obj.model_params[0].up_grp["sex"][0] == [0]


def test_mitigate(capfd):
    base_reg_obj.mitigate(p_var=[], method=[])
    captured = capfd.readouterr()
    assert "Bias mitigation is not supported for regression use cases." in captured.out
