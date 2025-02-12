import math
import os
import sys
import pickle
from copy import deepcopy

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

# Set up project paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)

# Required for relative imports
module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))
sys.path.append(module_path)
import selection, uplift, util

from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.util.utility import (
    check_datatype,
    check_value,
    convert_to_set,
    get_cpu_count,
    check_multiprocessing
)
from aiverify_veritastool.util.errors import MyError
from aiverify_veritastool.usecases.credit_scoring import CreditScoring
from aiverify_veritastool.usecases.base_classification import BaseClassification

@pytest.fixture
def credit_scoring_data():
    """Fixture to load and prepare credit scoring test data."""
    # Load data
    file_path = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'credit_score_dict.pickle')
    with open(file_path, "rb") as input_file:
        cs = pickle.load(input_file)

    # Reduce marriage classes
    cs["X_train"]['MARRIAGE'] = cs["X_train"]['MARRIAGE'].replace([0, 3], 1)
    cs["X_test"]['MARRIAGE'] = cs["X_test"]['MARRIAGE'].replace([0, 3], 1)

    return cs

@pytest.fixture
def model_container(credit_scoring_data):
    """Fixture to create a ModelContainer instance for testing."""
    cs = credit_scoring_data

    # Prepare model parameters
    model_obj = LogisticRegression(C=0.1)
    model_obj.fit(cs["X_train"], cs["y_train"])

    container = ModelContainer(
        y_true=np.array(cs["y_test"]),
        p_grp={'SEX': [1], 'MARRIAGE': [1]},
        model_type="classification",
        model_name="credit_scoring",
        y_pred=np.array(cs["y_pred"]),
        y_prob=cs["y_prob"],
        y_train=np.array(cs["y_train"]),
        x_train=cs["X_train"],
        x_test=cs["X_test"],
        model_object=model_obj,
        up_grp={'SEX': [2], 'MARRIAGE': [2]}
    )

    return container

def test_check_datatype(model_container):
    """Test data type validation in ModelContainer."""
    container = deepcopy(model_container)
    expected_msg = ''

    # Introduce type errors
    container.y_pred = tuple(container.y_pred)
    expected_msg += '[type_error]: y_pred: given <class \'tuple\'>, expected [<class \'NoneType\'>, <class \'list\'>, <class \'numpy.ndarray\'>, <class \'pandas.core.series.Series\'>] at check_datatype()\n'

    container.p_grp = {'SEX': np.array([[1]]), 'MARRIAGE': [[1]]}
    expected_msg += '[type_error]: p_grp values: given <class \'numpy.ndarray\'>, expected list or str at check_datatype()\n'

    container._input_validation_lookup['new_variable'] = [(list,), str]
    expected_msg += '[type_error]: new_variable: given None, expected [<class \'list\'>] at check_datatype()\n'

    container._input_validation_lookup['new_variable2'] = [None, str]

    with pytest.raises(MyError) as exc_info:
        check_datatype(container)

    assert exc_info.value.message == expected_msg

def test_check_value(model_container):
    """Test value validation in ModelContainer."""
    container = deepcopy(model_container)
    expected_msg = ''

    # Test case with single value check
    container.new_variable2 = 'random_var'
    container._input_validation_lookup['new_variable2'] = [str, ]

    # Invalid y_prob value
    container.y_prob[0] = 10
    expected_msg += '[value_error]: y_prob: given range [0.004324126464885938 : 10.0] , expected (-0.01, 1.01) at check_value()\n'

    # Invalid protected features column
    container.protected_features_cols['new_column'] = 1
    expected_msg += '[column_value_error]: protected_features_cols: given [\'MARRIAGE\', \'SEX\'] expected [\'MARRIAGE\', \'SEX\', \'new_column\'] at check_value()\n'

    # Invalid model type
    container.model_type = 'random_type'
    expected_msg += '[value_error]: model_type: given random_type, expected [\'classification\', \'regression\', \'uplift\'] at check_value()\n'

    # Invalid pos_label
    container.pos_label = [[1, 'pos']]
    expected_msg += '[value_error]: pos_label: given [\'1\', \'pos\'], expected [0, 1] at check_value()\n'

    # Invalid p_grp
    container.p_grp = {'SEX': [1], 'MARRIAGE': [1], 'RELIGION': [1]}
    expected_msg += '[value_error]: p_grp: given [\'MARRIAGE\', \'RELIGION\', \'SEX\'], expected [\'MARRIAGE\', \'SEX\'] at check_value()\n'

    # Invalid p_var type
    container.p_var = ['SEX', 123]
    expected_msg += '[value_error]: p_var: given <class \'int\'>, expected <class \'str\'> at check_value()\n'

    with pytest.raises(MyError) as exc_info:
        check_value(container)

    assert exc_info.value.message == expected_msg

def test_convert_to_set():
    """Test the convert_to_set utility function."""
    assert convert_to_set('s') == {'s'}
    assert convert_to_set(1) == {1}
    assert convert_to_set({1, 2, 3}) == {1, 2, 3}
    assert convert_to_set((1, 2)) == {1, 2}
    assert convert_to_set([1, 2, 3, 4, 5, 5, 5]) == {1, 2, 3, 4, 5}

def test_get_cpu_count():
    """Test the get_cpu_count utility function."""
    assert get_cpu_count() > 0

def test_check_multiprocessing():
    """Test the check_multiprocessing utility function."""
    cpu_count = math.floor(get_cpu_count() / 2)

    assert check_multiprocessing(-1) == 1
    assert check_multiprocessing(0) == cpu_count
    assert check_multiprocessing(1) == 1
    assert check_multiprocessing(2) == min(cpu_count, 2)
    assert check_multiprocessing(8) == min(cpu_count, 8)
    assert check_multiprocessing(32) == min(cpu_count, 32)

@pytest.fixture
def classification_setup():
    """Fixture to set up classification test data and objects."""
    # Load classification test data
    file_path = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle')
    with open(file_path, "rb") as input_file:
        cm_prop = pickle.load(input_file)

    # Prepare data
    x_train = cm_prop["X_train"].drop(['ID'], axis=1)
    x_test = cm_prop["X_test"].drop(['ID'], axis=1)
    y_train = cm_prop["y_train"]

    # Train classifier
    clf = cm_prop['model']
    clf.fit(x_train, y_train)
    y_pred = clf.predict(x_test)

    # Create container
    container = ModelContainer(
        y_true=cm_prop["y_test"],
        p_grp={'isforeign': [0], 'isfemale': [0], 'isforeign|isfemale': 'maj_rest'},
        model_type="classification",
        model_name="base_classification",
        y_pred=y_pred,
        y_prob=pd.DataFrame(cm_prop["y_prob"], columns=['CN', 'CR', 'TN', 'TR']),
        y_train=y_train,
        x_train=x_train,
        x_test=x_test,
        model_object=clf,
        pos_label=['CR'],
        neg_label=['CN']
    )

    # Create classification object
    clf_obj = BaseClassification(
        model_params=[container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type='difference',
        perf_metric_name="accuracy",
        tran_row_num=[12, 42],
        tran_max_sample=10,
        tran_pdp_feature=['income', 'age'],
        tran_pdp_target='TR'
    )

    return container, clf_obj

def test_check_data_unassigned(classification_setup):
    """Test unassigned data checking in classification setup."""
    container, _ = classification_setup

    # Check y_true distribution
    labels_true, counts_true = np.unique(container.y_true, return_counts=True)
    assert np.array_equal(labels_true, [0, 1])
    assert np.array_equal(counts_true, [3734, 2277])

    # Check y_pred distribution
    labels_pred, counts_pred = np.unique(container.y_pred, return_counts=True)
    assert np.array_equal(labels_pred, [0, 1])
    assert counts_pred.sum() == 6011

    # Check shapes consistency
    assert container.y_prob.shape == container.y_prob.shape
    assert container.x_test.shape[0] == container.y_prob.shape[0]
    assert container.protected_features_cols.shape[0] == container.y_prob.shape[0]
