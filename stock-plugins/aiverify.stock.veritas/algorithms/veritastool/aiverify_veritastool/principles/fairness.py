import concurrent.futures
import copy
import datetime
import json
import re
import sys
from typing import Optional
import warnings
from copy import deepcopy
from math import floor
from pathlib import Path

import phik  # noqa
import IPython
import ipywidgets as widgets
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from IPython.display import HTML, display
from ipywidgets import HBox, Layout, VBox
from tqdm.auto import tqdm

from ..metrics.fairness_metrics import FairnessMetrics
from ..metrics.newmetric import NewMetric
from ..metrics.performance_metrics import PerformanceMetrics
from ..metrics.tradeoff import TradeoffRate
from ..config.constants import Constants
from ..util.errors import VeritasError
from ..util.schema import ModelArtifact, parse_model_artifact
from ..util.utility import (
    check_multiprocessing,
    input_parameter_filtering,
    input_parameter_validation,
    process_y_prob,
    check_data_unassigned,
    check_datatype,
    check_value,
)

# Some of the older created examples have this issues
warnings.filterwarnings("ignore", message="X has feature names, but StandardScaler was fitted without feature names")


class Fairness:
    """
    Base Class with attributes used across all use cases within Machine Learning model fairness evaluation.
    """

    def __init__(
        self,
        model_params,
        fair_threshold,
        fair_metric_name,
        fair_is_pos_label_fav,
        fair_concern,
        fair_priority,
        fair_impact,
        fair_metric_type,
        fairness_metric_value_input,
    ):
        """
        Parameters
        ------------------
        model_params : list
                It holds ModelContainer object(s).
                Data holder that contains all the attributes of the model to be assessed. Compulsory input for initialization.

        Instance Attributes
        -------------------
        fair_metric_obj : object, default=None
                Stores the FairnessMetrics() object and contains the result of the computations.

        perf_metric_obj : object, default=None
                Stores the PerformanceMetrics() object and contains the result of the computations.

        percent_distribution : dict, default=None
                Stores the percentage breakdown of the classes in y_true.

        calibration_score : float, default=None
                The brier score loss computed for calibration. Computable if y_prob is given.

        calibration_curve_bin : dict, default=None
                Dictionary of calibration score, probabilities of predicted and true values.

        tradeoff_obj : object, default=None
                Stores the TradeoffRate() object and contains the result of the computations.

        correlation_output : dict, default=None
                Pairwise correlation of most important features (top 20 feature + protected variables).

        feature_mask : dict of list, default=None
                Stores the mask array for every protected variable applied on the x_test dataset.

        fair_conclusion : dict, default=None
                Contains conclusion of how the primary fairness metric compares against the fairness threshold. The key will be the protected variable and the conclusion will be "fair" or "unfair".
                e.g. {"gender": {'fairness_conclusion': "fair", "threshold": 0.01}, "race":{'fairness_conclusion': "unfair", "threshold": 0.01}}

        evaluate_status : int, default=0
                Tracks the status of the completion of the evaluate() method to be checked in compile(). Either 1 for complete or -1 for error if any exceptions were raised.

        evaluate_status_cali: boolean, default=False
                Tracks the status of the completion of the calibration curve step within evaluate() method to be checked in compile().
                False = Skipped (if y_prob is not provided)
                True = Complete

        evaluate_status_perf_dynamics: boolean, default=False
                Tracks the status of the completion of the performance dynamics step within evaluate() method to be checked in compile().
                False = Skipped
                True = Complete

        evaluate_status_indiv_fair: boolean, default=False
                Tracks the status of the completion of the individual fairness step within evaluate() method to be checked in compile().
                False = Skipped
                True = Complete

        tradeoff_status : int, default=0
                Tracks the status of the completion of the tradeoff() method to be checked in compile().
                0 = Not started
                1 = Complete
                -1 = Skipped (if y_prob is not provided)

        feature_imp_status : int, default=0
                Tracks the status of the completion of the compute_feature_imp() method to be checked in compile().
                0 = Not started
                1 = Complete
                -1 = Skipped (if model_object not provided, wrong train_op_name/predict_op_name, x_train or x_test error)

        feature_imp_status_loo: boolean, default=False
                Tracks the status of the completion of the leave-one-out analysis step within feature_importance() method to be checked in compile().
                False = Skipped (if x_train or y_train or model object or fit/predict operator names are not provided)
                True = Complete

        feature_imp_status_corr: boolean, default=False
                Tracks the status of the completion of the correlation matrix computation step within feature_importance() method to be checked in compile().
                False = Skipped (if the correlation dataframe is not provided in ModelContainer)
                True = Complete

        feature_imp_values: dict of list, default = None
                Contains the difference in metric values between the original and loco models for each protected variable.

                {"gender":
                         {
                          "gender": (perf_delta, fair_delta, flip, suggestion),
                          "race": (perf_delta, fair_delta, flip, suggestion)
                          },
                "race":
                         {
                          "gender": (perf_delta, fair_delta, flip, suggestion),
                          "race": (perf_delta, fair_delta, flip, suggestion)
                          }
                }

                flip = "fair to fair", "unfair to fair", "fair to unfair", "unfair to unfair"

        rootcause_values: dict of list, default = None
                Contains the mean SHAP values between the privileged and unprivileged groups of the protected variable, used for plots in rootcause() method.
                The values are normalized between 0 and 1.

        rootcause_label_index : int, default = -1
                The index of the target label to be considered for root cause analysis. Default -1 assumes the last index of classes_ attribute.

        rootcause_model_num : int, default = 0
                Data holder that contains all the attributes of the model to be assessed. It may hold more than one ModelContainer object.

        rootcause_sample_size : int, default = None
                The sample size used in root cause analysis.

        sigma : float or int , default = 0
                 Standard deviation for Gaussian kernel for smoothing the contour lines of primary fairness metric.
                 When sigma <= 0, smoothing is turn off.
                 Suggested to try sigma = 3 or above if noisy contours are observed.

        corr_df : pandas.DataFrame
                The correlation matrix computed using Phi_K correlation coefficient.

        corr_top_3_features : list, default = []
                Contains the unique top 3 features with the highest correlation coefficients for each protected variable, excluding surrogate features.

        surrogate_features : dict
                Contains surrogate features above correlation threshold for each protected variable.

        mitigate_result : dict
                Contains the outputs for the specified bias mitigate techniques, e.g., threshold tuning, reweighing and correlation removal.

        mitigate_p_var : list of strings, default = []
                Protected variables to be considered for bias mitigation.

        mitigate_method : list of strings, default = []
                Methods used for bias mitigation. Valid inputs include "reweigh", "correlate", "threshold".

        mitigate_surrogate_flag : int, default = 0
                Indicates whether `surrogate_features` output dictionary has surrogates for at least one p_var. By default, it assumes that there are no surrogates
                for all protected variables.

        rw_is_transform : boolean, default = False
                Indicates whether the reweighing technique has been applied to the transformed data or the original data.

        cr_is_transform : boolean, default = False
                Indicates whether the correlation removal technique has been applied be applied to the transformed data or the original data.

        tran_artifact : dict, default = None
                A dictionary containing the output results from the `_tran_compile` method, which includes the artifact from transparency `explain` method.

        evaluate_disable : list, default = []
                A list of functions (as string) that user wants to disable during evaluate. By default, no function is disabled.

        compile_disable : list, default = []
                A list of functions (as string) that user wants to disable during the compilation process. By default, no function is disabled.

        compile_disable_map : dict, default = {}
                A dictionary that contains the API function names disabled by user and features for each API. The dictionary can be empty if no features are disabled.

        is_pgrp_abv_min_size : dict
                A dictionary that stores the Boolean values for each p_var and checks whether p_grp is above minimum size.

        is_upgrp_abv_min_size : dict
                A dictionary that stores the Boolean values for each p_var and checks whether up_grp is above minimum size.

        _input_validation_lookup: dict
                Contains the attribute and its correct data type and allowed values (if applicable) for every argument passed by user.

        _use_case_metrics: dict of list, default = None
                Contains all the performance & fairness metrics for each use case.
                {"fair ": ["fnr_parity", ...], "perf": ["balanced_accuracy, ..."]}
                Dynamically assigned during initialisation by using the _metric_group_map in Fairness/Performance Metrics class and the _model_type_to_metric above.

        map_policy_to_method : dict
                Maps the policies to the corresponding compute functions.

        map_mitigate_to_method : dict
                Maps the mitigate methods to the corresponding compute functions.

        mitigate_methods : list
                A list the stores the supported bias mitigation techniques.

        multiclass_flag : boolean, default = False
                Indicates whether model parameters provided in ModelContainer runs multi-class classification diagnosis. Used in BaseClassification.

        err : object
                VeritasError object

        """
        self.model_params = model_params
        self.fair_threshold = fair_threshold
        self.fair_metric_name = fair_metric_name
        self.fair_concern = fair_concern
        self.fair_priority = fair_priority
        self.fair_impact = fair_impact
        self.fair_is_pos_label_fav = fair_is_pos_label_fav
        self.fair_metric_type = fair_metric_type
        self.fairness_metric_value_input = fairness_metric_value_input
        self.correlation_threshold = 0.7
        self.min_samples_per_label = Constants().min_samples_per_label
        self.fair_metric_obj = None
        self.perf_metric_obj = None
        self.percent_distribution = None
        self.calibration_score = None
        self.calibration_curve_bin = None
        self.tradeoff_obj = None
        self.correlation_output = None
        self.fair_conclusion = None
        self.evaluate_status = 0
        self.evaluate_status_cali = False
        self.evaluate_status_perf_dynamics = False
        self.evaluate_status_indiv_fair = False
        self.tradeoff_status = 0
        self.feature_imp_status = 0
        self.feature_imp_values = None
        self.feature_imp_status_corr = False
        self.feature_imp_status_loo = False
        self.rootcause_values = None
        self.rootcause_label_index = -1
        self.rootcause_model_num = 0
        self.rootcause_sample_size = None
        self.sigma = None
        self.corr_df = None
        self.corr_top_3_features = []
        self.surrogate_features = {}
        self.mitigate_result = {}
        self.mitigate_p_var = []
        self.mitigate_method = []
        self.mitigate_surrogate_flag = 0
        self.rw_is_transform = False
        self.cr_is_transform = False
        self.tran_artifact = None
        self.evaluate_disable = []
        self.compile_disable = []
        self.compile_disable_map = {}
        self.multiclass_flag = False
        self.err = VeritasError()
        # For adding user defined new metrics
        FairnessMetrics.add_user_defined_metrics()
        PerformanceMetrics.add_user_defined_metrics()

        self.fair_threshold_input = fair_threshold
        # This captures the fair_metric input by the user
        self.fair_metric_input = fair_metric_name
        self.fair_neutral_tolerance = Constants().fair_neutral_tolerance

        if self.model_params[0].p_grp is not None:
            self.is_pgrp_abv_min_size = dict.fromkeys(self.model_params[0].p_var, True)
            self.is_upgrp_abv_min_size = dict.fromkeys(self.model_params[0].p_var, True)

        self._model_type_input()
        auto_fair_metric_name = True if self.fair_metric_name == "auto" else False
        self._select_fairness_metric_name()
        self.check_perf_metric_name()
        self.check_fair_metric_name()

        self._use_case_metrics = {}
        use_case_fair_metrics = []
        check_fair_metrics = []
        for i, j in FairnessMetrics.map_fair_metric_to_group.items():
            check_fair_metrics.append(i)
            if self.fair_metric_name != "auto":
                if j[1] == self._model_type_to_metric_lookup[self.model_params[0].model_type][0] and (
                    j[2] == FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2]
                    or j[2] == "information"
                ):
                    use_case_fair_metrics.append(i)
            else:
                if j[1] == self._model_type_to_metric_lookup[self.model_params[0].model_type][0] and (
                    j[2] == self.fair_metric_type or j[2] == "information"
                ):
                    use_case_fair_metrics.append(i)
        self._use_case_metrics["fair"] = use_case_fair_metrics

        use_case_perf_metrics = []
        for i, j in PerformanceMetrics.map_perf_metric_to_group.items():
            if j[1] == self._model_type_to_metric_lookup[self.model_params[0].model_type][0]:
                use_case_perf_metrics.append(i)
        self._use_case_metrics["perf"] = use_case_perf_metrics

        use_case_indiv_fair_metrics = []
        for i, j in FairnessMetrics.map_indiv_fair_metric_to_group.items():
            if j[1] == self._model_type_to_metric_lookup[self.model_params[0].model_type][0]:
                use_case_indiv_fair_metrics.append(i)
        self._use_case_metrics["indiv_fair"] = use_case_indiv_fair_metrics

        self._input_validation_lookup = {
            "fair_threshold": [
                (float, int),
                (Constants().fair_threshold_low, Constants().fair_threshold_high),
            ],
            "fair_neutral_tolerance": [
                (float,),
                (
                    Constants().fair_neutral_threshold_low,
                    Constants().fair_neutral_threshold_high,
                ),
            ],
            "fair_concern": [(str,), ["eligible", "inclusive", "both"]],
            "fair_priority": [(str,), ["benefit", "harm"]],
            "fair_impact": [(str,), ["normal", "significant", "selective"]],
            "perf_metric_name": [(str,), self._use_case_metrics["perf"]],
            "fair_metric_name": [(str,), check_fair_metrics],
            "model_params": [(list,), None],
            "fairness_metric_value_input": [(dict,), None],
        }

        if auto_fair_metric_name:
            self._input_validation_lookup["fair_metric_type"] = [
                (str,),
                ["difference", "ratio"],
            ]
        else:
            self.fair_metric_type = FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2]

        self.k = Constants().k
        self.array_size = Constants().perf_dynamics_array_size
        self.decimals = Constants().decimals
        self.correlation_bins = Constants().correlation_bins

        self.map_policy_to_method = {
            "maj_min": self._majority_vs_minority,
            "maj_rest": self._majority_vs_rest,
            "max_bias": self._max_bias,
        }

        self.map_mitigate_to_method = {
            "threshold": self._threshold,
            "reweigh": self._reweigh,
            "correlate": self._correlate,
        }

        self.mitigate_methods = ["threshold", "reweigh", "correlate"]

    def _majority_vs_minority(self, p_var, mdl):
        """
        Computes the majority and minority groups based on the maj_min policy and protected variable.

        Parameters
        ----------
        p_var : str
                Name of the protected variable.

        mdl : object
                Model container object containing the protected feature columns and true labels.

        Returns
        -------
        maj : list of lists
                List of lists containing the majority group values.

        min : list of lists
                List of lists containing the minority group values.
        """
        if mdl.model_type == "regression":
            maj = [mdl.protected_features_cols[p_var].value_counts().nlargest(1).index.values.tolist()]
            min = [mdl.protected_features_cols[p_var].value_counts().nsmallest(1).index.values.tolist()]
        else:
            maj_min_df = pd.concat([mdl.protected_features_cols[p_var], pd.Series(mdl.y_true)], axis=1)
            maj_min_df.columns = [p_var, "y_true"]
            maj_min_df = maj_min_df.groupby(mdl.protected_features_cols[p_var]).apply(
                lambda grp: self._get_sub_group_data(grp, None, False)
            )
            maj_min_df.columns = ["pos_labels", "neg_labels", "sample_count"]
            (
                maj_ix,
                min_ix,
                majgrp_abv_min_size,
                mingrp_abv_min_size,
            ) = self._get_max_min_group(maj_min_df)
            self.is_pgrp_abv_min_size[p_var] = majgrp_abv_min_size
            self.is_upgrp_abv_min_size[p_var] = mingrp_abv_min_size
            maj = [[maj_ix]]
            min = [[min_ix]]

        return maj, min

    def _majority_vs_rest(self, p_var, mdl):
        """
        Computes the majority and all the groups based on the maj_rest policy and protected variable.

        Parameters
        ----------
        p_var : str
                Name of the protected variable.

        mdl : object
                Model container object containing the protected feature columns and true labels.

        Returns
        -------
        maj : list of lists
                List of lists containing the majority group values.

        rest : list of lists
                List of lists containing all the other group values.
        """
        maj_rest = mdl.protected_features_cols[p_var].value_counts().nlargest(1)
        maj = [maj_rest.index.values.tolist()]
        rest = [[lbl for lbl in self.model_params[0].check_p_grp[p_var] if lbl not in maj[0]]]

        if mdl.model_type != "regression":
            maj_rest_df = pd.concat([mdl.protected_features_cols[p_var], pd.Series(mdl.y_true)], axis=1)
            maj_rest_df.columns = [p_var, "y_true"]
            maj_rest_df = maj_rest_df.groupby(mdl.protected_features_cols[p_var]).apply(
                lambda grp: self._get_sub_group_data(grp, None, False)
            )
            maj_rest_df.columns = ["pos_labels", "neg_labels", "sample_count"]

            maj_pos_lbls = maj_rest_df.loc[maj[0]]["pos_labels"].values[0]
            maj_neg_lbls = maj_rest_df.loc[maj[0]]["neg_labels"].values[0]
            rest_pos_lbls = maj_rest_df.loc[rest[0]]["pos_labels"].values.sum()
            rest_neg_lbls = maj_rest_df.loc[rest[0]]["neg_labels"].values.sum()

            if maj_pos_lbls > self.min_samples_per_label and maj_neg_lbls > self.min_samples_per_label:
                self.is_pgrp_abv_min_size[p_var] = True
            else:
                self.is_pgrp_abv_min_size[p_var] = False

            if rest_pos_lbls > self.min_samples_per_label and rest_neg_lbls > self.min_samples_per_label:
                self.is_upgrp_abv_min_size[p_var] = True
            else:
                self.is_pgrp_abv_min_size[p_var] = False

        return maj, rest

    def translate_fair_to_perf_metric(self):
        """
        Translates the primary fairness metric to the corresponding performance metric based on the lookup table `FairnessMetrics.map_fair_metric_to_group`.

        Returns
        -------
        perf_metric : str
                The name of the performance metric that corresponds to the primary fairness metric.

        direction : str
                The direction of the performance metric (either 'higher' or 'lower') indicating whether a higher metric value indicates better model performance.
        """
        perf_metric = FairnessMetrics.map_fair_metric_to_group[self.fair_metric_name][6]
        direction = FairnessMetrics.map_fair_metric_to_group[self.fair_metric_name][7]
        return perf_metric, direction

    def _get_sub_group_data(self, grp, perf_metric="sample_count", is_max_bias=True):
        """
        Computes the subgroup data for each policy.

        Parameters
        ----------
        grp : pandas.DataFrame
                A pandas dataframe containing the relevant data for the given subgroup.

        perf_metric : str
                The performance metric to use in the subgroup calculation, by default 'sample_count'.

        is_max_bias : bool
                Whether policy is `max_bias`, by default True.

        Returns
        -------
        pandas.Series
                A pandas series containing the count of positive and negative class, as well as the metric value.
        """
        pos_class_count = grp["y_true"].values.sum()
        neg_class_count = (1 - grp["y_true"].values).sum()
        if is_max_bias:
            metric_val = self.perf_metric_obj.translate_metric(
                perf_metric,
                obj=self.perf_metric_obj,
                subgrp_y_true=grp["y_true"].values,
                subgrp_y_pred=grp["y_pred"].values,
                subgrp_y_prob=grp["y_prob"].values,
            )
        else:
            metric_val = pos_class_count + neg_class_count

        return pd.Series([pos_class_count, neg_class_count, metric_val])

    def _get_max_min_group(self, subGrpDf, perf_metric="sample_count"):
        """
        Finds the maximum and minimum subgroups based on the performance metric and the minimum sample count thresholds.

        Parameters
        ----------
        subGrpDf : pandas.DataFrame
                DataFrame containing the subgroups to evaluate.

        perf_metric : str
                Performance metric used to evaluate the subgroups. Default is 'sample_count'.

        Returns
        -------
        best_ix : int
                Index of the best subgroup found based on the performance metric.

        worst_ix : int
                Index of the worst subgroup found based on the performance metric.

        max_group_found : bool
                True if a subgroup satisfying the minimum sample count threshold was found for the maximum group. False otherwise.

        min_group_found : bool
                True if a subgroup satisfying the minimum sample count threshold was found for the minimum group. False otherwise.
        """
        max_group_found = False
        min_group_found = False

        subGrpDf = subGrpDf.sort_values(by=[perf_metric], ascending=False)

        best_ix = subGrpDf.index[0]
        for ix in subGrpDf.index:
            if (
                subGrpDf.loc[ix]["pos_labels"] >= self.min_samples_per_label
                and subGrpDf.loc[ix]["neg_labels"] >= self.min_samples_per_label
            ):
                best_ix = ix
                max_group_found = True
                break

        worst_ix = subGrpDf.index[-1]
        for ix in list(reversed(subGrpDf.index)):
            if (
                subGrpDf.loc[ix]["pos_labels"] >= self.min_samples_per_label
                and subGrpDf.loc[ix]["neg_labels"] >= self.min_samples_per_label
            ):
                worst_ix = ix
                min_group_found = True
                break
        return best_ix, worst_ix, max_group_found, min_group_found

    def _max_bias(self, p_var, mdl):
        """
        Computes the best and worst groups based on the max_bias policy and protected variable.

        Parameters
        ----------
        p_var : str
                Name of the protected variable.

        mdl : object
                Model container object containing the protected feature columns and true labels.

        Returns
        -------
        best : list of lists
                List of lists containing the best group values.

        worst : list of lists
                List of lists containing the worst group values.
        """
        perf_metric, direction = self.translate_fair_to_perf_metric()

        max_bias_df = pd.concat(
            [
                mdl.protected_features_cols[p_var],
                pd.Series(mdl.y_true),
                pd.Series(mdl.y_pred),
                pd.Series(mdl.y_prob),
            ],
            axis=1,
        )
        max_bias_df.columns = [p_var, "y_true", "y_pred", "y_prob"]

        max_bias_df = max_bias_df.groupby(mdl.protected_features_cols[p_var]).apply(
            lambda grp: self._get_sub_group_data(grp, perf_metric)
        )

        max_bias_df.columns = ["pos_labels", "neg_labels", perf_metric]

        (
            best_ix,
            worst_ix,
            bestgrp_abv_min_size,
            worstgrp_abv_min_size,
        ) = self._get_max_min_group(max_bias_df, perf_metric)
        self.is_pgrp_abv_min_size[p_var] = bestgrp_abv_min_size
        self.is_upgrp_abv_min_size[p_var] = worstgrp_abv_min_size
        best = [[best_ix]]
        worst = [[worst_ix]]
        if direction == "lower":
            best, worst = worst, best

        return best, worst

    def _auto_assign_p_up_groups(self):
        """
        Automatically assigns privileged and unprivileged groups based on the policy specified by the user for the protected variable.

        It then maps the policy to the corresponding function that will assign the privileged and unprivileged groups.

        The resulting groups are stored in the respective model container object.
        """
        self.perf_metric_obj = PerformanceMetrics(self)
        mdl = self.model_params[0]
        for p_var_key in mdl.p_grp.keys():
            if isinstance(mdl.p_grp[p_var_key], str):
                with np.errstate(divide="ignore", invalid="ignore"):
                    p_grp, up_grp = self.map_policy_to_method[mdl.p_grp[p_var_key]](p_var_key, mdl)
                mdl.p_grp[p_var_key] = p_grp
                mdl.up_grp[p_var_key] = up_grp

    def _check_non_policy_p_var_min_samples(self):
        """
        Checks if the privileged group and unprivileged group meet the minimum sample size per label for a given protected variable, for p_grp/up_grp not specified using policy.
        """
        for p_var_key in self.model_params[0].p_grp.keys():
            if not isinstance(self.model_params[0].p_grp[p_var_key], str) and self.model_params[0].y_true is not None:
                p_grp_vals = self.model_params[0].p_grp[p_var_key][0]
                up_grp_vals = self.model_params[0].up_grp[p_var_key][0]

                p_up_df = pd.concat(
                    [
                        self.model_params[0].protected_features_cols[p_var_key],
                        pd.Series(self.model_params[0].y_true),
                    ],
                    axis=1,
                )
                p_up_df.columns = [p_var_key, "y_true"]
                p_up_df = p_up_df.groupby(self.model_params[0].protected_features_cols[p_var_key]).apply(
                    lambda grp: self._get_sub_group_data(grp, None, False)
                )
                p_up_df.columns = ["pos_labels", "neg_labels", "sample_count"]

                maj_pos_lbls = p_up_df.loc[p_grp_vals]["pos_labels"].values.sum()
                maj_neg_lbls = p_up_df.loc[p_grp_vals]["neg_labels"].values.sum()

                rest_pos_lbls = p_up_df.loc[up_grp_vals]["pos_labels"].values.sum()
                rest_neg_lbls = p_up_df.loc[up_grp_vals]["neg_labels"].values.sum()

                if maj_pos_lbls > self.min_samples_per_label and maj_neg_lbls > self.min_samples_per_label:
                    self.is_pgrp_abv_min_size[p_var_key] = True
                else:
                    self.is_pgrp_abv_min_size[p_var_key] = False

                if rest_pos_lbls > self.min_samples_per_label and rest_neg_lbls > self.min_samples_per_label:
                    self.is_upgrp_abv_min_size[p_var_key] = True
                else:
                    self.is_pgrp_abv_min_size[p_var_key] = False

    def evaluate(self, visualize=False, output=True, n_threads=1, seed=None, disable=[]):
        """
        Computes the percentage count of subgroups, performance, and fairness metrics together with their confidence intervals, calibration score & fairness metric self.fair_conclusion for all protected variables.
        If visualize = True, output will be overwritten to False (will not be shown) and run fairness_widget() from Fairness.
        Option to disable perf_dynamic, calibration_curve and individual_fair.

        Parameters
        ----------
        visualize : boolean, default=False
                If visualize = True, output will be overwritten to False and run fairness_widget() from Fairness.

        output : boolean, default=True
                If output = True, _print_evaluate() from Fairness will run.

        n_threads : int, default=1
                Number of currently active threads of a job

        seed : int, default=None
                Used to initialize the random number generator.

        disable : list, default=[]
                Used to specify which sections to skip. Can include "perf_dynamic", "calibration_curve" and "individual_fair".

        Returns
        ----------
        _fairness_widget() or _print_evaluate()
        """
        # if y_true/y_pred/x_test is None, skip evaluate
        if self.feature_mask is None or self.model_params[0].y_true is None:
            self.evaluate_status = -1
            print("Skipped: Evaluate is skipped due to insufficient data input during ModelContainer() initialization.")
            return

        if self.model_params[0].model_type != "uplift" and self.model_params[0].y_pred is None:
            self.evaluate_status = -1
            print("Skipped: Evaluate is skipped due to insufficient data input during ModelContainer() initialization.")
            return
        exp_disable = ["perf_dynamic", "calibration_curve", "individual_fair"]
        self.evaluate_disable = [] if disable is None else disable

        _input_parameter_lookup = {"disable": [disable, (list,), exp_disable]}

        # Filter the input parameters to only include valid values
        filtered_params = input_parameter_filtering(_input_parameter_lookup)

        # Update the variables with the values in the filtered_params dictionary
        disable = filtered_params.get("disable")

        # Update the _input_parameter_lookup dictionary with the updated values
        _input_parameter_lookup["disable"][0] = self.evaluate_disable

        # Validate the data types and values of the input parameters
        input_parameter_validation(_input_parameter_lookup)

        # check if evaluate hasn't run, only run if haven't
        if self.evaluate_status == 0:
            # to show progress bar
            eval_pbar = tqdm(total=100, desc="Evaluate performance", bar_format="{l_bar}{bar}")
            eval_pbar.update(1)
            # execute performance metrics from PerformanceMetrics class
            self._compute_performance(n_threads=n_threads, seed=seed, eval_pbar=eval_pbar)
            eval_pbar.set_description("Evaluate fairness")
            # execute fairness metrics from FairnessMetrics class
            self._compute_fairness(n_threads=n_threads, seed=seed, eval_pbar=eval_pbar)
            # to determine fairness conclusion based on inputs
            self._fairness_conclusion()
            # set status to 1 after evaluate has run
            self.evaluate_status = 1
            eval_pbar.set_description("Evaluate")
            eval_pbar.update(100 - eval_pbar.n)
            eval_pbar.close()
            print("", flush=True)
        # to trigger widget
        if visualize is True:
            output = False
            self._fairness_widget()
        # to trigger evaluate printout
        if output is True:
            self._print_evaluate()

    def _fair_conclude(self, protected_feature_name, **kwargs):
        """
        Checks the fairness_conclusion for the selected protected feature with the primary fairness metric value against the fair_threshold

        Parameters
        ----------
        protected_feature_name : string
            Name of a protected feature

        Other Parameters
        ----------------
        priv_m_v : float
            Privileged metric value

        Returns
        ----------
        out : dict
            Fairness threshold and conclusion for the chosen protected variable
        """
        # for feature importance, when privileged metric values have been overwritten during leave-one-out analysis
        if "priv_m_v" in kwargs:
            priv_m_v = kwargs["priv_m_v"]
            value = kwargs["value"]
        # else run as per input values
        else:
            priv_m_v = (
                self.fair_metric_obj.result.get(protected_feature_name)
                .get("fair_metric_values")
                .get(self.fair_metric_name)[1]
            )
            value = self.fair_metric_obj.result[protected_feature_name]["fair_metric_values"].get(
                self.fair_metric_name
            )[0]

        # to handle different variations of threhold value provided e.g. float, decimals, integer
        fair_threshold = self._compute_fairness_metric_threshold(priv_m_v)

        out = {}
        # append threshold value to result
        out["threshold"] = fair_threshold

        # if metric used is ratio based, means it will either be more than 1 or less than 1. So set n = 1 to see the difference.
        if FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2] == "ratio":
            n = 1
        # if metric used is pairty based, means it will either be more than 0 or less than 0 So set n = 0 to see the difference.
        elif FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2] == "difference":
            n = 0

        # find absolute difference of fair values calculated after metric has been applied
        f_value = abs(value - n)
        # determine whether input values are fair or unfair depending on metrics applied
        if f_value <= fair_threshold:
            out["fairness_conclusion"] = "fair"
        else:
            out["fairness_conclusion"] = "unfair"
        return out

    def _fairness_conclusion(self):
        """
        Computes _fair_conclude() for all the protected features and returns results in a dictionary

        Returns
        ----------
        self.fair_conclusion : dict
            fair_conclusion and threshold for every protected variable
        """
        self.fair_conclusion = {}
        # to append each fair conclusion for each protected variable into a single dictionary
        for i in self.model_params[0].protected_features_cols.columns:
            self.fair_conclusion[i] = self._fair_conclude(i)

    def _compute_fairness_metric_threshold(self, priv_m_v):
        """
        Computes the fairness metric threshold based on the fair_threshold variable

        Parameters
        ----------
        priv_m_v : float
                Privileged metric value

        Returns
        ----------
        fair_threshold : float
                Fairness metric threshold
        """
        # to handle different variations of threhold value provided e.g. float, decimals, integer
        if self.fair_threshold > 1:
            self.fair_threshold = floor(self.fair_threshold)
            if FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2] == "ratio":
                fair_threshold = 1 - (self.fair_threshold / 100)
            elif FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2] == "difference":
                fair_threshold = (1 - (self.fair_threshold / 100)) * priv_m_v

            return fair_threshold
        else:
            return self.fair_threshold

    def _compute_performance(self, n_threads, seed, eval_pbar):
        """
        Computes the percentage count of subgroups, all the performance metrics together with their confidence intervals & the calibration curve data.

        Parameters
        -----------
        n_threads : int
                Number of currently active threads of a job

        seed : int
                Used to initialize the random number generator.

        eval_pbar : tqdm object
                Progress bar

        Returns
        ----------
        All calculations from every performance metric
        """
        # to initialize PerformanceMetrics and exceute all the perf metrics at one go
        if self.perf_metric_obj is None:
            self.perf_metric_obj = PerformanceMetrics(self)
        self.perf_metric_obj.execute_all_perf(
            n_threads=n_threads,
            seed=seed,
            eval_pbar=eval_pbar,
            disable=self.evaluate_disable,
        )
        # bring status bar to full after all perf metrics have been ran
        eval_pbar.update(1)
        # if calibration_curve function has been run, then set status to True
        if self.perf_metric_obj.result["calibration_curve"] is None:
            self.evaluate_status_cali = False
        else:
            self.evaluate_status_cali = True
        # if perf_dynamic function has been run, then set status to True
        if self.perf_metric_obj.result["perf_dynamic"] is None:
            self.evaluate_status_perf_dynamics = False
        else:
            self.evaluate_status_perf_dynamics = True

    def _compute_fairness(self, n_threads, seed, eval_pbar):
        """
        Computes all the fairness metrics together with their confidence intervals & the self.fair_conclusion for every protected variable

        Parameters
        -----------
        n_threads : int
                Number of currently active threads of a job

        seed : int
                Used to initialize the random number generator.

        eval_pbar : tqdm object
                Progress bar

        Returns
        ----------
        All calculations from every fairness metric
        """
        # to initialize FairnessMetrics and exceute all the fair metrics at one go
        self.fair_metric_obj = FairnessMetrics(self)
        self.fair_metric_obj.execute_all_fair(
            n_threads=n_threads,
            seed=seed,
            eval_pbar=eval_pbar,
            disable=self.evaluate_disable,
        )
        # bring status bar to full after all fair metrics have been ran
        eval_pbar.update(1)
        for i in self.model_params[0].p_var:
            for j in self._use_case_metrics["fair"]:
                # if user provides fair metric value input value for each protected variable
                if self.fairness_metric_value_input:
                    if i in self.fairness_metric_value_input.keys():
                        if j in self.fairness_metric_value_input[i].keys():
                            self.fair_metric_obj.result[i]["fair_metric_values"][j] = (
                                self.fairness_metric_value_input[i][j],
                                self.fair_metric_obj.result[i]["fair_metric_values"][j][1],
                                self.fair_metric_obj.result[i]["fair_metric_values"][j][2],
                            )
                            msg = "{} value for {} is overwritten by user input, CI and privileged metric value may be inconsistent."
                            msg = msg.format(FairnessMetrics.map_fair_metric_to_group[j][0], i)
                            warnings.warn(msg)
        # if indiv_fair function has been run, then set status to True
        if self.fair_metric_obj.result["indiv_fair"] is None:
            self.evaluate_status_indiv_fair = False
        else:
            self.evaluate_status_indiv_fair = True

    def compile(self, disable=[], n_threads=1, save_artifact=True) -> Optional[ModelArtifact]:
        """
        Runs the evaluation function together with the trade-off, feature importance and transparency explain sections and saves all the results to a JSON file locally.

        Parameters
        -------------
        disable : list, default=[]
                List of strings that specify which sections to skip. Can include "evaluate", "tradeoff", "feature_importance", "explain".
                If "evaluate" is specified, fairness diagnosis will be skipped.

        n_threads : int, default=1
                Number of currently active threads of a job

        save_artifact : boolean, default=True
                If save_artifact = True, the model artifact will be saved locally. If false, the model artifact will be returned as a dictionary.

        Returns
        ----------
        Prints messages for the status of evaluate and tradeoff and generates model artifact
        """
        exp_disable = ["evaluate", "tradeoff", "feature_importance", "explain"]
        evaluate_status = "done"

        # Parse `disable` input parameter and output a dictionary containing disabled API functions and their respective disabled features
        self.compile_disable_map = self._input_parameter_compile_processing(disable)

        # Extract the list of API functions to be skipped
        self.compile_disable = (
            list(self.compile_disable_map.keys())
            if self.compile_disable_map
            else (exp_disable if self.compile_disable_map is None else [])
        )

        # Check data dependency for each API method
        self.compile_disable.extend(self._check_data_dependency())

        # Check that `evaluate`,`feature_importance` and `explain` keys are present in `compile_disable_map` dict
        self.compile_disable_map.update(
            [(key, []) for key in ["evaluate", "feature_importance", "explain"] if key not in self.compile_disable_map]
        )

        # Check that `evaluate`,`feature_importance` and `explain` keys are present in `compile_disable_map` dict if nothing is disabled
        if not self.compile_disable:
            self.compile_disable_map = {
                "evaluate": [],
                "feature_importance": [],
                "explain": [],
            }

        _input_parameter_lookup = {"disable": [self.compile_disable, (list,), exp_disable]}

        # Filter the input parameters to only include valid values
        filtered_params = input_parameter_filtering(_input_parameter_lookup)

        # Update the variables with the values in the filtered_params dictionary
        self.compile_disable = filtered_params.get("disable")

        # Update the _input_parameter_lookup dictionary with the updated values
        _input_parameter_lookup["disable"][0] = self.compile_disable

        # Validate the data types and values of the input parameters
        input_parameter_validation(_input_parameter_lookup)

        # check if evaluate hasn't run, only run if haven't
        if self.evaluate_status == 0 and (
            "evaluate" not in self.compile_disable or self.compile_disable_map["evaluate"]
        ):
            self.evaluate(
                visualize=False,
                output=False,
                n_threads=n_threads,
                disable=list(self.compile_disable_map["evaluate"]),
            )
        # if evaluate is in disable, print skipped
        elif (
            self.evaluate_status == 0
            and "evaluate" in self.compile_disable
            and not self.compile_disable_map["evaluate"]
        ):
            evaluate_status = "skipped"
        if self.evaluate_status == -1:
            evaluate_status = "skipped"
        # printout
        print("{:40s}{:<10}".format("Running evaluate", evaluate_status))
        print("{:5s}{:35s}{:<10}".format("", "performance measures", evaluate_status))
        print("{:5s}{:35s}{:<10}".format("", "bias detection", evaluate_status))

        if self.evaluate_status == 1 and self.evaluate_status_cali:
            print("{:5s}{:35s}{:<10}".format("", "probability calibration", "done"))
        else:
            print("{:5s}{:35s}{:<10}".format("", "probability calibration", "skipped"))

        if self.evaluate_status == 1 and self.evaluate_status_perf_dynamics:
            print("{:5s}{:35s}{:<10}".format("", "performance dynamics", "done"))
        else:
            print("{:5s}{:35s}{:<10}".format("", "performance dynamics", "skipped"))

        if self.evaluate_status == 1 and self.evaluate_status_indiv_fair:
            print("{:5s}{:35s}{:<10}".format("", "individual fairness", "done"))
        else:
            print("{:5s}{:35s}{:<10}".format("", "individual fairness", "skipped"))
        # check if user wants to skip tradeoff, if yes tradeoff will not run, print skipped
        if self.tradeoff_status == -1:
            print("{:40s}{:<10}".format("Running tradeoff", "skipped"))
        # check if tradeoff hasn't run and user does not want to skip, only run if haven't
        elif (
            self.tradeoff_status == 0
            and "tradeoff" not in self.compile_disable
            and ("evaluate" not in self.compile_disable or self.compile_disable_map["evaluate"])
        ):
            try:
                self.tradeoff(output=False, n_threads=n_threads)
                # if user wants to skip tradeoff, print skipped
                if self.tradeoff_status == -1:
                    print("{:40s}{:<10}".format("Running tradeoff", "skipped"))
                # set status to 1 after evaluate has run
                elif self.tradeoff_status == 1:
                    print("{:40s}{:<10}".format("Running tradeoff", "done"))
            except:
                print("{:40s}{:<10}".format("Running tradeoff", "skipped"))
        # check if tradeoff hasn't run and user wants to skip, print skipped
        elif self.tradeoff_status == 0 and ("tradeoff" in self.compile_disable or "evaluate" in self.compile_disable):
            if "tradeoff" in self.compile_disable or (
                "evaluate" in self.compile_disable and not self.compile_disable_map["evaluate"]
            ):
                self.tradeoff_status = -1
                print("{:40s}{:<10}".format("Running tradeoff", "skipped"))
        else:
            print("{:40s}{:<10}".format("Running tradeoff", "done"))
        # check if user wants to skip feature_importance, if yes feature_importance will not run, print skipped
        if self.feature_imp_status_corr:
            print("{:40s}{:<10}".format("Running feature importance", "done"))
        elif self.feature_imp_status == -1:
            print("{:40s}{:<10}".format("Running feature importance", "skipped"))
        # check if feature_importance hasn't run and user does not want to skip, only run if haven't
        elif (
            self.feature_imp_status == 0
            and ("feature_importance" not in self.compile_disable or self.compile_disable_map["feature_importance"])
            and ("evaluate" not in self.compile_disable or self.compile_disable_map["evaluate"])
        ):
            try:
                self.feature_importance(
                    output=False,
                    n_threads=n_threads,
                    disable=list(self.compile_disable_map["feature_importance"]),
                )
                if self.feature_imp_status == 1:
                    print("{:40s}{:<10}".format("Running feature importance", "done"))
                elif self.feature_imp_status_corr:
                    print("{:40s}{:<10}".format("Running feature importance", "done"))
                else:
                    print("{:40s}{:<10}".format("Running feature importance", "skipped"))
            except:
                print("{:40s}{:<10}".format("Running feature importance", "skipped"))
        # check if feature_importance hasn't run and user wants to skip, print skipped
        elif self.feature_imp_status == 0 and (
            "feature_importance" in self.compile_disable or "evaluate" in self.compile_disable
        ):
            if (
                "feature_importance" in self.compile_disable and not self.compile_disable_map["feature_importance"]
            ) or ("evaluate" in self.compile_disable and not self.compile_disable_map["evaluate"]):
                self.feature_imp_status = -1
                print("{:40s}{:<10}".format("Running feature importance", "skipped"))
        else:
            print("{:40s}{:<10}".format("Running feature importance", "done"))
        # check if feature_importance_loo has ran, if not print skipped

        if self.feature_imp_status_loo:
            print("{:5s}{:35s}{:<10}".format("", "leave-one-out analysis", "done"))
        else:
            print("{:5s}{:35s}{:<10}".format("", "leave-one-out analysis", "skipped"))
        # check if feature_importance_corr has ran, if not print skipped
        if self.feature_imp_status_corr:
            print("{:5s}{:35s}{:<10}".format("", "correlation analysis", "done"))
        else:
            print("{:5s}{:35s}{:<10}".format("", "correlation analysis", "skipped"))

        # check explain section in transparency if explain is not in disable
        if "explain" not in self.compile_disable or self.compile_disable_map["explain"]:
            self.tran_artifact = self._tran_compile(disable=list(self.compile_disable_map["explain"]))
        else:
            self.tran_artifact = None
            print("{:40s}{:<10}".format("Running transparency", "skipped"))

        # run function to generate json model artifact file after all API functions have ran
        return self._generate_model_artifact(save_artifact)

    def tradeoff(self, output=True, n_threads=1, sigma=0):
        """
        Computes the trade-off between performance and fairness over a range  of threshold values.
        If output = True, run the _print_tradeoff() function.

        Parameters
        -----------
        output : boolean, default=True
            If output = True, run the _print_tradeoff() function.

        n_threads : int, default=1
                Number of currently active threads of a job

        sigma : float or int , default = 0
                 Standard deviation for Gaussian kernel for smoothing the contour lines of primary fairness metric.
                 When sigma <= 0, smoothing is turn off.
                 Suggested to try sigma = 3 or above if noisy contours are observed.
        """
        # if y_true/y_prob/x_test is None, skip tradeoff
        if self.model_params[0].y_prob is None or self.model_params[0].y_true is None or self.feature_mask is None:
            self.tradeoff_status = -1
            print("Skipped: Tradeoff is skipped due to insufficient data input during ModelContainer() initialization.")
        # if user wants to skip tradeoff, return None
        if self.tradeoff_status == -1:
            return
        # check if tradeoff hasn't run, only run if haven't
        elif self.tradeoff_status == 0:
            self.sigma = sigma
            n_threads = check_multiprocessing(n_threads)
            # to show progress bar
            tdff_pbar = tqdm(total=100, desc="Tradeoff", bar_format="{l_bar}{bar}")
            tdff_pbar.update(5)
            sys.stdout.flush()
            # initialize tradeoff
            self.tradeoff_obj = TradeoffRate(self)

            tdff_pbar.update(10)
            # run tradeoff
            self.tradeoff_obj.compute_tradeoff(n_threads, tdff_pbar)
            tdff_pbar.update(100 - tdff_pbar.n)
            tdff_pbar.close()
            print("", flush=True)
            # if after running tradoeff, result is None, print skipped
            if self.tradeoff_obj.result == {}:
                print("Skipped: ", self.tradeoff_obj.msg)
                self.tradeoff_status = -1
            else:
                # set status to 1 after tradeoff has ran
                self.tradeoff_status = 1
        # if tradeoff has already ran once, just print result
        if output and self.tradeoff_status == 1:
            self._print_tradeoff()

    def feature_importance(self, output=True, n_threads=1, correlation_threshold=0.7, disable=[]):
        """
        Trains models using the leave-one-variable-out method for each protected variable and computes the performance and fairness metrics each time to assess the impact of those variables.
        If output = True, run the _print_feature_importance() function.

        Parameters
        ------------
        output : boolean, default=True
                Flag to print out the results of evaluation in the console. This flag will be False if visualize=True.

        n_threads : int
                Number of currently active threads of a job

        correlation_threshold : float, default=0.7
                Correlation threshold used in surrogate detection

        Returns
        ------------
        self.feature_imp_status_loo : boolean
                Tracks the status of the completion of the leave-one-out analysis step within feature_importance() method to be checked in compile().

        self.feature_imp_status : int
                Tracks the status of the completion of the feature_importance() method to be checked in compile().

        self._compute_correlation()

        self._print_feature_importance()
        """
        if self.correlation_threshold is not None and self.correlation_threshold != correlation_threshold:
            self.feature_imp_status_corr = False
        self.correlation_threshold = correlation_threshold
        disable = [] if disable is None else disable

        _input_parameter_lookup = {
            "correlation_threshold": [
                self.correlation_threshold,
                (float, int),
                (
                    Constants().correlation_threshold_low,
                    Constants().correlation_threshold_high,
                ),
            ],
            "disable": [disable, (list,), ["correlation"]],
        }

        # Filter the input parameters to only include valid values
        filtered_params = input_parameter_filtering(_input_parameter_lookup)

        # Update the variables with the values in the filtered_params dictionary
        disable = filtered_params.get("disable")

        # Update the _input_parameter_lookup dictionary with the updated values
        _input_parameter_lookup["disable"][0] = disable

        # Validate the data types and values of the input parameters
        input_parameter_validation(_input_parameter_lookup)

        # if user wants to skip feature_importance, return None
        if self.feature_imp_status == -1:
            self.feature_imp_values = None
            return

        # check if feature_importance hasn't run, only run if haven't
        if self.feature_imp_status == 0:
            for k in self.model_params:
                x_train = k.x_train
                y_train = k.y_train
                model_object = k.model_object
                x_test = k.x_test
                model_type = k.model_type
                train_op_name = k.train_op_name
                predict_op_name = k.predict_op_name
                predict_proba_op_name = k.predict_proba_op_name
                op_name = (
                    [train_op_name, predict_op_name] + [predict_proba_op_name] if model_type != "regression" else []
                )
                # if model_object is not provided, skip feature_importance
                if model_object is None:
                    self.feature_imp_status = -1
                    print("Skipped: Feature importance is skipped as model_object is not passed")
                    return
                else:
                    for var_name in op_name:
                        # to check callable functions
                        try:
                            callable(getattr(model_object, var_name))
                        except:
                            self.feature_imp_status = -1
                            print(
                                "Skipped: Feature importance is skipped due to train_op_name/predict_op_name/predict_proba_op_name error"
                            )
                            return
            # to show progress bar
            fimp_pbar = tqdm(total=100, desc="Feature importance", bar_format="{l_bar}{bar}")
            fimp_pbar.update(1)
            self.feature_imp_values = {}

            # if evaluate_status = 0, run evaluate() first
            if self.evaluate_status == 0:
                self.evaluate(output=False)

            # if evaluate skipped, return None
            if self.evaluate_status == -1:
                self.feature_imp_values = None
                print(
                    "Skipped: Feature importance is skipped due to insufficient data input during ModelContainer() initialization."
                )
                return

            for h in self.model_params[0].non_intersect_pvars:
                self.feature_imp_values[h] = {}
                fimp_pbar.update(1)

            # if user wants to skip feature_importance or evaluate skipped, return None
            if self.feature_imp_status == -1:
                self.feature_imp_values = None
                return

            fimp_pbar.update(1)

            num_p_var = len(self.model_params[0].non_intersect_pvars)
            n_threads = check_multiprocessing(n_threads)
            max_workers = min(n_threads, num_p_var)

            # if require to run with 1 thread, will skip deepcopy
            worker_progress = 80 / num_p_var
            if max_workers >= 1:
                threads = []
                with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                    fimp_pbar.update(5)
                    # iterate through protected variables to drop one by one as part of leave-one-out

                    for i in self.model_params[0].non_intersect_pvars:
                        use_case_object = self
                        model_object = self.deepcopy_model_obj()
                        threads.append(
                            executor.submit(
                                Fairness._feature_imp_loo,
                                p_variable=i,
                                use_case_object=use_case_object,
                                fimp_pbar=fimp_pbar,
                                worker_progress=worker_progress,
                                model_object=model_object,
                            )
                        )

                    for thread in threads:
                        fimp_pbar.update(round(8 / num_p_var, 2))
                        if thread.result() is None:
                            self.feature_imp_status = -1
                            return
                        else:
                            for removed_pvar, values in thread.result().items():
                                for pvar, v in values.items():
                                    self.feature_imp_values[pvar][removed_pvar] = v

            # change flag after feature_importance has finished running
            self.feature_imp_status_loo = True
            self.feature_imp_status = 1
            fimp_pbar.update(2)
            fimp_pbar.update(100.0 - fimp_pbar.n)
            fimp_pbar.close()
            print("", flush=True)

        # if feature_importance has already ran once, just print result
        if output is True:
            self._print_feature_importance()

        # check if correlation analysis hasn't run or correlation threshold changed, only run if haven't
        if self.feature_imp_status_corr is False and "correlation" not in disable:
            with tqdm(total=100, desc="Correlation analysis ", bar_format="{l_bar}{bar}") as corr_pbar:
                corr_pbar.update(30)
                # if data_prep_flag is False, run transparency _data_prep() first
                if not self.tran_flag[0]["data_prep_flag"]:
                    corr_pbar.set_description("Running data preparation")
                    tqdm._instances.clear()
                    self._data_prep(model_num=0)
                    corr_pbar.update(30)

                # Run correlation analysis
                corr_pbar.set_description("Correlation analysis")
                corr_pbar.update(30)
                self._compute_correlation()
                corr_pbar.update(100 - corr_pbar.n)
                corr_pbar.close()

        # if feature_importance has already ran once, just print result
        if output is True:
            self._print_correlation_analysis()

    def _feature_imp_loo(p_variable, use_case_object, fimp_pbar, worker_progress, model_object):
        """
        Maps each thread's work for feature_importance()

        Parameters
        ------------
        p_variable : str
                Name of protected variable

        use_case_object : object
                Initialised use case object

        fimp_pbar :

        worker_progress :

        Returns
        ------------
        dictionary of loo_result of each p_var
        """
        # get baseline values
        baseline_perf_values = use_case_object.perf_metric_obj.result.get("perf_metric_values").get(
            use_case_object.perf_metric_name
        )[0]
        baseline_fair_values = (
            use_case_object.fair_metric_obj.result.get(p_variable)
            .get("fair_metric_values")
            .get(use_case_object.fair_metric_name)[0]
        )
        baseline_fairness_conclusion = use_case_object.fair_conclusion.get(p_variable).get("fairness_conclusion")
        # empty y_pred_new, y_prob_new list to be appended
        y_pred_new = []
        y_prob_new = []
        loo_result = {}

        # loop through model_params
        for k in range(len(use_case_object.model_params)):
            # for uplift model type --> two model container --> need to train two models
            # when model param len =2, then it is uplift model
            p_var = use_case_object.model_params[k].p_var
            x_train = use_case_object.model_params[k].x_train
            y_train = use_case_object.model_params[k].y_train
            model_obj = model_object[k]
            x_test = use_case_object.model_params[k].x_test
            pos_label = use_case_object.model_params[k].pos_label
            neg_label = use_case_object.model_params[k].neg_label
            model_type = use_case_object.model_params[k].model_type
            train_op = getattr(model_obj, use_case_object.model_params[k].train_op_name)
            predict_op = getattr(model_obj, use_case_object.model_params[k].predict_op_name)
            predict_proba_op = (
                getattr(model_obj, use_case_object.model_params[k].predict_proba_op_name)
                if model_type != "regression"
                else None
            )
            obj_in = use_case_object.model_params[k]
            # show progress bar
            fimp_pbar.update(round(worker_progress * 0.9 / len(use_case_object.model_params), 2))

            try:
                # check if x_train is a dataframe
                if isinstance(x_train, pd.DataFrame):
                    # drop protected variable and train model
                    train_op(
                        x_train.drop(columns=[p_variable]), y_train
                    )  # train_op_name is string, need to use getattr[] to get the attribute?
                else:
                    train_op(x_train, y_train, p_variable)  # train_op to handle drop column i inside train_op
                    # Predict and compute performance Metrics (PerformanceMetrics.result.balanced_acc)
            except:
                # else print skipped and return None
                print(
                    "Skipped: LOCO analysis is skipped for [",
                    p_variable,
                    "] due to x_train/y_train error",
                )
                use_case_object.feature_imp_status = -1
                return None

            try:
                # check if x_test is a dataframe
                if isinstance(x_test, pd.DataFrame):
                    # drop protected variable and predict
                    pre_y_pred_new = np.array(predict_op(x_test.drop(columns=[p_variable])))
                    pre_y_prob_new = (
                        np.array(predict_proba_op(x_test.drop(columns=[p_variable])))
                        if model_type != "regression"
                        else None
                    )
                else:
                    pre_y_pred_new = predict_op(
                        x_train, y_train, p_variable
                    )  # train_op to handle drop column i inside train_op
                    pre_y_prob_new = (
                        predict_proba_op(x_train, y_train, p_variable) if model_type != "regression" else None
                    )  # train_op to handle drop column i inside train_op
            except:
                # else print skipped and return None
                print(
                    "Skipped: LOCO analysis is skipped for [",
                    p_variable,
                    "] due to x_test/y_test error",
                )
                use_case_object.feature_imp_status = -1
                return None

            fimp_pbar.update(round(worker_progress * 0.02, 2))
            # to ensure labels and datatype for predicted values are correct before running metrics
            if len(pre_y_pred_new.shape) == 1 and pre_y_pred_new.dtype.kind in [
                "i",
                "O",
                "U",
            ]:
                pre_y_pred_new, pos_label2 = use_case_object._check_label(
                    pre_y_pred_new,
                    pos_label,
                    neg_label,
                    obj_in=obj_in,
                    y_pred_flag=True,
                )  # Fairness > Usecaseobject provided it is cm/cs
            else:
                pre_y_pred_new = pre_y_pred_new.astype(np.float64)

            if (
                pre_y_prob_new is not None
                and model_type == "classification"
                and len(pre_y_prob_new.shape) > 1
                and pre_y_prob_new.shape[1] > 1
                and use_case_object.multiclass_flag is not True
            ):
                pre_y_prob_new = process_y_prob(model_obj.classes_, pre_y_prob_new, pos_label, neg_label)

            y_pred_new.append(pre_y_pred_new)
            y_prob_new.append(pre_y_prob_new)
        # run performance and fairness evaluation only for primary performance and fair metric
        loo_perf_value = use_case_object.perf_metric_obj.translate_metric(
            use_case_object.perf_metric_name,
            obj=use_case_object.perf_metric_obj,
            y_pred_new=y_pred_new,
            y_prob_new=y_prob_new,
        )
        # to find deltas (removed - baseline) for primary perf metric
        deltas_perf = loo_perf_value - baseline_perf_values

        # to iterate through each protected variable for each protected variable that is being dropped
        for j in use_case_object.model_params[0].non_intersect_pvars:
            fimp_pbar.update(round(worker_progress * 0.08 / len(p_var), 2))
            use_case_object.fair_metric_obj.curr_p_var = j
            # will this work under multithreading? will not work, should changes to a copy
            # get loo_perf_value,loo_fair_values
            (
                loo_fair_value,
                loo_priv_m_v,
            ) = use_case_object.fair_metric_obj.translate_metric(
                use_case_object.fair_metric_name,
                obj=use_case_object.fair_metric_obj,
                y_pred_new=y_pred_new,
                y_prob_new=y_prob_new,
            )[:2]

            # to find deltas (removed - baseline) for each protected variable in iteration for primary fair metric
            baseline_fair_values_j = (
                use_case_object.fair_metric_obj.result.get(j)
                .get("fair_metric_values")
                .get(use_case_object.fair_metric_name)[0]
            )
            baseline_fairness_conclusion_j = use_case_object.fair_conclusion.get(j).get("fairness_conclusion")
            deltas_fair = loo_fair_value - baseline_fair_values_j

            # fairness fair_conclusion
            loo_fairness_conclusion = use_case_object._fair_conclude(j, priv_m_v=loo_priv_m_v, value=loo_fair_value)
            delta_conclusion = baseline_fairness_conclusion_j + " to " + loo_fairness_conclusion["fairness_conclusion"]

            # suggestion
            # if metric used is difference based, means it will either be more than 0 or less than 0. So set n = 0 to see the difference.
            if FairnessMetrics.map_fair_metric_to_group.get(use_case_object.fair_metric_name)[2] == "difference":
                n = 0
            # if metric used is ratio based, means it will either be more than 1 or less than 1. So set n = 1 to see the difference.
            else:
                n = 1

            if abs(loo_fair_value - n) < abs(baseline_fair_values_j - n):
                if PerformanceMetrics.map_perf_metric_to_group.get(use_case_object.perf_metric_name)[1] == "regression":
                    if deltas_perf <= 0:
                        suggestion = "exclude"
                    else:
                        suggestion = "examine further"
                else:
                    if deltas_perf >= 0:
                        suggestion = "exclude"
                    else:
                        suggestion = "examine further"
                delta_conclusion += " (+)"
            elif abs(loo_fair_value - n) > abs(baseline_fair_values_j - n):
                if PerformanceMetrics.map_perf_metric_to_group.get(use_case_object.perf_metric_name)[1] == "regression":
                    if deltas_perf >= 0:
                        suggestion = "include"
                    else:
                        suggestion = "examine further"
                else:
                    if deltas_perf <= 0:
                        suggestion = "include"
                    else:
                        suggestion = "examine further"
                delta_conclusion += " (-)"
            else:
                if PerformanceMetrics.map_perf_metric_to_group.get(use_case_object.perf_metric_name)[1] == "regression":
                    if deltas_perf < 0:
                        suggestion = "exclude"
                    elif deltas_perf > 0:
                        suggestion = "include"
                    else:
                        suggestion = "exclude"
                else:
                    if deltas_perf > 0:
                        suggestion = "exclude"
                    elif deltas_perf < 0:
                        suggestion = "include"
                    else:
                        suggestion = "exclude"

            loo_result[j] = [deltas_perf, deltas_fair, delta_conclusion, suggestion]

        return {p_variable: loo_result}

    def _compute_correlation(self):
        """
        Computes the top-20 correlation matrix inclusive of the protected variables
        """
        try:
            if isinstance(self.model_params[0].x_test, str) or self.model_params[0].x_test is None:
                self.feature_imp_status_corr = False
                return

            # Extract n_features from transparency if x_test features > 20 else extract all features
            feature_cols = (
                np.array(self.tran_top_features[0]["Feature_name"][:20])
                if self.model_params[0].x_test.shape[1] > 20
                else np.array(self.model_params[0].x_test.columns)
            )
            p_var_cols = np.array(self.model_params[0].non_intersect_pvars)
            feature_cols = [col for col in feature_cols if col not in p_var_cols]
            # Feature_columns value from x_test
            feature_columns = self.model_params[0].x_test[feature_cols]
            # p_var_columns value from protected_features_cols
            p_var_columns = self.model_params[0].x_test[p_var_cols]
            # Create final columns and apply corr()
            df = pd.concat([feature_columns, p_var_columns], axis=1)
            interval_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            self.corr_df = df.phik_matrix(interval_cols=interval_cols, bins=self.correlation_bins)
            self.correlation_output = {
                "feature_names": self.corr_df.columns.values.tolist(),
                "corr_values": [[float(value) for value in row] for row in self.corr_df.values.tolist()],
            }
            self.feature_imp_status_corr = True

            # Initialise result structure for surrogate_features
            for i in p_var_columns:
                self.surrogate_features[i] = {}

            # Identify any surrogate feature for each p_var if above specified correlation threshold
            for i in p_var_columns.columns:
                self.surrogate_features[i] = {
                    corr_index: (cor_val,)
                    for corr_index, cor_val in self.corr_df[i].items()
                    if corr_index not in p_var_columns and cor_val > self.correlation_threshold
                }

            # Create set of surrogate features
            surrogate_set = set()
            for p_var, i in self.surrogate_features.items():
                surrogate_set |= set(i.keys())

            # Identify top 3 features with highest correlation coefficient below threshold
            corr_df_filtered = self.corr_df.abs()
            top_3_features = {p_var: [] for p_var in p_var_columns}
            for p_var in p_var_columns:
                corr_row = corr_df_filtered.loc[:, p_var]
                corr_row = corr_row.drop(labels=surrogate_set, axis=0)
                top_3 = corr_row[corr_row.index != p_var].nlargest(3)
                top_3_features[p_var] = list(top_3.index)

            # Concatenate for all protected variables and get unique features
            self.corr_top_3_features = list(set(sum(top_3_features.values(), [])))

        except:
            self.feature_imp_status_corr = False

    def _print_evaluate(self):
        """
        Formats the results of the evaluate() method before printing to console.
        """
        if "_rejection_inference_flag" in dir(self):
            if True in self._rejection_inference_flag.values():
                print("Special Parameters")
                print("Rejection Inference = True")
                name = []
                for i in self.model_params[0].p_grp.keys():
                    name += [i + " - " + ", ".join(str(x) for x in self.model_params[0].p_grp.get(i)[0])]
                    name += [i + " - " + ", ".join(str(x) for x in self.model_params[0].up_grp.get(i)[0])]
                titles = ["Group", "Base Rate", "Number of Rejected Applicants"]

                a = []
                for i in self.spl_params["base_default_rate"].keys():
                    a += self.spl_params["base_default_rate"].get(i)

                b = []
                for i in self.spl_params["num_applicants"].keys():
                    b += self.spl_params["num_applicants"].get(i)

                data = [titles] + list(zip(name, a, b))
                max_width = max(len(i) for i in name)
                for i, d in enumerate(data):
                    line = "| ".join(str(x).ljust(max_width) for x in d)
                    print(line)
                    if i == 0:
                        print("-" * len(line))

                print("\n")

        elif hasattr(self, "spl_params") and ("revenue" in self.spl_params or "treatment_cost" in self.spl_params):
            print("Special Parameters")

            titles = ["Revenue", "Treatment Cost"]

            a = [self.spl_params["revenue"]]

            b = [self.spl_params["treatment_cost"]]

            data = [titles] + list(zip(a, b))
            for i, d in enumerate(data):
                line = "| ".join(str(x).ljust(16) for x in d)
                print(line)
                if i == 0:
                    print("-" * len(line))

            print("\n")

        if PerformanceMetrics.map_perf_metric_to_group.get(self.perf_metric_name)[1] != "regression":
            print("Class Distribution")

            if self.model_params[0].model_type != "uplift":
                if self.perf_metric_obj.result.get("class_distribution").get("pos_label") is not None:
                    print(
                        "{0:<45s}{1:>29.{decimal_pts}f}%".format(
                            "\t" + "pos_label",
                            self.perf_metric_obj.result.get("class_distribution").get("pos_label") * 100,
                            decimal_pts=self.decimals,
                        )
                    )
                else:
                    print("{0:<45s}{1:>29}".format("\t" + "pos_label", "NA"))  # For multi-class classification cases

                if self.perf_metric_obj.result.get("class_distribution").get("neg_label") is not None:
                    print(
                        "{0:<45s}{1:>29.{decimal_pts}f}%".format(
                            "\t" + "neg_label",
                            self.perf_metric_obj.result.get("class_distribution").get("neg_label") * 100,
                            decimal_pts=self.decimals,
                        )
                    )
                else:
                    print("{0:<45s}{1:>29}".format("\t" + "neg_label", "NA"))  # For multi-class classification cases

            else:
                print(
                    "{0:<45s}{1:>29.{decimal_pts}f}%".format(
                        "\t" + "CN",
                        self.perf_metric_obj.result.get("class_distribution").get("CN") * 100,
                        decimal_pts=self.decimals,
                    )
                )
                print(
                    "{0:<45s}{1:>29.{decimal_pts}f}%".format(
                        "\t" + "TN",
                        self.perf_metric_obj.result.get("class_distribution").get("TN") * 100,
                        decimal_pts=self.decimals,
                    )
                )
                print(
                    "{0:<45s}{1:>29.{decimal_pts}f}%".format(
                        "\t" + "CR",
                        self.perf_metric_obj.result.get("class_distribution").get("CR") * 100,
                        decimal_pts=self.decimals,
                    )
                )
                print(
                    "{0:<45s}{1:>29.{decimal_pts}f}%".format(
                        "\t" + "TR",
                        self.perf_metric_obj.result.get("class_distribution").get("TR") * 100,
                        decimal_pts=self.decimals,
                    )
                )
        else:
            pass
        print("\n")

        if self.model_params[0].sample_weight is not None:
            print("Performance Metrics (Sample Weight = True)")
        else:
            print("Performance Metrics")

        def print_metric_value(metric, fair):
            v2 = " +/- "
            if fair == 0:
                if any(
                    map(
                        lambda x: x is None,
                        self.perf_metric_obj.result.get("perf_metric_values")[metric],
                    )
                ):
                    self.perf_metric_obj.result.get("perf_metric_values")[metric] = tuple(
                        "NA" if x is None else x for x in self.perf_metric_obj.result.get("perf_metric_values")[metric]
                    )
                m = "\t" + PerformanceMetrics.map_perf_metric_to_group.get(metric)[0]
                if self.perf_metric_obj.result.get("perf_metric_values").get(metric)[0] == "NA":
                    v1 = "NA"
                    v3 = "NA"
                else:
                    v1 = "{:>0.{decimal_pts}f}".format(
                        self.perf_metric_obj.result.get("perf_metric_values").get(metric)[0],
                        decimal_pts=self.decimals,
                    )
                    v3 = "{:>0.{decimal_pts}f}".format(
                        self.perf_metric_obj.result.get("perf_metric_values").get(metric)[1],
                        decimal_pts=self.decimals,
                    )
            else:
                if any(
                    map(
                        lambda x: x is None,
                        self.fair_metric_obj.result.get(i_var).get("fair_metric_values")[metric],
                    )
                ):
                    self.fair_metric_obj.result.get(i_var).get("fair_metric_values")[metric] = tuple(
                        "NA" if x is None else x
                        for x in self.fair_metric_obj.result.get(i_var).get("fair_metric_values")[metric]
                    )
                m = "\t" + FairnessMetrics.map_fair_metric_to_group.get(metric)[0]
                if self.fair_metric_obj.result.get(i_var).get("fair_metric_values")[metric][0] == "NA":
                    v1 = "NA"
                    v3 = "NA"
                else:
                    v1 = "{:>0.{decimal_pts}f}".format(
                        self.fair_metric_obj.result.get(i_var).get("fair_metric_values")[metric][0],
                        decimal_pts=self.decimals,
                    )
                    v3 = "{:>0.{decimal_pts}f}".format(
                        self.fair_metric_obj.result.get(i_var).get("fair_metric_values")[metric][2],
                        decimal_pts=self.decimals,
                    )

            if (v1 == "NA") & (v3 == "NA"):
                v = v1
            else:
                v = v1 + v2 + v3

            if self.perf_metric_name == metric or self.fair_metric_name == metric:
                print("\033[1m" + "{0:<45s}{1:>30s}".format(m, v) + "\033[0m")
            else:
                print("{0:<45s}{1:>30s}".format(m, v))

        for k in self._use_case_metrics["perf"]:
            print_metric_value(k, 0)

        if self.perf_metric_obj.result.get("calibration_curve") is None:
            pass
        else:
            print("\n")
            print("Probability Calibration")
            m = "\tBrier Loss Score"
            v = "{:.{decimal_pts}f}".format(
                self.perf_metric_obj.result.get("calibration_curve").get("score"),
                decimal_pts=self.decimals,
            )

            print("{0:<45s}{1:>30s}".format(m, v))

        if self.fair_metric_obj.result.get("indiv_fair") is None:
            pass
        else:
            print("\n")
            print("Individual Fairness")

            for k in self._use_case_metrics["indiv_fair"]:
                m = "\t" + FairnessMetrics.map_indiv_fair_metric_to_group.get(k)[0]
                v = "{:.{decimal_pts}f}".format(
                    self.fair_metric_obj.result.get("indiv_fair").get(k),
                    decimal_pts=self.decimals,
                )

                print("{0:<45s}{1:>30s}".format(m, v))

        print("\n")

        if self.fair_metric_input == "auto":
            print("Primary Fairness Metric Suggestion")
            print("\t{}".format(FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[0]))
            print("based on")
            print("\tfair_priority = {}".format(self.fair_priority))
            print("\tfair_concern = {}".format(self.fair_concern))
            print("\tfair_impact = {}".format(self.fair_impact))
            print("\tfair_metric_type = {}".format(self.fair_metric_type))
            print("\n")

        for i, i_var in enumerate(self.model_params[0].protected_features_cols.columns):
            p_len = len(str(i + 1) + ": " + i_var)

            if self.is_pgrp_abv_min_size[i_var] is not None and not self.is_pgrp_abv_min_size[i_var]:
                if isinstance(self.model_params[0].p_grp_input[i_var], str):
                    p_grp_str = "Privileged Group* ({})".format(
                        ", ".join(str(lbl) for lbl in self.model_params[-1].p_grp.get(i_var)[0])
                    )
                else:
                    p_grp_str = "Privileged Group*"
            else:
                if isinstance(self.model_params[0].p_grp_input[i_var], str):
                    p_grp_str = "Privileged Group ({})".format(
                        ", ".join(str(lbl) for lbl in self.model_params[-1].p_grp.get(i_var)[0])
                    )
                else:
                    p_grp_str = "Privileged Group"

            if self.is_upgrp_abv_min_size[i_var] is not None and not self.is_upgrp_abv_min_size[i_var]:
                if isinstance(self.model_params[0].p_grp_input[i_var], str):
                    if len(self.model_params[-1].up_grp[i_var][0]) == 1:
                        up_grp_str = "Unprivileged Group* ({})".format(
                            ", ".join(str(lbl) for lbl in self.model_params[-1].up_grp.get(i_var)[0])
                        )
                    else:
                        up_grp_str = "Unprivileged Group* (Not {})".format(self.model_params[-1].p_grp[i_var][0][0])
                else:
                    up_grp_str = "Unprivileged Group*"
            else:
                if isinstance(self.model_params[0].p_grp_input[i_var], str):
                    if len(self.model_params[-1].up_grp[i_var][0]) == 1:
                        up_grp_str = "Unprivileged Group ({})".format(
                            ", ".join(str(lbl) for lbl in self.model_params[-1].up_grp.get(i_var)[0])
                        )
                    else:
                        up_grp_str = "Unprivileged Group (Not {})".format(self.model_params[-1].p_grp[i_var][0][0])
                else:
                    up_grp_str = "Unprivileged Group"
            print("-" * 35 + str(i + 1) + ": " + i_var.title() + "-" * int((45 - p_len)))

            print("Value Distribution")
            print(
                "{:<45s}{:>29.{decimal_pts}f}%".format(
                    "\t" + p_grp_str,
                    self.fair_metric_obj.result.get(i_var).get("feature_distribution").get("privileged_group") * 100,
                    decimal_pts=self.decimals,
                )
            )
            print(
                "{:<45s}{:>29.{decimal_pts}f}%".format(
                    "\t" + up_grp_str,
                    self.fair_metric_obj.result.get(i_var).get("feature_distribution").get("unprivileged_group") * 100,
                    decimal_pts=self.decimals,
                )
            )

            if self.is_pgrp_abv_min_size[i_var] is not None and (
                not self.is_pgrp_abv_min_size[i_var] or not self.is_upgrp_abv_min_size[i_var]
            ):
                print("*Measurement may not be robust as min_samples_per_label is not satisfied")
            print("\n")
            if self.model_params[0].sample_weight is not None:
                print("Fairness Metrics (Sample Weight = True)")
            else:
                print("Fairness Metrics")
            for h in self._use_case_metrics["fair"]:
                print_metric_value(h, 1)

            print("\n")
            print("Fairness Conclusion")
            m = "\tOutcome ({})".format(FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[0])
            v = self.fair_conclusion.get(i_var).get("fairness_conclusion").title()
            print("{0:<55s}{1:>20s}*".format(m, v))

            m = "\tFairness Threshold"

            if self.fair_threshold > 0 and self.fair_threshold < 1:
                v = str(self.fair_threshold)
            elif self.fair_threshold > 1 and self.fair_threshold < 100:
                v = str(self.fair_threshold) + "%"
            print("{0:<45s}{1:>30s}".format(m, v))
            print("\n")

        print(
            """*Disclaimer: The outcome is calculated based on your inputs and is provided for informational purposes only.
            Should you decide to act upon the information herein, you do so at your own risk and Veritas Toolkit will not be liable or responsible in any way. """
        )
        sys.stdout.flush()

    def _print_tradeoff(self):
        """
        Formats the results of the tradeoff() method before printing to console.
        """
        i = 1
        p_var = self.model_params[0].p_var
        for p_variable in p_var:
            # title
            title_str = " " + str(i) + ". " + p_variable + " "
            if len(title_str) % 2 == 1:
                title_str += " "
            line_str = int((72 - len(title_str)) / 2) * "-"
            print(line_str + title_str + line_str)

            print("Performance versus Fairness Trade-Off")
            # Single Threshold
            print("\t Single Threshold")
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    "Privileged/Unprivileged Threshold",
                    self.tradeoff_obj.result[p_variable]["max_perf_single_th"][0],
                    decimal_pts=self.decimals,
                )
            )
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    str("Best " + self.tradeoff_obj.result[p_variable]["perf_metric_name"] + "*"),
                    self.tradeoff_obj.result[p_variable]["max_perf_single_th"][2],
                    decimal_pts=self.decimals,
                )
            )

            # Separated Thresholds
            print("\t Separated Thresholds")
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    "Privileged Threshold",
                    self.tradeoff_obj.result[p_variable]["max_perf_point"][0],
                    decimal_pts=self.decimals,
                )
            )
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    "Unprivileged Threshold",
                    self.tradeoff_obj.result[p_variable]["max_perf_point"][1],
                    decimal_pts=self.decimals,
                )
            )
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    str("Best " + self.tradeoff_obj.result[p_variable]["perf_metric_name"] + "*"),
                    self.tradeoff_obj.result[p_variable]["max_perf_point"][2],
                    decimal_pts=self.decimals,
                )
            )

            # Separated Thresholds under Neutral Fairness (0.01)
            print("\t Separated Thresholds under Neutral Fairness ({})".format(self.fair_neutral_tolerance))
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    "Privileged Threshold",
                    self.tradeoff_obj.result[p_variable]["max_perf_neutral_fair"][0],
                    decimal_pts=self.decimals,
                )
            )
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    "Unprivileged Threshold",
                    self.tradeoff_obj.result[p_variable]["max_perf_neutral_fair"][1],
                    decimal_pts=self.decimals,
                )
            )
            print(
                "\t\t{:35s}{:>20.{decimal_pts}f}".format(
                    str("Best " + self.tradeoff_obj.result[p_variable]["perf_metric_name"] + "*"),
                    self.tradeoff_obj.result[p_variable]["max_perf_neutral_fair"][2],
                    decimal_pts=self.decimals,
                )
            )
            print("\t\t*estimated by approximation, subject to the resolution of mesh grid")
            print("")
            i += 1

        if self.tradeoff_obj.replacement_flag == 1:
            print(
                "Note: Fairness metric {} is not supported in tradeoff. {} is suggested as a replacement for tradeoff only.".format(
                    self.fair_metric_name, self.tradeoff_obj.fair_metric_name
                )
            )

        sys.stdout.flush()

    def _print_feature_importance(self):
        """
        Formats the results of the feature_importance() method before printing to console.
        """
        # perf_metric_name and/or fair_metric_name truncated if len > 25
        perf_metric_truncated = (
            (self.perf_metric_name[:23] + "..") if len(self.perf_metric_name) > 25 else self.perf_metric_name
        )
        fair_metric_truncated = (
            (self.fair_metric_name[:23] + "..") if len(self.fair_metric_name) > 25 else self.fair_metric_name
        )

        for i, i_var in enumerate(self.model_params[0].non_intersect_pvars):
            print("\n")
            p_len = len(str(i + 1) + ": Fairness on " + i_var)
            print("-" * 50 + str(i + 1) + ": Fairness on " + i_var.title() + "-" * int((124 - 50 - p_len)))
            print()
            print("-" * 124)
            print(
                "|{:<30}|{:<25}|{:<25}|{:<20}|{:<18}|".format(
                    "Removed Protected Variable",
                    perf_metric_truncated,
                    fair_metric_truncated,
                    "Fairness Conclusion",
                    "Suggestion",
                )
            )
            print("-" * 124)
            for j in self.model_params[0].non_intersect_pvars:
                col1, col2, col3, col4 = self.feature_imp_values[i_var][j]
                print(
                    "|{:<30}|{:<25.{decimal_pts}f}|{:<25.{decimal_pts}f}|{:<20}|{:<18}|".format(
                        j, col1, col2, col3, (col4).title(), decimal_pts=self.decimals
                    )
                )
                print("-" * 124)
            print()

        sys.stdout.flush()

    def _print_correlation_analysis(self):
        """
        Formats the results of correlation analysis in feature_importance() method before printing to console.
        """
        if not self.feature_imp_status_corr:
            print("Correlation matrix skipped")
            return

        surrogate_list = []
        for p_var, surrogates in self.surrogate_features.items():
            if surrogates:
                surrogate_list.extend(surrogates.keys())

        display_cols = list(
            set(
                [
                    *self.surrogate_features.keys(),
                    *surrogate_list,
                    *self.corr_top_3_features,
                ]
            )
        )
        display_df = self.corr_df.loc[display_cols, display_cols]

        print(
            "\nPartial correlation matrix (Most correlated features for {}):".format(
                ", ".join(self.surrogate_features.keys())
            )
        )
        display(display_df)
        if surrogate_list:
            for p_var, surrogates in self.surrogate_features.items():
                if surrogates:
                    print(
                        "* Surrogate detected for {} (threshold={:.{decimal_pts}g}): {}".format(
                            p_var,
                            self.correlation_threshold,
                            ", ".join(str(x) for x in surrogates.keys()),
                            decimal_pts=self.decimals,
                        )
                    )

        else:
            print(
                "* No surrogate detected based on correlation analysis (threshold={:.{decimal_pts}g}).".format(
                    self.correlation_threshold, decimal_pts=self.decimals
                )
            )

        sys.stdout.flush()

    def mitigate(
        self,
        p_var=[],
        method=["reweigh"],
        cr_alpha=1,
        cr_beta=None,
        rw_weights=None,
        transform_x=None,
        transform_y=None,
        model_num=0,
    ):
        """
        Performs bias mitigation based on the techniques selected. Supports 3 techniques which output fair thresholds, decorrelated columns and debiased weights.

        Parameters
        ----------
        p_var : list of strings, default=None
                Optional parameter. Protected variables to be considered for mitigation. If not specified, all the protected variables in the model will be considered.

        method : list of strings, default=['reweigh']
                Optional parameter. Methods to be used for mitigation. Valid inputs include "reweigh", "decorrelate", "threshold".

        cr_alpha : float, default=1
                Weight of the original feature set in the decorrelation method.

        cr_beta : float, default=None
                Weight of the filtered feature set in the decorrelation method. If not specified, cr_alpha will be used.

        rw_weights : dict, default=None
                Dictionary containing the sample weights for each protected variable.

        transform_x : numpy array, default=None
                Transformed feature set for training data. If not specified, the original feature set will be used.

        transform_y : numpy array, default=None
                Transformed label set for training data. If not specified, the original label set will be used.

        model_num : int, default=0
                The model number in model_params to be used for bias mitigation.

        Returns
        ----------
        Print the results of the specified bias mitigation method to console.
        """
        p_var = [] if p_var is None else p_var
        method = [] if method is None else method
        NoneType = type(None)
        exp_transform_x = None
        exp_cr_beta = None
        _input_parameter_lookup = {
            "p_var": [p_var, (list,), self.model_params[0].non_intersect_pvars],
            "method": [method, (list,), self.mitigate_methods],
        }

        # Filter the input parameters to only include valid values
        filtered_params = input_parameter_filtering(_input_parameter_lookup, obj_in=self.model_params[model_num])

        # Expected param_range
        if "reweigh" in filtered_params["method"] or "correlate" in filtered_params["method"]:
            exp_transform_x = (
                self.model_params[model_num].x_test.columns.tolist()
                if self.model_params[model_num].x_test is not None
                else self.model_params[model_num].x_train.columns
            )

        if "correlate" in filtered_params["method"]:
            if p_var == []:
                exp_cr_beta = (
                    (
                        len(self.model_params[model_num].non_intersect_pvars),
                        self.model_params[model_num].x_test.shape[1]
                        - len(self.model_params[model_num].non_intersect_pvars),
                    )
                    if self.model_params[model_num].x_test is not None
                    else (
                        len(self.model_params[model_num].non_intersect_pvars),
                        self.model_params[model_num].x_train.shape[1],
                    )
                )
            else:
                exp_cr_beta = (
                    (
                        len(p_var),
                        self.model_params[model_num].x_test.shape[1]
                        - len(self.model_params[model_num].non_intersect_pvars),
                    )
                    if self.model_params[model_num].x_test is not None
                    else (len(p_var), self.model_params[model_num].x_train.shape[1])
                )

        _input_parameter_no_filtering = {
            "cr_alpha": [cr_alpha, (int, float), (0, 1)],
            "cr_beta": [cr_beta, (np.ndarray, NoneType), exp_cr_beta],
            "rwg_weights": [rw_weights, (dict, NoneType), None],
            "transform_x": [
                transform_x,
                (NoneType, pd.DataFrame, str),
                exp_transform_x,
            ],
            "transform_y": [transform_y, (NoneType, list, np.ndarray, pd.Series), None],
            "model_num": [model_num, (int,), list(range(len(self.model_params)))],
        }

        _input_parameter_lookup.update(_input_parameter_no_filtering)

        # Update the variables with the values in the filtered_params dictionary
        p_var = filtered_params.get("p_var")
        method = filtered_params.get("method")

        # Update the _input_parameter_lookup dictionary with the updated values
        _input_parameter_lookup["p_var"][0] = p_var
        _input_parameter_lookup["method"][0] = method

        # Validate the data types and values of the input parameters
        input_parameter_validation(_input_parameter_lookup)
        mitigate_result = {}
        # Initialize tqdm progress bar
        with tqdm(total=100, desc="Bias mitigation ", bar_format="{l_bar}{bar}") as mi_pbar:
            # If p_var is not specified, use all protected variables
            self.mitigate_p_var = self.model_params[model_num].non_intersect_pvars if not p_var else p_var
            self.mitigate_method = method

            for i in self.mitigate_method:
                if i == "correlate":
                    mitigate_result[i] = self.map_mitigate_to_method[i](
                        self.mitigate_p_var, cr_alpha, cr_beta, transform_x
                    )
                    mi_pbar.update(10)
                elif i == "reweigh":
                    mitigate_result[i] = self.map_mitigate_to_method[i](
                        self.mitigate_p_var,
                        rw_weights,
                        transform_x,
                        transform_y,
                        model_num,
                    )
                    mi_pbar.update(10)
                else:
                    if i == "threshold":
                        # check tradeoff_status, if False, run self.tradeoff()
                        if self.tradeoff_status == 0:
                            self.tradeoff(output=False)
                            mi_pbar.update(10)
                    mitigate_result[i] = self.map_mitigate_to_method[i](self.mitigate_p_var)
                    mi_pbar.update(10)

            mi_pbar.update(100 - mi_pbar.n)
            mi_pbar.close()
            print("", flush=True)

        self.mitigate_result = mitigate_result

        self._print_mitigate()

        return mitigate_result

    def _print_mitigate(self):
        """
        Formats the results of the mitigate() method before printing to console.

        Returns
        ----------
        Prints the results of the bias mitigation techniques to the console.
        """
        print("*Effective input for p_var = {}".format(self.mitigate_p_var))

        if "threshold" in self.mitigate_method:
            print()
            print("=" * 80)
            print("Threshold tuning".center(80))
            print("=" * 80)
            print()
            print("-" * 80)
            print("|{:<30}|{:<23}|{:<23}|".format("Protected variable", "Privileged", "Unprivileged"))
            print("-" * 80)

            # Iterate through protected variables
            for i in self.mitigate_p_var:
                if i in self.tradeoff_obj.result:
                    # Get thresholds from tradeoff results
                    th1 = self.tradeoff_obj.result[i]["max_perf_neutral_fair"][0]
                    th2 = self.tradeoff_obj.result[i]["max_perf_neutral_fair"][1]
                    # Print thresholds for each protected variable
                    print(
                        "|{:<30}|{:<23.{decimal_pts}f}|{:<23.{decimal_pts}f}|".format(
                            i, th1, th2, decimal_pts=self.decimals
                        )
                    )
                    print("-" * 80)
            print()
            if self.model_params[0].y_pred is None:
                print("Skipped: Thresholding not supported for multi-class labels. Hence, new y_pred\nreturn None.")

        if "reweigh" in self.mitigate_method:
            print()
            print("=" * 80)
            print("Reweighing".center(80))
            print("=" * 80)
            print()

            if self.rw_is_transform:
                print("Calculating sample_weights for transform_x based on provided rw_weights,\ntransform_y.")
            else:
                print("-" * 80)
                print("|{:<30}|{:<23}|{:<23}|".format(", ".join(i for i in self.mitigate_p_var), "Label", "Weight"))
                print("-" * 80)

                for key, value in self.mitigate_result["reweigh"][1].items():
                    n = len(key) - 1
                    p_var_value = key[:n]
                    label = key[n]
                    weight = value
                    print(
                        "|{:<30}|{:<23}|{:<23.{decimal_pts}f}|".format(
                            ", ".join(str(i) for i in p_var_value),
                            label,
                            weight,
                            decimal_pts=self.decimals,
                        )
                    )
                    print("-" * 80)
                print()
                print("Calculating sample_weights for x_train.")
                print("(To use a different dataset provide transform_x, transform_y and rw_weights)")

        if "correlate" in self.mitigate_method:
            print()
            print("=" * 80)
            print("Correlation Removal".center(80))
            print("=" * 80)
            print()

            if self.cr_is_transform:
                print("Transforming dataset based on provided and corr_alpha and corr_beta.")
            else:
                print("Transforming x_train, x_test based on corr_alpha.")
                print("(To use a different dataset provide transform_x, corr_alpha and corr_beta)")

        print()

    def _threshold(self, p_var=None):
        """
        Returns separate thresholds for privileged and unprivileged groups based on tradeoff analysis.
        The order of the arrays in the tuple will be based on the order of p_var input.

        Parameters
        ----------
        p_var : list of str, default=None
                Protected variable to be considered for threshold tuning.

        Returns
        ----------
        y_pred_copy : tuple of numpy arrays
                A tuple of numpy arrays according to the suggested thresholds from tradeoff analysis.
        """
        # y_pred = self.model_params[0].y_pred
        y_prob = self.model_params[0].y_prob
        model_type = self.model_params[0].model_type

        if model_type == "uplift" and y_prob is None:
            return None
        else:
            y_pred_copy = []
            for var in p_var:
                # Get thresholds from tradeoff analysis
                th1 = self.tradeoff_obj.result[var]["max_perf_neutral_fair"][0]
                th2 = self.tradeoff_obj.result[var]["max_perf_neutral_fair"][1]

                # Make copy of y_pred and change elements based on feature mask
                y_pred_var = y_prob.copy()
                mask = self.feature_mask[var]
                y_pred_var[mask == 1] = np.where(y_prob[mask == 1] >= th1, 1, 0)
                y_pred_var[mask == 0] = np.where(y_prob[mask == 0] >= th2, 1, 0)

                y_pred_copy.append(y_pred_var)

            return tuple(y_pred_copy)

    def _reweigh(self, p_var, weights, transform_x, transform_y, model_num):
        """
        Return debiased weights for individual samples of training dataset.
        If empty, all protected variables are used. Only declared non-intersectional protected variables are supported.

        Parameters
        ----------
        p_var : list of strings
                Protected variables to be considered for reweighing.

        weights : numpy.ndarray
                An array of sample weights.

        transform_x : pandas.DataFrame
                The transformed feature data to use for computing the reweighing factors.

        transform_y : pandas.Series, numpy.ndarray, list
                The transformed target data to use for computing the reweighing factors.

        model_num : int
                The index of model_params to be used for reweighing.

        Returns
        -------
        sample_weight_t : numpy.ndarray
                The adjusted sample weights computed using the reweighing factors.

        reweigh_factors_dict : dict
                A dictionary of the reweighing factors for each p_var-label group.
        """
        # If one is None and others aren't then ignore
        if weights is not None and transform_x is not None and transform_y is not None:
            df = pd.concat([transform_x[p_var], pd.Series(transform_y)], axis=1).values
            sample_weight_t = np.array(list(map(lambda x: weights[tuple(x)], df)))
            self.rw_is_transform = True
            return sample_weight_t

        else:
            sample_weight = np.ones(self.model_params[model_num].y_train.shape)
            sample_weight_t = np.empty_like(sample_weight)

            df = self.model_params[model_num].x_train.copy()
            df = df.set_index(p_var)
            df = df.index.to_frame()
            groups = df.set_index(p_var).index
            groups = groups.to_flat_index()

            unique_groups = np.unique(groups)
            unique_classes = np.unique(self.model_params[model_num].y_train)
            n_groups = len(unique_groups)
            n_classes = len(unique_classes)
            reweigh_factors = np.full((n_groups, n_classes), np.nan)
            reweigh_factors_dict = {}
            y = self.model_params[model_num].y_train

            def N_(i):
                return sample_weight[i].sum()

            N = sample_weight.sum()
            for i, g in enumerate(unique_groups):
                for j, c in enumerate(unique_classes):
                    g_and_c = (groups == g) & (y == c)
                    if np.any(g_and_c):
                        W_gc = N_(groups == g) * N_(y == c) / (N * N_(g_and_c))
                        sample_weight_t[g_and_c] = W_gc * sample_weight[g_and_c]
                        reweigh_factors[i, j] = W_gc
                        if isinstance(g, tuple):
                            reweigh_factors_dict[(*g, c)] = W_gc
                        else:
                            reweigh_factors_dict[(g, c)] = W_gc

            self.rw_is_transform = False
            return sample_weight_t, reweigh_factors_dict

    def _correlate(self, p_var, alpha, beta, transform_df):
        """
        Applies a linear transformation to the non-sensitive feature columns in order to remove their correlation with
        the sensitive feature columns while retaining as much information as possible (as measured by the least-squares error).

        If empty, all protected variables are used. Only declared non-intersectional protected variables are supported.

        Parameters
        ----------
        p_var : list of strings
                Protected variables to be considered for decorrelate.

        alpha : int or float, optional
                Weight of the decorrelated data.

        beta : numpy.ndarray or None
                A matrix of weights used to transform a given dataset. If provided, `transform_df` must also be provided.

        transform_df : pandas.DataFrame or None
                The transformed feature data for decorrelate. If provided, `beta` must also be provided.

        Returns
        -------
        tuple or ndarray
                Returns a tuple containing the transformed test data if `beta` and `transform_df` not None.
                Otherwise, returns a tuple containing the transformed train and test data and the beta coefficients.
        """
        # If one is None and other isn't then ignore
        if beta is not None and transform_df is not None:
            x_use = transform_df.drop(columns=self.model_params[0].non_intersect_pvars)
            x_sensitive = transform_df[p_var]
            beta_ = beta
            self.cr_is_transform = True
        else:
            x_use = self.model_params[0].x_train.drop(columns=self.model_params[0].non_intersect_pvars)
            x_sensitive = self.model_params[0].x_train[p_var]  # [p_var]
            sensitive_mean_ = x_sensitive.mean()
            x_s_center = x_sensitive - sensitive_mean_
            beta_, _, _, _ = np.linalg.lstsq(x_s_center, x_use, rcond=None)
            x_filtered = x_use.values - x_s_center.dot(beta_)
            x_use = np.atleast_2d(x_use)
            x_filtered = np.atleast_2d(x_filtered)
            x_train_decorr = alpha * x_filtered + (1 - alpha) * x_use
            cols_wo_pvar = [
                col
                for col in self.model_params[0].x_train.columns
                if col not in self.model_params[0].non_intersect_pvars
            ]
            x_train_decorr = pd.DataFrame(x_train_decorr, columns=cols_wo_pvar)  #
            x_train_decorr[self.model_params[0].non_intersect_pvars] = self.model_params[0].x_train[
                self.model_params[0].non_intersect_pvars
            ]
            x_train_decorr = x_train_decorr[self.model_params[0].x_train.columns]

            x_use = self.model_params[0].x_test.drop(columns=self.model_params[0].non_intersect_pvars)
            x_sensitive = self.model_params[0].x_test[p_var]
            self.cr_is_transform = False

        sensitive_mean_ = x_sensitive.mean()
        x_s_center = x_sensitive - sensitive_mean_
        x_filtered = x_use.values - x_s_center.dot(beta_)
        x_use = np.atleast_2d(x_use)
        x_filtered = np.atleast_2d(x_filtered)
        x_test_decorr = alpha * x_filtered + (1 - alpha) * x_use
        cols_wo_pvar = [
            col for col in self.model_params[0].x_test.columns if col not in self.model_params[0].non_intersect_pvars
        ]
        x_test_decorr = pd.DataFrame(x_test_decorr, columns=cols_wo_pvar)
        x_test_decorr[self.model_params[0].non_intersect_pvars] = self.model_params[0].x_test[
            self.model_params[0].non_intersect_pvars
        ]
        x_test_decorr = x_test_decorr[self.model_params[0].x_test.columns]

        if beta is not None and transform_df is not None:
            return (x_test_decorr,)
        else:
            return x_train_decorr, x_test_decorr, beta_

    def rootcause(self, p_var=[], multi_class_target=None, model_num=0):
        """
        Computes top 10 features contributing to bias. Bias is measured by Shap-based demographic parity.

        Parameters
        ----------
        p_var : list of strings, default=None
                Optional parameter. Protected variables to be considered for rootcause analysis.

        multi_class_target : int, float or str, default=None
                Optional parameter. Label to use for comparison between privileged and unprivileged groups in rootcause analysis. Only applicable for multi-class classification models. If not specified, the last label will be used.

        model_num : int, default=0
                The model number in model_params to be used for root cause analysis.

        Returns
        ----------
        Creates the bar plot displaying top 10 contributors to bias for each protected variable.
        """
        # if y_train/x_train/x_test is None, skip evaluate
        if (
            self.model_params[0].y_train is None
            or self.model_params[0].x_train is None
            or self.model_params[0].p_grp is None
            or self.model_params[0].model_object is None
            or isinstance(self.model_params[0].x_train, str)
        ):
            print(
                "Skipped: Root cause analysis is skipped due to insufficient data input during ModelContainer() initialization."
            )
            return
        self.rootcause_values = {}
        self.rootcause_label_index = -1  # default to use the last label in tran_shap_values
        self.rootcause_model_num = model_num
        p_var = [] if p_var is None else p_var

        _input_parameter_lookup = {"model_num": [model_num, (int,), [i for i in range(len(self.model_params))]]}

        # Validate the data types and values of the input parameters
        input_parameter_validation(_input_parameter_lookup)

        # ignore user input for binary classes but print warning
        if (
            len(self.model_params[self.rootcause_model_num].model_object.classes_) == 2
            and multi_class_target is not None
        ):
            print("Warning: Current use case does not support '{}' so input is discarded.".format(multi_class_target))
            multi_class_target = self.model_params[self.rootcause_model_num].model_object.classes_.tolist()[1]

        _input_parameter_lookup = {
            "p_var": [
                p_var,
                (list,),
                self.model_params[self.rootcause_model_num].non_intersect_pvars,
            ],
            "multi_class_target": [
                multi_class_target,
                (str, float, int),
                self.model_params[self.rootcause_model_num].model_object.classes_,
            ],
        }

        # Filter the input parameters to only include valid values
        filtered_params = input_parameter_filtering(_input_parameter_lookup)

        # Update the variables with the values in the filtered_params dictionary
        p_var = filtered_params.get("p_var")

        # Update the _input_parameter_lookup dictionary with the updated values
        _input_parameter_lookup["p_var"][0] = p_var

        # Validate the data types and values of the input parameters
        input_parameter_validation(_input_parameter_lookup)

        # to show progress bar
        rca_pbar = tqdm(total=100, desc="Root cause analysis", bar_format="{l_bar}{bar}")
        rca_pbar.update(1)

        # if tran_status_total is False, run _data_sampling and _shap to get tran_shap_values
        if not self.tran_flag[model_num]["data_prep_flag"]:
            rca_pbar.set_description("Running shap explanation")
            tqdm._instances.clear()
            self._data_prep(model_num)
            rca_pbar.update(1)

        # Select the appropriate class label for root cause analysis if the model is a multi-class classifier, default label_index = -1
        rca_pbar.set_description("Root cause analysis")
        tran_shap_values = self.tran_shap_values[self.rootcause_model_num]
        if isinstance(tran_shap_values, list):
            # find index of multi_class_target in tran_shap_values
            if multi_class_target is not None:
                self.rootcause_label_index = (
                    self.model_params[self.rootcause_model_num].model_object.classes_.tolist().index(multi_class_target)
                )
            tran_shap_values = tran_shap_values[self.rootcause_label_index]
        self.rootcause_sample_size = tran_shap_values.shape[0]
        rca_pbar.update(10)

        if not p_var:
            p_var = self.model_params[self.rootcause_model_num].non_intersect_pvars
        # Loop through each feature in p_var and calculate the group difference
        for i in p_var:
            self.rootcause_values[i] = {}

            # Get p_var sampled data from tran_processed_data
            prot_var_df = self.tran_processed_data[i]
            # Get privileged and unprivileged groups for p_var
            privileged_grp = self.model_params[self.rootcause_model_num].p_grp.get(i)[0]
            unprivileged_grp = self.model_params[self.rootcause_model_num].up_grp.get(i)[0]

            # Create feature mask where elements in privileged_grp are True, otherwise -1
            feature_mask = np.where(prot_var_df.isin(privileged_grp), True, -1)
            # Update existing feature mask where elements in unprivileged_grp are False, otherwise no change
            feature_mask = np.where(prot_var_df.isin(unprivileged_grp), False, feature_mask)

            # Get indices where feature mask is 0 or 1
            indices = np.where(np.isin(feature_mask, [0, 1]))
            # Filter tran_shap_values to only keep values corresponding to indices with 0 or 1 in feature mask
            tran_shap_values_pvar = tran_shap_values[indices]
            # Create group mask by filtering feature mask to only keep values 0 or 1 and convert to boolean
            group_mask = feature_mask[np.where(feature_mask != -1)].astype(bool)
            feature_names = self.tran_processed_data.columns
            self.rootcause_values[i] = self._rootcause_group_difference(
                tran_shap_values_pvar, group_mask, feature_names
            )
        rca_pbar.update(10)

        rca_pbar.update(100 - rca_pbar.n)
        rca_pbar.close()
        print("", flush=True)

        self._print_rootcause()

    def _rootcause_group_difference(self, tran_shap_values, group_mask, feature_names, max_display=10, sort=True):
        """
        This function computes the absolute difference in mean SHAP values between privileged and unprivileged groups, and returns a dictionary
        of the top `max_display` (Default = 10) features sorted by their absolute difference value. The values are also normalized between 0 and 1.

        Parameters
        ----------
        tran_shap_values : numpy.ndarray
            Stores the shapley explanation values obtained based on the model and data passed.
        group_mask : numpy.ndarray
            A boolean array indicating which data point belong to the privileged group (True) and which samples belong to the
            unprivileged group (False).
        feature_names : list of str, optional
            The names of the features in the dataset.
        max_display : int, optional
            The maximum number of features to display in the results. The default is 10.
        sort : bool, optional
            If True, the results will be sorted in descending order of absolute contribution.

        Returns
        -------
        rca_results : dict
            A dictionary containing the absolute difference in mean SHAP values and the normalized values between 0 and 1 for each feature.
        """
        rca_result = {}
        diff = tran_shap_values[group_mask].mean(0) - tran_shap_values[~group_mask].mean(0)

        if sort is True:
            inds = np.argsort(-np.abs(diff)).astype(int)
        else:
            inds = np.arange(len(diff))

        if max_display is not None:
            inds = inds[:max_display]

        feature_names = [feature_names[i] for i in inds]
        group_diffs = np.abs(diff[inds])
        group_diffs_min = group_diffs.min()
        group_diffs_max = group_diffs.max()

        for num, var in enumerate(feature_names):
            group_diff = group_diffs[num]
            group_diff_norm = (group_diff - group_diffs_min) / (group_diffs_max - group_diffs_min)
            rca_result[var] = group_diff_norm

        return rca_result

    def _print_rootcause(self):
        """
        Formats and displays the results of the root cause analysis for the specified class label index.

        Returns
        -------
        Creates the bar plot displaying top 10 contributors to bias for each protected variable.

        Notes
        -----
        By default, the bar plot display the top 10 contributors sorted by descending order of the normalized absolute demographic parity difference.
        The values above the bars show the normalized absolute demographic parity difference.
        """
        class_name = self.model_params[self.rootcause_model_num].model_object.classes_[self.rootcause_label_index]
        header1 = "Top 10 contributors towards bias for class '{}'".format(class_name)
        print()
        if not self.tran_max_sample == self.model_params[self.rootcause_model_num].x_train.shape[0]:
            header2 = "Measured by SHAP-based Demographic Parity on {} samples".format(self.rootcause_sample_size)
        else:
            header2 = "Measured by SHAP-based Demographic Parity"
        max_header_length = max(len(header1), len(header2))
        print("{:>25}{:^{}}".format("", header1, max_header_length))
        print("{:>25}{:^{}}".format("", header2, max_header_length))
        print()
        print()

        # plot bar plots for each p_var in rootcause_values
        for i, i_var in enumerate(self.rootcause_values):
            feature_names = []
            group_diff = []
            for j in self.rootcause_values[i_var]:
                group_diff.append(self.rootcause_values[i_var][j])
                feature_names.append(j)

            # create bar plot
            fig, ax = plt.subplots()
            sorted_indexes = np.argsort(-np.array(group_diff)).astype(int)
            sorted_labels = [feature_names[i] for i in sorted_indexes]
            bar_plot = ax.barh(
                sorted_labels,
                sorted(group_diff, reverse=True),
                align="center",
                color="#12239E",
                zorder=2,
            )

            # add values for each bar
            for bar in bar_plot:
                width = bar.get_width()
                # ax.text(width, bar.get_y() + bar.get_height()/2, '{:.{decimal_pts}f}%'.format(width*100, decimal_pts=self.decimals), ha='left', va='center')
                ax.text(
                    width,
                    bar.get_y() + bar.get_height() / 2,
                    "{:.{decimal_pts}f}%".format(width * 100, decimal_pts=1),
                    ha="left",
                    va="center",
                )

            ax.set_xlabel("Normalized Absolute Contributions in Percentage")
            ax.set_title("Root Cause Analysis on {}".format(i_var))
            ax.set_yticks(sorted_labels)
            ax.set_yticklabels(sorted_labels)
            ax.set_xlim(left=0, right=1.15)
            ax.set_ylim(ax.get_ylim()[::-1])
            ax.xaxis.grid(True, alpha=0.3, zorder=1)

            # Save the figure and show
            plt.tight_layout()
            plt.show()
        print()

    def _generate_model_artifact(self, save_artifact=True) -> Optional[ModelArtifact]:
        """
        Generates the JSON file to be saved locally at the end of compile()

        Parameters
        ----------
        save_artifact : bool, default=True
                If True, a JSON file will be saved locally. If False, the dictionary will be returned.
        """
        # aggregate the results into model artifact
        print("{:40s}".format("Generating model artifact"), end="")
        artifact = {}

        if (
            "evaluate" not in self.compile_disable or self.compile_disable_map["evaluate"]
        ) and self.evaluate_status != -1:
            artifact_fair = {}
            # Section 1 - fairness_init
            # write results to fairness_init
            fairness_init = {}
            fairness_init["fair_metric_name_input"] = self.fair_metric_input
            fairness_init["fair_metric_name"] = FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[0]
            fairness_init["perf_metric_name"] = PerformanceMetrics.map_perf_metric_to_group.get(self.perf_metric_name)[
                0
            ]
            fairness_init["protected_features"] = self.model_params[0].p_var
            if FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[1] != "regression":
                fairness_init["fair_priority"] = self.fair_priority
                fairness_init["fair_concern"] = self.fair_concern
                fairness_init["fair_impact"] = self.fair_impact
            # if self.model_params[0].model_type == "uplift" or self.model_params[0].model_type == "credit":
            # if self.spl_params is not None:
            if "spl_params" in dir(self):
                fairness_init["special_params"] = (
                    self.spl_params
                )  # num_applicants and base_default_rate for creditscoring, treatment_cost, revenue and selection_threshold for customermarketing
            fairness_init["fair_threshold_input"] = self.fair_threshold_input
            fairness_init["fair_neutral_tolerance"] = self.fair_neutral_tolerance
            model_type = self.model_params[0].model_type
            # add fairness_init results to artifact
            artifact_fair["fairness_init"] = fairness_init
            perf_result = deepcopy(self.perf_metric_obj.result)
            perf_vals_wth_metric_names = {}
            for key in self.perf_metric_obj.result["perf_metric_values"].keys():
                if key in PerformanceMetrics.map_perf_metric_to_group.keys():
                    perf_vals_wth_metric_names[PerformanceMetrics.map_perf_metric_to_group.get(key)[0]] = (
                        self.perf_metric_obj.result["perf_metric_values"][key]
                    )
            perf_result["perf_metric_values"] = perf_vals_wth_metric_names
            artifact_fair = {**artifact_fair, **(perf_result)}
            artifact_fair["correlation_matrix"] = None
            if self.feature_imp_status_corr:
                artifact_fair["correlation_matrix"] = self.correlation_output
            # above part will only be tested when Credit Scoring and Customer Marketing classes can be run

            p_var = self.model_params[0].p_var
            # write results to features_dict
            features_dict = {}
            for pvar in p_var:
                dic_h = {}
                dic_h["fair_threshold"] = self.fair_conclusion.get(pvar).get("threshold")

                p_grp_val = self.model_params[0].p_grp[pvar]
                up_grp_val = self.model_params[0].up_grp[pvar]

                def process_pgrp_upgrp_value(val):
                    if isinstance(val[0], list) and isinstance(val[0][0], str):
                        return [[int(v) if v.isdigit() else v for v in item.split("|")] for item in val[0]]
                    else:
                        return val

                dic_h["privileged"] = process_pgrp_upgrp_value(p_grp_val)
                dic_h["unprivileged"] = process_pgrp_upgrp_value(up_grp_val)

                dic_t = {}
                dic_t["fairness_conclusion"] = self.fair_conclusion.get(pvar).get("fairness_conclusion")
                dic_t["tradeoff"] = None
                if self.tradeoff_status == 1:
                    dic_t["tradeoff"] = self.tradeoff_obj.result.get(pvar)
                dic_t["feature_importance"] = None
                if self.feature_imp_status == 1:
                    dic_t["feature_importance"] = self.feature_imp_values.get(pvar)

                fair_vals_wth_metric_names = {}
                for key in self.fair_metric_obj.result.get(pvar)["fair_metric_values"].keys():
                    if key in FairnessMetrics.map_fair_metric_to_group.keys():
                        fair_vals_wth_metric_names[FairnessMetrics.map_fair_metric_to_group.get(key)[0]] = (
                            self.fair_metric_obj.result.get(pvar)["fair_metric_values"][key]
                        )
                fair_result = deepcopy(self.fair_metric_obj.result.get(pvar))
                fair_result["fair_metric_values"] = fair_vals_wth_metric_names
                for k, v in fair_result["fair_metric_values"].items():
                    fair_result["fair_metric_values"][k] = [v[0], v[2]]
                features_dict[str(pvar)] = {**dic_h, **fair_result, **dic_t}
            # add features_dict results to artifact
            artifact_fair["features"] = features_dict
            artifact_fair["individual_fairness"] = self.fair_metric_obj.result.get("indiv_fair")
        else:
            artifact_fair = None

        model_name = (self.model_params[0].model_name + "_").replace(" ", "_")
        filename = "model_artifact_" + model_name + datetime.datetime.today().strftime("%Y%m%d_%H%M") + ".json"
        artifact["fairness"] = artifact_fair
        artifact["transparency"] = self.tran_artifact
        self.artifact, err = parse_model_artifact(artifact)

        if not self.artifact:
            print(err)
        elif self.artifact.fairness is None and self.artifact.transparency is None:
            print("skipped")
        elif save_artifact:
            data = self.artifact.dict()
            with open(filename, "w") as f:
                f.write(json.dumps(data, cls=NpEncoder))
                print("done")
                print("Saved model artifact to " + filename)
        else:
            return self.artifact

    def _fairness_widget(self):
        """
        Runs to pop up a widget to visualize the evaluation output
        """
        try:
            if get_ipython().__class__.__name__ == "ZMQInteractiveShell":  # noqa: F821
                display(
                    HTML(
                        """
                            <style>
                                .dropdown_clr {
                                    background-color: #E2F0D9;
                                }
                                .fair_green{
                                    width:auto;
                                    background-color:#E2F0D9;
                                }
                                .perf_blue {
                                    width:auto;
                                    background-color:#DEEBF7;
                                }
                            </style>
                            """
                    )
                )

                result_fairness = self.fair_metric_obj.result
                option_p_var = self.fair_metric_obj.p_var[0]
                options = []
                for i in self.fair_metric_obj.p_var[0]:
                    options += [i + " (privileged group = " + str(self.model_params[0].p_grp.get(i)) + ")"]
                model_type = self.model_params[0].model_type.title()
                if PerformanceMetrics.map_perf_metric_to_group.get(self.perf_metric_name)[1] != "regression":
                    model_concern = self.fair_concern.title()
                    model_priority = self.fair_priority.title()
                    model_impact = self.fair_impact.title()
                else:
                    model_concern = "N/A"
                    model_priority = "N/A"
                    model_impact = "N/A"
                model_name = self.model_params[0].model_name.title()
                metric_type = self.fair_metric_type.title()
                if FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2] == "ratio":
                    neutral_pos = 1
                else:
                    neutral_pos = 0

                html_pink = '<div style="color:black; text-align:left; padding-left:5px; background-color:#FBE5D6; font-size:12px">{}</div>'
                html_grey_true = (
                    '<div style="color:black; text-align:center; background-color:#AEAEB2; font-size:12px">{}</div>'
                )
                html_grey_false = (
                    '<div style="color:#8E8E93; text-align:center; background-color:#E5E5EA; font-size:12px">{}</div>'
                )
                html_yellow_left = '<div style="color:black; text-align:left; padding-left:5px; background-color:#FFF2CC; font-size:12px">{}</div>'
                html_yellow_right = '<div style="color:black; text-align:right; padding-right:5px; background-color:#FFF2CC; font-size:12px">{}</div>'
                html_model_type = widgets.HTML(
                    value=html_yellow_left.format("Model Type: " + model_type),
                    layout=Layout(display="flex", width="30%"),
                )
                html_model_name = widgets.HTML(
                    value=html_yellow_right.format("Model Name: " + model_name),
                    layout=Layout(display="flex", justify_content="flex-end", width="45%"),
                )
                dropdown_protected_feature = widgets.Dropdown(
                    options=options,
                    description=r"Protected Feature:",
                    layout=Layout(
                        display="flex",
                        justify_content="flex-start",
                        width="50%",
                        padding="0px 0px 0px 5px",
                    ),
                    style=dict(description_width="initial"),
                )
                dropdown_protected_feature.add_class("dropdown_clr")
                html_model_priority = widgets.HTML(
                    value=html_pink.format("Priority: " + model_priority),
                    layout=Layout(display="flex", width="12.5%"),
                )
                html_model_impact = widgets.HTML(
                    value=html_pink.format("Impact: " + model_impact),
                    layout=Layout(display="flex", width="12.5%"),
                )
                html_model_concern = widgets.HTML(
                    value=html_pink.format("Concern: " + model_concern),
                    layout=Layout(display="flex", width="12.5%"),
                )
                html_metric_type = widgets.HTML(
                    value=html_pink.format("Type: " + metric_type),
                    layout=Layout(display="flex", width="12.5%"),
                )

                if self.model_params[0].sample_weight is not None:
                    sw = html_grey_true
                else:
                    sw = html_grey_false

                if "_rejection_inference_flag" in dir(self):
                    if True in self._rejection_inference_flag.values():
                        ri = html_grey_true
                    else:
                        ri = html_grey_false
                elif hasattr(self, "spl_params") and model_type == "Uplift":
                    if None not in self.spl_params.values():
                        ri = html_grey_true
                    else:
                        ri = html_grey_false
                else:
                    ri = html_grey_false

                html_sample_weight = widgets.HTML(
                    value=sw.format("Sample Weight"),
                    layout=Layout(display="flex", justify_content="center", width="12.5%"),
                )

                # if model_type == "Credit":
                if "_rejection_inference_flag" in dir(self):
                    html_rej_infer = widgets.HTML(
                        value=ri.format("Rejection Inference"),
                        layout=Layout(display="flex", justify_content="center", width="12.5%"),
                    )
                elif model_type == "Uplift":
                    html_rej_infer = widgets.HTML(
                        value=ri.format("Revenue & Cost"),
                        layout=Layout(display="flex", justify_content="center", width="12.5%"),
                    )
                elif model_type in ["Classification", "Regression"]:
                    regression = '<div style="color:#E5E5EA; text-align:center; background-color:#E5E5EA; font-size:12px">{}</div>'
                    html_rej_infer = widgets.HTML(
                        value=regression.format("N/A"),
                        layout=Layout(display="flex", justify_content="center", width="12.5%"),
                    )

                html_fair_italics = '<div style="color:black; text-align:left; padding-left:5px;  font-style: italic;font-weight: bold;font-size:14px">{}</div>'
                html_fair_bold = '<div style="color:black; text-align:center;font-weight: bold;font-size:20px">{}</div>'
                html_fair_bold_red = (
                    '<div style="color:#C41E3A; text-align:center; font-weight:bold; font-size:20px">{}</div>'
                )
                html_fair_bold_green = (
                    '<div style="color:#228B22; text-align:center; font-weight:bold; font-size:20px">{}</div>'
                )
                html_fair_small = (
                    '<div style="color:black; text-align:left; padding-left:25px;  font-size:12px">{}</div>'
                )
                html_fair_metric = (
                    '<div style="color:black; text-align:right;  font-weight: bold;font-size:20px">{}</div>'
                )
                html_fair_ci = '<div style="color:black; text-align:left; padding-left:5px; font-size:15px">{}</div>'

                chosen_p_v = option_p_var[0]
                fair1 = widgets.HTML(
                    value=html_fair_italics.format("Fairness"),
                    layout=Layout(display="flex", margin="0"),
                )
                fair2_1 = widgets.HTML(
                    value=html_fair_small.format("Metric"),
                    layout=Layout(display="flex", justify_content="flex-start", margin="0"),
                )
                fair2_2 = widgets.HTML(
                    value=html_fair_small.format("Assessment"),
                    layout=Layout(display="flex", justify_content="flex-start", margin="0"),
                )

                fair3_1 = widgets.HTML(
                    value=html_fair_bold.format(FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[0]),
                    layout=Layout(display="flex", justify_content="center", margin="0"),
                )
                if self.fair_conclusion.get(chosen_p_v).get("fairness_conclusion") == "fair":
                    pattern = html_fair_bold_green
                else:
                    pattern = html_fair_bold_red
                fair3_2_v = pattern.format(self.fair_conclusion.get(chosen_p_v).get("fairness_conclusion").title())

                fair3_2 = widgets.HTML(
                    value=fair3_2_v,
                    layout=Layout(display="flex", justify_content="center", margin="0"),
                )

                fair4_1 = widgets.HTML(
                    value=html_fair_small.format("Value"),
                    layout=Layout(display="flex", justify_content="flex-start", margin="0"),
                )
                fair4_2 = widgets.HTML(
                    value=html_fair_small.format("Threshold"),
                    layout=Layout(display="flex", justify_content="flex-start", margin="0"),
                )
                v = html_fair_metric.format(
                    "{:.{decimal_pts}f}".format(
                        self.fair_metric_obj.result.get(chosen_p_v)
                        .get("fair_metric_values")
                        .get(self.fair_metric_name)[0],
                        decimal_pts=self.decimals,
                    )
                )

                fair5_1 = widgets.HTML(
                    value=v,
                    layout=Layout(
                        display="flex",
                        width="50%",
                        justify_content="center",
                        margin="0",
                    ),
                )

                c = html_fair_ci.format(
                    "\xb1 "
                    + "{:.{decimal_pts}f}".format(
                        self.fair_metric_obj.result.get(chosen_p_v)
                        .get("fair_metric_values")
                        .get(self.fair_metric_name)[2],
                        decimal_pts=self.decimals,
                    )
                )

                fair5_1_1 = widgets.HTML(
                    value=c,
                    layout=Layout(
                        display="flex",
                        width="50%",
                        justify_content="center",
                        margin="0",
                    ),
                )

                t = html_fair_bold.format(
                    "{:.{decimal_pts}f}".format(
                        self.fair_conclusion.get(chosen_p_v).get("threshold"),
                        decimal_pts=self.decimals,
                    )
                )

                fair5_2 = widgets.HTML(
                    value=t,
                    layout=Layout(display="flex", justify_content="center", margin="0"),
                )

                fair5 = HBox(
                    [fair5_1, fair5_1_1],
                    layout=Layout(display="flex", justify_content="center"),
                )

                box1f = VBox(
                    children=[fair2_1, fair3_1, fair4_1, fair5],
                    layout=Layout(width="66.666%"),
                )

                box2f = VBox(
                    children=[fair2_2, fair3_2, fair4_2, fair5_2],
                    layout=Layout(width="66.666%"),
                )

                box3f = HBox([box1f, box2f])

                box4f = VBox(
                    [fair1, box3f],
                    layout=Layout(width="66.666%", margin="5px 5px 5px 0px"),
                )
                box4f.add_class("fair_green")

                html_perf_italics = '<div style="color:black; text-align:left; padding-left:5px; font-style: italic;font-weight: bold;font-size:14px">{}</div>'
                html_perf_bold = (
                    '<div style="color:black; text-align:center;  font-weight: bold;font-size:20px">{}</div>'
                )
                html_perf_small = (
                    '<div style="color:black; text-align:left; padding-left:25px; font-size:12px">{}</div>'
                )
                html_perf_metric = (
                    '<div style="color:black; text-align:right; font-weight: bold;font-size:20px">{}</div>'
                )
                html_perf_ci = '<div style="color:black; text-align:left; padding-left:5px;font-size:15px">{}</div>'

                perf1 = widgets.HTML(
                    value=html_perf_italics.format("Performance"),
                    layout=Layout(display="flex", width="33.3333%", margin="0"),
                )

                perf2_1 = widgets.HTML(
                    value=html_perf_small.format("Assessment"),
                    layout=Layout(display="flex", justify_content="flex-start", margin="0"),
                )
                perf3_1 = widgets.HTML(
                    value=html_perf_bold.format(
                        PerformanceMetrics.map_perf_metric_to_group.get(self.perf_metric_name)[0]
                    ),
                    layout=Layout(display="flex", justify_content="flex-start", margin="0"),
                )

                perf4_1 = widgets.HTML(
                    value=html_perf_small.format("Value"),
                    layout=Layout(display="flex", justify_content="flex-start", margin="0"),
                )
                v = "{:.{decimal_pts}f}".format(
                    self.perf_metric_obj.result.get("perf_metric_values").get(self.perf_metric_name)[0],
                    decimal_pts=self.decimals,
                )
                perf5_1 = widgets.HTML(
                    value=html_perf_metric.format(v),
                    layout=Layout(
                        display="flex",
                        justify_content="flex-start",
                        width="50%",
                        margin="0",
                    ),
                )
                c = "{:.{decimal_pts}f}".format(
                    self.perf_metric_obj.result.get("perf_metric_values").get(self.perf_metric_name)[1],
                    decimal_pts=self.decimals,
                )
                perf5_1_1 = widgets.HTML(
                    value=html_perf_ci.format("\xb1 " + c),
                    layout=Layout(
                        display="flex",
                        justify_content="flex-start",
                        width="50%",
                        margin="0",
                    ),
                )

                perf5 = HBox(
                    [perf5_1, perf5_1_1],
                    layout=Layout(display="flex", justify_content="center"),
                )

                box1p = VBox(children=[perf2_1, perf3_1, perf4_1, perf5])

                box2p = VBox(
                    [perf1, box1p],
                    layout=Layout(width="33.333%", margin="5px 0px 5px 5px"),
                )

                box2p.add_class("perf_blue")

                metric_box = HBox([box4f, box2p], layout=Layout(width="auto"))

                PATH = Path(__file__).parent.parent.joinpath("resources", "widget")

                if (
                    model_type != "Uplift"
                    and PerformanceMetrics.map_perf_metric_to_group.get(self.perf_metric_name)[1] != "regression"
                ):
                    image1 = IPython.display.Image(filename=PATH / "perf_class_jpg.JPG", width=300, height=500)
                    A = widgets.Image(value=image1.data, format="jpg", width=260)
                    image2 = IPython.display.Image(filename=PATH / "fair_class_jpg.JPG", width=300, height=500)
                    B = widgets.Image(value=image2.data, format="jpg", width=260)
                elif model_type == "Uplift":
                    image1 = IPython.display.Image(filename=PATH / "perf_uplift_jpg.JPG", width=300, height=500)
                    A = widgets.Image(value=image1.data, format="jpg", width=260)
                    image2 = IPython.display.Image(filename=PATH / "fair_uplift_jpg.JPG", width=300, height=500)
                    B = widgets.Image(value=image2.data, format="jpg", width=260)
                else:
                    image1 = IPython.display.Image(filename=PATH / "perf_regression_jpg.JPG", width=300, height=500)
                    A = widgets.Image(value=image1.data, format="jpg", width=260)
                    image2 = IPython.display.Image(filename=PATH / "fair_regression_jpg.JPG", width=300, height=500)
                    B = widgets.Image(value=image2.data, format="jpg", width=260)

                tab = widgets.Tab([A, B], layout={"width": "32%", "margin": "15px", "height": "350px"})
                tab.set_title(0, "Performance Metrics")
                tab.set_title(1, "Fairness Metrics")
                plot_output = widgets.Output(layout=Layout(display="flex", align_items="stretch", width="66.6666%"))

                def filtering(protected_feature):
                    global chosen_p_v
                    chosen_p_v = protected_feature
                    if self.fair_conclusion.get(chosen_p_v).get("fairness_conclusion") == "fair":
                        fair3_2.value = html_fair_bold_green.format(
                            self.fair_conclusion.get(chosen_p_v).get("fairness_conclusion").title()
                        )
                    else:
                        fair3_2.value = html_fair_bold_red.format(
                            self.fair_conclusion.get(chosen_p_v).get("fairness_conclusion").title()
                        )

                    fair5_1.value = html_fair_metric.format(
                        "{:.{decimal_pts}f}".format(
                            self.fair_metric_obj.result.get(chosen_p_v)
                            .get("fair_metric_values")
                            .get(self.fair_metric_name)[0],
                            decimal_pts=self.decimals,
                        )
                    )

                    fair5_1_1.value = html_fair_ci.format(
                        "\xb1 "
                        + "{:.{decimal_pts}f}".format(
                            self.fair_metric_obj.result.get(chosen_p_v)
                            .get("fair_metric_values")
                            .get(self.fair_metric_name)[2],
                            decimal_pts=self.decimals,
                        )
                    )

                    fair5_2.value = html_fair_bold.format(
                        "{:.{decimal_pts}f}".format(
                            self.fair_conclusion.get(chosen_p_v).get("threshold"),
                            decimal_pts=self.decimals,
                        )
                    )

                    plot_output.clear_output()

                    filtered_data = pd.DataFrame(result_fairness[protected_feature]["fair_metric_values"])
                    for metric in NewMetric.__subclasses__():
                        if metric.metric_name in result_fairness[protected_feature]["fair_metric_values"].keys():
                            if (
                                metric.metric_name != self.fair_metric_name
                                and metric.metric_name in filtered_data.columns
                            ):
                                filtered_data.drop([metric.metric_name], axis=1, inplace=True)

                    # remove information metric type from plot
                    for metric_name in filtered_data.columns:
                        if FairnessMetrics.map_fair_metric_to_group.get(metric_name)[2] == "information" or (
                            result_fairness[protected_feature]["fair_metric_values"][metric_name][0] == "NA"
                        ):
                            filtered_data.drop([metric_name], axis=1, inplace=True)

                    if (
                        model_type != "Uplift"
                        and PerformanceMetrics.map_perf_metric_to_group.get(self.perf_metric_name)[1] != "regression"
                    ):
                        for i in filtered_data.columns:
                            if FairnessMetrics.map_fair_metric_to_group.get(i)[2] == "ratio":
                                filtered_data.loc[0, i] = filtered_data[i][0] - 1
                    metrics = list(filtered_data.columns)
                    values = filtered_data.loc[0].values

                    # define threshold minimum and maximum based on fair_metric_type and its neutral position
                    th_min = neutral_pos + (-1 * self.fair_conclusion.get(chosen_p_v).get("threshold"))
                    th_max = neutral_pos + (self.fair_conclusion.get(chosen_p_v).get("threshold"))

                    with plot_output:
                        fig = plt.figure(figsize=(20, 13), dpi=300)
                        clrs = ["#C41E3A" if (x == self.fair_metric_name) else "#12239E" for x in metrics]
                        ax = fig.gca()
                        idx = [i for i in range(len(values)) if values[i] is None]
                        metrics = [metrics[i] for i in range(len(metrics)) if i not in idx]
                        values = [values[i] for i in range(len(values)) if i not in idx]
                        # set neutral position at 1 if primary fairness metric type is ratio, else 0 if primary fairness metric type is difference
                        plt.bar(
                            metrics,
                            values,
                            color=clrs,
                            align="center",
                            width=0.5,
                            bottom=neutral_pos,
                        )

                        plt.yticks(fontsize=25)
                        label = [
                            FairnessMetrics.map_fair_metric_to_group.get(metrics[i])[5] for i in range(len(metrics))
                        ]
                        wrap_label = []
                        for l in label:
                            l_ = l.split(" ")
                            l_.insert(1, "\n")
                            wrap_label += [" ".join(l_)]
                        if (
                            model_type == "Uplift"
                            or PerformanceMetrics.map_perf_metric_to_group.get(self.perf_metric_name)[1] == "regression"
                        ):
                            plt.xticks(
                                fontsize=23,
                                ticks=np.arange(len(label)),
                                labels=wrap_label,
                                rotation=0,
                            )
                        else:
                            plt.xticks(
                                fontsize=23,
                                ticks=np.arange(len(label)),
                                labels=wrap_label,
                                rotation=90,
                            )
                        ax.tick_params(axis="x", direction="in", length=16, width=2)
                        plt.ylabel("Values", fontsize=25)
                        plt.title("Fairness Metric Assessment", fontsize=35, y=1.01)
                        plt.grid(color="black", axis="y", linewidth=0.5)

                        plt.axhspan(th_min, th_max, color="#228B22", alpha=0.2, lw=0)
                        if max(values) > th_max - neutral_pos:
                            ymax = ((max(values)) * 1.5) + neutral_pos
                        else:
                            ymax = ((th_max - neutral_pos) * 1.5) + neutral_pos

                        if min(values) < th_min - neutral_pos:
                            ymin = (min(values)) * 1.5 + neutral_pos
                        else:
                            ymin = ((th_min - neutral_pos) * 1.5) + neutral_pos
                        plt.ylim([ymin, ymax])

                        th = mpatches.Patch(color="#228B22", alpha=0.2, label="Threshold Range")
                        pm = mpatches.Patch(color="#C41E3A", label="Primary Metric")
                        plt.legend(
                            handles=[pm, th],
                            loc="upper center",
                            bbox_to_anchor=(0.5, -0.2),
                            prop={"size": 25},
                            ncol=2,
                            borderaxespad=3,
                        )

                        plt.box(False)
                        plt.tight_layout()
                        plt.show()

                def dropdown_event_handler(change):
                    new = change.new.split(" (")[0]
                    filtering(new)

                filtering(option_p_var[0])
                dropdown_protected_feature.observe(dropdown_event_handler, names="value")

                item_layout = widgets.Layout(margin="0 0 0 0")
                input_widgets1 = widgets.HBox(
                    [
                        html_model_type,
                        html_sample_weight,
                        html_rej_infer,
                        html_model_name,
                    ],
                    layout=item_layout,
                )
                input_widgets2 = widgets.HBox(
                    [
                        dropdown_protected_feature,
                        html_model_priority,
                        html_model_impact,
                        html_model_concern,
                        html_metric_type,
                    ],
                    layout=item_layout,
                )
                input_widgets = VBox([input_widgets1, input_widgets2])

                top_display = widgets.VBox([input_widgets, metric_box])
                plot_tab = widgets.HBox([plot_output, tab])
                dashboard = widgets.VBox([top_display, plot_tab])
                display(dashboard)
                if FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2] == "ratio":
                    print("Note: The threshold and the values of ratio-based metrics are shifted down by 1.")
            else:
                print("The widget is only available on Jupyter notebook")
        except:
            print("Skipped: Issue encountered in rendering the widget.")

    def _set_feature_mask(self):
        """
        Sets the feature mask for each protected variable based on its privileged group

        Returns
        ----------
        feature_mask : dict of list
                Stores the mask array for every protected variable applied on the x_test dataset.
        """
        feature_mask = {}
        for i in self.model_params[0].p_var:
            prot_var_df = self.model_params[0].protected_features_cols[i]
            privileged_grp = self.model_params[0].p_grp.get(i)[0]  # as p_grp is a list containing a list
            unprivileged_grp = self.model_params[0].up_grp.get(i)[0]
            feature_mask[i] = np.empty(len(prot_var_df))
            feature_mask[i] = -1
            feature_mask[i] = np.where(prot_var_df.isin(privileged_grp), True, -1)
            feature_mask[i] = np.where(prot_var_df.isin(unprivileged_grp), False, feature_mask[i])

        return feature_mask

    def _get_e_lift(self):
        """
        Helper function to get empirical lift

        Returns
        ---------
        None
        """
        return None

    # def _get_confusion_matrix(self, y_true, y_pred, sample_weight, curr_p_var = None, feature_mask = None, **kwargs):
    #     """
    #     Compute confusion matrix

    #     Parameters
    #     ----------
    #     y_true : np.ndarray
    #             Ground truth target values.

    #     y_pred : np.ndarray
    #             Copy of predicted targets as returned by classifier.

    #     sample_weight : array of shape (n_samples,), default=None
    #             Used to normalize y_true & y_pred.

    #     curr_p_var : string, default=None
    #             Current protected variable

    #     feature_mask : dictionary of lists, default = None
    #             Stores the mask array for every protected variable applied on the x_test dataset.

    #     Returns
    #     -------
    #     Confusion matrix metrics based on privileged and unprivileged groups or a list of None if curr_p_var == None
    #     """
    #     #confusion matrix will only run for classification models
    #     if self._model_type_to_metric_lookup[self.model_params[0].model_type][0] == "classification" :

    #         if 'y_true' in kwargs:
    #             y_true = kwargs['y_true']

    #         if 'y_pred' in kwargs:
    #             y_pred = kwargs['y_pred']

    #         if curr_p_var is None:
    #             if y_pred is None:
    #                 return [None] * 4

    #             tn, fp, fn, tp = confusion_matrix(y_true=y_true, y_pred=y_pred, sample_weight=sample_weight).ravel()

    #             return tp, fp, tn, fn
    #         else :
    #             if y_pred is None:
    #                 return [None] * 8

    #             mask = feature_mask[curr_p_var]

    #             if sample_weight is None :
    #                 tn_p, fp_p, fn_p, tp_p = confusion_matrix(y_true=np.array(y_true)[mask], y_pred=np.array(y_pred)[mask]).ravel()
    #                 tn_u, fp_u, fn_u, tp_u  = confusion_matrix(y_true=np.array(y_true)[~mask], y_pred=np.array(y_pred)[~mask]).ravel()
    #             else :
    #                 tn_p, fp_p, fn_p, tp_p = confusion_matrix(y_true=np.array(y_true)[mask], y_pred=np.array(y_pred)[mask], sample_weight = sample_weight[mask]).ravel()
    #                 tn_u, fp_u, fn_u, tp_u  = confusion_matrix(y_true=np.array(y_true)[~mask], y_pred=np.array(y_pred)[~mask], sample_weight = sample_weight[~mask]).ravel()

    #             return tp_p, fp_p, tn_p, fn_p, tp_u, fp_u, tn_u, fn_u
    #     else :
    #         if curr_p_var is None :
    #             return [None] * 4
    #         else :
    #             return [None] * 8

    def _base_input_check(self):
        """
        Checks if there are conflicting input values
        """
        try:
            if FairnessMetrics.map_fair_metric_to_group.get(self.fair_metric_name)[2] == "information":
                if self.fair_threshold > 1:
                    self.err.push(
                        "conflict_error",
                        var_name_a=str(self.fair_metric_name),
                        some_string="conflict with fair_threshold",
                        value="",
                        function_name="_base_input_check",
                    )
                    self.err.pop()
        except TypeError:
            pass

    def _model_type_input(self):
        """
        Checks if model type input is valid
        """

        model_type_exp = self.model_params[0].model_type

        # Check if all model types have the same model_type
        for idx, i in enumerate(self.model_params):
            if i.model_type != model_type_exp:
                self.err.push(
                    "value_error",
                    var_name="model_params[" + str(idx) + "]'s model_type",
                    given=str(i.model_type),
                    expected=model_type_exp,
                    function_name="_model_type_input",
                )

        for i in self.model_params:
            # throw an error if model_type provided is not in _model_type_to_metric_lookup
            if i.model_type not in self._model_type_to_metric_lookup.keys():
                self.err.push(
                    "value_error",
                    var_name="model_type",
                    given=str(i.model_type),
                    expected=list(self._model_type_to_metric_lookup.keys()),
                    function_name="_model_type_input",
                )
                # print any exceptions occured
                self.err.pop()

        if model_type_exp in ["classification", "regression"] and len(self.model_params) != 1:
            self.err.push(
                "value_error",
                var_name="model_type=" + model_type_exp + " model_params length",
                given=len(self.model_params),
                expected=1,
                function_name="_model_type_input",
            )

        if model_type_exp in ["uplift"] and len(self.model_params) != 2:
            self.err.push(
                "value_error",
                var_name="model_type=" + model_type_exp + " model_params length",
                given=len(self.model_params),
                expected=2,
                function_name="_model_type_input",
            )

        model_size = self._model_type_to_metric_lookup[self.model_params[0].model_type][2]
        # check if model_size provided based in model_type provided is accepted as per _model_type_to_metric_lookup
        if model_size > len(self.model_params):
            self.err.push(
                "length_error",
                var_name="model_type",
                given=str(len(self.model_params)),
                expected=str(model_size),
                function_name="_model_type_input",
            )
            # print any exceptions occured
            self.err.pop()
        # check if model_size is -1. If it is only take first set of model_params values
        elif model_size == -1:
            self.model_params = self.model_params[:1]
        else:
            self.model_params = self.model_params[:model_size]

        # check if model_type of first model_container is uplift, the model_name of second model_container should be clone. Otherwise, throw an exception
        if self.model_params[0].model_type == "uplift":
            if self.model_params[1].model_name != "clone":
                self.err.push(
                    "value_error",
                    var_name="model_name",
                    given=str(self.model_params[1].model_name),
                    expected="clone",
                    function_name="_model_type_input",
                )
            # print any exceptions occured
            self.err.pop()

    def _fairness_metric_value_input_check(self):
        """
        Checks if fairness metric value input is valid
        """
        if self.fairness_metric_value_input is not None:
            for i in self.fairness_metric_value_input.keys():
                # if user provided keys are not in protected variables, ignore
                if i not in self.model_params[0].p_var:
                    print("Warning: The fairness_metric_value_input is not provided properly, so it is ignored")
                    self.fairness_metric_value_input = None
                    break
                for j in self.fairness_metric_value_input[i].keys():
                    # if user provided fair metrics are not in fair metrics in use case class, ignore
                    if j not in self._use_case_metrics["fair"]:
                        print("Warning: The fairness_metric_value_input is not provided properly, so it is ignored")
                        self.fairness_metric_value_input = None
                        break

    def check_fair_metric_name(self):
        """
        Checks if primary fairness metric is valid
        """
        if (
            self.fair_metric_name not in FairnessMetrics.map_fair_metric_to_group.keys()
            or FairnessMetrics.map_fair_metric_to_group[self.fair_metric_name][4] is False
        ):
            ratio_parity_metrics = []
            for i, j in FairnessMetrics.map_fair_metric_to_group.items():
                if (
                    j[1] == self._model_type_to_metric_lookup[self.model_params[0].model_type][0]
                    and FairnessMetrics.map_fair_metric_to_group[i][4] is True
                ):
                    ratio_parity_metrics.append(i)
            self.err.push(
                "value_error",
                var_name="fair_metric_name",
                given=self.fair_metric_name,
                expected=ratio_parity_metrics,
                function_name="check_fair_metric_name",
            )
        # print any exceptions occured
        self.err.pop()

    def check_perf_metric_name(self):
        """
        Checks if primary performance metric is valid
        """
        if (
            self.perf_metric_name not in PerformanceMetrics.map_perf_metric_to_group.keys()
            or PerformanceMetrics.map_perf_metric_to_group[self.perf_metric_name][2] is False
        ):
            perf_list = []
            for i, j in PerformanceMetrics.map_perf_metric_to_group.items():
                if (
                    j[1] == self._model_type_to_metric_lookup[self.model_params[0].model_type][0]
                    and PerformanceMetrics.map_perf_metric_to_group[i][2] is True
                ):
                    perf_list.append(i)
            self.err.push(
                "value_error",
                var_name="perf_metric_name",
                given=self.perf_metric_name,
                expected=perf_list,
                function_name="check_perf_metric_name",
            )
        # print any exceptions occured
        self.err.pop()

    def _fairness_tree(self, is_pos_label_favourable=True):
        """
        Sets the feature mask for each protected variable based on its privileged group

        Parameters
        -----------
        is_pos_label_favourable: boolean, default=True
                Whether the pos_label is the favourable label

        Returns
        ----------
        self.fair_metric_name : string
                Fairness metric name
        """
        err_ = []

        map_fair_parity_metric_to_ratio = {
            "equal_opportunity": "equal_opportunity_ratio",
            "fpr_parity": "fpr_ratio",
            "tnr_parity": "tnr_ratio",
            "fnr_parity": "fnr_ratio",
            "ppv_parity": "ppv_ratio",
            "npv_parity": "npv_ratio",
            "fdr_parity": "fdr_ratio",
            "for_parity": "for_ratio",
            "equal_odds": "equal_odds_ratio",
            "neg_equal_odds": "neg_equal_odds_ratio",
            "calibration_by_group": "calibration_by_group_ratio",
            "auc_parity": "auc_ratio",
            "log_loss_parity": "log_loss_ratio",
        }

        if self.fair_concern not in ["eligible", "inclusive", "both"]:
            err_.append(
                [
                    "value_error",
                    "fair_concern",
                    str(self.fair_concern),
                    str(["eligible", "inclusive", "both"]),
                ]
            )

        if self.fair_priority not in ["benefit", "harm"]:
            err_.append(
                [
                    "value_error",
                    "fair_priority",
                    str(self.fair_priority),
                    str(["benefit", "harm"]),
                ]
            )

        if self.fair_impact not in ["significant", "selective", "normal"]:
            err_.append(
                [
                    "value_error",
                    "fair_impact",
                    str(self.fair_impact),
                    str(["significant", "selective", "normal"]),
                ]
            )

        if self.fair_metric_type not in ["difference", "ratio"]:
            err_.append(
                [
                    "value_error",
                    "fair_metric_type",
                    str(self.fair_metric_type),
                    str(["difference", "ratio"]),
                ]
            )

        if err_ != []:
            for i in range(len(err_)):
                self.err.push(
                    err_[i][0],
                    var_name=err_[i][1],
                    given=err_[i][2],
                    expected=err_[i][3],
                    function_name="_fairness_tree",
                )
            self.err.pop()

        if is_pos_label_favourable is True:
            if self.fair_priority == "benefit":
                if self.fair_impact == "normal":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "fpr_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "equal_opportunity"
                    elif self.fair_concern == "both":
                        fair_metric_name = "equal_odds"
                elif self.fair_impact == "significant" or self.fair_impact == "selective":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "fdr_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "ppv_parity"
                    elif self.fair_concern == "both":
                        self.err.push(
                            "conflict_error",
                            var_name_a="fair_concern",
                            some_string="not applicable",
                            value="",
                            function_name="_fairness_tree",
                        )
                        self.err.pop()
            elif self.fair_priority == "harm":
                if self.fair_impact == "normal":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "fpr_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "fnr_parity"
                    elif self.fair_concern == "both":
                        fair_metric_name = "equal_odds"
                elif self.fair_impact == "significant" or self.fair_impact == "selective":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "fdr_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "for_parity"
                    elif self.fair_concern == "both":
                        fair_metric_name = "calibration_by_group"

        else:
            if self.fair_priority == "benefit":
                if self.fair_impact == "normal":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "fnr_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "tnr_parity"
                    elif self.fair_concern == "both":
                        fair_metric_name = "neg_equal_odds"
                elif self.fair_impact == "significant" or self.fair_impact == "selective":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "for_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "npv_parity"
                    elif self.fair_concern == "both":
                        self.err.push(
                            "conflict_error",
                            var_name_a="fairness concern",
                            some_string="not applicable",
                            value="",
                            function_name="_fairness_tree",
                        )
                        self.err.pop()
            elif self.fair_priority == "harm":
                if self.fair_impact == "normal":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "fnr_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "fpr_parity"
                    elif self.fair_concern == "both":
                        fair_metric_name = "equal_odds"
                elif self.fair_impact == "significant" or self.fair_impact == "selective":
                    if self.fair_concern == "inclusive":
                        fair_metric_name = "for_parity"
                    elif self.fair_concern == "eligible":
                        fair_metric_name = "fdr_parity"
                    elif self.fair_concern == "both":
                        fair_metric_name = "calibration_by_group"

        if self.fair_metric_type == "ratio":
            fair_metric_name = map_fair_parity_metric_to_ratio.get(fair_metric_name)

        return fair_metric_name

    def get_prob_calibration_results(self):
        """
        Gets the probability calibration results

        Returns
        ------------
        a dictionary with below keys and values:
            'prob_true': the ground truth values split into 10 bins from 0 to 1
            'prob_pred': the mean predicted probability in each bin
            'score': the brier loss score
        """
        if self.evaluate_status_cali is True:
            return self.perf_metric_obj.result.get("calibration_curve")
        else:
            return None

    def get_perf_metrics_results(self):
        """
        Gets the performance metrics results

        Returns
        ------------
        a dictionary with keys as the metric name and values as the metric value together with confidence interval
        """
        if self.evaluate_status == 1:
            return self.perf_metric_obj.result.get("perf_metric_values")
        else:
            return None

    def get_fair_metrics_results(self):
        """
        Gets the fair metrics results

        Returns
        ------------
        a dictionary with keys as the metric name and values as the metric value together with confidence interval
        """
        if self.evaluate_status == 1:
            result = {}
            for p_var in self.fair_metric_obj.result.keys():
                if p_var != "indiv_fair":
                    result[p_var] = self.fair_metric_obj.result[p_var]["fair_metric_values"]
            return result
        else:
            return None

    def get_tradeoff_results(self):
        """
        Gets the tradeoff results

        Returns
        ------------
        a dictionary with below keys and values:
            protected variable name as key to split result values for each protected variable
            'fair_metric_name': fairness metric name
            'perf_metric_name': performance metric name
            'fair': array of shape (n, n*) of fairness metric values
            'perf': array of shape (n, n*) of performance metric values
            'th_x': array of shape (n*, ) of thresholds on x axis
            'th_y': array of shape (n*, ) of thresholds on y axis
            'max_perf_point': maxiumn performance point on the grid
            'max_perf_single_th': maxiumn performance point on the grid with single threshold
            'max_perf_neutral_fair': maxiumn performance point on the grid with neutral fairness
            *n is defined by tradeoff_threshold_bins in config
        """
        if self.tradeoff_status == 1:
            return self.tradeoff_obj.result
        else:
            return None

    def get_loo_results(self):
        """
        Gets the leave one out analysis results

        Returns
        ------------
        a dictionary with below keys and values:
            protected variable name as key to split fairness result on each protected variable
            protected variable name as key to denote the removed protected variable
            array values denote the performance metric value, fariness metric value, fairness conclusion and suggestion
        """
        if self.feature_imp_status_loo is True:
            return self.feature_imp_values
        else:
            return None

    def get_correlation_results(self):
        """
        Gets the correlation analysis results

        Returns
        ------------
        a dictionary with below keys and values:
            'feature_names': feature names for correlation analysis
            'corr_values': correlation values according to feature names
        """
        if self.feature_imp_status_corr is True:
            return self.correlation_output
        else:
            return None

    def _get_confusion_matrix_optimized(self, y_true, y_pred, sample_weight, curr_p_var=None, feature_mask=None):
        """
        Compute confusion matrix

        Parameters
        ----------
        y_true : numpy.ndarray
                Ground truth target values.

        y_pred : numpy.ndarray
                Copy of predicted targets as returned by classifier.

        sample_weight : numpy.ndarray
                Used to normalize y_true & y_pred.

        curr_p_var : string, default=None
                Current protected variable

        feature_mask : dict of list, default = None
                Stores the mask array for every protected variable applied on the x_test dataset.

        Returns
        -------
        Confusion matrix metrics based on privileged and unprivileged groups or for the entire dataset
        """
        nan_array = np.array([None] * y_true.shape[0]).reshape(-1, 1)

        if sample_weight is None or None in sample_weight:
            sample_weight = np.ones(y_true.shape)
        if self._model_type_to_metric_lookup[self.model_params[0].model_type][0] == "classification":
            correct = (y_true == y_pred) * 1
            incorrect = 1 - correct

            if hasattr(self, "_rejection_inference_flag"):
                rejection_inference_filter = {
                    k: v for k, v in getattr(self, "_rejection_inference_flag").items() if v is True
                }
            else:
                rejection_inference_filter = None

            if curr_p_var is None:
                if y_pred is None:
                    return nan_array, nan_array, nan_array, nan_array
                elif rejection_inference_filter is not None and len(rejection_inference_filter) > 0:
                    tp = np.sum(correct * y_true, axis=2)
                    fp = np.sum(incorrect * (1 - y_true), axis=2)
                    M = (
                        self.spl_params["num_applicants"][list(rejection_inference_filter.keys())[0]][0]
                        + self.spl_params["num_applicants"][list(rejection_inference_filter.keys())[0]][1]
                    )
                    fn = M * (1 - self.common_base_default_rate) - tp
                    tn = M * (self.common_base_default_rate) - fp
                    return tp, fp, tn, fn
                else:
                    tp = np.sum(correct * y_true * sample_weight, 2)
                    fp = np.sum(incorrect * (1 - y_true * sample_weight), 2)
                    tn = np.sum(correct * (1 - y_true * sample_weight), 2)
                    fn = np.sum(incorrect * y_true * sample_weight, 2)
                    return tp, fp, tn, fn

            else:
                if y_pred is None:
                    return (
                        nan_array,
                        nan_array,
                        nan_array,
                        nan_array,
                        nan_array,
                        nan_array,
                        nan_array,
                        nan_array,
                    )
                else:
                    mask = feature_mask[curr_p_var]  # 1=privileged, 0=otherwise
                    maskFilter = mask != -1  # to remove rows which don't belong to privileged or unprivileged groups
                    # privileged group
                    tp_p = np.sum(
                        correct * y_true * mask * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )
                    fp_p = np.sum(
                        incorrect * (1 - y_true) * mask * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )
                    tn_p = np.sum(
                        correct * (1 - y_true) * mask * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )
                    fn_p = np.sum(
                        incorrect * y_true * mask * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )
                    # unprivileged group
                    tp_u = np.sum(
                        correct * y_true * (1 - mask) * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )
                    fp_u = np.sum(
                        incorrect * (1 - y_true) * (1 - mask) * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )
                    tn_u = np.sum(
                        correct * (1 - y_true) * (1 - mask) * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )
                    fn_u = np.sum(
                        incorrect * y_true * (1 - mask) * sample_weight,
                        axis=2,
                        where=maskFilter,
                    )

                    if rejection_inference_filter is not None and self._rejection_inference_flag[curr_p_var] is True:
                        fn_p = (
                            self.spl_params["num_applicants"][curr_p_var][0]
                            * (1 - self.spl_params["base_default_rate"][curr_p_var][0])
                            - tp_p
                        )
                        tn_p = (
                            self.spl_params["num_applicants"][curr_p_var][0]
                            * self.spl_params["base_default_rate"][curr_p_var][0]
                            - fp_p
                        )
                        fn_u = (
                            self.spl_params["num_applicants"][curr_p_var][1]
                            * (1 - self.spl_params["base_default_rate"][curr_p_var][1])
                            - tp_u
                        )
                        tn_u = (
                            self.spl_params["num_applicants"][curr_p_var][1]
                            * self.spl_params["base_default_rate"][curr_p_var][1]
                            - fp_u
                        )
                        return tp_p, fp_p, tn_p, fn_p, tp_u, fp_u, tn_u, fn_u
                    else:
                        return tp_p, fp_p, tn_p, fn_p, tp_u, fp_u, tn_u, fn_u

        else:
            if curr_p_var is None:
                return nan_array, nan_array, nan_array, nan_array
            else:
                return (
                    nan_array,
                    nan_array,
                    nan_array,
                    nan_array,
                    nan_array,
                    nan_array,
                    nan_array,
                    nan_array,
                )

    def deepcopy_model_obj(self):
        """
        Performs a deep copy of model_object in model_params while keeping the rest as a shallow copy.
        """
        model_objects = []
        for i in range(len(self.model_params)):
            model_param = copy.copy(self.model_params[i])
            model_obj = getattr(model_param, "model_object")
            setattr(model_param, "model_object", deepcopy(model_obj))
            model_objects.append(model_param.model_object)
        return model_objects

    def check_label_data_for_model_type(self):
        """
        Performs a check on label values in user inputs against the usecase's specified model_type.
        """
        err_ = []
        successMsg = "label data check completed without issue"

        for idx, mdl in enumerate(self.model_params):
            model_params_len = self._model_type_to_metric_lookup.get(mdl.model_type)[2]
            label_size = self._model_type_to_metric_lookup.get(mdl.model_type)[1]

            # Check pos_label not None for classification use cases, except for base_classification which supports multi-class
            if label_size > 0 and mdl.pos_label is None:
                err_.append(["value_error", "pos_label", mdl.pos_label, set(mdl.y_true)])

            # If neg_label not specified deduce from pos_label
            if mdl.y_true is not None and mdl.pos_label is not None and mdl.neg_label is None:
                neg_labels = list(mdl.y_true_labels - set(mdl.pos_label))
            else:
                neg_labels = mdl.neg_label

            # Skip check for regression (which doesn't have the concept of labels)
            if label_size != -1:
                # pos_label and neg_label checks
                # Skip check for base_classification (which supports any number of labels)
                if label_size > 0 and mdl.pos_label is not None and mdl.neg_label is not None:
                    given_label_size = len(mdl.pos_label) + len(neg_labels)
                    if given_label_size != label_size:
                        err_.append(
                            [
                                "length_error",
                                "expected labels size",
                                given_label_size,
                                str(label_size),
                            ]
                        )
                    if len(mdl.pos_label) == 0:
                        err_.append(["length_error", "pos_label", "0", ">= 1"])
                    if len(neg_labels) == 0:
                        err_.append(["length_error", "pos_label", "0", ">= 1"])
                # y data checks
                if mdl.y_true is not None:
                    if len(mdl.y_true_labels) < label_size:
                        err_.append(
                            [
                                "length_error",
                                "y_true label length in model_params[" + str(idx) + "]",
                                len(mdl.y_true_labels),
                                ">=" + str(label_size),
                            ]
                        )
                if mdl.y_train is not None:
                    if len(mdl.y_train_labels) < label_size:
                        err_.append(
                            [
                                "length_error",
                                "y_train label length in model_params[" + str(idx) + "]",
                                len(mdl.y_train_labels),
                                ">=" + str(label_size),
                            ]
                        )
                if mdl.y_pred is not None:
                    if len(mdl.y_pred_labels) < label_size:
                        err_.append(
                            [
                                "length_error",
                                "y_pred label length in model_params[" + str(idx) + "]",
                                len(mdl.y_pred_labels),
                                ">=" + str(label_size),
                            ]
                        )

            if err_ == []:
                return successMsg
            else:
                for i in range(len(err_)):
                    self.err.push(
                        err_[i][0],
                        var_name=err_[i][1],
                        given=err_[i][2],
                        expected=err_[i][3],
                        function_name="check_label_data_for_model_type",
                    )
            self.err.pop()

    def _check_input(self):
        """
        Wrapper function to perform all checks using dictionaries of datatypes & dictionary of values.
        This function does not return any value. Instead, it raises an error when any of the checks from the Utility class fail.
        """

        # check label values in model_params against the usecase's specified model_type info.
        self.check_label_data_for_model_type()

        # check datatype of input variables to ensure they are of the correct datatype
        check_datatype(self)

        # check datatype of input variables to ensure they are reasonable
        check_value(self)

        # check for model_params
        mp_given = len(self.model_params)
        mp_expected = self._model_type_to_metric_lookup[self.model_params[0].model_type][2]
        if mp_given != mp_expected:
            self.err.push(
                "length_error",
                var_name="model_params",
                given=str(mp_given),
                expected=str(mp_expected),
                function_name="_check_input",
            )

        # check for conflicting input values
        self._base_input_check()

        # check if input variables will the correct fair_metric_name based on fairness tree
        self._fairness_metric_value_input_check()

        # check if y_pred is not None
        if self.model_params[0].y_pred is None:
            self.err.push(
                "type_error",
                var_name="y_pred",
                given="type None",
                expected="type [list, np.ndarray, pd.Series]",
                function_name="_check_input",
            )

        # check if y_prob is float
        if self.model_params[0].y_prob is not None:
            if self.model_params[0].y_prob.dtype.kind == "i":
                self.err.push(
                    "type_error",
                    var_name="y_prob",
                    given="type int",
                    expected="type float",
                    function_name="_check_input",
                )

    def _select_fairness_metric_name(self):
        """
        Retrieves the fairness metric name based on the values of model_type, fair_concern, fair_impact, fair_priority and fair_metric_type.
        Name of the primary fairness metric to be used for computations in the evaluate() and/or compile() functions
        """
        if self.fair_metric_name == "auto":
            self.fair_metric_name = self._fairness_tree(self.fair_is_pos_label_fav)
        else:
            self.fair_metric_name

    def _set_up_fairness(self):
        """
        Set up fairness diagnosis for new use case creation.
        """
        self.e_lift = None
        self.pred_outcome = None
        self._check_input()
        self._check_non_policy_p_var_min_samples()
        self._auto_assign_p_up_groups()
        self.feature_mask = self._set_feature_mask()

    def _check_binary_restriction(self, model_num=0):
        """
        Checks whether pos_label, neg_label inputs meet the binary requirement for specified use cases.

        Parameters
        ----------------
        model_num : int, default=0
                Allow model to be specified for binary restriction check

        Returns:
        ---------------
        successMsg : str
                If there are no errors, a success message will be returned
        """
        err = VeritasError()
        err_ = []
        successMsg = "binary restriction check completed without issue"
        model_type = self.model_params[model_num].model_type
        pos_label = self.model_params[model_num].pos_label
        neg_label = self.model_params[model_num].neg_label
        pos_label_size = len(pos_label)
        neg_label_size = len(neg_label) if neg_label is not None else 1

        if model_type != "uplift":
            if pos_label_size != 1 or neg_label_size != 1:
                print("Use case expects binary only. For multi-class use cases, consider using base_classification.")

            if model_type == "classification":
                if neg_label is not None:
                    if neg_label_size != 1:
                        err_.append(
                            [
                                "length_error",
                                "neg_label binary label",
                                str(neg_label_size),
                                "1",
                            ]
                        )
                if pos_label_size != 1:
                    err_.append(
                        [
                            "length_error",
                            "pos_label binary label",
                            str(pos_label_size),
                            "1",
                        ]
                    )

        if err_ == []:
            return successMsg
        else:
            for i in range(len(err_)):
                err.push(
                    err_[i][0],
                    var_name=err_[i][1],
                    given=err_[i][2],
                    expected=err_[i][3],
                    function_name="_check_binary_restriction",
                )
            err.pop()

    def _model_data_processing(self):
        """
        Processes the data in the model container for each model in model_params.

        This method checks for unassigned labels in pos_label and neg_label for multi-class classification models,
        converts y_prob to nx1 array if model_type is classification if y_prob is not nx1,
        and removes unassigned labels in y_true, y_pred, y_prob, x_test, protected_features_cols.
        """
        for model in self.model_params:
            if model._model_data_processing_flag:
                continue

            if model.neg_label is None and model.pos_label is not None and model.y_true is not None:
                model.neg_label = list(set(model.y_true) - set(model.pos_label))

            if model.y_true is not None and model.model_type == "classification" and model.unassigned_y_label[0]:
                if len(model.y_true.shape) == 1 and model.y_true.dtype.kind in [
                    "i",
                    "O",
                    "U",
                ]:
                    model.y_true, model.pos_label2 = self._check_label(
                        model.y_true, model.pos_label, model.neg_label, obj_in=model
                    )
                if (
                    model.y_pred is not None
                    and len(model.y_pred.shape) == 1
                    and model.y_pred.dtype.kind in ["i", "O", "U"]
                ):
                    model.y_pred, model.pos_label2 = self._check_label(
                        model.y_pred,
                        model.pos_label,
                        model.neg_label,
                        obj_in=model,
                        y_pred_flag=True,
                    )
                # Remove unassigned labels in y_true, y_pred, y_prob, x_test, protected_features_cols
                (
                    model.y_true,
                    model.y_pred,
                    model.y_prob,
                    model.x_test,
                    model.protected_features_cols,
                ) = check_data_unassigned(model)

            else:
                if (
                    model.y_true is not None
                    and len(model.y_true.shape) == 1
                    and model.y_true.dtype.kind in ["i", "O", "U"]
                ):
                    model.y_true, model.pos_label2 = self._check_label(
                        model.y_true, model.pos_label, model.neg_label, obj_in=model
                    )
                if (
                    model.y_pred is not None
                    and len(model.y_pred.shape) == 1
                    and model.y_pred.dtype.kind in ["i", "O", "U"]
                ):
                    model.y_pred, model.pos_label2 = self._check_label(
                        model.y_pred,
                        model.pos_label,
                        model.neg_label,
                        obj_in=model,
                        y_pred_flag=True,
                    )

            # Convert y_prob to nx1 array if model_type is classification and y_prob is not nx1
            if (
                model.y_prob is not None
                and model.model_type == "classification"
                and len(model.y_prob.shape) > 1
                and model.y_prob.shape[1] > 1
            ):
                model.y_prob = process_y_prob(model.classes_, model.y_prob, model.pos_label, model.neg_label)

    def _check_label(self, y, pos_label, neg_label=None, obj_in=None, y_pred_flag=False):
        """
        Creates copy of y_true as y_true_bin and convert favourable labels to 1 and unfavourable to 0 for non-uplift models.
        Overwrites y_pred with the conversion, if `y_pred_flag` is set to True.
        Checks if pos_labels are inside y

        Parameters
        -----------
        y : numpy.ndarray
                Ground truth target values.

        pos_label : list
                Label values which are considered favorable.
                For all model types except uplift, converts the favourable labels to 1 and others to 0.
                For uplift, user is to provide 2 label names e.g. [["a"], ["b"]] in fav label. The first will be mapped to treatment responded (TR) & second to control responded (CR).

        neg_label : list, default=None
                Label values which are considered unfavorable.
                neg_label will only be used in uplift models.
                For uplift, user is to provide 2 label names e.g. [["c"], ["d"]] in unfav label. The first will be mapped to treatment rejected (TR) & second to control rejected (CR).

        obj_in : object, default=None
                The object of the model_container class.

        y_pred_flag : boolean, default=False
                Flag to indicate if `y` is y_pred. Also, y_pred will be processed if there are unassigned labels in pos_label and neg_label.

        Returns
        -----------------
        y_bin : list
                Encoded labels.

        pos_label2 : list
                Label values which are considered favorable.
        """
        err = VeritasError()
        err_ = []

        if pos_label is None:
            return y, pos_label

        y_bin = y
        if y_pred_flag and obj_in.unassigned_y_label[0]:
            y_bin = check_data_unassigned(obj_in, y_bin, y_pred_negation_flag=True)

        else:
            row = np.isin(y_bin, pos_label)
            if not y_pred_flag:
                if sum(row) == len(y_bin):
                    err_.append(
                        [
                            "value_error",
                            "pos_label",
                            pos_label,
                            "not all y_true labels as pos_label",
                        ]
                    )
                elif sum(row) == 0:
                    err_.append(["value_error", "pos_label", pos_label, set(y_bin)])
                for i in range(len(err_)):
                    err.push(
                        err_[i][0],
                        var_name=err_[i][1],
                        given=err_[i][2],
                        expected=err_[i][3],
                        function_name="_check_label",
                    )
            y_bin[row] = 1
            y_bin[~row] = 0

        pos_label2 = [[1]]
        y_bin = y_bin.astype(np.int8)

        err.pop()

        return y_bin, pos_label2

    def _check_data_dependency(self):
        """
        Check data input dependency for each API function during `ModelContainer()` initialization before `compile()` is run

        Returns
        -------
        disable_compile : list
                A list containing the API functions that will be disabled in `compile`
        """
        disable_compile = []
        if self.feature_mask is None or self.model_params[0].y_true is None:
            self.evaluate_status = -1
            disable_compile.append("evaluate")
        if self.model_params[0].model_type != "uplift" and self.model_params[0].y_pred is None:
            self.evaluate_status = -1
            disable_compile.append("evaluate")
        if (
            self.model_params[0].y_prob is None
            or self.model_params[0].y_true is None
            or self.feature_mask is None
            or self.model_params[0].pos_label is None
        ):
            self.tradeoff_status = -1
            disable_compile.append("tradeoff")
        if (
            self.model_params[0].model_object is None
            or self.model_params[0].x_train is None
            or self.model_params[0].y_train is None
        ):
            self.feature_imp_status = -1
            disable_compile.append("feature_importance")
        return disable_compile

    def _input_parameter_compile_processing(self, disable=[]):
        """
        Validate and process the `disable` input parameter for the `compile` API function.

        Parameters
        ----------
        disable : list
                A list of strings where each string represents the API function name and a list of disabled features for the API function specified by user,
                separated by the `>` symbol. Multiple disabled features can be joined using `|` symbol.

        Returns
        -------
        dict_map : dict
                A dictionary containing the parsed and validated `disable` input parameter.
        """
        err = VeritasError()
        err_ = []

        if disable is None:
            return None

        # Check if disable is list type
        if not isinstance(disable, list):
            err_.append(["type_error", "disable", str(type(disable)), "list"])
        else:
            dict_map = {}
            for item in disable:
                # Check that elements inside list are string type
                if not isinstance(item, str):
                    err_.append(["type_error", "values in disable", str(type(item)), "str"])
                else:
                    # Check that if string contains "|", then it must also contain ">"
                    if "|" in item and ">" not in item:
                        err_.append(
                            [
                                "value_error",
                                "values in disable",
                                item,
                                "string to contain '>' if it contains '|' pipe",
                            ]
                        )
                    # Check that it should only contain "|" or ">" symbols but not any other symbols.
                    elif re.match("^[a-zA-Z0-9_]*(>[a-zA-Z0-9_]*(\|[a-zA-Z0-9_]+)*)?$", item) is None:
                        err_.append(
                            [
                                "value_error",
                                "values in disable",
                                item,
                                "string to contain '|' and/or '>' characters only",
                            ]
                        )
                    else:
                        # Check that there should only be 1 ">" if present
                        if item.count(">") > 1:
                            err_.append(
                                [
                                    "value_error",
                                    "values in disable",
                                    item,
                                    "string to contain only one '>'",
                                ]
                            )
                        else:
                            api, *features = item.split(">")
                            features = set(features[0].split("|")) if features else set()
                            dict_map[api] = features

        if err_:
            for i in range(len(err_)):
                err.push(
                    err_[i][0],
                    var_name=err_[i][1],
                    given=err_[i][2],
                    expected=err_[i][3],
                    function_name="_input_parameter_compile_processing",
                )
            err.pop()
            return None

        return dict_map


class NpEncoder(json.JSONEncoder):
    """
    Saves the errors to a template message depending on their error type to an initialised list
    """

    def default(self, obj):
        """
        Parameters
        ------------
        obj : object
        """
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)
