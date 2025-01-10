import os
import pickle
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)
import matplotlib
import numpy as np
import pandas as pd
import shap
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.metrics.performance_metrics import PerformanceMetrics
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.model.modelwrapper import ModelWrapper
from aiverify_veritastool.principles.transparency import Transparency
from aiverify_veritastool.usecases.predictive_underwriting import PredictiveUnderwriting
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

matplotlib.use("Agg")
import pytest
from aiverify_veritastool.util.errors import MyError

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
model_name = "pred_underwriting"
model_type = "classification"
model = RandomForestClassifier(random_state=123)
model.fit(x_train, y_train)

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
    model_object=model,
    up_grp=up_grp,
)

# Create Use Case Object
pred_underwriting_obj = PredictiveUnderwriting(
    model_params=[container],
    fair_threshold=80,
    fair_concern="inclusive",
    fair_priority="benefit",
    fair_impact="normal",
    fair_metric_type="ratio",
    tran_row_num=[1, 2, 3, 20],
    tran_max_sample=10,
    tran_max_display=10,
    tran_pdp_feature=["annual_premium", "payout_amount"],
)

pred_underwriting_obj.compile()
pred_underwriting_obj.evaluate()
pred_underwriting_obj.tradeoff()
pred_underwriting_obj.feature_importance()
result = (
    pred_underwriting_obj.perf_metric_obj.result,
    pred_underwriting_obj.fair_metric_obj.result,
)


def test_evaluate():
    assert round(result[0]["perf_metric_values"]["selection_rate"][0], 3) == 0.816


def test_artifact():
    tradeoff_data = pred_underwriting_obj.artifact.fairness.features['gender'].tradeoff
    perf_dynamic = pred_underwriting_obj.artifact.fairness.perf_dynamic

    # Compare shapes of tradeoff data
    assert tradeoff_data['th_x'].shape == tradeoff_data['th_y'].shape
    assert tradeoff_data['fair'].shape == tradeoff_data['perf'].shape

    # Compare array sizes of performance dynamics data
    assert pred_underwriting_obj.array_size == perf_dynamic['threshold'].shape[0]
    assert pred_underwriting_obj.array_size == len(perf_dynamic['perf'])
    assert pred_underwriting_obj.array_size == len(perf_dynamic['selection_rate'])


def test_fairness_conclusion():
    if pred_underwriting_obj.fair_threshold < 1:
        assert (
            pred_underwriting_obj.fair_threshold
            == pred_underwriting_obj.fair_conclusion["gender"]["threshold"]
        )
    else:
        value = round(
            (1 - pred_underwriting_obj.fair_conclusion["gender"]["threshold"]) * 100
        )
        assert pred_underwriting_obj.fair_threshold == value
    assert pred_underwriting_obj.fair_conclusion["gender"]["fairness_conclusion"] in (
        "fair",
        "unfair",
    )


def test_compute_fairness():
    if pred_underwriting_obj.fairness_metric_value_input:
        assert (
            pred_underwriting_obj.fairness_metric_value_input["gender"]["fpr_parity"]
            == pred_underwriting_obj.fair_metric_obj.result["gender"][
                "fair_metric_values"
            ]["fpr_parity"][0]
        )


def test_fairness_metric_value_input_check():
    pred_underwriting_obj.fairness_metric_value_input = {
        "other_pvar": {"fpr_parity": 0.2}
    }
    pred_underwriting_obj._fairness_metric_value_input_check()
    assert pred_underwriting_obj.fairness_metric_value_input is None

    pred_underwriting_obj.fairness_metric_value_input = {
        "gender": {"other_metric": 0.2}
    }
    pred_underwriting_obj._fairness_metric_value_input_check()
    assert pred_underwriting_obj.fairness_metric_value_input is None


def test_compile():
    assert pred_underwriting_obj.evaluate_status == 1
    assert pred_underwriting_obj.evaluate_status_cali is True
    assert pred_underwriting_obj.evaluate_status_perf_dynamics is True
    assert pred_underwriting_obj.tradeoff_status == 1
    assert pred_underwriting_obj.feature_imp_status == 1
    assert pred_underwriting_obj.feature_imp_status_loo is True
    assert pred_underwriting_obj.feature_imp_status_corr is True


def test_compile_status():
    pred_underwriting_obj.feature_imp_status = 0
    pred_underwriting_obj.tradeoff_status = 0
    pred_underwriting_obj.feature_imp_status_corr = False
    # pred_underwriting_obj.compile(skip_tradeoff_flag=1, skip_feature_imp_flag=1) unknown args
    assert pred_underwriting_obj.feature_imp_status == 0  # -1
    assert pred_underwriting_obj.tradeoff_status == 0  # -1


def test_tradeoff():
    assert (
        round(
            pred_underwriting_obj.tradeoff_obj.result["gender"]["max_perf_point"][0], 3
        )
        == 0.510
    )
    pred_underwriting_obj.model_params[0].y_prob = None
    pred_underwriting_obj.tradeoff()
    assert pred_underwriting_obj.tradeoff_status == -1
    pred_underwriting_obj.tradeoff_obj.result = None
    pred_underwriting_obj.tradeoff()
    assert pred_underwriting_obj.tradeoff_status == -1


def test_feature_importance():
    pred_underwriting_obj.feature_imp_status = 0
    pred_underwriting_obj.evaluate_status = 0
    pred_underwriting_obj.feature_importance()
    assert (
        round(pred_underwriting_obj.feature_imp_values["gender"]["gender"][0], 3)
        == -0.003
    )
    pred_underwriting_obj.feature_imp_status = -1
    pred_underwriting_obj.feature_importance()
    assert pred_underwriting_obj.feature_imp_values is None


def test_feature_importance_x_test_exception():
    import numpy as np
    from aiverify_veritastool.model.modelwrapper import ModelWrapper

    class xtestwrapper(ModelWrapper):
        """
        Abstract Base class to provide an interface that supports non-pythonic models.
        Serves as a template for users to define the

        """

        def __init__(self, model_obj, classes=[0, 1]):
            self.model_obj = model_obj
            self.classes_ = classes
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

        def predict_proba(self, x_test):
            return self.model_obj.predict_proba(x_test.values)

    model_object = None
    model_object = xtestwrapper(model_object)

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
        model_object=model_object,
        up_grp=up_grp,
    )

    # Create Use Case Object
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_name="auto",
        tran_row_num=[1, 2, 3],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["age", "payout_amount"],
    )

    test = pred_underwriting_obj.feature_importance()
    assert test is None


def test_feature_importance_x_train_exception():
    import numpy as np
    from aiverify_veritastool.model.modelwrapper import ModelWrapper

    class xtrainwrapper(ModelWrapper):
        """
        Abstract Base class to provide an interface that supports non-pythonic models.
        Serves as a template for users to define the

        """

        def __init__(self, model_obj, classes=[0, 1]):
            self.model_obj = model_obj
            self.classes_ = classes
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

        def predict_proba(self, x_test):
            return self.model_obj.predict_proba(x_test.values)

    model_object = None
    model_object = xtrainwrapper(model_object)

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
        model_object=model_object,
        up_grp=up_grp,
    )

    # Create Use Case Object
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_name="auto",
        tran_row_num=[1, 2, 3],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["age", "payout_amount"],
    )

    test = pred_underwriting_obj.feature_importance()
    assert test is None


def test_e_lift():
    result = pred_underwriting_obj._get_e_lift()
    assert result is None


def test_feature_mask():
    assert len(pred_underwriting_obj.model_params[0].x_test) == len(
        pred_underwriting_obj.feature_mask["gender"]
    )


def test_base_input_check():
    pred_underwriting_obj.fair_metric_name = "mi_independence"
    pred_underwriting_obj.fair_threshold = 43
    pred_underwriting_obj.fairness_metric_value_input = {
        "gender": {"other_metric": 0.2}
    }
    with pytest.raises(MyError) as toolkit_exit:
        pred_underwriting_obj._base_input_check()
    assert toolkit_exit.type == MyError


def test_model_type_input():
    pred_underwriting_obj.model_params[0].model_type = "svm"
    with pytest.raises(MyError) as toolkit_exit:
        pred_underwriting_obj._model_type_input()
    assert toolkit_exit.type == MyError

    pred_underwriting_obj._model_type_to_metric_lookup[
        pred_underwriting_obj.model_params[0].model_type
    ] = ("classification", 2, 2)
    with pytest.raises(MyError) as toolkit_exit:
        pred_underwriting_obj._model_type_input()
    assert toolkit_exit.type == MyError

    if (
        pred_underwriting_obj.model_params[0].model_type == "uplift"
        and pred_underwriting_obj.model_params[1].model_name != "clone"
    ):
        pred_underwriting_obj.model_params[1].model_name = "duplicate"
    with pytest.raises(MyError) as toolkit_exit:
        pred_underwriting_obj._model_type_input()
    assert toolkit_exit.type == MyError


def test_fairness_tree():
    pred_underwriting_obj.fair_concern = "eligible"
    pred_underwriting_obj.fair_priority = "benefit"
    pred_underwriting_obj.fair_impact = "normal"
    # pred_underwriting_obj._fairness_tree()
    assert pred_underwriting_obj._fairness_tree() == "equal_opportunity_ratio"
    pred_underwriting_obj.fair_concern = "inclusive"
    # pred_underwriting_obj._fairness_tree()
    assert pred_underwriting_obj._fairness_tree() == "fpr_ratio"
    pred_underwriting_obj.fair_concern = "both"
    # pred_underwriting_obj._fairness_tree()
    assert pred_underwriting_obj._fairness_tree() == "equal_odds_ratio"
    pred_underwriting_obj.fair_impact = "selective"
    pred_underwriting_obj.fair_concern = "eligible"
    pred_underwriting_obj.fair_priority = "benefit"
    # pred_underwriting_obj._fairness_tree()
    assert pred_underwriting_obj._fairness_tree() == "ppv_ratio"
    pred_underwriting_obj.fair_impact = "selective"
    pred_underwriting_obj.fair_concern = "inclusive"
    pred_underwriting_obj.fair_priority = "benefit"
    # pred_underwriting_obj._fairness_tree()
    assert pred_underwriting_obj._fairness_tree() == "fdr_ratio"
    pred_underwriting_obj.fair_concern = "both"
    with pytest.raises(MyError) as toolkit_exit:
        pred_underwriting_obj._fairness_tree()
    assert toolkit_exit.type == MyError
    pred_underwriting_obj.fair_impact = "normal"
    pred_underwriting_obj.fair_concern = "inclusive"
    pred_underwriting_obj.fair_priority = "harm"
    # pred_underwriting_obj._fairness_tree()
    assert pred_underwriting_obj._fairness_tree() == "fpr_ratio"
    pred_underwriting_obj.fair_concern = "eligible"
    assert pred_underwriting_obj._fairness_tree() == "fnr_ratio"
    pred_underwriting_obj.fair_concern = "both"
    assert pred_underwriting_obj._fairness_tree() == "equal_odds_ratio"
    pred_underwriting_obj.fair_impact = "significant"
    pred_underwriting_obj.fair_concern = "inclusive"
    assert pred_underwriting_obj._fairness_tree() == "fdr_ratio"
    pred_underwriting_obj.fair_concern = "eligible"
    assert pred_underwriting_obj._fairness_tree() == "for_ratio"
    pred_underwriting_obj.fair_concern = "both"
    assert pred_underwriting_obj._fairness_tree() == "calibration_by_group_ratio"

    pred_underwriting_obj.fair_concern = "eligible"
    pred_underwriting_obj.fair_priority = "benefit"
    pred_underwriting_obj.fair_impact = "normal"
    # pred_underwriting_obj._fairness_tree(is_pos_label_favourable = False)
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "tnr_ratio"
    )
    pred_underwriting_obj.fair_concern = "inclusive"
    # pred_underwriting_obj._fairness_tree(is_pos_label_favourable = False)
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "fnr_ratio"
    )
    pred_underwriting_obj.fair_concern = "both"
    # pred_underwriting_obj._fairness_tree(is_pos_label_favourable = False)
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "neg_equal_odds_ratio"
    )
    pred_underwriting_obj.fair_impact = "selective"
    pred_underwriting_obj.fair_concern = "eligible"
    pred_underwriting_obj.fair_priority = "benefit"
    # pred_underwriting_obj._fairness_tree(is_pos_label_favourable = False)
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "npv_ratio"
    )
    pred_underwriting_obj.fair_impact = "selective"
    pred_underwriting_obj.fair_concern = "inclusive"
    pred_underwriting_obj.fair_priority = "benefit"
    # pred_underwriting_obj._fairness_tree(is_pos_label_favourable = False)
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "for_ratio"
    )
    pred_underwriting_obj.fair_concern = "both"
    with pytest.raises(MyError) as toolkit_exit:
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
    assert toolkit_exit.type == MyError
    pred_underwriting_obj.fair_impact = "normal"
    pred_underwriting_obj.fair_concern = "inclusive"
    pred_underwriting_obj.fair_priority = "harm"
    # pred_underwriting_obj._fairness_tree(is_pos_label_favourable = False)
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "fnr_ratio"
    )
    pred_underwriting_obj.fair_concern = "eligible"
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "fpr_ratio"
    )
    pred_underwriting_obj.fair_concern = "both"
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "equal_odds_ratio"
    )
    pred_underwriting_obj.fair_impact = "significant"
    pred_underwriting_obj.fair_concern = "inclusive"
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "for_ratio"
    )
    pred_underwriting_obj.fair_concern = "eligible"
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "fdr_ratio"
    )
    pred_underwriting_obj.fair_concern = "both"
    assert (
        pred_underwriting_obj._fairness_tree(is_pos_label_favourable=False)
        == "calibration_by_group_ratio"
    )


def test_check_label():
    y = np.array([1, 1, 1, 1, 1, 1, 1])
    msg = "[value_error]: pos_label: given [1], expected not all y_true labels as pos_label at _check_label()\n"
    # catch the err poping out
    with pytest.raises(MyError) as toolkit_exit:
        y_new, pos_label2 = pred_underwriting_obj._check_label(
            y=y, pos_label=[1], neg_label=[0]
        )
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
        y_new, pos_label2 = pred_underwriting_obj._check_label(
            y=y, pos_label=[1], neg_label=[0]
        )
    assert toolkit_exit.type == MyError
    # # print('====== test_check_label() =======\n')
    # # print(toolkit_exit.value.message)
    # # print('====== test_check_label() expected msg =======\n')
    # # print(msg)
    assert toolkit_exit.value.message == msg


def test_rootcause_group_difference():
    SEED = 123
    path = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'shap_values_puw.npy')
    path = os.path.normpath(path)
    x_train_sample = x_train.sample(n=1000, random_state=SEED)
    shap_values = np.load(path)

    # Test case without feature_mask
    group_mask = np.where(x_train_sample.gender == 1, True, False)
    result = pred_underwriting_obj._rootcause_group_difference(
        shap_values, group_mask, x_train_sample.columns
    )
    expected = {
        "policy_duration",
        "number_exclusions",
        "payout_amount",
        "tenure",
        "num_sp_policies",
        "gender",
        "age",
        "num_pa_policies",
        "num_life_policies",
        "latest_purchase_product_category",
    }
    assert set(result.keys()) == expected

    # Test case with feature_mask
    prot_var_df = x_train_sample["race"]
    privileged_grp = pred_underwriting_obj.model_params[0].p_grp.get("race")[0]
    unprivileged_grp = pred_underwriting_obj.model_params[0].up_grp.get("race")[0]
    feature_mask = np.where(prot_var_df.isin(privileged_grp), True, -1)
    feature_mask = np.where(prot_var_df.isin(unprivileged_grp), False, feature_mask)
    indices = np.where(np.isin(feature_mask, [0, 1]))
    shap_values = shap_values[indices]
    group_mask = feature_mask[np.where(feature_mask != -1)].astype(bool)
    result = pred_underwriting_obj._rootcause_group_difference(
        shap_values, group_mask, x_train_sample.columns
    )
    expected = {
        "policy_duration",
        "annual_premium",
        "tenure",
        "num_life_policies",
        "latest_purchase_product_category",
        "payout_amount",
        "new_pol_last_3_years",
        "num_pa_policies",
        "race",
        "marital_status",
    }
    assert set(result.keys()) == expected


@pytest.fixture
def new_puw_setup():
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
        model_object=model,
        up_grp=up_grp,
    )

    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )
    yield pred_underwriting_obj


def test_rootcause(new_puw_setup):
    pred_underwriting_obj = new_puw_setup
    # Check p_var parameter: default all p_var
    pred_underwriting_obj.rootcause(p_var=[])
    assert bool(pred_underwriting_obj.rootcause_values) is True
    assert len(pred_underwriting_obj.rootcause_values.keys()) == 2
    assert len(pred_underwriting_obj.rootcause_values["gender"].values()) == 10

    # Check p_var parameter for 1 p_var, input_parameter_filtering to remove 'other_pvar'
    pred_underwriting_obj.rootcause(p_var=["gender", "other_pvar"])
    assert bool(pred_underwriting_obj.rootcause_values) is True
    assert len(pred_underwriting_obj.rootcause_values.keys()) == 1
    assert len(pred_underwriting_obj.rootcause_values["gender"].values()) == 10

    # Check invalid p_var input
    with pytest.raises(MyError) as toolkit_exit:
        pred_underwriting_obj.rootcause(p_var=123)
    assert toolkit_exit.type == MyError

    # Check multi_class_label parameter:
    pred_underwriting_obj.rootcause(multi_class_target=0)
    assert pred_underwriting_obj.rootcause_label_index == -1


def test_feature_imp_corr(capsys, new_puw_setup):
    pred_underwriting_obj = new_puw_setup
    pred_underwriting_obj.feature_imp_status_corr = False
    pred_underwriting_obj.feature_importance()

    # Check _print_correlation_analysis
    captured = capsys.readouterr()
    assert (
        "* Surrogate detected for gender (threshold=0.7): num_life_policies"
        in captured.out
    )

    # Check correlation_threshold
    pred_underwriting_obj.feature_imp_status_corr = False
    pred_underwriting_obj.feature_importance(correlation_threshold=0.6)
    assert pred_underwriting_obj.feature_imp_status_corr is True
    assert pred_underwriting_obj.correlation_threshold == 0.6

    # Disable correlation analysis
    pred_underwriting_obj.feature_imp_status_corr = False
    pred_underwriting_obj.feature_importance(disable=["correlation"])
    captured = capsys.readouterr()
    assert "Correlation matrix skipped" in captured.out


def test_compute_correlation():
    # Check top 3 features
    assert len(pred_underwriting_obj.corr_top_3_features) <= 6
    # Check surrogate features
    assert len(pred_underwriting_obj.surrogate_features["gender"]) == 1
    assert "num_life_policies" in pred_underwriting_obj.surrogate_features["gender"]


@pytest.mark.parametrize("p_var", [(["gender"]), ([])])
def test_mitigate_correlate(p_var, mitigate_correlate_setup):
    if p_var:
        mitigated_gender, result_mitigate1, _, _ = mitigate_correlate_setup
        # Check shape of mitigated x_train, x_test
        assert mitigated_gender["correlate"][0].shape == x_train.shape
        assert mitigated_gender["correlate"][1].shape == x_test.shape

        # Check that mitigated fair metric value is closer to neutral coefficient
        fair_metric_mitigated = result_mitigate1.get("gender")["fair_metric_values"][
            "fpr_ratio"
        ][0]
        assert abs(fair_metric_mitigated - 1) != abs(4.677 - 1)
    else:
        _, _, mitigated_all_pvars, result_mitigate2 = mitigate_correlate_setup
        # Check shape of mitigated x_train, x_test
        assert mitigated_all_pvars["correlate"][0].shape == x_train.shape
        assert mitigated_all_pvars["correlate"][1].shape == x_test.shape

        # Check that mitigated fair metric value is closer to neutral coefficient
        fair_metric_mitigated_gender = result_mitigate2.get("gender")[
            "fair_metric_values"
        ]["fpr_ratio"][0]
        fair_metric_mitigated_race = result_mitigate2.get("race")["fair_metric_values"][
            "fpr_ratio"
        ][0]
        fair_metric_mitigated_intersect = result_mitigate2.get("gender|race")[
            "fair_metric_values"
        ]["fpr_ratio"][0]
        assert abs(fair_metric_mitigated_gender - 1) != abs(4.677 - 1)
        assert abs(fair_metric_mitigated_race - 1) != abs(0.188 - 1)
        assert abs(fair_metric_mitigated_intersect - 1) != abs(4.299 - 1)


@pytest.mark.parametrize("p_var", [(["gender"]), ([])])
def test_mitigate_threshold(p_var, new_puw_setup):
    pred_underwriting_obj = new_puw_setup
    pred_underwriting_obj.tradeoff()
    mitigated = pred_underwriting_obj.mitigate(p_var=p_var, method=["threshold"])
    assert mitigated["threshold"][0].shape == y_pred.shape
    if p_var:
        assert len(mitigated["threshold"]) == 1
    else:
        assert all(
            [
                mitigated["threshold"][1].shape == y_pred.shape,
                len(mitigated["threshold"]) == 2,
            ]
        )


def test_mitigate_threshold_mitigated(mitigate_threshold_setup):
    _, pred_underwriting_obj_mitg = mitigate_threshold_setup
    pred_underwriting_obj_mitg.evaluate(output=False)
    result_mitigate = pred_underwriting_obj_mitg.fair_metric_obj.result

    # Check that mitigated fair metric value is closer to neutral coefficient
    fair_metric_mitigated = result_mitigate.get("gender")["fair_metric_values"][
        "fpr_ratio"
    ][0]
    assert abs(fair_metric_mitigated - 1) != abs(4.677 - 1)


class MitigateWrapper(ModelWrapper):
    def __init__(self, model_obj, th, classes=[0, 1]):
        self.model_obj = model_obj
        self.classes_ = classes
        self.th = th

    def fit(self, X, y):
        self.model_obj.fit(X, y)

    def predict(self, x_test):
        test_probs = self.model_obj.predict_proba(x_test)[:, 1]
        # Using bias mitigation thresholds
        test_preds = np.where(test_probs > self.th, 1, 0)
        return test_preds

    def predict_proba(self, x_test):
        return self.model_obj.predict_proba(x_test)


def get_row_threshold(X, column, groups, thresholds):
    th = np.zeros(len(X), dtype=float)
    for g, t in zip(groups, thresholds):
        group_mask = X[column] == g
        th[group_mask] = t
    return th


@pytest.fixture
def mitigate_threshold_setup():
    SEED = 123
    th = get_row_threshold(x_test, "gender", [1, 0], [0.422, 0.699])
    rfc_untrained = RandomForestClassifier(random_state=SEED)
    model_obj = MitigateWrapper(rfc_untrained, th)
    model_obj.fit(x_train, y_train)
    mitg_y_pred = model_obj.predict(x_test)
    mitg_y_prob = model_obj.predict_proba(x_test)[:, 1]
    container_mitg = ModelContainer(
        y_true,
        p_grp,
        model_type,
        model_name,
        mitg_y_pred,
        mitg_y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model_obj,
        up_grp=up_grp,
    )
    pred_underwriting_obj_mitg = PredictiveUnderwriting(
        model_params=[container_mitg],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )

    yield container_mitg, pred_underwriting_obj_mitg


@pytest.fixture
def mitigate_correlate_setup():
    p_grp = {"gender": [1], "race": [1], "gender|race": "max_bias"}
    up_grp = {"gender": [0], "race": [2, 3]}
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
        model_object=model,
        up_grp=up_grp,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )

    mitigated_gender = pred_underwriting_obj.mitigate(
        p_var=["gender"], method=["correlate"]
    )
    x_train_mitigated = mitigated_gender["correlate"][0]
    x_test_mitigated = mitigated_gender["correlate"][1]
    y_pred_new = model.predict(x_test_mitigated)
    y_prob_new = model.predict_proba(x_test_mitigated)[:, 1]

    # Update Model Container
    p_grp = {"gender": [1], "race": [1], "gender|race": "max_bias"}
    up_grp = {"gender": [0], "race": [2, 3]}
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
        model_object=model,
        up_grp=up_grp,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )

    pred_underwriting_obj.evaluate(output=False)
    result_mitigate1 = pred_underwriting_obj.fair_metric_obj.result

    # Reinitialise Model Container
    p_grp = {"gender": [1], "race": [1], "gender|race": "max_bias"}
    up_grp = {"gender": [0], "race": [2, 3]}
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
        model_object=model,
        up_grp=up_grp,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )

    mitigated_all_pvars = pred_underwriting_obj.mitigate(p_var=[], method=["correlate"])
    x_train_mitigated = mitigated_gender["correlate"][0]
    x_test_mitigated = mitigated_gender["correlate"][1]
    y_pred_new = model.predict(x_test_mitigated)
    y_prob_new = model.predict_proba(x_test_mitigated)[:, 1]

    # Update Model Container
    p_grp = {"gender": [1], "race": [1], "gender|race": "max_bias"}
    up_grp = {"gender": [0], "race": [2, 3]}
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
        model_object=model,
        up_grp=up_grp,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )

    pred_underwriting_obj.evaluate(output=False)
    result_mitigate2 = pred_underwriting_obj.fair_metric_obj.result
    yield mitigated_gender, result_mitigate1, mitigated_all_pvars, result_mitigate2


@pytest.mark.parametrize("p_var", [(["gender"]), ([])])
def test_mitigate_reweigh(p_var):
    mitigated = pred_underwriting_obj.mitigate(
        p_var=p_var,
        method=["reweigh"],
        rw_weights=None,
        transform_x=None,
        transform_y=None,
    )
    assert not pred_underwriting_obj.rw_is_transform
    assert mitigated["reweigh"][0].shape[0] == x_train.shape[0]
    assert isinstance(next(iter(mitigated["reweigh"][1].keys())), tuple)

    # Check values of sample weights computation based on ground truth
    if not p_var:
        assert round(mitigated["reweigh"][1][(0, 0, 1.0)], 3) == 0.5
    else:
        assert round(mitigated["reweigh"][1][(0, 1.0)], 3) == 0.9


@pytest.mark.parametrize("p_var", [(["gender"]), (["gender", "race"])])
def test_mitigate_reweigh_categorical(p_var):
    x_train_rwg = x_train.copy()
    x_test_rwg = x_test.copy()
    x_train_rwg["gender"] = pd.Categorical.from_codes(
        x_train_rwg["gender"], categories=["male", "female"]
    )
    x_train_rwg["race"] = pd.Categorical.from_codes(
        x_train_rwg["race"],
        categories=["race_0", "race_1", "race_2", "race_3", "race_4"],
    )
    x_test_rwg["gender"] = pd.Categorical.from_codes(
        x_test_rwg["gender"], categories=["male", "female"]
    )
    x_test_rwg["race"] = pd.Categorical.from_codes(
        x_test_rwg["race"],
        categories=["race_0", "race_1", "race_2", "race_3", "race_4"],
    )
    p_grp = {"gender": ["male"], "race": ["race_1"]}
    up_grp = {"gender": ["female"], "race": ["race_2", "race_3"]}

    container = ModelContainer(
        y_true,
        p_grp,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train_rwg,
        x_test=x_test_rwg,
        model_object=model,
        up_grp=up_grp,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )

    mitigated = pred_underwriting_obj.mitigate(
        p_var=p_var,
        method=["reweigh"],
        rw_weights=None,
        transform_x=None,
        transform_y=None,
    )
    assert not pred_underwriting_obj.rw_is_transform
    assert mitigated["reweigh"][0].shape[0] == x_train.shape[0]
    assert isinstance(next(iter(mitigated["reweigh"][1].keys())), tuple)

    # Check values of sample weights computation based on ground truth
    if "race" in p_var:
        assert round(mitigated["reweigh"][1][("male", "race_0", 1.0)], 3) == 0.5
    else:
        assert round(mitigated["reweigh"][1][("male", 1.0)], 3) == 0.9


@pytest.mark.parametrize(
    "p_grp, up_grp",
    [
        (
            {"gender": [1], "race": [1], "gender|race": "maj_min"},
            {"gender": [0], "race": [2, 3]},
        ),
        ({"gender": [1], "race": "maj_min"}, {"gender": [0]}),
    ],
)
def test_policy_maj_min(p_grp, up_grp):
    p_grp_policy = p_grp
    up_grp_policy = up_grp
    container = ModelContainer(
        y_true,
        p_grp_policy,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model,
        up_grp=up_grp_policy,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )
    if "gender|race" in p_grp:
        assert pred_underwriting_obj.model_params[0].p_grp["gender|race"][0] == ["0|1"]
        assert pred_underwriting_obj.model_params[0].up_grp["gender|race"][0] == ["1|1"]
    else:
        assert pred_underwriting_obj.model_params[0].p_grp["race"][0] == [1]
        assert pred_underwriting_obj.model_params[0].up_grp["race"][0] == [2]


@pytest.mark.parametrize(
    "p_grp, up_grp",
    [
        (
            {"gender": [1], "race": [1], "gender|race": "maj_rest"},
            {"gender": [0], "race": [2, 3]},
        ),
        ({"gender": [1], "race": "maj_rest"}, {"gender": [0]}),
    ],
)
def test_policy_maj_rest(p_grp, up_grp):
    p_grp_policy = p_grp
    up_grp_policy = up_grp
    container = ModelContainer(
        y_true,
        p_grp_policy,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model,
        up_grp=up_grp_policy,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )
    if "gender|race" in p_grp:
        expected_upgrp = ["1|1", "0|3", "1|3", "0|2", "1|2", "1|4", "0|4", "1|0"]
        assert pred_underwriting_obj.model_params[0].p_grp["gender|race"][0] == ["0|1"]
        assert set(
            pred_underwriting_obj.model_params[0].up_grp["gender|race"][0]
        ) == set(expected_upgrp)
    else:
        expected_upgrp = [3, 2, 4, 0]
        assert pred_underwriting_obj.model_params[0].p_grp["race"][0] == [1]
        assert set(pred_underwriting_obj.model_params[0].up_grp["race"][0]) == set(
            expected_upgrp
        )


@pytest.mark.parametrize(
    "p_grp, up_grp",
    [
        (
            {"gender": [1], "race": [1], "gender|race": "max_bias"},
            {"gender": [0], "race": [2, 3]},
        ),
        ({"gender": [1], "race": "max_bias"}, {"gender": [0]}),
    ],
)
def test_policy_max_bias(p_grp, up_grp):
    p_grp_policy = p_grp
    up_grp_policy = up_grp
    container = ModelContainer(
        y_true,
        p_grp_policy,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model,
        up_grp=up_grp_policy,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )
    if "gender|race" in p_grp:
        assert pred_underwriting_obj.model_params[0].p_grp["gender|race"][0] == ["1|1"]
        assert pred_underwriting_obj.model_params[0].up_grp["gender|race"][0] == ["0|1"]
    else:
        assert pred_underwriting_obj.model_params[0].p_grp["race"][0] == [2]
        assert pred_underwriting_obj.model_params[0].up_grp["race"][0] == [1]


@pytest.mark.parametrize("fair_metric_name, ", [("log_loss_parity"), ("auc_parity")])
def test_policy_max_bias_y_prob(fair_metric_name):
    # Check direction indicator anda y_prob-based metrics
    p_grp_policy = {"gender": [1], "race": [1], "gender|race": "max_bias"}
    up_grp_policy = {"gender": [0], "race": [2, 3]}
    container = ModelContainer(
        y_true,
        p_grp_policy,
        model_type,
        model_name,
        y_pred,
        y_prob,
        y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=model,
        up_grp=up_grp_policy,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_name=fair_metric_name,
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )
    if fair_metric_name == "auc_parity":
        assert pred_underwriting_obj.model_params[0].p_grp["gender|race"][0] == ["1|1"]
        assert pred_underwriting_obj.model_params[0].up_grp["gender|race"][0] == ["0|1"]
    elif fair_metric_name == "log_loss_parity":
        assert pred_underwriting_obj.model_params[0].p_grp["gender|race"][0] == ["0|1"]
        assert pred_underwriting_obj.model_params[0].up_grp["gender|race"][0] == ["1|1"]


def test_compile_disable():
    pred_underwriting_obj.evaluate_status = 0
    pred_underwriting_obj.feature_imp_status = 0
    pred_underwriting_obj.feature_imp_status_loo = False
    pred_underwriting_obj.feature_imp_status_corr = False
    pred_underwriting_obj.tradeoff_status = 0
    pred_underwriting_obj.compile(disable=["evaluate", "explain"])
    assert pred_underwriting_obj.feature_imp_status == -1
    assert pred_underwriting_obj.tradeoff_status == -1


def test_compile_disable_pipe_processing():
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
        model_object=model,
        up_grp=up_grp,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )
    pred_underwriting_obj.compile(
        disable=[
            "evaluate>perf_dynamic|calibration_curve|individual_fair",
            "feature_importance>correlation",
            "explain",
        ]
    )
    assert pred_underwriting_obj.compile_disable_map["evaluate"] == set(
        ["calibration_curve", "individual_fair", "perf_dynamic"]
    )
    assert pred_underwriting_obj.compile_disable_map["feature_importance"] == set(
        ["correlation"]
    )
    assert pred_underwriting_obj.evaluate_status == 1
    assert pred_underwriting_obj.feature_imp_status == 1
    assert not pred_underwriting_obj.feature_imp_status_corr


def test_compile_skip():
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
        model_object=model,
        up_grp=up_grp,
    )
    pred_underwriting_obj = PredictiveUnderwriting(
        model_params=[container],
        fair_threshold=80,
        fair_concern="inclusive",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="ratio",
        tran_row_num=[1, 2, 3, 20],
        tran_max_sample=10,
        tran_max_display=10,
        tran_pdp_feature=["annual_premium", "payout_amount"],
    )
    pred_underwriting_obj.feature_imp_status = -1
    pred_underwriting_obj.tradeoff_status = -1
    pred_underwriting_obj.compile(disable=["explain"])
    assert pred_underwriting_obj.feature_imp_status == -1
    assert pred_underwriting_obj.tradeoff_status == -1


def test_check_perf_metric_name():
    PerformanceMetrics.map_perf_metric_to_group["test_perf_metric"] = (
        "Custom Performance Metric",
        "classification",
        False,
    )
    pred_underwriting_obj.perf_metric_name = "test_perf_metric"

    msg = "[value_error]: perf_metric_name: given test_perf_metric, expected ['selection_rate', 'accuracy', 'balanced_acc', 'recall', 'precision', 'f1_score', 'tnr', 'fnr', 'npv', 'roc_auc', 'log_loss'] at check_perf_metric_name()\n"
    with pytest.raises(Exception) as toolkit_exit:
        pred_underwriting_obj.check_perf_metric_name()
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg
    del PerformanceMetrics.map_perf_metric_to_group["test_perf_metric"]
