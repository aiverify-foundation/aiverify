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
from aiverify_veritastool.usecases.base_classification import BaseClassification
from aiverify_veritastool.util.errors import MyError
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score
from sklearn.tree import DecisionTreeClassifier

matplotlib.use("Agg")
module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))

sys.path.append(module_path)
import selection
import uplift
import util

# Load Base Classification Test Data
file_prop = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle'),
input_prop = open(file_prop[0], "rb")
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
    model_object=clf,
    pos_label=["TR", "CR"],
    neg_label=["TN", "CN"],
)

# Create Use Case Object
clf_obj = BaseClassification(
    model_params=[container],
    fair_threshold=80,
    fair_concern="eligible",
    fair_priority="benefit",
    fair_impact="normal",
    fair_metric_name="auto",
    perf_metric_name="accuracy",
    tran_row_num=[12, 42],
    tran_max_sample=10,
    tran_pdp_feature=["income", "age"],
    tran_pdp_target="TR",
)

clf_obj.compile()
clf_obj.evaluate()
clf_obj.tradeoff()
clf_obj.feature_importance()
clf_obj.rootcause()
result = clf_obj.perf_metric_obj.result, clf_obj.fair_metric_obj.result


def test_evaluate():
    assert round(result[0]["perf_metric_values"]["selection_rate"][0], 3) == 0.306


def test_artifact():
    tradeoff_data = clf_obj.artifact.fairness.features['isforeign'].tradeoff
    perf_dynamic = clf_obj.artifact.fairness.perf_dynamic

    # Compare shapes of tradeoff data
    assert tradeoff_data['th_x'].shape == tradeoff_data['th_y'].shape
    assert tradeoff_data['fair'].shape == tradeoff_data['perf'].shape

    # Compare array sizes of performance dynamics data
    assert clf_obj.array_size == perf_dynamic['threshold'].shape[0]
    assert clf_obj.array_size == len(perf_dynamic['perf'])
    assert clf_obj.array_size == len(perf_dynamic['selection_rate'])


def test_fairness_conclusion():
    if clf_obj.fair_threshold < 1:
        assert (
            clf_obj.fair_threshold == clf_obj.fair_conclusion["isforeign"]["threshold"]
        )
    else:
        value = round((1 - clf_obj.fair_conclusion["isforeign"]["threshold"]) * 100)
        assert value == round(
            (
                1
                - (1 - clf_obj.fair_threshold / 100)
                * result[1]["isforeign"]["fair_metric_values"][
                    clf_obj.fair_metric_name
                ][1]
            )
            * 100
        )
    assert clf_obj.fair_conclusion["isforeign"]["fairness_conclusion"] in (
        "fair",
        "unfair",
    )


def test_compute_fairness():
    if clf_obj.fairness_metric_value_input:
        assert (
            clf_obj.fairness_metric_value_input["isforeign"]["fpr_parity"]
            == clf_obj.fair_metric_obj.result["isforeign"]["fair_metric_values"][
                "fpr_parity"
            ][0]
        )


def test_fairness_metric_value_input_check():
    clf_obj.fairness_metric_value_input = {"other_pvar": {"fpr_parity": 0.2}}
    clf_obj._fairness_metric_value_input_check()
    assert clf_obj.fairness_metric_value_input is None

    clf_obj.fairness_metric_value_input = {"isforeign": {"other_metric": 0.2}}
    clf_obj._fairness_metric_value_input_check()
    assert clf_obj.fairness_metric_value_input is None


def test_compile():
    assert clf_obj.evaluate_status == 1
    assert clf_obj.evaluate_status_cali is True
    assert clf_obj.evaluate_status_perf_dynamics is True
    assert clf_obj.tradeoff_status == 1
    assert clf_obj.feature_imp_status == 1
    assert clf_obj.feature_imp_status_loo is True
    assert clf_obj.feature_imp_status_corr is True


def test_compile_skip():
    clf_obj.feature_imp_status = 0
    clf_obj.tradeoff_status = 0
    clf_obj.feature_imp_status_corr = False
    # clf_obj.compile(skip_tradeoff_flag=1, skip_feature_imp_flag=1) unknown args
    assert clf_obj.feature_imp_status == 0  # -1
    assert clf_obj.tradeoff_status == 0  # -1


def test_tradeoff():
    assert (
        round(clf_obj.tradeoff_obj.result["isforeign"]["max_perf_point"][0], 3) == 0.3
    )
    clf_obj.model_params[0].y_prob = None
    clf_obj.tradeoff()
    assert clf_obj.tradeoff_status == -1
    clf_obj.tradeoff_obj.result = None
    clf_obj.tradeoff()
    assert clf_obj.tradeoff_status == -1


def test_feature_importance():
    clf_obj.feature_imp_status = 0
    clf_obj.evaluate_status = 0
    clf_obj.feature_importance()
    assert round(clf_obj.feature_imp_values["isforeign"]["isforeign"][0], 3) == -0.007
    clf_obj.feature_imp_status = -1
    clf_obj.feature_importance()
    assert clf_obj.feature_imp_values is None


def test_feature_importance_x_test_exception():
    import numpy as np
    from aiverify_veritastool.model.modelwrapper import ModelWrapper

    class xtestwrapper(ModelWrapper):
        """
        Abstract Base class to provide an interface that supports non-pythonic models.
        Serves as a template for users to define the

        """

        def __init__(self, model_obj, classes=["CN", "CR", "TN", "TR"]):
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
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
    )

    # Create Use Case Object
    clf_obj = BaseClassification(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_name="auto",
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=10,
        tran_pdp_feature=["income", "age"],
        tran_pdp_target="TR",
    )

    test = clf_obj.feature_importance()
    assert test is None


def test_feature_importance_x_train_exception():
    import numpy as np
    from aiverify_veritastool.model.modelwrapper import ModelWrapper

    class xtrainwrapper(ModelWrapper):
        """
        Abstract Base class to provide an interface that supports non-pythonic models.
        Serves as a template for users to define the

        """

        def __init__(self, model_obj, classes=["CN", "CR", "TN", "TR"]):
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
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
    )

    # Create Use Case Object
    clf_obj = BaseClassification(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_name="auto",
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=10,
        tran_pdp_feature=["income", "age"],
        tran_pdp_target="TR",
    )

    test = clf_obj.feature_importance()
    assert test is None


def test_e_lift():
    result = clf_obj._get_e_lift()
    assert result is None


def test_feature_mask():
    assert len(clf_obj.model_params[0].x_test) == len(clf_obj.feature_mask["isforeign"])


def test_base_input_check():
    clf_obj.fair_metric_name = "mi_independence"
    clf_obj.fair_threshold = 43
    clf_obj.fairness_metric_value_input = {"isforeign": {"other_metric": 0.2}}
    with pytest.raises(MyError) as toolkit_exit:
        clf_obj._base_input_check()
    assert toolkit_exit.type == MyError


def test_model_type_input():
    clf_obj.model_params[0].model_type = "svm"
    with pytest.raises(MyError) as toolkit_exit:
        clf_obj._model_type_input()
    assert toolkit_exit.type == MyError

    clf_obj._model_type_to_metric_lookup[clf_obj.model_params[0].model_type] = (
        "classification",
        2,
        2,
    )
    with pytest.raises(MyError) as toolkit_exit:
        clf_obj._model_type_input()
    assert toolkit_exit.type == MyError

    if (
        clf_obj.model_params[0].model_type == "uplift"
        and clf_obj.model_params[1].model_name != "clone"
    ):
        clf_obj.model_params[1].model_name = "duplicate"
    with pytest.raises(MyError) as toolkit_exit:
        clf_obj._model_type_input()
    assert toolkit_exit.type == MyError


def test_fairness_tree():
    clf_obj.fair_impact = "normal"
    # clf_obj._fairness_tree()
    assert clf_obj._fairness_tree() == "equal_opportunity"
    clf_obj.fair_concern = "inclusive"
    # clf_obj._fairness_tree()
    assert clf_obj._fairness_tree() == "fpr_parity"
    clf_obj.fair_concern = "both"
    # clf_obj._fairness_tree()
    assert clf_obj._fairness_tree() == "equal_odds"
    clf_obj.fair_impact = "selective"
    clf_obj.fair_concern = "eligible"
    clf_obj.fair_priority = "benefit"
    # clf_obj._fairness_tree()
    assert clf_obj._fairness_tree() == "ppv_parity"
    clf_obj.fair_impact = "selective"
    clf_obj.fair_concern = "inclusive"
    clf_obj.fair_priority = "benefit"
    # clf_obj._fairness_tree()
    assert clf_obj._fairness_tree() == "fdr_parity"
    clf_obj.fair_concern = "both"
    with pytest.raises(MyError) as toolkit_exit:
        clf_obj._fairness_tree()
    assert toolkit_exit.type == MyError
    clf_obj.fair_impact = "normal"
    clf_obj.fair_concern = "inclusive"
    clf_obj.fair_priority = "harm"
    # clf_obj._fairness_tree()
    assert clf_obj._fairness_tree() == "fpr_parity"

    clf_obj.fair_concern = "eligible"
    clf_obj.fair_priority = "benefit"
    clf_obj.fair_impact = "normal"
    # clf_obj._fairness_tree(is_pos_label_favourable = False)
    assert clf_obj._fairness_tree(is_pos_label_favourable=False) == "tnr_parity"
    clf_obj.fair_concern = "inclusive"
    # clf_obj._fairness_tree(is_pos_label_favourable = False)
    assert clf_obj._fairness_tree(is_pos_label_favourable=False) == "fnr_parity"
    clf_obj.fair_concern = "both"
    # clf_obj._fairness_tree(is_pos_label_favourable = False)
    assert clf_obj._fairness_tree(is_pos_label_favourable=False) == "neg_equal_odds"
    clf_obj.fair_impact = "selective"
    clf_obj.fair_concern = "eligible"
    clf_obj.fair_priority = "benefit"
    # clf_obj._fairness_tree(is_pos_label_favourable = False)
    assert clf_obj._fairness_tree(is_pos_label_favourable=False) == "npv_parity"
    clf_obj.fair_impact = "selective"
    clf_obj.fair_concern = "inclusive"
    clf_obj.fair_priority = "benefit"
    # clf_obj._fairness_tree(is_pos_label_favourable = False)
    assert clf_obj._fairness_tree(is_pos_label_favourable=False) == "for_parity"
    clf_obj.fair_concern = "both"
    with pytest.raises(MyError) as toolkit_exit:
        clf_obj._fairness_tree(is_pos_label_favourable=False)
    assert toolkit_exit.type == MyError
    clf_obj.fair_impact = "normal"
    clf_obj.fair_concern = "inclusive"
    clf_obj.fair_priority = "harm"
    # clf_obj._fairness_tree(is_pos_label_favourable = False)
    assert clf_obj._fairness_tree(is_pos_label_favourable=False) == "fnr_parity"


def test_check_label():
    y = np.array([1, 1, 1, 1, 1, 1, 1])
    msg = "[value_error]: pos_label: given [1], expected not all y_true labels as pos_label at _check_label()\n"
    # catch the err poping out
    with pytest.raises(MyError) as toolkit_exit:
        y_new, pos_label2 = clf_obj._check_label(y=y, pos_label=[1], neg_label=[0])
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
        y_new, pos_label2 = clf_obj._check_label(y=y, pos_label=[1], neg_label=[0])
    assert toolkit_exit.type == MyError
    # # print('====== test_check_label() =======\n')
    # # print(toolkit_exit.value.message)
    # # print('====== test_check_label() expected msg =======\n')
    # # print(msg)
    assert toolkit_exit.value.message == msg


def test_rootcause_group_difference():
    SEED = 123
    x_train_sample = x_train.sample(n=1000, random_state=SEED)
    explainer_shap = shap.Explainer(
        clf_obj.model_params[0].model_object.predict_proba, x_train_sample
    )
    explanation = explainer_shap(x_train_sample)
    shap_values = np.moveaxis(explanation.values, -1, 0)
    idx = list(clf_obj.model_params[0].model_object.classes_).index(
        clf_obj.model_params[0].pos_label[0]
    )
    shap_values = shap_values[idx]

    # Test case without feature_mask
    group_mask = np.where(x_train_sample.isforeign == 1, True, False)
    result = clf_obj._rootcause_group_difference(
        shap_values, group_mask, x_train_sample.columns
    )
    expected = ["isforeign", "age", "income", "noproducts", "isfemale", "didrespond"]
    actual_order = list(result.keys())
    assert set(actual_order) == set(expected)

    # Test case with feature_mask
    prot_var_df = x_train_sample["isforeign"]
    privileged_grp = clf_obj.model_params[0].p_grp.get("isforeign")[0]
    unprivileged_grp = clf_obj.model_params[0].up_grp.get("isforeign")[0]
    feature_mask = np.where(prot_var_df.isin(privileged_grp), True, -1)
    feature_mask = np.where(prot_var_df.isin(unprivileged_grp), False, feature_mask)
    indices = np.where(np.isin(feature_mask, [0, 1]))
    shap_values = shap_values[indices]
    group_mask = feature_mask[np.where(feature_mask != -1)].astype(bool)
    result = clf_obj._rootcause_group_difference(
        shap_values, group_mask, x_train_sample.columns
    )
    expected = ["isforeign", "age", "income", "didrespond", "isfemale", "noproducts"]
    actual_order = list(result.keys())
    assert set(actual_order) == set(expected)


@pytest.fixture
def new_clf_setup():
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
        model_object=clf,
        pos_label=["TR", "CR"],
        neg_label=["TN", "CN"],
    )

    clf_obj = BaseClassification(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_name="auto",
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=10,
        tran_pdp_feature=["income", "age"],
        tran_pdp_target="TR",
    )
    yield clf_obj


def test_rootcause(new_clf_setup):
    clf_obj = new_clf_setup
    # Check p_var parameter: default all p_var
    clf_obj.rootcause(p_var=[])
    assert bool(clf_obj.rootcause_values) is True
    assert len(clf_obj.rootcause_values.keys()) == 2
    assert len(clf_obj.rootcause_values["isforeign"].values()) == 6

    # Check p_var parameter for 1 p_var, input_parameter_filtering to remove 'other_pvar'
    clf_obj.rootcause(p_var=["isforeign", "other_pvar"])
    assert bool(clf_obj.rootcause_values) is True
    assert len(clf_obj.rootcause_values.keys()) == 1
    assert len(clf_obj.rootcause_values["isforeign"].values()) == 6

    # Check invalid p_var input
    with pytest.raises(MyError) as toolkit_exit:
        clf_obj.rootcause(p_var=123)
    assert toolkit_exit.type == MyError

    # Check multi_class_label parameter:
    clf_obj.rootcause(multi_class_target="CN")
    assert clf_obj.rootcause_label_index == 0


def test_feature_imp_corr(capsys, new_clf_setup):
    clf_obj = new_clf_setup
    clf_obj.feature_imp_status_corr = False
    clf_obj.feature_importance()

    # Check _print_correlation_analysis
    captured = capsys.readouterr()
    assert "* No surrogate detected based on correlation analysis" in captured.out

    # Check correlation_threshold
    clf_obj.feature_imp_status_corr = False
    clf_obj.feature_importance(correlation_threshold=0.6)
    assert clf_obj.feature_imp_status_corr is True
    assert clf_obj.correlation_threshold == 0.6

    # Disable correlation analysis
    clf_obj.feature_imp_status_corr = False
    clf_obj.feature_importance(disable=["correlation"])
    captured = capsys.readouterr()
    assert "Correlation matrix skipped" in captured.out


def test_compute_correlation():
    print(clf_obj.surrogate_features)
    # Check top 3 features
    assert len(clf_obj.corr_top_3_features) <= 6
    # Check surrogate features
    assert bool(clf_obj.surrogate_features["isforeign"]) is False
