"""
Utility functions for I/O.

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

import pathlib
from os import path

import pandas as pd

COVARIATES_FILE = "model_inputs.csv"
SENSITIVE_FILE = "sensitive_attributes.csv"
OUTCOMES_FILE = "outcomes.csv"
TRUTH_FILE = "truth.csv"
INDEX_LABEL = "ID"


def load_data():
    """Load the simulation data, run the simulation if no data exists."""
    datapath = pathlib.Path(__file__).parent.absolute()
    files = [COVARIATES_FILE, SENSITIVE_FILE, OUTCOMES_FILE, TRUTH_FILE]
    paths = [path.join(datapath, f) for f in files]
    data = tuple(pd.read_csv(f, index_col=INDEX_LABEL) for f in paths)
    return data


def outcomes2labels(outcomes: pd.DataFrame, sensitives: pd.DataFrame):
    """Filter the outcomes into labels for ML algorithms.

    This returns both uplift and response/propensity labels. This also puts
    the sensitive attributes into the targets as a MultiIndex like aif360.
    """
    # Un-dummy uplift target
    uplift = outcomes[["TN", "TR", "CN", "CR"]].astype(int)
    uplift = uplift[uplift == 1].stack().reset_index()["level_1"]

    # response
    response = outcomes["s_applied"]  # you don't see DND's in a response mod.

    # Now make a multi-index with all of the relevant things
    outcome_cols = [
        "s_applied",
        "s_acquired",
        "s_success",
        "ns_applied",
        "ns_acquired",
        "ns_success",
    ]
    ids = pd.Series(outcomes.index)
    index = pd.concat((ids, sensitives, outcomes[outcome_cols]), axis=1)
    index = pd.MultiIndex.from_frame(index)
    uplift.index = index
    response.index = index

    return uplift, response
