"""
Basic fairness measures specific to uplift models.

Written by Daniel Steinberg and Lachlan McCalman,
Gradient Institute Ltd. (info@gradientinstitute.org).

Copyright © 2020 Monetary Authority of Singapore

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
"""

from functools import partial
from typing import Callable, Dict, Tuple, Union

import numpy as np
import pandas as pd
from response import Responder
from scipy.integrate import simpson
from scipy.stats import multinomial
from scipy.stats.mstats import mquantiles
from sklearn.metrics import log_loss, r2_score
from sklearn.preprocessing import OneHotEncoder
from uplift import Uplifter

#
# Generic Uplift Scorers
#


def make_model_scorer(
    scorefn: Callable, *args, pred_method: str = "select", **kwargs
) -> float:
    """Make a scorer for an uplift model (Uplifter or Responder class)."""

    # Make the scorer function
    def scorer(estimator, X, y):
        predict = getattr(estimator, pred_method)(X)
        score = scorefn(y, predict, *args, **kwargs)
        return score

    return scorer


def make_fair_scorer(
    func: Callable,
    prot_attr: str,
    priv_group: int,
    diff: bool,
    *args,
    pred_method: str = "select",
    **kwargs,
) -> float:
    """Make a scorer that is the disparity between protected group scores."""

    # make the scorer function
    def scorer(estimator, X, y):
        # get selection and protected attribute
        predict = getattr(estimator, pred_method)(X)
        attributes = _get_attributes(y)
        protected = np.array(attributes[prot_attr] != priv_group)

        # call the input scoring function
        s_r = func(y[protected], predict[protected], *args, **kwargs)
        s_i = func(y[~protected], predict[~protected], *args, **kwargs)

        measure = s_r - s_i if diff else s_r / s_i
        return measure

    return scorer


def gini_fairness(
    estimator: Union[Responder, Uplifter],
    X: Union[np.array, pd.DataFrame],
    y: pd.Series,
    prot_attr: str,
    n_percentiles: int = 20,
) -> float:
    """Calculate the Gini coefficient for continuous protected attributes.

    This calculation is based on trapezoidal integration of the Lorenz curve.
    """
    selection = estimator.select(X)
    attributes = _get_attributes(y)

    # Get the continuous protected attribute
    if prot_attr in attributes.columns:
        A = np.array(attributes[prot_attr])
    elif prot_attr in X.columns:
        A = np.array(X[prot_attr])
    else:
        raise ValueError("`prot_attr` is not in y or X!")

    G = _gini_coefficient(selection, A, n_percentiles)
    return G


#
# Test data evaluator
#


def test_model(
    estimator: Uplifter,
    X_test: Union[pd.DataFrame, np.array],
    y_test: pd.Series,
    scorers: Dict[str, Callable],
    lower_quantile: float = 0.05,
    upper_quantile: float = 0.95,
    replications: int = 50,
) -> Dict[str, Tuple[float, int]]:
    """Evaluate the uplift model scores on a test dataset, with uncertainty."""
    scores = {}
    for k, fun in scorers.items():
        pfun = partial(fun, estimator)
        scores[k] = _empirical_bootstrap(
            pfun,
            X_test,
            y_test,
            q_lower=lower_quantile,
            q_upper=upper_quantile,
            replications=replications,
        )

    return scores


#
#  Additional model measures
#


def std_nlog_loss(y_true: Union[pd.Series, np.ndarray], p_pred: np.array) -> float:
    """Standardised negative log-loss.

    Standardised against a naive predictor trained on the test set.
    """
    nll = -log_loss(y_true, p_pred)
    # This assumes the labels were sorted using python's sort function,
    #   which is true for scikit learn classes.
    y_enc = OneHotEncoder(sparse=False).fit_transform(y_true.to_numpy()[:, np.newaxis])

    p_rate = y_enc.mean(axis=0)
    naive = multinomial(n=1, p=p_rate)
    naivell = naive.logpmf(y_enc).mean()

    std_nll = nll - naivell
    return std_nll


def empirical_lift(y: pd.Series, selected: np.array) -> float:
    """Estimate the empirical lift from a selection."""
    Ntr = sum(y[selected] == "TR")
    Ntn = sum(y[selected] == "TN")
    pRcT = Ntr / (Ntr + Ntn)
    Ncr = sum(y[selected] == "CR")
    Ncn = sum(y[selected] == "CN")
    pRcC = Ncr / (Ncr + Ncn)
    emp_lift = pRcT - pRcC
    return emp_lift


def lift_r2(y: pd.Series, lift: np.array) -> float:
    """Calculate R2 score between predicted lift and empirical lift deciles."""
    deciles = np.arange(10)
    dec_idx = pd.qcut(lift, 10, labels=deciles)

    # Compute the empirical lift per deciles
    emp_lift = np.array([empirical_lift(y, dec_idx == d) for d in deciles])

    # Compute the average predicted lift per decile
    med_lift = np.array([np.median(lift[dec_idx == d]) for d in deciles])

    # R2 between lifts
    r2 = r2_score(emp_lift, med_lift)
    return r2


def proportion_selected(y: pd.Series, selected: np.array) -> float:
    """Calculate the proportion of the cohort selected."""
    # Impact rate
    p_sel = sum(selected) / len(selected)
    return p_sel


#
# Mock deployment impact scoring
#


def deployment_outcomes(y: pd.Series, selected: np.array) -> pd.DataFrame:
    """Get the 'real world' outcomes from a deployment."""
    attributes = _get_attributes(y)

    # Copy not selected outcomes to outcomes
    applied = np.array(attributes.ns_applied)
    acquired = np.array(attributes.ns_acquired)
    success = np.array(attributes.ns_success)

    # Change selected to selected outcomes
    applied[selected] = attributes.loc[selected, "s_applied"]
    acquired[selected] = attributes.loc[selected, "s_acquired"]
    success[selected] = attributes.loc[selected, "s_success"]

    outcomes = pd.DataFrame(
        {
            "applied": applied,
            "acquired": acquired,
            "success": success,
        },
        index=y.index,
    )

    return outcomes


def mock_deploy(
    estimator: Uplifter,
    X_deploy: Union[pd.DataFrame, np.array],
    y_deploy: pd.Series,
    y_train: pd.Series,
    scorers: Dict[str, Callable],
    lower_quantile: float = 0.05,
    upper_quantile: float = 0.95,
    replications: int = 50,
) -> Dict[str, Tuple[float, int]]:
    """Evaluate the uplift model selection harms and benefits."""
    scores = {}
    for k, fun in scorers.items():
        pfun = partial(fun, estimator)
        scores[k] = _empirical_bootstrap(
            pfun,
            X_deploy,
            y_deploy,
            y_train,
            q_lower=lower_quantile,
            q_upper=upper_quantile,
            replications=replications,
        )

    return scores


def make_impacts(scorefn: Callable, *args, **kwargs) -> Callable:
    """Make a deployment impact scorer."""

    # make the scorer function
    def scorer(estimator, X_deploy, y_deploy, y_train):
        selected = estimator.select(X_deploy)
        outcomes = estimator.predict_outcomes(X_deploy)
        out_dep = deployment_outcomes(y_deploy, selected)
        out_ctl = _control_outcomes(y_train)
        Ir = scorefn(out_dep, out_ctl, selected, outcomes, *args, **kwargs)
        return Ir

    return scorer


def make_fair_impacts(
    scorefn: Callable, prot_attr: str, reported_group: int, *args, **kwargs
) -> Callable:
    """Make an impact scorer that is the disparity between groups."""

    # make the scorer function
    def scorer(estimator, X_deploy, y_deploy, y_train):
        # get selection and control
        selected = estimator.select(X_deploy)
        outcomes = estimator.predict_outcomes(X_deploy)
        out_dep = deployment_outcomes(y_deploy, selected)
        out_ctl = _control_outcomes(y_train)

        # selection reported mask
        att_dep = _get_attributes(y_deploy)
        rpt_dep = np.array(att_dep[prot_attr] == reported_group)

        # control reported mask
        att_ctl = _get_attributes(y_train)[_get_control(y_train)]
        rpt_ctl = np.array(att_ctl[prot_attr] == reported_group)

        pred_out_dep = {k: v[rpt_dep] for k, v in outcomes.items()}

        # call the input scoring function
        Ir = scorefn(
            out_dep[rpt_dep],
            out_ctl[rpt_ctl],
            selected[rpt_dep],
            pred_out_dep,
            *args,
            **kwargs,
        )

        return Ir

    return scorer


#
# Direct harm and Benefit scoring functions
#


def benefit_from_receive(
    out_dep: pd.DataFrame,
    out_ctl: pd.DataFrame,
    selected: np.array,
    outcomes: Dict,
) -> float:
    """Calculate benefit from receiving an intervention."""
    return proportion_selected(out_dep, selected)


def benefit_from_receive_gini(
    out_dep: pd.DataFrame,
    out_ctl: pd.DataFrame,
    selected: np.array,
    outcomes: Dict,
    prot_attr: str,
    n_percentiles: int = 20,
) -> float:
    """Calculate benefit from receiving an intervention, continuous."""
    attributes = _get_attributes(out_dep)
    A = np.array(attributes[prot_attr])
    G = _gini_coefficient(selected, A, n_percentiles)
    return G


def harm_from_unwanted(
    out_dep: pd.DataFrame,
    out_ctl: pd.DataFrame,
    selected: np.array,
    outcomes: Dict,
) -> float:
    """Calculate the harm from receiving an unwanted intervention."""
    selected = selected.astype(bool)
    s_napplied = sum(1 - out_dep.applied[selected])
    ns_napplied = sum(1 - out_dep.applied[~selected])
    Ir = s_napplied / (s_napplied + ns_napplied)
    return Ir


def harm_from_unwanted_gini(
    out_dep: pd.DataFrame,
    out_ctl: pd.DataFrame,
    selected: np.array,
    outcomes: Dict,
    prot_attr: str,
    n_percentiles: int = 20,
) -> float:
    """Calculate the harm from receiving unwanted intervention, continuous."""
    selected = selected.astype(bool)
    napplied = (1 - out_dep.applied).astype(bool)
    s_napplied = np.logical_and(selected, napplied)
    attributes = _get_attributes(out_dep)
    A = np.array(attributes[prot_attr])
    G = _gini_coefficient(s_napplied, A, n_percentiles)
    return G


#
# Indirect/Causal Harm and Benefit Measures
#


def benefit_from_acquire(
    out_dep: pd.DataFrame,
    out_ctl: pd.DataFrame,
    selected: np.array,
    outcomes: Dict,
) -> Tuple[float, int]:
    """Calculate the benefit from acquiring the product."""
    I_acq = sum(out_dep.acquired) / len(out_dep)
    I_c_acq = sum(out_ctl.acquired) / len(out_ctl)
    DI = I_acq - I_c_acq
    return DI


def harm_failed_application(
    out_dep: pd.DataFrame,
    out_ctl: pd.DataFrame,
    selected: np.array,
    outcomes: Dict,
    denominator_applied: bool = False,
) -> Tuple[float, int]:
    """Calculate the harm from a failed application."""
    # Impact rates
    sel_app_nacq = np.logical_and(out_dep.acquired == 0, out_dep.applied == 1)
    ctl_app_nacq = np.logical_and(out_ctl.acquired == 0, out_ctl.applied == 1)
    if denominator_applied:
        I_acq = sum(sel_app_nacq) / sum(out_dep.applied)
        I_c_acq = sum(ctl_app_nacq) / sum(out_ctl.applied)
    else:
        I_acq = sum(sel_app_nacq) / len(out_dep)
        I_c_acq = sum(ctl_app_nacq) / len(out_ctl)
    DI = I_acq - I_c_acq
    return DI


def harm_longterm(
    out_dep: pd.DataFrame,
    out_ctl: pd.DataFrame,
    selected: np.array,
    outcomes: Dict,
) -> Tuple[float, int]:
    """Calculate the harm from a long-term credit outcome."""
    # Impact rates
    sel_acq_nsuc = np.logical_and(out_dep.success == 0, out_dep.acquired == 1)
    ctl_acq_nsuc = np.logical_and(out_ctl.success == 0, out_ctl.acquired == 1)
    Ncohort = sum(out_dep.acquired)
    I_suc = sum(sel_acq_nsuc) / Ncohort
    I_c_suc = sum(ctl_acq_nsuc) / sum(out_ctl.acquired)
    DI = I_suc - I_c_suc
    return DI


#
# Private module functions
#


def _get_attributes(y: pd.Series) -> pd.DataFrame:
    """Get the attributes from a target Series."""
    attributes = y.index.to_frame(index=False)
    attributes.set_index("ID", inplace=True)
    return attributes


def _get_selection_protection(
    estimator: Uplifter,
    X: Union[np.array, pd.DataFrame],
    y: pd.Series,
    prot_attr: str,
    priv_group: int,
) -> Tuple[np.array, np.array, pd.DataFrame]:
    """Get selection, protected attribute masks, and other attributes."""
    selection = estimator.select(X)
    attributes = _get_attributes(y)
    protected = np.array(attributes[prot_attr] != priv_group)
    return selection, protected


def _control_outcomes(y_train: pd.Series) -> pd.DataFrame:
    """Get the control outcomes from the experiment."""
    attributes = _get_attributes(y_train)

    # Filter only control data
    incontrol = _get_control(y_train)
    control = attributes[incontrol]

    # Copy not selected outcomes to outcomes
    outcomes = control[["ns_applied", "ns_acquired", "ns_success"]]
    outcomes.columns = ["applied", "acquired", "success"]

    return outcomes


def _get_control(y):
    """Get a mask of those in the control group."""
    CR = np.array(y == "CR")
    CN = np.array(y == "CN")
    incontrol = np.logical_or(CR, CN)
    return incontrol


# def _empirical_bootstrap(
#     func: Callable,
#     *data,
#     replications: int,
#     q_lower: float,
#     q_upper: float,
#     **fkwargs
# ) -> Tuple[float, float, float]:
#     """Get the confidence intervals using the empirical bootstrap."""
#     # get the score from data
#     score = func(*data, **fkwargs)

#     return score, score, score


def _empirical_bootstrap(
    func: Callable, *data, replications: int, q_lower: float, q_upper: float, **fkwargs
) -> Tuple[float, float, float]:
    """Get the confidence intervals using the empirical bootstrap."""
    # get the score from data
    score = func(*data, **fkwargs)
    N = len(data[0])

    # resample the data, get the score differences
    samples = np.zeros(replications)
    for r in range(replications):
        rind = np.random.choice(N, N, replace=True)
        sdata = [d.iloc[rind] for d in data]
        score_sample = func(*sdata, **fkwargs)
        samples[r] = score_sample - score

    # Compute the quantiles of these differences, then compute corresponding
    # quantiles for the score note that the quantiles of the differences are
    # reversed when applying to the score.
    d_l, d_u = mquantiles(samples, prob=[1.0 - q_lower, 1.0 - q_upper])
    score_l, score_u = score - d_l, score - d_u
    return score_l, score, score_u


def _gini_coefficient(
    selection: np.array, attribute: np.array, n_percentiles: int
) -> float:
    """Gini coefficient of the selection shared over the attribute."""
    # Cut the selected cohort lift into percentiles based on their attribute
    percentiles = np.arange(n_percentiles)
    perc_idx = pd.qcut(attribute, n_percentiles, labels=percentiles)

    # Calculate the area under the Lorenz curve
    hist = np.array([sum(selection[perc_idx == p]) for p in percentiles])
    cum_select = np.cumsum(hist) / sum(selection)
    area = simpson(
        np.insert(cum_select, 0, 0), np.linspace(0, 1, n_percentiles + 1)  # start at 0
    )

    G = 1.0 - 2.0 * area
    return G
