import os
import sys
import pickle
import numpy as np
import pandas as pd
import pytest

# Set up project paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)

# Required for relative imports
module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../examples/customer_marketing_example'))
sys.path.append(module_path)
import selection, uplift, util

from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.usecases.customer_marketing import CustomerMarketing
from aiverify_veritastool.metrics.performance_metrics import PerformanceMetrics
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.util.errors import MyError

# Constants
PROFIT_RESPOND = 190
COST_TREATMENT = 20

@pytest.fixture
def marketing_data():
    """Load and prepare marketing test data for both propensity and rejection models."""
    # Load data files
    file_paths = {
        'prop': os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_acq_dict.pickle'),
        'rej': os.path.join(project_root, 'user_defined_files', 'veritas_data', 'mktg_uplift_rej_dict.pickle')
    }

    data = {}
    for key, path in file_paths.items():
        with open(path, "rb") as f:
            data[key] = pickle.load(f)

    return data

@pytest.fixture
def feature_data():
    """Create feature importance data."""
    return {
        "FEATURE": ['income', 'noproducts', 'didrespond', 'age', 'isfemale', 'isforeign'],
        "VALUE": [0.3, 0.2, 0.15, 0.1, 0.05, 0.03]
    }

@pytest.fixture
def base_model_containers(marketing_data):
    """Create model containers for both rejection and propensity models."""
    # Common processing for X data
    def process_x_data(x_data):
        return x_data.drop(['ID'], axis=1)

    # Prepare rejection model data
    cm_rej = marketing_data['rej']
    x_train_rej = process_x_data(cm_rej["X_train"])
    x_test_rej = process_x_data(cm_rej["X_test"])
    y_prob_rej = pd.DataFrame(cm_rej["y_prob"], columns=['CN', 'CR', 'TN', 'TR'])

    # Prepare propensity model data
    cm_prop = marketing_data['prop']
    y_prob_prop = pd.DataFrame(cm_prop["y_prob"], columns=['CN', 'CR', 'TN', 'TR'])

    # Fit models
    model_object_rej = cm_rej['model']
    model_object_prop = cm_prop['model']
    model_object_rej.fit(x_train_rej, cm_rej["y_train"])
    model_object_prop.fit(x_train_rej, cm_prop["y_train"])

    # Create rejection model container
    container_rej = ModelContainer(
        y_true=cm_rej["y_test"],
        y_pred=cm_rej["y_test"],
        y_prob=y_prob_rej,
        y_train=cm_rej["y_train"],
        p_grp={'isforeign': [0], 'isfemale': [0], 'isforeign|isfemale': 'maj_rest'},
        x_train=x_train_rej,
        x_test=x_test_rej,
        model_object=model_object_rej,
        model_name="custmr_marketing",
        model_type="uplift",
        pos_label=['TR', 'CR'],
        neg_label=['TN', 'CN']
    )

    # Create propensity model container by cloning and updating
    container_prop = container_rej.clone(
        y_true=cm_prop["y_test"],
        y_pred=cm_prop["y_test"],
        y_prob=y_prob_prop,
        y_train=cm_prop["y_train"],
        model_object=model_object_prop,
        pos_label=['TR', 'CR'],
        neg_label=['TN', 'CN']
    )

    return container_rej, container_prop

@pytest.fixture
def customer_marketing_obj(base_model_containers):
    """Create CustomerMarketing instance for testing."""
    container_rej, container_prop = base_model_containers

    return CustomerMarketing(
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
        tran_max_sample=10,
        tran_pdp_feature=['age', 'income'],
        tran_pdp_target='CR',
        tran_max_display=6,
        fair_is_pos_label_fav=False
    )

def test_check_input(customer_marketing_obj):
    """Test input validation for customer marketing."""
    # Test invalid metric lookup
    customer_marketing_obj._model_type_to_metric_lookup[customer_marketing_obj.model_params[0].model_type] = ('uplift', 4, 4)
    with pytest.raises(MyError):
        customer_marketing_obj._check_input()

    # Reset to valid metric lookup
    customer_marketing_obj._model_type_to_metric_lookup[customer_marketing_obj.model_params[0].model_type] = ('uplift', 4, 2)

    # Test invalid revenue parameter
    customer_marketing_obj.spl_params = {'revenue': '190', 'treatment_cost': 20}
    with pytest.raises(MyError):
        customer_marketing_obj._check_input()

    # Test negative revenue
    customer_marketing_obj.spl_params = {'revenue': -190, 'treatment_cost': 20}
    with pytest.raises(MyError):
        customer_marketing_obj._check_input()

    # Test revenue less than treatment cost
    customer_marketing_obj.spl_params = {'revenue': 10, 'treatment_cost': 20}
    with pytest.raises(MyError):
        customer_marketing_obj._check_input()

def test_get_confusion_matrix(customer_marketing_obj):
    """Test confusion matrix calculations."""
    # Prepare test data
    y_true_reshape = np.array(customer_marketing_obj.model_params[0].y_true).reshape(1, 1, -1)
    y_pred_reshape = np.array(customer_marketing_obj.model_params[0].y_pred).reshape(1, 1, -1)

    # Test basic confusion matrix
    result = customer_marketing_obj._get_confusion_matrix_optimized(y_true_reshape, None, None)
    assert len(result) == 4
    assert np.all(np.equal(result[0], None))

    # Test confusion matrix with protected variable
    result = customer_marketing_obj._get_confusion_matrix_optimized(
        y_true_reshape,
        None,
        None,
        curr_p_var='isforeign'
    )
    assert len(result) == 8
    assert np.all(np.equal(result[0], None))

def test_select_fairness_metric_name(customer_marketing_obj):
    """Test fairness metric name selection."""
    # Test explicit metric name
    customer_marketing_obj.fair_metric_name = 'disparate_impact'
    customer_marketing_obj._select_fairness_metric_name()
    assert customer_marketing_obj.fair_metric_name == 'disparate_impact'

    # Test auto selection for classification
    customer_marketing_obj.fair_metric_name = 'auto'
    customer_marketing_obj.model_params[0].model_type = 'classification'
    customer_marketing_obj._select_fairness_metric_name()
    assert customer_marketing_obj.fair_metric_name == 'npv_parity'

def test_get_e_lift(customer_marketing_obj):
    """Test e_lift calculation."""
    customer_marketing_obj.model_params[0].model_type = 'classification'
    result = customer_marketing_obj._get_e_lift()
    assert result is None

def test_compute_pred_outcome(customer_marketing_obj):
    """Test prediction outcome computation."""
    # Test classification model type
    customer_marketing_obj.model_params[0].model_type = 'classification'
    result = customer_marketing_obj._compute_pred_outcome(y_pred_new=None)
    assert result is None

    # Test uplift model type
    customer_marketing_obj.model_params[0].model_type = 'uplift'
    result = customer_marketing_obj._compute_pred_outcome(y_pred_new=[None, None])
    assert result is None
