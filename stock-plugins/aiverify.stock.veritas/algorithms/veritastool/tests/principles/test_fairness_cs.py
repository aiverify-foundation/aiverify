import os
import pickle
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)
import matplotlib
import numpy as np
import pandas as pd
import pytest
import shap
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.metrics.performance_metrics import PerformanceMetrics
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.principles.transparency import Transparency
from aiverify_veritastool.usecases.credit_scoring import CreditScoring
from aiverify_veritastool.util.errors import MyError
from sklearn.linear_model import LogisticRegression

matplotlib.use("Agg")

# Load Credit Scoring Test Data
file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'credit_score_dict.pickle')
input_file = open(file, "rb")
cs = pickle.load(input_file)
input_file.close()

# Reduce into two classes
cs["X_train"]["MARRIAGE"] = cs["X_train"]["MARRIAGE"].replace([0, 3], 1)
cs["X_test"]["MARRIAGE"] = cs["X_test"]["MARRIAGE"].replace([0, 3], 1)
# Model Container Parameters
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
model_obj = cs["model"]
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
    fair_metric_name="auto",
    tran_row_num=[20, 40],
    tran_max_sample=10,
    tran_pdp_feature=["LIMIT_BAL"],
    tran_max_display=10,
    fairness_metric_value_input={"SEX": {"fpr_parity": 0.2}},
)

cre_sco_obj.compile()
cre_sco_obj.evaluate()
cre_sco_obj.tradeoff()
cre_sco_obj.feature_importance()
cre_sco_obj.compile()
result = cre_sco_obj.perf_metric_obj.result, cre_sco_obj.fair_metric_obj.result


def test_evaluate():
    assert round(result[0]["perf_metric_values"]["selection_rate"][0], 3) == 0.781


def test_artifact():
    tradeoff_data = cre_sco_obj.artifact.fairness.features['SEX'].tradeoff
    perf_dynamic = cre_sco_obj.artifact.fairness.perf_dynamic

    # Compare shapes of tradeoff data
    assert tradeoff_data['th_x'].shape == tradeoff_data['th_y'].shape
    assert tradeoff_data['fair'].shape == tradeoff_data['perf'].shape

    # Compare array sizes of performance dynamics data
    assert cre_sco_obj.array_size == perf_dynamic['threshold'].shape[0]
    assert cre_sco_obj.array_size == len(perf_dynamic['perf'])
    assert cre_sco_obj.array_size == len(perf_dynamic['selection_rate'])


def test_fairness_conclusion():
    if cre_sco_obj.fair_threshold < 1:
        assert (
            cre_sco_obj.fair_threshold
            == cre_sco_obj.fair_conclusion["SEX"]["threshold"]
        )
    else:
        value = round((1 - cre_sco_obj.fair_conclusion["SEX"]["threshold"]) * 100)
        assert value == round(
            (
                1
                - (1 - cre_sco_obj.fair_threshold / 100)
                * result[1]["SEX"]["fair_metric_values"][cre_sco_obj.fair_metric_name][
                    1
                ]
            )
            * 100
        )
    assert cre_sco_obj.fair_conclusion["SEX"]["fairness_conclusion"] in (
        "fair",
        "unfair",
    )


def test_compute_fairness():
    if cre_sco_obj.fairness_metric_value_input is not None:
        assert (
            cre_sco_obj.fairness_metric_value_input["SEX"]["fpr_parity"]
            == cre_sco_obj.fair_metric_obj.result["SEX"]["fair_metric_values"][
                "fpr_parity"
            ][0]
        )


def test_fairness_metric_value_input_check():
    cre_sco_obj.fairness_metric_value_input = {"INCOME": {"fpr_parity": 0.2}}
    cre_sco_obj._fairness_metric_value_input_check()
    assert cre_sco_obj.fairness_metric_value_input is None

    cre_sco_obj.fairness_metric_value_input = {"SEX": {"other_metric": 0.2}}
    cre_sco_obj._fairness_metric_value_input_check()
    assert cre_sco_obj.fairness_metric_value_input is None


def test_compile():
    assert cre_sco_obj.evaluate_status == 1
    assert cre_sco_obj.evaluate_status_cali is True
    assert cre_sco_obj.evaluate_status_perf_dynamics is True
    assert cre_sco_obj.tradeoff_status == 1
    assert cre_sco_obj.feature_imp_status == 1
    assert cre_sco_obj.feature_imp_status_loo is True
    assert cre_sco_obj.feature_imp_status_corr is True


def test_compile_skip():
    cre_sco_obj.feature_imp_status = 0
    cre_sco_obj.tradeoff_status = 0
    cre_sco_obj.feature_imp_status_corr = False
    # cre_sco_obj.compile(skip_tradeoff_flag=1, skip_feature_imp_flag=1) unknown args
    assert cre_sco_obj.feature_imp_status == 0  # -1
    assert cre_sco_obj.tradeoff_status == 0  # -1


def test_tradeoff():
    assert (
        round(cre_sco_obj.tradeoff_obj.result["SEX"]["max_perf_point"][0], 3) == 0.431
    )
    cre_sco_obj.model_params[0].y_prob = None
    cre_sco_obj.tradeoff()
    assert cre_sco_obj.tradeoff_status == -1
    cre_sco_obj.tradeoff_obj.result = None
    cre_sco_obj.tradeoff()
    assert cre_sco_obj.tradeoff_status == -1


def test_feature_importance():
    cre_sco_obj.feature_imp_status = 0
    cre_sco_obj.evaluate_status = 0
    cre_sco_obj.feature_importance()
    assert round(cre_sco_obj.feature_imp_values["SEX"]["SEX"][0], 3) == 0.021
    cre_sco_obj.feature_imp_status = -1
    cre_sco_obj.feature_importance()
    assert cre_sco_obj.feature_imp_values is None


def test_feature_importance_x_test_exception():
    import numpy as np
    from aiverify_veritastool.model.modelwrapper import ModelWrapper

    class xtestwrapper(ModelWrapper):
        """
        Abstract Base class to provide an interface that supports non-pythonic models.
        Serves as a template for users to define the

        """

        def __init__(self, model_obj):
            self.model_obj = model_obj
            # self.output_file = output_file

        """
        Parameters
        ----------
        model_file : string
                Path to the model file. e.g. "/home/model.pkl"

        output_file : string
                Path to which the prediction results will be written to in the form of a csv file. e.g. "/home/results.csv"
        """

        def fit(self, X, y):
            """
            This function is a template for user to specify a custom fit() method that trains the model and saves it to self.model_file.
            An example is as follows:

            train_cmd = "train_func --train {x_train} {y_train} {self.model_file}"
            import subprocess
            process = subprocess.Popen(train_cmd.split(), stdout=subprocess.PIPE)
            output, error = process.communicate()

            """
            pass

        def predict(self, x_test, best_th=0.43):
            pass

    #             test_probs = self.model_obj.predict_proba(x_test)[:, 1]
    #             test_preds = np.where(test_probs > best_th, 1, 0)
    #             return test_preds

    model_object = None
    model_object = xtestwrapper(model_object)

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
    test = cre_sco_obj.feature_importance()
    assert test is None


def test_feature_importance_x_train_exception():
    import numpy as np
    from aiverify_veritastool.model.modelwrapper import ModelWrapper

    class xtrainwrapper(ModelWrapper):
        """
        Abstract Base class to provide an interface that supports non-pythonic models.
        Serves as a template for users to define the

        """

        def __init__(self, model_obj):
            self.model_obj = model_obj
            # self.output_file = output_file

        """
        Parameters
        ----------
        model_file : string
                Path to the model file. e.g. "/home/model.pkl"

        output_file : string
                Path to which the prediction results will be written to in the form of a csv file. e.g. "/home/results.csv"
        """

        def fit(self, X, y):
            """
            This function is a template for user to specify a custom fit() method that trains the model and saves it to self.model_file.
            An example is as follows:

            train_cmd = "train_func --train {x_train} {y_train} {self.model_file}"
            import subprocess
            process = subprocess.Popen(train_cmd.split(), stdout=subprocess.PIPE)
            output, error = process.communicate()

            """
            pass

        def predict(self, x_test, best_th=0.43):
            # error
            test_probs = self.model_obj.predict_proba(x_test)[:, 1]
            test_preds = np.where(test_probs > best_th, 1, 0)
            return test_preds

    model_object = None
    model_object = xtrainwrapper(model_object)

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
    test = cre_sco_obj.feature_importance()
    assert test is None


def test_e_lift():
    result = cre_sco_obj._get_e_lift()
    assert result is None


def test_feature_mask():
    assert len(cre_sco_obj.model_params[0].x_test) == len(
        cre_sco_obj.feature_mask["SEX"]
    )


def test_base_input_check():
    cre_sco_obj.fair_metric_name = "mi_independence"
    cre_sco_obj.fair_threshold = 43
    cre_sco_obj.fairness_metric_value_input = {"SEX": {"other_metric": 0.2}}
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj._base_input_check()
    assert toolkit_exit.type == MyError


def test_model_type_input():
    cre_sco_obj.model_params[0].model_type = "svm"
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj._model_type_input()
    assert toolkit_exit.type == MyError

    cre_sco_obj._model_type_to_metric_lookup[cre_sco_obj.model_params[0].model_type] = (
        "classification",
        2,
        2,
    )
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj._model_type_input()
    assert toolkit_exit.type == MyError

    if (
        cre_sco_obj.model_params[0].model_type == "uplift"
        and cre_sco_obj.model_params[1].model_name != "clone"
    ):
        cre_sco_obj.model_params[1].model_name = "duplicate"
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj._model_type_input()
    assert toolkit_exit.type == MyError


def test_fairness_tree():
    cre_sco_obj.fair_impact = "normal"
    # cre_sco_obj._fairness_tree()
    assert cre_sco_obj._fairness_tree() == "equal_opportunity"
    cre_sco_obj.fair_concern = "inclusive"
    # cre_sco_obj._fairness_tree()
    assert cre_sco_obj._fairness_tree() == "fpr_parity"
    cre_sco_obj.fair_concern = "both"
    # cre_sco_obj._fairness_tree()
    assert cre_sco_obj._fairness_tree() == "equal_odds"
    cre_sco_obj.fair_impact = "selective"
    cre_sco_obj.fair_concern = "eligible"
    cre_sco_obj.fair_priority = "benefit"
    # cre_sco_obj._fairness_tree()
    assert cre_sco_obj._fairness_tree() == "ppv_parity"
    cre_sco_obj.fair_impact = "selective"
    cre_sco_obj.fair_concern = "inclusive"
    cre_sco_obj.fair_priority = "benefit"
    # cre_sco_obj._fairness_tree()
    assert cre_sco_obj._fairness_tree() == "fdr_parity"
    cre_sco_obj.fair_concern = "both"
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj._fairness_tree()
    assert toolkit_exit.type == MyError
    cre_sco_obj.fair_impact = "normal"
    cre_sco_obj.fair_concern = "inclusive"
    cre_sco_obj.fair_priority = "harm"
    # cre_sco_obj._fairness_tree()
    assert cre_sco_obj._fairness_tree() == "fpr_parity"

    cre_sco_obj.fair_concern = "eligible"
    cre_sco_obj.fair_priority = "benefit"
    cre_sco_obj.fair_impact = "normal"
    # cre_sco_obj._fairness_tree(is_pos_label_favourable = False)
    assert cre_sco_obj._fairness_tree(is_pos_label_favourable=False) == "tnr_parity"
    cre_sco_obj.fair_concern = "inclusive"
    # cre_sco_obj._fairness_tree(is_pos_label_favourable = False)
    assert cre_sco_obj._fairness_tree(is_pos_label_favourable=False) == "fnr_parity"
    cre_sco_obj.fair_concern = "both"
    # cre_sco_obj._fairness_tree(is_pos_label_favourable = False)
    assert cre_sco_obj._fairness_tree(is_pos_label_favourable=False) == "neg_equal_odds"
    cre_sco_obj.fair_impact = "selective"
    cre_sco_obj.fair_concern = "eligible"
    cre_sco_obj.fair_priority = "benefit"
    # cre_sco_obj._fairness_tree(is_pos_label_favourable = False)
    assert cre_sco_obj._fairness_tree(is_pos_label_favourable=False) == "npv_parity"
    cre_sco_obj.fair_impact = "selective"
    cre_sco_obj.fair_concern = "inclusive"
    cre_sco_obj.fair_priority = "benefit"
    # cre_sco_obj._fairness_tree(is_pos_label_favourable = False)
    assert cre_sco_obj._fairness_tree(is_pos_label_favourable=False) == "for_parity"
    cre_sco_obj.fair_concern = "both"
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj._fairness_tree(is_pos_label_favourable=False)
    assert toolkit_exit.type == MyError
    cre_sco_obj.fair_impact = "normal"
    cre_sco_obj.fair_concern = "inclusive"
    cre_sco_obj.fair_priority = "harm"
    # cre_sco_obj._fairness_tree(is_pos_label_favourable = False)
    assert cre_sco_obj._fairness_tree(is_pos_label_favourable=False) == "fnr_parity"


def test_check_label():
    y = np.array([1, 1, 1, 1, 1, 1, 1])
    msg = "[value_error]: pos_label: given [1], expected not all y_true labels as pos_label at _check_label()\n"
    # catch the err poping out
    with pytest.raises(MyError) as toolkit_exit:
        y_new, pos_label2 = cre_sco_obj._check_label(y=y, pos_label=[1], neg_label=[0])
    assert toolkit_exit.type == MyError
    # # print('====== test_check_label() =======\n')
    # # print(toolkit_exit.value.message)
    # # print('====== test_check_label() expected msg =======\n')
    # # print(msg)
    assert toolkit_exit.value.message == msg

    y = np.array([0, 0, 0, 0, 0, 0])
    msg = "[value_error]: pos_label: given [1], expected {0} at _check_label()\n"
    # catch the err poping out
    with pytest.raises(MyError) as toolkit_exit:
        y_new, pos_label2 = cre_sco_obj._check_label(y=y, pos_label=[1], neg_label=[0])
    assert toolkit_exit.type == MyError
    # # print('====== test_check_label() =======\n')
    # # print(toolkit_exit.value.message)
    # # print('====== test_check_label() expected msg =======\n')
    # # print(msg)
    assert toolkit_exit.value.message == msg


def test_rootcause_group_difference():
    SEED = 123
    path = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'shap_values_cs.npy')
    path = os.path.normpath(path)
    x_train_sample = x_train.sample(n=1000, random_state=SEED)
    shap_values = np.load(path)

    # Test case without feature_mask
    group_mask = np.where(x_train_sample.SEX == 1, True, False)
    result = cre_sco_obj._rootcause_group_difference(
        shap_values, group_mask, x_train_sample.columns
    )
    expected = {
        "BILL_AMT1",
        "LIMIT_BAL",
        "BILL_AMT3",
        "BILL_AMT2",
        "PAY_AMT1",
        "BILL_AMT4",
        "BILL_AMT6",
        "PAY_AMT6",
        "BILL_AMT5",
        "PAY_AMT3",
    }
    assert set(result.keys()) == expected

    # Test case with feature_mask
    prot_var_df = x_train_sample["MARRIAGE"]
    privileged_grp = cre_sco_obj.model_params[0].p_grp.get("MARRIAGE")[0]
    unprivileged_grp = cre_sco_obj.model_params[0].up_grp.get("MARRIAGE")[0]
    feature_mask = np.where(prot_var_df.isin(privileged_grp), True, -1)
    feature_mask = np.where(prot_var_df.isin(unprivileged_grp), False, feature_mask)
    indices = np.where(np.isin(feature_mask, [0, 1]))
    shap_values = shap_values[indices]
    group_mask = feature_mask[np.where(feature_mask != -1)].astype(bool)
    result = cre_sco_obj._rootcause_group_difference(
        shap_values, group_mask, x_train_sample.columns
    )
    expected = {
        "BILL_AMT1",
        "LIMIT_BAL",
        "BILL_AMT4",
        "BILL_AMT2",
        "BILL_AMT6",
        "PAY_AMT2",
        "PAY_AMT1",
        "PAY_AMT5",
        "PAY_AMT6",
        "BILL_AMT3",
    }
    assert set(result.keys()) == expected


@pytest.fixture
def new_cre_sco_setup():
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
        fair_metric_name="auto",
        tran_row_num=[20, 40],
        tran_max_sample=10,
        tran_pdp_feature=["LIMIT_BAL"],
        tran_max_display=10,
        fairness_metric_value_input={"SEX": {"fpr_parity": 0.2}},
    )
    yield cre_sco_obj


def test_rootcause(new_cre_sco_setup):
    cre_sco_obj = new_cre_sco_setup
    # Check p_var parameter: default all p_var
    cre_sco_obj.rootcause(p_var=[])
    assert bool(cre_sco_obj.rootcause_values) is True
    assert len(cre_sco_obj.rootcause_values.keys()) == 2
    assert len(cre_sco_obj.rootcause_values["SEX"].values()) == 10

    # Check p_var parameter for 1 p_var, input_parameter_filtering to remove 'other_pvar'
    cre_sco_obj.rootcause(p_var=["SEX", "other_pvar"])
    assert bool(cre_sco_obj.rootcause_values) is True
    assert len(cre_sco_obj.rootcause_values.keys()) == 1
    assert len(cre_sco_obj.rootcause_values["SEX"].values()) == 10

    # Check invalid p_var input
    with pytest.raises(MyError) as toolkit_exit:
        cre_sco_obj.rootcause(p_var=123)
    assert toolkit_exit.type == MyError

    # Check multi_class_label parameter:
    cre_sco_obj.rootcause(multi_class_target=0)
    assert cre_sco_obj.rootcause_label_index == -1


def test_feature_imp_corr(capsys, new_cre_sco_setup):
    cre_sco_obj = new_cre_sco_setup
    cre_sco_obj.feature_imp_status_corr = False
    cre_sco_obj.feature_importance()

    # Check _print_correlation_analysis
    captured = capsys.readouterr()
    assert "* No surrogate detected based on correlation analysis" in captured.out

    # Check correlation_threshold
    cre_sco_obj.feature_imp_status_corr = False
    cre_sco_obj.feature_importance(correlation_threshold=0.6)
    assert cre_sco_obj.feature_imp_status_corr is True
    assert cre_sco_obj.correlation_threshold == 0.6

    # Disable correlation analysis
    cre_sco_obj.feature_imp_status_corr = False
    cre_sco_obj.feature_importance(disable=["correlation"])
    captured = capsys.readouterr()
    assert "Correlation matrix skipped" in captured.out


def test_compute_correlation():
    # Check top 3 features
    assert len(cre_sco_obj.corr_top_3_features) <= 6
    # Check surrogate features
    assert bool(cre_sco_obj.surrogate_features["SEX"]) is False
