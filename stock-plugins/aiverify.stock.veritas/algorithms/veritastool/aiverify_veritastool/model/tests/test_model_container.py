import os
import pickle
import sys
from copy import deepcopy

import numpy as np
import pandas as pd
import pytest

project_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
sys.path.insert(0, project_root)
from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.usecases.base_classification import BaseClassification
from aiverify_veritastool.usecases.credit_scoring import CreditScoring
from aiverify_veritastool.util.errors import MyError
from sklearn.linear_model import LogisticRegression

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

# Load Credit Scoring Test Data
file = os.path.join(
    project_root, "aiverify_veritastool", "examples", "data", "credit_score_dict.pickle"
)
input_file = open(file, "rb")
cs = pickle.load(input_file)
# sample feature_imp
feature_imp = pd.DataFrame(
    data={
        "features": ["EDUCATION", "SEX", "MARRIAGE", "AGE"],
        "values": [0.04, 0.08, 0.03, 0.02],
    }
)

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

# rejection inference
num_applicants = {"SEX": [3500, 5000], "MARRIAGE": [3500, 5000]}
base_default_rate = {"SEX": [0.10, 0.05], "MARRIAGE": [0.10, 0.05]}
# model_object = LRwrapper(model_object)
model_obj = LogisticRegression(C=0.1)
model_obj.fit(x_train, y_train)

m_container = ModelContainer(
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


def test_model_container():
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

    assert container is not None

    # y_true
    pos_label = [1]
    neg_label = None
    s_y_true = Fairness._check_label(
        Fairness, np.array(y_true, dtype=int), pos_label, neg_label, container
    )[0]
    assert np.array_equal(s_y_true, container.y_true)

    # y_train
    assert np.array_equal(y_train, container.y_train)

    # p_var
    # assert p_var == container.p_var

    # p_grp
    # assert p_grp == container.p_grp

    # y_pred
    pos_label = [1]
    neg_label = None
    s_y_pred = Fairness._check_label(
        Fairness,
        np.array(y_pred, dtype=int),
        pos_label,
        neg_label,
        container,
        y_pred_flag=True,
    )[0]
    assert np.array_equal(s_y_pred, container.y_pred)

    if model_name == "auto":
        self.model_name = model_type
    assert model_name[0:20] == container.model_name

    assert container.err.queue == []

    sample_weight = np.random.choice(10, 7500, replace=True)
    sample_weight_train = np.random.choice(10, 22500, replace=True)
    container2 = ModelContainer(
        y_true=y_true,
        y_train=y_train,
        p_grp=p_grp,
        x_train=x_train,
        x_test=x_test,
        model_object=model_obj,
        model_type=model_type,
        y_pred=y_pred,
        y_prob=y_prob,
        sample_weight=sample_weight,
    )
    assert container2 is not None


def test_check_protected_columns():
    """
    #change p_var to ndarray
    f_container = deepcopy(m_container)
    f_container.p_var = np.array(['SEX', 'MARRIAGE'])
    msg = '[type_error]: p_var: given <class \'numpy.ndarray\'>, expected <class \'list\'> at check_protected_columns()\n'
    with pytest.raises(Exception) as toolkit_exit:
        f_container.check_protected_columns()
    assert toolkit_exit.type == MyError
    # print('====== test_check_protected_columns() #change p_var to ndarray =======')
    # print( toolkit_exit.value.message)
    assert toolkit_exit.value.message == msg
    print("Successful")
    print(toolkit_exit.value.message)
    """
    # set protected_features_cols column to 'GENDER'
    f_container2 = deepcopy(m_container)
    # f_container2.protected_features_cols = None
    # f_container2.x_test = None # Commented out since transparency analysis can now run independently
    # msg = '[length_error]: protected_features_cols and x_test: given length None for both, expected length not both are None at check_protected_columns()\n'
    f_container2.protected_features_cols = f_container2.protected_features_cols.rename(
        columns={"SEX": "GENDER"}
    )
    msg = "[value_error]: p_var: given ['SEX', 'MARRIAGE'], expected ['GENDER', 'MARRIAGE'] at check_protected_columns()\n"

    with pytest.raises(Exception) as toolkit_exit:
        f_container2.check_protected_columns()
    assert toolkit_exit.type == MyError
    # print('====== test_check_protected_columns() #set protected_features_cols and x_test both to None =======')
    # print( toolkit_exit.value.message)
    assert toolkit_exit.value.message == msg
    """
    #Remove SEX column from protected_features_cols
    f_container3 = deepcopy(m_container) 
    f_container3.protected_features_cols = f_container3.x_test.loc[:, 'EDUCATION':'AGE']
    msg = '[value_error]: p_var: given [\'SEX\', \'MARRIAGE\'], expected [\'EDUCATION\', \'MARRIAGE\', \'AGE\'] at check_protected_columns()\n'
    with pytest.raises(Exception) as toolkit_exit:
        f_container3.check_protected_columns()
    assert toolkit_exit.type == MyError
    # print('====== test_check_protected_columns() #set a new column for protected_features_cols')
    # print( toolkit_exit.value.message)
    assert toolkit_exit.value.message == msg

    #self.protected_features_cols is None and self.x_test is not None
    f_container4 = deepcopy(m_container) 
    f_container4.protected_features_cols = None
    f_container4.x_test  = f_container4.x_test.loc[:, 'EDUCATION':'AGE']
    msg = '[value_error]: p_var: given [\'SEX\', \'MARRIAGE\'], expected [\'EDUCATION\', \'MARRIAGE\', \'AGE\'] at check_protected_columns()\n'
    
    with pytest.raises(Exception) as toolkit_exit:
        f_container4.check_protected_columns()
    assert toolkit_exit.type == MyError
    #print('====== test_check_protected_columns() #set a new column for x_test')
    # print( toolkit_exit.value.message)
    assert toolkit_exit.value.message == msg
    """


def test_check_data_consistency():
    msg = ""
    f_container = deepcopy(m_container)

    # change y_prob dtype to non float
    f_container.y_prob = f_container.y_prob.astype(int)
    msg += "[type_error]: y_prob: given not type float64, expected float64 at check_data_consistency()\n"

    # change row count of protected_features_cols
    f_container.protected_features_cols = f_container.protected_features_cols.append(
        f_container.protected_features_cols[0:100]
    )
    msg += "[length_error]: protected_features_cols row: given length 7600, expected length 7500 at check_data_consistency()\n"

    # #change row count of x_train
    # f_container.x_train = f_container.x_train.append(f_container.x_train[0:10]) #assigned again below
    # msg += '[length_error]: x_train row: given length 22510, expected length 22500 at check_data_consistency()\n'

    # if both x_test and x_train are df, change the no. of columns to not the same
    f_container.x_train["new_column"] = 1
    msg += "[length_error]: x_train column: given length 24, expected length 23 at check_data_consistency()\n"

    """
    #change pos_label size and neg_label size
    f_container.neg_label = [[0],['neg']]
    msg += '[length_error]: neg_label: given length 2, expected length 1 at check_data_consistency()\n'
    f_container.pos_label = [[1],['pos']]
    msg += '[length_error]: pos_label: given length 2, expected length 1 at check_data_consistency()\n'

    #catch the err poping out
    # print('====== test_check_data_consistency() =======\n')
    # print(toolkit_exit.value.message)
    # print('====== test_check_data_consistency() expected msg =======\n')
    # print(msg)
    """
    with pytest.raises(Exception) as toolkit_exit:
        f_container.check_data_consistency()
    assert toolkit_exit.type == MyError

    assert toolkit_exit.value.message == msg

    # 2nd round of test consistency
    msg = ""
    f_container2 = deepcopy(m_container)

    # pro_f_cols_cols != len(self.p_var):
    f_container2.p_var.append(["New p_var"])
    msg += "[length_error]: p_var array: given length 3, expected length 2 at check_data_consistency()\n"

    f_container2.model_type = "uplift"
    f_container2.pos_label = ["TR", "CR"]
    msg += "[value_error]: neg_label: given None, expected not None at check_data_consistency()\n"
    # msg += '[length_error]: y_prob column length: given length 1, expected length 4 at check_data_consistency()\n'

    f_container2.y_pred = list(f_container2.y_pred)
    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        f_container2.check_data_consistency()
    assert toolkit_exit.type == MyError
    # print('====== test_check_data_consistency() =======\n')
    # print(toolkit_exit.value.message)
    # print('====== test_check_data_consistency() expected msg =======\n')
    # print(msg)
    assert toolkit_exit.value.message == msg

    # 3rd round of test consistency
    msg = ""
    f_container3 = deepcopy(m_container)
    # p_grp and up_grp have overlap values
    f_container3.up_grp = {"SEX": [[1]], "MARRIAGE": [[2]]}
    msg += "[value_error]: p_grp and up_grp: given p_grp [[1]] and up_grp [[1]], expected no value overlap at check_data_consistency()\n"

    # len(self.sample_weight_train) != train_row_count
    # f_container3.sample_weight_train = np.random.choice(10, 1000, replace=True)
    # f_container3.x_train = f_container3.x_train.append(f_container3.x_train[0:10])

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        f_container3.check_data_consistency()
    assert toolkit_exit.type == MyError
    # print('====== test_check_data_consistency() =======\n')
    # print(toolkit_exit.value.message)
    # print('====== test_check_data_consistency() expected msg =======\n')
    # print(msg)
    assert toolkit_exit.value.message == msg

    # 4th round of test consistency
    msg = ""
    f_container4 = deepcopy(m_container)
    # check y_prob column shape
    f_container4.y_prob = np.stack(
        (f_container4.y_prob, f_container4.y_prob, f_container4.y_prob), axis=1
    )
    msg += "[length_error]: y_prob column length: given length 3>, expected length 2 at check_data_consistency()\n"

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        f_container4.check_data_consistency()
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


def test_check_label_consistency():
    msg = ""
    f_container = deepcopy(m_container)

    # put an extra label to y_pred
    f_container.y_pred[0] = 10
    msg += "[value_error]: y_pred labels: given {0, 1, 10}, expected {0, 1} at check_label_consistency()\n"

    # catch the err poping out
    with pytest.raises(Exception) as toolkit_exit:
        f_container.check_label_consistency()
    assert toolkit_exit.type == MyError
    assert toolkit_exit.value.message == msg


"""def test_check_label_length():
    msg =''
    f_container = deepcopy(m_container)
    
    f_container.pos_label = [[1],[2]]
    msg += '[length_error]: pos_label length: given length 2, expected length 1 at check_label_length()\n'
    
    #change y_true to all ones
    f_container.y_true = np.ones(7500)
    msg += '[length_error]: y_true label length: given length 1, expected length >=2 at check_label_length()\n'

    #change y_train to all ones
    f_container.y_train = np.ones(7500)
    msg += '[length_error]: y_train label length: given length 1, expected length >=2 at check_label_length()\n'

    #change y_pred to all ones
    f_container.y_pred = np.ones(7500)
    msg += '[length_error]: y_pred label length: given length 1, expected length >=2 at check_label_length()\n'

    #catch the err poping out
    
    with pytest.raises(Exception) as toolkit_exit:
        f_container.check_label_length()
    assert toolkit_exit.type == MyError
    # print('====== test_check_label_length() =======\n')
    # print(toolkit_exit.value.message)
    # print('====== test_check_label_length() expected msg =======\n')
    # print(msg)
    print(toolkit_exit.value.message)
    print("msg")
    print(msg)
    assert toolkit_exit.value.message == msg
"""


def test_clone():
    clone_obj = m_container.clone(
        y_true,
        model_obj,
        y_pred=y_pred,
        y_prob=y_prob,
        y_train=y_train,
        train_op_name="fit",
        predict_op_name="predict",
        sample_weight=None,
        pos_label=[1],
        neg_label=[0],
    )
    assert clone_obj is not None


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

    file_prop = os.path.join(
        project_root,
        "aiverify_veritastool",
        "examples",
        "data",
        "mktg_uplift_acq_dict.pickle",
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
