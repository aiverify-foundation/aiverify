import os
import pickle
import sys
from copy import deepcopy

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

# Required path setup
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)

module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))
sys.path.append(module_path)
import selection
import uplift
import util

from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.usecases.base_classification import BaseClassification
from aiverify_veritastool.util.errors import MyError, VeritasError

@pytest.fixture
def credit_scoring_data():
    """Fixture to load and prepare credit scoring test data."""
    file = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'credit_score_dict.pickle')
    with open(file, "rb") as input_file:
        cs = pickle.load(input_file)

    # Reduce into two classes
    for marriage_data in [cs["X_train"]["MARRIAGE"], cs["X_test"]["MARRIAGE"]]:
        marriage_data.replace([0, 3], 1, inplace=True)

    return cs

@pytest.fixture
def model_container(credit_scoring_data):
    """Fixture to create a model container with test data."""
    cs = credit_scoring_data

    # Initialize model
    model_obj = LogisticRegression(C=0.1)
    model_obj.fit(cs["X_train"], cs["y_train"])

    # Setup container parameters
    container_params = {
        "y_true": np.array(cs["y_test"]),
        "p_grp": {"SEX": [1], "MARRIAGE": [1]},
        "model_type": "classification",
        "model_name": "credit_scoring",
        "y_pred": np.array(cs["y_pred"]),
        "y_prob": cs["y_prob"],
        "y_train": np.array(cs["y_train"]),
        "x_train": cs["X_train"],
        "x_test": cs["X_test"],
        "model_object": model_obj,
        "up_grp": {"SEX": [2], "MARRIAGE": [2]}
    }

    return ModelContainer(**container_params)

def test_model_container_initialization(model_container):
    """Test basic model container initialization and attributes."""
    container = model_container
    assert container is not None

    # Test label processing
    pos_label = [1]
    s_y_true = Fairness._check_label(
        Fairness,
        np.array(container.y_true, dtype=int),
        pos_label,
        None,
        container
    )[0]
    assert np.array_equal(s_y_true, container.y_true)

    # Test y_pred processing
    s_y_pred = Fairness._check_label(
        Fairness,
        np.array(container.y_pred, dtype=int),
        pos_label,
        None,
        container,
        y_pred_flag=True
    )[0]
    assert np.array_equal(s_y_pred, container.y_pred)

    # Test model name truncation
    assert len(container.model_name) <= 20

    # Test error queue
    assert container.err.queue == []

def test_protected_columns_validation(model_container):
    """Test validation of protected columns."""
    container = deepcopy(model_container)

    # Test column renaming scenario
    container.protected_features_cols = container.protected_features_cols.rename(
        columns={"SEX": "GENDER"}
    )
    expected_error = "[value_error]: p_var: given ['SEX', 'MARRIAGE'], expected ['GENDER', 'MARRIAGE'] at check_protected_columns()\n"

    with pytest.raises(MyError) as error:
        container.check_protected_columns()
    assert error.value.message == expected_error

def test_data_consistency_validation(model_container):
    """Test data consistency validation."""
    container = deepcopy(model_container)

    # Introduce multiple inconsistencies
    container.y_prob = container.y_prob.astype(int)
    container.protected_features_cols = pd.concat([
        container.protected_features_cols,
        container.protected_features_cols.iloc[0:100]
    ])
    container.x_train["new_column"] = 1

    expected_errors = [
        "[type_error]: y_prob: given not type float64, expected float64 at check_data_consistency()\n",
        "[length_error]: protected_features_cols row: given length 7600, expected length 7500 at check_data_consistency()\n",
        "[length_error]: x_train column: given length 24, expected length 23 at check_data_consistency()\n"
    ]

    with pytest.raises(MyError) as error:
        container.check_data_consistency()
    assert error.value.message == "".join(expected_errors)

def test_label_consistency(model_container):
    """Test label consistency validation."""
    container = deepcopy(model_container)

    # Introduce label inconsistency
    container.y_pred[0] = 10
    expected_error = "[value_error]: y_pred labels: given {0, 1, 10}, expected {0, 1} at check_label_consistency()\n"

    with pytest.raises(MyError) as error:
        container.check_label_consistency()
    assert error.value.message == expected_error

def test_model_cloning(model_container):
    """Test model container cloning functionality."""
    container = model_container
    clone_params = {
        "y_true": container.y_true,
        "model_object": container.model_object,
        "y_pred": container.y_pred,
        "y_prob": container.y_prob,
        "y_train": container.y_train,
        "train_op_name": "fit",
        "predict_op_name": "predict",
        "sample_weight": None,
        "pos_label": [1],
        "neg_label": [0]
    }

    cloned_container = container.clone(**clone_params)
    assert cloned_container is not None

def test_check_classes():
    # Load Base Classification Test Data
    module_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../../../aiverify_veritastool/examples/customer_marketing_example",
        )
    )
    sys.path.append(module_path)
    import selection
    import uplift
    import util

    file_prop = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle')

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
        fair_metric_name="auto",
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=10,
        tran_pdp_feature=["income", "age"],
        tran_pdp_target="TR",
    )

    # 1st round of test consistency
    msg = ""
    f_container1 = deepcopy(clf_container)
    # check when model_object is available, but classes_ attribute not available
    del f_container1.model_object.classes_
    f_container1.y_prob = pd.DataFrame(
        cm_prop["y_prob"], columns=["CN", "CR", "TN", "TR"]
    )
    f_container1.y_true = y_true
    f_container1.y_pred = y_pred
    msg += "classes check completed without issue"
    result = f_container1.check_classes()
    assert result == msg

    # 2nd round of test consistency
    msg = ""
    f_container2 = deepcopy(clf_container)
    # check when model_object and classes_ attribute are available, but order of classes_ not consistent with y_prob column names
    f_container2.y_prob = pd.DataFrame(
        cm_prop["y_prob"], columns=["CN", "CR", "TN", "TR"]
    )
    f_container2.y_true = y_true
    f_container2.y_pred = y_pred
    f_container2.model_object.classes_ = np.array(["TR", "CN", "CR", "TN"])
    msg += "[value_error]: classes_: given ['TR' 'CN' 'CR' 'TN'], expected labels in classes_ to be consistent with y_prob dataframe column names at check_classes()\n"

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        f_container2.check_classes()
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    # 3rd round of test consistency
    msg = ""
    # check when model_object and classes_ attribute are available and classes > 2 (multi-class), but y_prob passed has 1D shape (10000,)
    f_container3_y_prob = cm_prop["y_prob"][:, 0].reshape(-1)
    msg += "[length_error]: y_prob column length: given length 1, expected length 4 at check_data_consistency()\n"

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        f_container3 = ModelContainer(
            y_true,
            p_grp,
            model_type,
            model_name,
            y_pred,
            f_container3_y_prob,
            y_train,
            x_train=x_train,
            x_test=x_test,
            model_object=clf,
            pos_label=["TR", "CR"],
            neg_label=["TN", "CN"],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg

    # 4th round of test consistency
    msg = ""
    # check when model_object and classes_ attribute are available and classes > 2 (multi-class), but y_prob passed as numpy array instead of expected pandas dataframe
    f_container4_y_prob = cm_prop["y_prob"]
    msg += "[type_error]: y_prob: given <class 'numpy.ndarray'>, expected <class 'pandas.core.frame.DataFrame'> with labels as column names at check_y_prob()\n"

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        f_container4 = ModelContainer(
            y_true,
            p_grp,
            model_type,
            model_name,
            y_pred,
            f_container4_y_prob,
            y_train,
            x_train=x_train,
            x_test=x_test,
            model_object=clf,
            pos_label=["TR", "CR"],
            neg_label=["TN", "CN"],
        )
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg
