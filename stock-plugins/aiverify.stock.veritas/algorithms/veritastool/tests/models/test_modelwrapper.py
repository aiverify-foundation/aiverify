import os
import pickle
import sys

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

# Set up project paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
sys.path.insert(0, project_root)

from aiverify_veritastool.model.modelwrapper import ModelWrapper

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
def model_setup(credit_scoring_data):
    """Fixture to set up model and data for testing."""
    cs = credit_scoring_data

    # Prepare test data
    model_params = {
        'y_true': np.array(cs["y_test"]),
        'y_pred': np.array(cs["y_pred"]),
        'y_train': np.array(cs["y_train"]),
        'p_var': ["SEX", "MARRIAGE"],
        'p_grp': {"SEX": [1], "MARRIAGE": [1]},
        'x_train': cs["X_train"],
        'x_test': cs["X_test"],
        'model_object': LogisticRegression(C=0.1),
        'model_name': "credit scoring",
        'model_type': "credit",
        'y_prob': cs["y_prob"]
    }

    return model_params

def test_model_wrapper(model_setup):
    """Test ModelWrapper functionality."""
    # Create ModelWrapper instance
    model_wrapper = ModelWrapper(model_setup['model_object'])

    # Test fit_predict functionality
    assert model_wrapper.check_fit_predict(
        model_setup['x_train'],
        model_setup['y_train'],
        model_setup['x_test'],
        model_setup['y_true']
    ) == 1
