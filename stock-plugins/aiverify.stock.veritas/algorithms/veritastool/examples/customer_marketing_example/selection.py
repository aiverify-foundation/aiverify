"""
Generic selection strategy functions.

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
from typing import Iterable, Union

import numpy as np
import pandas as pd

#
# Selection strategies
#


def threshold(
    score: np.array, X: Union[np.array, pd.DataFrame], thresh: float = 0.0
) -> np.array:
    """Select all those above a score threshold."""
    selected_mask = score >= thresh
    return selected_mask


def diff_threshold(
    score: np.array,
    X: pd.DataFrame,
    column: str,
    groups: Iterable[str],
    thresholds: Iterable[float],
) -> np.array:
    """Select all those above a score threshold."""
    selected_mask = np.zeros(len(score), dtype=bool)
    for g, t in zip(groups, thresholds):
        group_mask = X[column] == g
        selected_mask[group_mask] = score[group_mask] >= t
    return selected_mask


def topn(score: np.array, X: Union[np.array, pd.DataFrame], n_select: int) -> np.array:
    """Select the top N individuals as ranked by estimated score."""
    rank = np.argsort(score)[::-1]
    selected_index = rank[:n_select]
    selected_mask = _index_to_mask(len(score), selected_index)
    return selected_mask


def topp(
    score: np.array, X: Union[np.array, pd.DataFrame], p_select: float
) -> np.array:
    """Select the top proportion of individuals as ranked by estimated lift."""
    rank = np.argsort(score)[::-1]
    assert p_select > 0.0 and p_select <= 1.0, "p_select must be (0, 1]."
    n_select = int(round(len(score) * p_select))
    selected_index = rank[:n_select]
    selected_mask = _index_to_mask(len(score), selected_index)
    return selected_mask


#
# Module helpers
#


def _index_to_mask(N: int, selected_index: np.array):
    """Turn a selection index into a mask."""
    selected_mask = np.zeros(N, dtype=bool)
    selected_mask[selected_index] = True
    return selected_mask
