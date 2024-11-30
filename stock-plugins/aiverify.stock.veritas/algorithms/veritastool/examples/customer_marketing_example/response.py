"""
Response/Propensity estimation and selection functions.

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
from typing import Callable, Union

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator

#
# Estimators for uplift
#


class Responder(BaseEstimator):
    """Wrap a scikit learn estimator with properties for propensity models."""

    def __init__(self, selectionfn: Callable, clf: BaseEstimator) -> None:
        self.clf = clf
        self.selectionfn = selectionfn

    def fit(self, X: Union[np.array, pd.DataFrame], y: pd.Series) -> BaseEstimator:
        self.clf.fit(X, y)
        return self

    def predict(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.clf.predict(X)

    def predict_proba(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.clf.predict_proba(X)

    def decision_function(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        return self.clf.decision_function(X)

    def select(self, X: Union[np.array, pd.DataFrame]) -> np.array:
        proba = self.predict_proba(X)[:, 1]
        selection = self.selectionfn(proba)
        return selection
