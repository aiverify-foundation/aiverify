import os
import pickle
import sys

project_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
sys.path.insert(0, project_root)
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from veritastool.model.modelwrapper import ModelWrapper


def test_model_wrapper():
    # Load Credit Scoring Test Data
    file = os.path.join(
        project_root, "veritastool", "examples", "data", "credit_score_dict.pickle"
    )
    input_file = open(file, "rb")
    cs = pickle.load(input_file)
    input_file.close()
    # Reduce into two classes
    cs["X_train"]["MARRIAGE"] = cs["X_train"]["MARRIAGE"].replace([0, 3], 1)
    cs["X_test"]["MARRIAGE"] = cs["X_test"]["MARRIAGE"].replace([0, 3], 1)
    # Model Contariner Parameters
    y_true = np.array(cs["y_test"])
    y_pred = np.array(cs["y_pred"])
    y_train = np.array(cs["y_train"])
    p_var = ["SEX", "MARRIAGE"]
    p_grp = {"SEX": [1], "MARRIAGE": [1]}
    x_train = cs["X_train"]
    x_test = cs["X_test"]

    model_object = LogisticRegression(C=0.1)
    model_name = "credit scoring"
    model_type = "credit"
    y_prob = cs["y_prob"]

    test = ModelWrapper(model_object)

    assert test.check_fit_predict(x_train, y_train, x_test, y_true) is True
