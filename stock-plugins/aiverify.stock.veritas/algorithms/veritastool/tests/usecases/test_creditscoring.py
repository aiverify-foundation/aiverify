import os
import sys
import pickle
import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

# Set up project paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)

from aiverify_veritastool.model.model_container import ModelContainer
from aiverify_veritastool.usecases.credit_scoring import CreditScoring
from aiverify_veritastool.metrics.performance_metrics import PerformanceMetrics
from aiverify_veritastool.metrics.fairness_metrics import FairnessMetrics
from aiverify_veritastool.principles.fairness import Fairness
from aiverify_veritastool.util.errors import MyError

@pytest.fixture
def credit_scoring_data():
    """Load and prepare credit scoring test data."""
    file_path = os.path.join(project_root, 'user_defined_files', 'veritas_data', 'credit_score_dict.pickle')
    with open(file_path, "rb") as input_file:
        cs = pickle.load(input_file)

    # Reduce marriage classes into two categories
    cs["X_train"]['MARRIAGE'] = cs["X_train"]['MARRIAGE'].replace([0, 3], 1)
    cs["X_test"]['MARRIAGE'] = cs["X_test"]['MARRIAGE'].replace([0, 3], 1)

    return cs

@pytest.fixture
def base_model_container(credit_scoring_data):
    """Create a basic ModelContainer instance for testing."""
    cs = credit_scoring_data

    model_obj = LogisticRegression(C=0.1)
    model_obj.fit(cs["X_train"], cs["y_train"])

    return ModelContainer(
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

@pytest.fixture
def base_credit_scoring(base_model_container):
    """Create a basic CreditScoring instance for testing."""
    num_applicants = {"SEX": [5841, 5841], "MARRIAGE": [5841, 5841]}
    base_default_rate = {"SEX": [0.5, 0.5], "MARRIAGE": [0.5, 0.5]}

    return CreditScoring(
        model_params=[base_model_container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        num_applicants=num_applicants,
        base_default_rate=base_default_rate,
        tran_row_num=[20, 40],
        tran_max_sample=10,
        tran_pdp_feature=['LIMIT_BAL'],
        tran_max_display=10
    )

def test_check_input(base_credit_scoring):
    """Test input validation for credit scoring."""
    # Test invalid metric lookup
    base_credit_scoring._model_type_to_metric_lookup[base_credit_scoring.model_params[0].model_type] = ('classification', 4, 2)
    with pytest.raises(MyError):
        base_credit_scoring._check_input()

    # Reset to valid metric lookup
    base_credit_scoring._model_type_to_metric_lookup[base_credit_scoring.model_params[0].model_type] = ('classification', 2, 1)

def test_check_special_params(credit_scoring_data, base_model_container):
    """Test validation of special parameters for credit scoring."""
    def create_credit_scoring_with_params(num_applicants, base_default_rate, **kwargs):
        """Helper function to create CreditScoring instance with specific parameters."""
        return CreditScoring(
            model_params=[base_model_container],
            fair_threshold=80,
            fair_concern="eligible",
            fair_priority="benefit",
            fair_impact="normal",
            perf_metric_name="accuracy",
            num_applicants=num_applicants,
            base_default_rate=base_default_rate,
            tran_row_num=[20, 40],
            tran_max_sample=10,
            tran_pdp_feature=['LIMIT_BAL'],
            tran_max_display=10,
            **kwargs
        )

    test_cases = [
        # Invalid numeric values
        (1, 2),
        # String values in num_applicants
        ({'SEX': ['3500', 5000], 'MARRIAGE': [3500, 5000]},
         {'SEX': [0.10, 0.05], 'MARRIAGE': [0.10, 0.05]}),
        # String values in base_default_rate
        ({'SEX': [3500, 5000], 'MARRIAGE': [3500, 5000]},
         {'SEX': ['0.10', 0.05], 'MARRIAGE': [0.10, 0.05]}),
        # Negative values in num_applicants
        ({'SEX': [-3500, 5000], 'MARRIAGE': [3500, 5000]},
         {'SEX': [0.10, 0.05], 'MARRIAGE': [0.10, 0.05]}),
        # Negative values in base_default_rate
        ({'SEX': [3500, 5000], 'MARRIAGE': [3500, 5000]},
         {'SEX': [-0.10, 0.05], 'MARRIAGE': [0.10, 0.05]}),
        # Incorrect array length in num_applicants
        ({'SEX': [3500, 5000, 3500], 'MARRIAGE': [3500, 5000, 3500]},
         {'SEX': [-0.10, 0.05], 'MARRIAGE': [0.10, 0.05]}),
        # Incorrect array length in base_default_rate
        ({'SEX': [3500, 5000], 'MARRIAGE': [3500, 5000]},
         {'SEX': [0.1, 0.05, 0.1], 'MARRIAGE': [0.1, 0.05, 0.1]}),
        # Values too small in base_default_rate
        ({'SEX': [3500, 5000], 'MARRIAGE': [3500, 5000]},
         {'SEX': [0.001, 0.005], 'MARRIAGE': [0.001, 0.005]})
    ]

    # Test each case
    for num_applicants, base_default_rate in test_cases:
        with pytest.raises(MyError):
            create_credit_scoring_with_params(num_applicants, base_default_rate)

    # Test with fair_metric_name
    with pytest.raises(MyError):
        create_credit_scoring_with_params(
            {'SEX': [3500, 5000], 'MARRIAGE': [3500, 5000]},
            {'SEX': [0.10, 0.05], 'MARRIAGE': [0.10, 0.05]},
            fair_metric_name="mi_independence"
        )

def test_get_confusion_matrix(credit_scoring_data, base_model_container):
    """Test confusion matrix calculations."""
    # Create CreditScoring instance with specific parameters
    cre_sco_obj = CreditScoring(
        model_params=[base_model_container],
        fair_threshold=80,
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        perf_metric_name="accuracy",
        tran_row_num=[20, 40],
        tran_max_sample=10,
        tran_pdp_feature=['LIMIT_BAL'],
        tran_max_display=10
    )

    # Prepare test data
    y_true_reshape = np.array(cre_sco_obj.model_params[0].y_true).reshape(1, 1, -1)
    y_pred_reshape = np.array(cre_sco_obj.model_params[0].y_pred).reshape(1, 1, -1)

    # Test case 1: Basic confusion matrix without predictions
    result = cre_sco_obj._get_confusion_matrix_optimized(y_true_reshape, None, None)
    assert len(result) == 4
    assert np.all(np.equal(result[0], None))

    # Test case 2: Confusion matrix with protected variable
    result = cre_sco_obj._get_confusion_matrix_optimized(y_true_reshape, None, None, curr_p_var='SEX')
    assert len(result) == 8
    assert np.all(np.equal(result[0], None))

    # Test case 3: Confusion matrix with special parameters
    cre_sco_obj.spl_params = {
        'num_applicants': {'SEX': [3500, 5000], 'MARRIAGE': [3500, 5000]},
        'base_default_rate': {'SEX': [0.1, 0.05], 'MARRIAGE': [0.1, 0.05]}
    }
    result = cre_sco_obj._get_confusion_matrix_optimized(y_true_reshape, y_pred_reshape, None)
    assert len(result) == 4
    assert tuple(round(a.item(), 1) for a in result) == (5039, 819, 840, 802)

    # Test case 4: Confusion matrix with sample weights and protected variable
    cre_sco_obj._rejection_inference_flag = {'SEX': False, 'MARRIAGE': False}
    sample_weight = np.array([0.7 for _ in range(len(y_pred_reshape.flatten()))])

    result = cre_sco_obj._get_confusion_matrix_optimized(
        y_true=y_true_reshape,
        y_pred=y_pred_reshape,
        sample_weight=sample_weight,
        curr_p_var='SEX',
        feature_mask=cre_sco_obj.feature_mask
    )

    assert len(result) == 8
    expected_values = (1309.7, 255.5, 275.8, 273.0, 2217.6, 317.8, 312.2, 288.4)
    actual_values = tuple(round(a.item(), 1) for a in result)
    assert actual_values == expected_values
