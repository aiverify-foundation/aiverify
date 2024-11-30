"""
Uplift estimation and selection functions.

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

from typing import Callable, Dict, Union

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator

#
# Estimators for uplift
#


class Uplifter(BaseEstimator):
    """Wrap a scikit learn estimator with properties for uplift estimation."""

    def __init__(
        self,
        liftfn: Callable,
        selectionfn: Callable,
        clf: BaseEstimator,
        outcome: str = "lift",
    ) -> None:
        self.clf = clf
        self.liftfn = liftfn
        self.selectionfn = selectionfn
        self.outcome = outcome

    def fit(self, X: Union[np.array, pd.DataFrame], y: pd.Series) -> BaseEstimator:
        self.clf.fit(X, y)
        self.classes_ = self.clf.classes_
        self.base_rates_ = lift_base_rates(y, self.classes_)
        return self

    def predict(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.clf.predict(X)

    def predict_proba(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.clf.predict_proba(X)

    def predict_outcomes(self, X: Union[np.array, pd.DataFrame]) -> Dict:
        """Predict probability of outcome if treated and untreated."""
        idx = {lab: i for i, lab in enumerate(self.classes_)}
        pC = self.base_rates_[idx["CR"]] + self.base_rates_[idx["CN"]]
        pT = self.base_rates_[idx["TR"]] + self.base_rates_[idx["TN"]]
        p = self.predict_proba(X)
        pOcT = p[:, idx["TR"]] / pT
        pOcC = p[:, idx["CR"]] / pC
        return {self.outcome + "_treatment": pOcT, self.outcome + "_control": pOcC}

    def decision_function(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.clf.decision_function(X)

    def lift(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        p_pred = self.predict_proba(X)
        est_lift = self.liftfn(self.classes_, p_pred, self.base_rates_)
        return est_lift

    def select(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        est_lift = self.lift(X)
        selection = np.array(self.selectionfn(est_lift, X))
        return selection

    def set_selectionfn(self, selectionfn: Callable) -> None:
        """Set the selection function."""
        self.selectionfn = selectionfn


class OutcomePredictor:
    def __init__(self, *predictors):
        self.predictors = {}
        for p in predictors:
            self.predictors.update({p.outcome: p})

    def predict(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.clf.predict(X)

    def predict_proba(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.predictors["lift"].predict_proba(X)

    def lift(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.predictors["lift"].lift(X)

    def select(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.predictors["lift"].select(X)

    def predict_outcomes(self, X: Union[np.array, pd.DataFrame]) -> Dict:
        outcomes = {}
        for p in self.predictors.values():
            outcomes.update(**p.predict_outcomes(X))
        return outcomes


#
# Lift calculation functions
#


def multiclass_lift(classes: np.array, p_pred: np.array, p_base: np.array) -> np.array:
    """Estimated lift from multi class classifier predictions."""
    # Get the base rates
    idx = {lab: i for i, lab in enumerate(classes)}
    pC = p_base[idx["CR"]] + p_base[idx["CN"]]
    pT = p_base[idx["TR"]] + p_base[idx["TN"]]

    # estimated lift
    e_lift = (p_pred[:, idx["TR"]] - p_pred[:, idx["TN"]]) / pT + (
        p_pred[:, idx["CN"]] - p_pred[:, idx["CR"]]
    ) / pC
    return e_lift


def lift_base_rates(y: pd.Series, classes: np.array) -> np.array:
    """Compute the base rates in targets, y."""
    p_base = np.array([np.mean(y == lab) for lab in classes])
    return p_base
