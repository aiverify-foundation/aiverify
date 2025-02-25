import concurrent.futures
from copy import deepcopy
from itertools import product

import numpy as np
import pandas as pd
from numpy import ma
from scipy.stats import entropy
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    mean_absolute_percentage_error,
    mean_squared_error,
)
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelBinarizer, OrdinalEncoder

from ..metrics import NewMetric, newmetric
from ..util.utility import check_multiprocessing


class FairnessMetrics:
    """
    Class that computes all the fairness metrics

    Class Attributes
    ----------
    map_fair_metric_to_group : dict
        Maps the fairness metrics to its name, metric_group (classification, uplift, or regression), type (difference or ratio), whether the metric is related to tradeoff, whether the metric can be a primary metric,
        short-form name, equivalent performance metric, direction of the perf metric i.e., whether a `higher` metric value indicates better model performance (higher, lower), and its dependency on y_pred/y_prob.
        e.g. {'equal_opportunity': ('Equal Opportunity', 'classification', 'difference', True, True, 'Equal Oppo', 'y_pred'), 'equal_odds': ('Equalized Odds', 'classification', 'difference', True, True, 'Equal Odds', 'balanced_acc', 'higher', 'y_pred')}

    map_indiv_fair_metric_to_group : dict
        Maps the individual fairness metrics to its name and metric_group.
        e.g., {'consistency_score': ('Consistency Score', 'classification')}
    """

    map_fair_metric_to_group = {
        "disparate_impact": (
            "Disparate Impact",
            "classification",
            "ratio",
            True,
            True,
            "Disp Impact",
            "selection_rate",
            "higher",
            "y_pred",
        ),
        "demographic_parity": (
            "Demographic Parity",
            "classification",
            "difference",
            True,
            True,
            "Demo Parity",
            "selection_rate",
            "higher",
            "y_pred",
        ),
        "equal_opportunity": (
            "Equal Opportunity",
            "classification",
            "difference",
            True,
            True,
            "Equal Oppo",
            "recall",
            "higher",
            "y_pred",
        ),
        "fpr_parity": (
            "False Positive Rate Parity",
            "classification",
            "difference",
            True,
            True,
            "FPR Parity",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "tnr_parity": (
            "True Negative Rate Parity",
            "classification",
            "difference",
            True,
            True,
            "TNR Parity",
            "tnr",
            "higher",
            "y_pred",
        ),
        "fnr_parity": (
            "False Negative Rate Parity",
            "classification",
            "difference",
            True,
            True,
            "FNR Parity",
            "fnr",
            "higher",
            "y_pred",
        ),
        "ppv_parity": (
            "Positive Predictive Parity",
            "classification",
            "difference",
            True,
            True,
            "PPV Parity",
            "precision",
            "higher",
            "y_pred",
        ),
        "npv_parity": (
            "Negative Predictive Parity",
            "classification",
            "difference",
            True,
            True,
            "NPV Parity",
            "npv",
            "higher",
            "y_pred",
        ),
        "fdr_parity": (
            "False Discovery Rate Parity",
            "classification",
            "difference",
            True,
            True,
            "FDR Parity",
            "recall",
            "higher",
            "y_pred",
        ),
        "for_parity": (
            "False Omission Rate Parity",
            "classification",
            "difference",
            True,
            True,
            "FOR Parity",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "equal_odds": (
            "Equalized Odds",
            "classification",
            "difference",
            True,
            True,
            "Equal Odds",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "neg_equal_odds": (
            "Negative Equalized Odds",
            "classification",
            "difference",
            True,
            True,
            "Neg Equal Odds",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "calibration_by_group": (
            "Calibration by Group",
            "classification",
            "difference",
            True,
            True,
            "Cali By Group",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "auc_parity": (
            "AUC Parity",
            "classification",
            "difference",
            False,
            True,
            "AUC Parity",
            "roc_auc",
            "higher",
            "y_prob",
        ),
        "log_loss_parity": (
            "Log-loss Parity",
            "classification",
            "difference",
            False,
            True,
            "Log-loss Parity",
            "log_loss",
            "lower",
            "y_prob",
        ),
        "equal_opportunity_ratio": (
            "Equal Opportunity Ratio",
            "classification",
            "ratio",
            True,
            True,
            "Equal Opp Ratio",
            "recall",
            "higher",
            "y_pred",
        ),
        "fpr_ratio": (
            "False Positive Rate Ratio",
            "classification",
            "ratio",
            True,
            True,
            "FPR Ratio",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "tnr_ratio": (
            "True Negative Rate Ratio",
            "classification",
            "ratio",
            True,
            True,
            "TNR Ratio",
            "tnr",
            "higher",
            "y_pred",
        ),
        "fnr_ratio": (
            "False Negative Rate Ratio",
            "classification",
            "ratio",
            True,
            True,
            "FNR Ratio",
            "fnr",
            "higher",
            "y_pred",
        ),
        "ppv_ratio": (
            "Positive Predictive Ratio",
            "classification",
            "ratio",
            True,
            True,
            "PPV Ratio",
            "precision",
            "higher",
            "y_pred",
        ),
        "npv_ratio": (
            "Negative Predictive Ratio",
            "classification",
            "ratio",
            True,
            True,
            "NPV Ratio",
            "npv",
            "higher",
            "y_pred",
        ),
        "fdr_ratio": (
            "False Discovery Rate Ratio",
            "classification",
            "ratio",
            True,
            True,
            "FDR Ratio",
            "recall",
            "higher",
            "y_pred",
        ),
        "for_ratio": (
            "False Omission Rate Ratio",
            "classification",
            "ratio",
            True,
            True,
            "FOR Ratio",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "equal_odds_ratio": (
            "Equalized Odds Ratio",
            "classification",
            "ratio",
            True,
            True,
            "Equalized OR",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "neg_equal_odds_ratio": (
            "Negative Equalized Odds Ratio",
            "classification",
            "ratio",
            True,
            True,
            "Neg Equalized OR",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "calibration_by_group_ratio": (
            "Calibration by Group Ratio",
            "classification",
            "ratio",
            True,
            True,
            "Cali By Group Ratio",
            "balanced_acc",
            "higher",
            "y_pred",
        ),
        "auc_ratio": (
            "AUC Ratio",
            "classification",
            "ratio",
            False,
            True,
            "AUC Ratio",
            "roc_auc",
            "higher",
            "y_prob",
        ),
        "log_loss_ratio": (
            "Log-loss Ratio",
            "classification",
            "ratio",
            False,
            True,
            "Log-loss Ratio",
            "log_loss",
            "lower",
            "y_prob",
        ),
        "mi_independence": (
            "Mutual Information Independence",
            "classification",
            "information",
            False,
            False,
            "MI Independence",
            None,
            None,
            "y_pred",
        ),
        "mi_separation": (
            "Mutual Information Separation",
            "classification",
            "information",
            False,
            False,
            "MI Separation",
            None,
            None,
            "y_pred",
        ),
        "mi_sufficiency": (
            "Mutual Information Sufficiency",
            "classification",
            "information",
            False,
            False,
            "MI Sufficiency",
            None,
            None,
            "y_pred",
        ),
        "rmse_parity": (
            "Root Mean Squared Error Parity",
            "regression",
            "difference",
            False,
            True,
            "RMSE Parity",
            "rmse",
            "lower",
            "y_pred",
        ),
        "mape_parity": (
            "Mean Absolute Percentage Error Parity",
            "regression",
            "difference",
            False,
            True,
            "MAPE Parity",
            "mape",
            "lower",
            "y_pred",
        ),
        "wape_parity": (
            "Weighted Absolute Percentage Error Parity",
            "regression",
            "difference",
            False,
            True,
            "WAPE Parity",
            "wape",
            "lower",
            "y_pred",
        ),
        "rmse_ratio": (
            "Root Mean Squared Error Ratio",
            "regression",
            "ratio",
            False,
            True,
            "RMSE Ratio",
            "rmse",
            "lower",
            "y_pred",
        ),
        "mape_ratio": (
            "Mean Absolute Percentage Error Ratio",
            "regression",
            "ratio",
            False,
            True,
            "MAPE Ratio",
            "mape",
            "lower",
            "y_pred",
        ),
        "wape_ratio": (
            "Weighted Absolute Percentage Error Ratio",
            "regression",
            "ratio",
            False,
            True,
            "WAPE Ratio",
            "wape",
            "lower",
            "y_pred",
        ),
        "rejected_harm": (
            "Harm from Rejection",
            "uplift",
            "difference",
            True,
            True,
            "Rejected Harm",
            "emp_lift",
            "higher",
            "y_prob",
        ),
        "acquire_benefit": (
            "Benefit from Acquiring",
            "uplift",
            "difference",
            False,
            True,
            "Acquire Benefit",
            "emp_lift",
            "higher",
            "y_prob",
        ),
    }

    map_indiv_fair_metric_to_group = {
        "consistency_score": ("Consistency Score", "classification"),
    }

    @staticmethod
    def add_user_defined_metrics():
        # to get cutomized metrics inherited from NewMetric class
        for metric in newmetric.NewMetric.__subclasses__():
            if metric.enable_flag is True and metric.metric_type == "fair":
                FairnessMetrics.map_fair_metric_to_group[metric.metric_name] = (
                    metric.metric_definition,
                    metric.metric_group,
                    metric.metric_difference_ratio,
                    False,
                    True,
                    metric.metric_short_name,
                    metric.metric_equiv_perf_metric,
                    metric.metric_direction,
                    metric.metric_reqt,
                )

    def __init__(self, use_case_object):
        """
        Parameters
        ------------------------
        use_case_object : object
                Object is initialised in use case classes.

        Instance Attributes
        ------------------------
        map_fair_metric_to_method : dict
                Maps the fairness metrics to the corresponding compute functions.
                e.g. {'equal_opportunity': _compute_equal_opportunity, 'equal_odds': _compute_equal_odds}

        map_fair_metric_to_method_optimized : dict
                Maps the fairness metrics to the corresponding optimized compute functions.

        map_indiv_fair_metric_to_method : dict
                Maps the individual fairness metrics to the corresponding optimized compute functions.

        result : dict of tuple, default=None
                Data holder that stores the following for every protected variable:
                - fairness metric value, corresponding confidence interval & neutral position for all fairness metrics.
                - feature distribution

        y_true : numpy.ndarray, default=None
                Ground truth target values.

        y_pred : numpy.ndarray, default=None
                Predicted targets as returned by classifier.

        y_train :numpy.ndarray, default=None
                Ground truth for training data.

        y_prob : numpy.ndarray, default=None
                Predicted probabilities as returned by classifier.
                For uplift models, L = 4. Else, L = 1 where shape is (n_samples, L)

        feature_mask : numpy.ndarray, default=None
                Array of the masked protected variable according to the privileged and unprivileged groups.

        sample_weight : numpy.ndarray, default=None
                Used to normalize y_true & y_pred.

        p_var : list, default=None
                List of protected variables used for fairness analysis.

        fair_metric_name: str, default=None
                Name of the primary fairness metric to be used for computations in the evaluate() and/or compile() functions

        _use_case_metrics: dict of list, default=None
                Contains all the performance & fairness metrics for each use case.
                {"fair ": ["fnr_parity", ...], "perf": ["balanced_accuracy, ..."]}
                Dynamically assigned during initialisation by using the _metric_group_map in Fairness/Performance Metrics class and the _model_type_to_metric above.
        """
        self.map_fair_metric_to_method = {
            "rmse_parity": self._compute_rmse_parity,
            "mape_parity": self._compute_mape_parity,
            "wape_parity": self._compute_wape_parity,
            "rmse_ratio": self._compute_rmse_ratio,
            "mape_ratio": self._compute_mape_ratio,
            "wape_ratio": self._compute_wape_ratio,
            "rejected_harm": self._compute_rejected_harm,
            "acquire_benefit": self._compute_benefit_from_acquiring,
        }

        self.map_fair_metric_to_method_optimized = {
            "disparate_impact": self._compute_disparate_impact,
            "demographic_parity": self._compute_demographic_parity,
            "equal_opportunity": self._compute_equal_opportunity,
            "fpr_parity": self._compute_fpr_parity,
            "tnr_parity": self._compute_tnr_parity,
            "fnr_parity": self._compute_fnr_parity,
            "ppv_parity": self._compute_positive_predictive_parity,
            "npv_parity": self._compute_negative_predictive_parity,
            "fdr_parity": self._compute_false_discovery_rate_parity,
            "for_parity": self._compute_false_omission_rate_parity,
            "equal_odds": self._compute_equalized_odds,
            "neg_equal_odds": self._compute_negative_equalized_odds,
            "calibration_by_group": self._compute_calibration_by_group,
            "auc_parity": self._compute_auc_parity,
            "log_loss_parity": self._compute_log_loss_parity,
            "equal_opportunity_ratio": self._compute_equal_opportunity_ratio,
            "fpr_ratio": self._compute_fpr_ratio,
            "tnr_ratio": self._compute_tnr_ratio,
            "fnr_ratio": self._compute_fnr_ratio,
            "ppv_ratio": self._compute_positive_predictive_ratio,
            "npv_ratio": self._compute_negative_predictive_ratio,
            "fdr_ratio": self._compute_false_discovery_rate_ratio,
            "for_ratio": self._compute_false_omission_rate_ratio,
            "equal_odds_ratio": self._compute_equalized_odds_ratio,
            "neg_equal_odds_ratio": self._compute_negative_equalized_odds_ratio,
            "calibration_by_group_ratio": self._compute_calibration_by_group_ratio,
            "auc_ratio": self._compute_auc_ratio,
            "log_loss_ratio": self._compute_log_loss_ratio,
            "mi_independence": self._compute_mi_independence,
            "mi_separation": self._compute_mi_separation,
            "mi_sufficiency": self._compute_mi_sufficiency,
        }

        self.map_indiv_fair_metric_to_method = {"consistency_score": self._consistency_score}

        # to get cutomized metrics inherited from NewMetric class
        for metric in NewMetric.__subclasses__():
            if metric.enable_flag is True and metric.metric_type == "fair":
                self.map_fair_metric_to_method[metric.metric_name] = metric.compute
                self.map_fair_metric_to_group[metric.metric_name] = (
                    metric.metric_definition,
                    metric.metric_group,
                    metric.metric_difference_ratio,
                    False,
                    True,
                    metric.metric_short_name,
                    metric.metric_equiv_perf_metric,
                    metric.metric_direction,
                    metric.metric_reqt,
                )
                if metric.metric_name not in use_case_object._use_case_metrics["fair"]:
                    use_case_object._use_case_metrics["fair"].append(metric.metric_name)

        self.result = {}
        self.y_true = None
        self.y_prob = None
        self.y_pred = None
        self.feature_mask = None
        self.p_var = None
        self.sample_weight = None
        self.fair_metric_name = None
        self._use_case_metrics = None
        self.use_case_object = use_case_object

    def _check_y_prob_pred(self):
        """
        Checks fairness metric depedency on y_pred or y_prob, and raises error if mismatched.
        """
        if (
            self.fair_metric_name is not None
            and FairnessMetrics.map_fair_metric_to_group[self.fair_metric_name][8] == "y_prob"
            and self.model_params[0].y_prob is None
        ):
            self.err.push(
                "value_error",
                var_name="fair_metric_name",
                given=self.fair_metric_name,
                expected="y_prob",
                function_name="_check_y_prob_pred",
            )
            self.err.pop()
        if (
            self.fair_metric_name is not None
            and FairnessMetrics.map_fair_metric_to_group[self.fair_metric_name][8] == "y_pred"
            and self.model_params[0].y_pred is None
        ):
            self.err.push(
                "value_error",
                var_name="fair_metric_name",
                given=self.fair_metric_name,
                expected="y_pred",
                function_name="_check_y_prob_pred",
            )
            self.err.pop()

    def execute_all_fair(self, n_threads, seed, eval_pbar, disable=[]):
        """
        Computes every fairness metric named inside the include_metrics list together with its associated confidence interval (dictionary), the privileged group metric value & the neutral position.

        Parameters
        ----------
        use_case_object : object
                A single initialized Fairness use case object (CreditScoring, CustomerMarketing, etc.)

        n_threads : int
                Number of currently active threads of a job

        seed : int
                Used to initialize the random number generator.

        eval_pbar : tqdm object
                Progress bar

        disable : list
                Option to disable individual fairness used in evaluate() method, i.e., disable=[‘individual_fair’]

        Returns
        ----------
        self.result: dict, default = None
                Data holder that stores the following for every protected variable.:
                - fairness metric value & corresponding confidence interval for all fairness metrics.
                - feature distribution
        """
        self.fair_metric_name = self.use_case_object.fair_metric_name
        self._use_case_metrics = self.use_case_object._use_case_metrics
        self.y_train = [model.y_train for model in self.use_case_object.model_params]
        self.y_true = [model.y_true for model in self.use_case_object.model_params]
        self.y_pred = [model.y_pred for model in self.use_case_object.model_params]
        self.p_var = [model.p_var for model in self.use_case_object.model_params]
        self.feature_mask = self.use_case_object.feature_mask
        self.curr_p_var = None
        self.result = {}
        map_fair_metric_keys = set(
            list(self.map_fair_metric_to_method.keys()) + list(self.map_fair_metric_to_method_optimized.keys())
        )
        # initialize result structure
        for i in self.p_var[0]:
            self.result[i] = {}
            idx = self.feature_mask[i]
            p_perc = sum(idx[idx != -1]) / len(
                idx[idx != -1]
            )  # removing rows which don't belong to priviledged or unpriviledged groups
            feature_dist = {
                "privileged_group": p_perc,
                "unprivileged_group": 1 - p_perc,
            }
            self.result[i]["feature_distribution"] = feature_dist
            self.result[i]["fair_metric_values"] = {}
            for j in self._use_case_metrics["fair"]:
                if j in map_fair_metric_keys:
                    self.result[i]["fair_metric_values"][j] = []

        self.result["indiv_fair"] = {}

        # update progress bar by 10
        eval_pbar.update(10)
        n = len(self.use_case_object.model_params[0].y_true)
        n_threads = check_multiprocessing(n_threads)

        # split k into k-1 times of random indexing compute and 1 time of original array compute
        if n_threads >= 1 and self.use_case_object.k > 1:
            # prepare k-1 arrays of random indices
            indices = []
            np.random.seed(seed)
            for ind in range(self.use_case_object.k - 1):
                indices.append(np.random.choice(n, n, replace=True))

            # split the indices based on number threads and put into indexes, the size each indexes is the number of times each thread need to run
            indexes = []
            for i in range(n_threads):
                indexes.append([])
                for x in indices[i::n_threads]:
                    indexes[i].append(x)

            threads = []
            worker_progress = 36 / n_threads
            with concurrent.futures.ThreadPoolExecutor(max_workers=n_threads) as executor:
                # iterate through protected variables to drop one by one as part of leave-on-out
                for k in range(n_threads):
                    # deepcopy will be skipped if n_threads is 1
                    if n_threads == 1:
                        metric_obj = self
                    else:
                        metric_obj = deepcopy(self)
                    # submit each thread's work to thread pool
                    if len(indexes[k]) > 0:
                        threads.append(
                            executor.submit(
                                FairnessMetrics._execute_all_fair_map,
                                metric_obj=metric_obj,
                                index=indexes[k],
                                eval_pbar=eval_pbar,
                                worker_progress=worker_progress,
                            )
                        )

                if n_threads != 1:
                    for thread in threads:
                        mp_result = thread.result()
                        for i in self.p_var[0]:
                            for j in self._use_case_metrics["fair"]:
                                if j in list(self.map_fair_metric_to_method.keys()) + list(
                                    self.map_fair_metric_to_method_optimized.keys()
                                ):
                                    self.result[i]["fair_metric_values"][j] += mp_result[i]["fair_metric_values"][j]
        else:
            # if multithreading is not triggered, directly update the progress bar by 36
            eval_pbar.update(36)

        # run 1 time of original array to compute fairness metrics
        FairnessMetrics._execute_all_fair_map(self, [np.arange(n)], eval_pbar, 1)

        # generate the final fairness metrics values and their CI based on k times of computation
        for i in self.p_var[0]:
            for j in self._use_case_metrics["fair"]:
                if j in map_fair_metric_keys:
                    if self.result[i]["fair_metric_values"][j][-1][0] is None:
                        self.result[i]["fair_metric_values"][j] = (None, None, None)
                    else:
                        self.result[i]["fair_metric_values"][j] = self.result[i]["fair_metric_values"][j][-1] + (
                            2
                            * np.nanstd(
                                np.array(
                                    [a_tuple[0] for a_tuple in self.result[i]["fair_metric_values"][j]],
                                    dtype=float,
                                )
                            ),
                        )

        if "individual_fair" not in disable:
            FairnessMetrics._execute_all_indiv_fair_map(self)
        else:
            self.result["indiv_fair"] = None
        eval_pbar.update(6)

    def _execute_all_fair_map(metric_obj, index, eval_pbar, worker_progress):
        """
        Maps each thread's work for execute_all_fair()
        Parameters
        ----------
        metric_obj : FairnessMetrics object
        index : numpy.ndarray
        eval_pbar : tqdm object
                Progress bar
        worker_progress : int
                Progress bar progress for each thread
        """
        # get each iteration's progress in 2 decimals to update the progress bar
        prog = round(worker_progress / (len(index)), 2)

        # list to store all np arrays and combine for vectorization
        metric_obj.y_trues = []
        metric_obj.y_probs = []
        metric_obj.y_preds = []
        metric_obj.sample_weights = []
        metric_obj.feature_masks_list = []
        metric_obj.y_onehot_trues = []
        metric_obj.y_onehot_preds = []

        for idx in index:
            # prepare data
            metric_obj.y_true = [model.y_true[idx] for model in metric_obj.use_case_object.model_params]
            metric_obj.y_prob = [
                model.y_prob[idx] if model.y_prob is not None else None
                for model in metric_obj.use_case_object.model_params
            ]
            metric_obj.y_pred = [
                model.y_pred[idx] if model.y_pred is not None else None
                for model in metric_obj.use_case_object.model_params
            ]
            metric_obj.sample_weight = [
                model.sample_weight[idx] if model.sample_weight is not None else None
                for model in metric_obj.use_case_object.model_params
            ]
            metric_obj.e_lift = (
                metric_obj.use_case_object.e_lift[idx] if metric_obj.use_case_object.e_lift is not None else None
            )
            metric_obj.pred_outcome = (
                {k: v[idx] for k, v in metric_obj.use_case_object.pred_outcome.items()}
                if metric_obj.use_case_object.pred_outcome is not None
                else {None}
            )
            metric_obj.feature_mask = {k: v[idx] for k, v in metric_obj.use_case_object.feature_mask.items()}

            metric_obj.y_trues.append(metric_obj.y_true)
            metric_obj.y_probs.append(metric_obj.y_prob)
            metric_obj.y_preds.append(metric_obj.y_pred)
            metric_obj.feature_masks_list.append(metric_obj.feature_mask)
            metric_obj.sample_weights.append(metric_obj.sample_weight)
            if metric_obj.use_case_object.multiclass_flag:
                metric_obj.y_onehot_true = [model.enc_y_true[idx] for model in metric_obj.use_case_object.model_params]
                metric_obj.y_onehot_pred = [model.enc_y_pred[idx] for model in metric_obj.use_case_object.model_params]
                metric_obj.y_onehot_trues.append(metric_obj.y_onehot_true)
                metric_obj.y_onehot_preds.append(metric_obj.y_onehot_pred)

            for i in metric_obj.p_var[0]:
                metric_obj.curr_p_var = i
                for j in metric_obj._use_case_metrics["fair"]:
                    if j in metric_obj.map_fair_metric_to_method.keys():
                        metric_obj.result[i]["fair_metric_values"][j].append(
                            metric_obj.map_fair_metric_to_method[j](obj=metric_obj)
                        )

        metric_obj.y_trues = np.array(metric_obj.y_trues)
        metric_obj.y_probs = np.array(metric_obj.y_probs)
        metric_obj.y_preds = np.array(metric_obj.y_preds)

        if metric_obj.use_case_object.multiclass_flag:
            metric_obj.y_onehot_trues = np.array(metric_obj.y_onehot_trues)
            metric_obj.y_onehot_preds = np.array(metric_obj.y_onehot_preds)

        if all(v[0] is None for v in metric_obj.sample_weights):
            metric_obj.sample_weights = None
        else:
            metric_obj.sample_weights = np.array(metric_obj.sample_weights)

        # Initialise entropy variables
        metric_obj.e_y_true = None
        metric_obj.e_y_pred = None
        metric_obj.e_y_true_y_pred = None

        metric_obj.feature_masks = {}
        for i in metric_obj.p_var[0]:
            metric_obj.curr_p_var = i
            metric_obj.feature_masks[i] = []

            metric_obj.e_curr_p_var = None
            metric_obj.e_joint = None
            metric_obj.e_y_true_curr_p_var = None
            metric_obj.e_y_pred_curr_p_var = None
            metric_obj.e_y_true_y_pred_curr_p_var = None

            for feature_mask in metric_obj.feature_masks_list:
                metric_obj.feature_masks[i].append(
                    (np.array(feature_mask[i]) * 1).reshape(1, 1, -1)
                )  # convert bool to int and reshape
            metric_obj.feature_masks[i] = np.concatenate(metric_obj.feature_masks[i])

            if metric_obj.use_case_object.multiclass_flag:
                metric_obj.ohe_classes_ = metric_obj.use_case_object.classes_
                metric_obj.tp_ps = 0
                metric_obj.fp_ps = 0
                metric_obj.tn_ps = 0
                metric_obj.fn_ps = 0
                metric_obj.tp_us = 0
                metric_obj.fp_us = 0
                metric_obj.tn_us = 0
                metric_obj.fn_us = 0

                for idx, _ in enumerate(metric_obj.ohe_classes_):
                    y_trues = metric_obj.y_onehot_trues[:, :, :, idx]
                    y_preds = metric_obj.y_onehot_preds[:, :, :, idx]

                    (
                        tp_ps,
                        fp_ps,
                        tn_ps,
                        fn_ps,
                        tp_us,
                        fp_us,
                        tn_us,
                        fn_us,
                    ) = metric_obj.use_case_object._get_confusion_matrix_optimized(
                        y_trues,
                        y_preds,
                        metric_obj.sample_weights,
                        i,
                        metric_obj.feature_masks,
                    )

                    metric_obj.tp_ps += tp_ps
                    metric_obj.fp_ps += fp_ps
                    metric_obj.tn_ps += tn_ps
                    metric_obj.fn_ps += fn_ps
                    metric_obj.tp_us += tp_us
                    metric_obj.fp_us += fp_us
                    metric_obj.tn_us += tn_us
                    metric_obj.fn_us += fn_us

            else:
                (
                    metric_obj.tp_ps,
                    metric_obj.fp_ps,
                    metric_obj.tn_ps,
                    metric_obj.fn_ps,
                    metric_obj.tp_us,
                    metric_obj.fp_us,
                    metric_obj.tn_us,
                    metric_obj.fn_us,
                ) = metric_obj.use_case_object._get_confusion_matrix_optimized(
                    metric_obj.y_trues,
                    metric_obj.y_preds,
                    metric_obj.sample_weights,
                    i,
                    metric_obj.feature_masks,
                )

            with np.errstate(divide="ignore", invalid="ignore"):
                for j in metric_obj._use_case_metrics["fair"]:
                    if j in metric_obj.map_fair_metric_to_method_optimized.keys():
                        metric_obj.result[i]["fair_metric_values"][j] += metric_obj.map_fair_metric_to_method_optimized[
                            j
                        ](obj=metric_obj)
        return metric_obj.result

    def _execute_all_indiv_fair_map(metric_obj):
        """
        Maps each thread's work for execute_all_indiv_fair()

        Parameters
        ----------
        metric_obj : FairnessMetrics object
        """

        if metric_obj.use_case_object.multiclass_flag:
            metric_obj.result["indiv_fair"] = None

        elif len(metric_obj._use_case_metrics["indiv_fair"]) > 0:
            for j in metric_obj._use_case_metrics["indiv_fair"]:
                if j in metric_obj.map_indiv_fair_metric_to_method.keys():
                    metric_obj.result["indiv_fair"][j] = metric_obj.map_indiv_fair_metric_to_method[j](obj=metric_obj)
        else:
            metric_obj.result["indiv_fair"] = None

        return metric_obj.result

    def _translate_confusion_matrix(metric_obj, y_true, y_pred, sample_weight, curr_p_var=None, feature_mask=None):
        """
        Translates confusion matrix based on privileged and unprivileged groups

        Parameters
        ----------
        metric_obj : object
                FairnessMetrics object

        y_true : list, numpy.ndarray or pandas.Series
                Ground truth target values.

        y_pred : list, numpy.ndarray, pandas.Series
                Predicted targets as returned by classifier.

        sample_weight : numpy.ndarray, default=None
                Used to normalize y_true & y_pred.

        curr_p_var : str, default=None
                Current protected variable.

        Returns
        ----------
        Confusion matrix metrics based on privileged and unprivileged groups
        """
        if metric_obj.use_case_object.multiclass_flag:
            y_onehot_true = []
            y_onehot_pred = []
            for y_true_sample, y_pred_sample in zip(y_true, y_pred):
                label_binarizer = LabelBinarizer().fit(y_true_sample[0])
                y_onehot_true.append(label_binarizer.transform(y_true_sample[0]))
                y_onehot_pred.append(label_binarizer.transform(y_pred_sample[0]))

            y_onehot_true = np.array(y_onehot_true)
            y_onehot_true = y_onehot_true.reshape(len(y_onehot_true), 1, -1, len(label_binarizer.classes_))
            metric_obj.y_onehot_true = y_onehot_true
            y_onehot_pred = np.array(y_onehot_pred)
            y_onehot_pred = y_onehot_pred.reshape(len(y_onehot_pred), 1, -1, len(label_binarizer.classes_))
            metric_obj.y_onehot_pred = y_onehot_pred

            tp_p_s_total = 0
            fp_p_s_total = 0
            tn_p_s_total = 0
            fn_p_s_total = 0
            tp_u_s_total = 0
            fp_u_s_total = 0
            tn_u_s_total = 0
            fn_u_s_total = 0

            metric_obj.ohe_classes_ = metric_obj.use_case_object.classes_

            for idx, _ in enumerate(metric_obj.ohe_classes_):
                y_trues = y_onehot_true[:, :, :, idx]
                y_preds = y_onehot_pred[:, :, :, idx]

                (
                    tp_p_s,
                    fp_p_s,
                    tn_p_s,
                    fn_p_s,
                    tp_u_s,
                    fp_u_s,
                    tn_u_s,
                    fn_u_s,
                ) = metric_obj.use_case_object._get_confusion_matrix_optimized(
                    y_trues, y_preds, sample_weight, curr_p_var, feature_mask
                )

                tp_p_s_total += tp_p_s
                fp_p_s_total += fp_p_s
                tn_p_s_total += tn_p_s
                fn_p_s_total += fn_p_s
                tp_u_s_total += tp_u_s
                fp_u_s_total += fp_u_s
                tn_u_s_total += tn_u_s
                fn_u_s_total += fn_u_s
        else:
            (
                tp_p_s_total,
                fp_p_s_total,
                tn_p_s_total,
                fn_p_s_total,
                tp_u_s_total,
                fp_u_s_total,
                tn_u_s_total,
                fn_u_s_total,
            ) = metric_obj.use_case_object._get_confusion_matrix_optimized(
                y_true, y_pred, sample_weight, curr_p_var, feature_mask
            )

        return (
            tp_p_s_total,
            fp_p_s_total,
            tn_p_s_total,
            fn_p_s_total,
            tp_u_s_total,
            fp_u_s_total,
            tn_u_s_total,
            fn_u_s_total,
        )

    def translate_metric(self, metric_name, **kwargs):
        """
        Computes the primary fairness metric value and its associate value for the privileged group, for the feature importance section.
        This function does not support rejection inference.

        Parameters
        ----------
        metric_name : str
                Name of fairness metric

        Other Parameters
        ----------
        kwargs : list

        Returns
        ----------
        result: dict, default = None
                Data holder that stores the following for every protected variable.:
                - fairness metric value, corresponding confidence interval for chosen fairness metric.
                - feature distribution
        """
        if metric_name in self.map_fair_metric_to_method.keys():
            return self.map_fair_metric_to_method[metric_name](**kwargs)
        if metric_name in self.map_fair_metric_to_method_optimized.keys():
            return self.map_fair_metric_to_method_optimized[metric_name](**kwargs)

    def _compute_disparate_impact(self, **kwargs):
        """
        Computes the ratio of approval rate between the privileged and unprivileged groups

        Returns
        ----------
        _compute_disparate_impact : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            pr_p = (tp_p + fp_p) / (tp_p + fp_p + tn_p + fn_p)
            pr_u = (tp_u + fp_u) / (tp_u + fp_u + tn_u + fn_u)
            return ((pr_u / pr_p)[0][0], pr_p[0][0])
        else:
            pr_p = (self.tp_ps + self.fp_ps) / (self.tp_ps + self.fp_ps + self.tn_ps + self.fn_ps)
            pr_u = (self.tp_us + self.fp_us) / (self.tp_us + self.fp_us + self.tn_us + self.fn_us)
            return list(map(tuple, np.stack((pr_u / pr_p, pr_p), axis=1).reshape(-1, 2).tolist()))

    def _compute_demographic_parity(self, **kwargs):
        """
        Computes the difference in approval rate between the privileged and unprivileged groups

        Returns
        ----------
        _compute_demographic_parity : list of tuple of floats
                Fairness metric value and privileged group metric value

        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            pr_p = (tp_p + fp_p) / (tp_p + fp_p + tn_p + fn_p)
            pr_u = (tp_u + fp_u) / (tp_u + fp_u + tn_u + fn_u)
            return ((pr_p - pr_u)[0][0], pr_p[0][0])
        else:
            pr_p = (self.tp_ps + self.fp_ps) / (self.tp_ps + self.fp_ps + self.tn_ps + self.fn_ps)
            pr_u = (self.tp_us + self.fp_us) / (self.tp_us + self.fp_us + self.tn_us + self.fn_us)
            return list(map(tuple, np.stack((pr_p - pr_u, pr_p), axis=1).reshape(-1, 2).tolist()))

    def _compute_false_omission_rate_parity(self, **kwargs):
        """
        Computes the difference in false omission rate values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_false_omission_rate_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            for_p = fn_p / (tn_p + fn_p)
            for_u = fn_u / (tn_u + fn_u)
            return ((for_p - for_u)[0][0], for_p[0][0])
        else:
            for_p = self.fn_ps / (self.tn_ps + self.fn_ps)
            for_u = self.fn_us / (self.tn_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((for_p - for_u, for_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_false_omission_rate_ratio(self, **kwargs):
        """
        Computes the ratio of false omission rate values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_false_omission_rate_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            for_p = fn_p / (tn_p + fn_p)
            for_u = fn_u / (tn_u + fn_u)
            return ((for_u / for_p)[0][0], for_p[0][0])
        else:
            for_p = self.fn_ps / (self.tn_ps + self.fn_ps)
            for_u = self.fn_us / (self.tn_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((for_u / for_p, for_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_false_discovery_rate_parity(self, **kwargs):
        """
        Computes the difference in false discovery rate values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_false_discovery_rate_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            fdr_p = fp_p / (tp_p + fp_p)
            fdr_u = fp_u / (tp_u + fp_u)
            return ((fdr_p - fdr_u)[0][0], fdr_p[0][0])
        else:
            fdr_p = self.fp_ps / (self.tp_ps + self.fp_ps)
            fdr_u = self.fp_us / (self.tp_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((fdr_p - fdr_u, fdr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_false_discovery_rate_ratio(self, **kwargs):
        """
        Computes the ratio of false discovery rate values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_false_discovery_rate_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            fdr_p = fp_p / (tp_p + fp_p)
            fdr_u = fp_u / (tp_u + fp_u)
            return ((fdr_u / fdr_p)[0][0], fdr_p[0][0])
        else:
            fdr_p = self.fp_ps / (self.tp_ps + self.fp_ps)
            fdr_u = self.fp_us / (self.tp_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((fdr_u / fdr_p, fdr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_positive_predictive_parity(self, **kwargs):
        """
        Computes the difference in positive predictive values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_positive_predictive_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            ppv_p = tp_p / (tp_p + fp_p)
            ppv_u = tp_u / (tp_u + fp_u)
            return ((ppv_p - ppv_u)[0][0], ppv_p[0][0])
        else:
            ppv_p = self.tp_ps / (self.tp_ps + self.fp_ps)
            ppv_u = self.tp_us / (self.tp_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((ppv_p - ppv_u, ppv_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_positive_predictive_ratio(self, **kwargs):
        """
        Computes the ratio of positive predictive values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_positive_predictive_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            ppv_p = tp_p / (tp_p + fp_p)
            ppv_u = tp_u / (tp_u + fp_u)
            return ((ppv_u / ppv_p)[0][0], ppv_p[0][0])
        else:
            ppv_p = self.tp_ps / (self.tp_ps + self.fp_ps)
            ppv_u = self.tp_us / (self.tp_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((ppv_u / ppv_p, ppv_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_negative_predictive_parity(self, **kwargs):
        """
        Computes the difference in negative predictive values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_negative_predictive_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            npv_p = tn_p / (tn_p + fn_p)
            npv_u = tn_u / (tn_u + fn_u)
            return ((npv_p - npv_u)[0][0], npv_p[0][0])
        else:
            npv_p = self.tn_ps / (self.tn_ps + self.fn_ps)
            npv_u = self.tn_us / (self.tn_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((npv_p - npv_u, npv_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_negative_predictive_ratio(self, **kwargs):
        """
        Computes the ratio of negative predictive values between the privileged and unprivileged groups

        Returns
        ----------
        _compute_negative_predictive_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            npv_p = tn_p / (tn_p + fn_p)
            npv_u = tn_u / (tn_u + fn_u)
            return ((npv_u / npv_p)[0][0], npv_p[0][0])
        else:
            npv_p = self.tn_ps / (self.tn_ps + self.fn_ps)
            npv_u = self.tn_us / (self.tn_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((npv_u / npv_p, npv_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_fnr_parity(self, **kwargs):
        """
        Computes the difference in false negative rates between the privileged and unprivileged groups

        Returns
        ----------
        _compute_fnr_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            fnr_p = fn_p / (tp_p + fn_p)
            fnr_u = fn_u / (tp_u + fn_u)
            return ((fnr_p - fnr_u)[0][0], fnr_p[0][0])
        else:
            fnr_p = self.fn_ps / (self.tp_ps + self.fn_ps)
            fnr_u = self.fn_us / (self.tp_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((fnr_p - fnr_u, fnr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_fnr_ratio(self, **kwargs):
        """
        Computes the ratio of false negative rates between the privileged and unprivileged groups

        Returns
        ----------
        _compute_fnr_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            fnr_p = fn_p / (tp_p + fn_p)
            fnr_u = fn_u / (tp_u + fn_u)
            return ((fnr_u / fnr_p)[0][0], fnr_p[0][0])
        else:
            fnr_p = self.fn_ps / (self.tp_ps + self.fn_ps)
            fnr_u = self.fn_us / (self.tp_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((fnr_u / fnr_p, fnr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_fpr_parity(self, **kwargs):
        """
        Computes the difference in false positive rates between the privileged and unprivileged groups

        Returns
        ----------
        _compute_fpr_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            fpr_p = fp_p / (tn_p + fp_p)
            fpr_u = fp_u / (tn_u + fp_u)
            return ((fpr_p - fpr_u)[0][0], fpr_p[0][0])
        else:
            fpr_p = self.fp_ps / (self.tn_ps + self.fp_ps)
            fpr_u = self.fp_us / (self.tn_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((fpr_p - fpr_u, fpr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_fpr_ratio(self, **kwargs):
        """
        Computes the ratio of false positive rates between the privileged and unprivileged groups

        Returns
        ----------
        _compute_fpr_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            fpr_p = fp_p / (tn_p + fp_p)
            fpr_u = fp_u / (tn_u + fp_u)
            return ((fpr_u / fpr_p)[0][0], fpr_p[0][0])
        else:
            fpr_p = self.fp_ps / (self.tn_ps + self.fp_ps)
            fpr_u = self.fp_us / (self.tn_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((fpr_u / fpr_p, fpr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_tnr_parity(self, **kwargs):
        """
        Computes the difference in true negative rates between the privileged and unprivileged groups

        Returns
        ----------
        _compute_tnr_parity : list tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tnr_p = tn_p / (tn_p + fp_p)
            tnr_u = tn_u / (tn_u + fp_u)
            return ((tnr_p - tnr_u)[0][0], tnr_p[0][0])
        else:
            tnr_p = self.tn_ps / (self.tn_ps + self.fp_ps)
            tnr_u = self.tn_us / (self.tn_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((tnr_p - tnr_u, tnr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_tnr_ratio(self, **kwargs):
        """
        Computes the ratio of true negative rates between the privileged and unprivileged groups

        Returns
        ----------
        _compute_tnr_ratio : list tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tnr_p = tn_p / (tn_p + fp_p)
            tnr_u = tn_u / (tn_u + fp_u)
            return ((tnr_u / tnr_p)[0][0], tnr_p[0][0])
        else:
            tnr_p = self.tn_ps / (self.tn_ps + self.fp_ps)
            tnr_u = self.tn_us / (self.tn_us + self.fp_us)
            return list(
                map(
                    tuple,
                    np.stack((tnr_u / tnr_p, tnr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_equalized_odds(self, **kwargs):
        """
        Computes the equalized odds

        Returns
        ----------
        _compute_equalized_odds : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tpr_p = tp_p / (tp_p + fn_p)
            tpr_u = tp_u / (tp_u + fn_u)
            fpr_p = fp_p / (fp_p + tn_p)
            fpr_u = fp_u / (fp_u + tn_u)
            return (
                (((tpr_p + fpr_p) - (tpr_u + fpr_u)) / 2)[0][0],
                ((tpr_p + fpr_p) / 2)[0][0],
            )
        else:
            tpr_p = self.tp_ps / (self.tp_ps + self.fn_ps)
            tpr_u = self.tp_us / (self.tp_us + self.fn_us)
            fpr_p = self.fp_ps / (self.fp_ps + self.tn_ps)
            fpr_u = self.fp_us / (self.fp_us + self.tn_us)
            return list(
                map(
                    tuple,
                    np.stack(
                        (((tpr_p + fpr_p) - (tpr_u + fpr_u)) / 2, (tpr_p + fpr_p) / 2),
                        axis=1,
                    )
                    .reshape(-1, 2)
                    .tolist(),
                )
            )

    def _compute_equalized_odds_ratio(self, **kwargs):
        """
        Computes the equalized odds ratio

        Returns
        ----------
        _compute_equalized_odds_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tpr_p = tp_p / (tp_p + fn_p)
            tpr_u = tp_u / (tp_u + fn_u)
            fpr_p = fp_p / (fp_p + tn_p)
            fpr_u = fp_u / (fp_u + tn_u)
            return (
                ((tpr_u + fpr_u) / (tpr_p + fpr_p))[0][0],
                ((tpr_p + fpr_p) / 2)[0][0],
            )
        else:
            tpr_p = self.tp_ps / (self.tp_ps + self.fn_ps)
            tpr_u = self.tp_us / (self.tp_us + self.fn_us)
            fpr_p = self.fp_ps / (self.fp_ps + self.tn_ps)
            fpr_u = self.fp_us / (self.fp_us + self.tn_us)
            return list(
                map(
                    tuple,
                    np.stack(((tpr_u + fpr_u) / (tpr_p + fpr_p), (tpr_p + fpr_p) / 2), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_negative_equalized_odds(self, **kwargs):
        """
        Computes the negative equalized odds

        Returns
        ----------
        _compute_negative_equalized_odds : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tnr_p = tn_p / (tn_p + fp_p)
            tnr_u = tn_u / (tn_u + fp_u)
            fnr_p = fn_p / (fn_p + tp_p)
            fnr_u = fn_u / (fn_u + tp_u)
            return (
                (((tnr_p + fnr_p) - (tnr_u + fnr_u)) / 2)[0][0],
                ((tnr_p + fnr_p) / 2)[0][0],
            )
        else:
            tnr_p = self.tn_ps / (self.tn_ps + self.fp_ps)
            tnr_u = self.tn_us / (self.tn_us + self.fp_us)
            fnr_p = self.fn_ps / (self.fn_ps + self.tp_ps)
            fnr_u = self.fn_us / (self.fn_us + self.tp_us)
            return list(
                map(
                    tuple,
                    np.stack(
                        (((tnr_p + fnr_p) - (tnr_u + fnr_u)) / 2, (tnr_p + fnr_p) / 2),
                        axis=1,
                    )
                    .reshape(-1, 2)
                    .tolist(),
                )
            )

    def _compute_negative_equalized_odds_ratio(self, **kwargs):
        """
        Computes the negative equalized odds ratio

        Returns
        ----------
        _compute_negative_equalized_odds_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tnr_p = tn_p / (tn_p + fp_p)
            tnr_u = tn_u / (tn_u + fp_u)
            fnr_p = fn_p / (fn_p + tp_p)
            fnr_u = fn_u / (fn_u + tp_u)
            return (
                ((tnr_u + fnr_u) / (tnr_p + fnr_p))[0][0],
                ((tnr_p + fnr_p) / 2)[0][0],
            )
        else:
            tnr_p = self.tn_ps / (self.tn_ps + self.fp_ps)
            tnr_u = self.tn_us / (self.tn_us + self.fp_us)
            fnr_p = self.fn_ps / (self.fn_ps + self.tp_ps)
            fnr_u = self.fn_us / (self.fn_us + self.tp_us)
            return list(
                map(
                    tuple,
                    np.stack(((tnr_u + fnr_u) / (tnr_p + fnr_p), (tnr_p + fnr_p) / 2), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_rmse_parity(self, **kwargs):
        """
        Computes the difference in root mean squared error between the privileged and unprivileged groups

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_rmse_parity : tuple of floats
                Fairness metric value and privileged group metric value
        """
        mask = self.feature_mask[self.curr_p_var]
        maskFilter = mask != -1
        mask = mask[maskFilter].astype(bool)
        y_true = self.y_true[0]
        y_pred = self.y_pred[0]
        if "y_pred_new" in kwargs:
            y_pred = kwargs["y_pred_new"][0]
        y_true = y_true[maskFilter]
        y_pred = y_pred[maskFilter]

        if self.sample_weight[0] is not None:
            sample_weight_p = np.array(self.sample_weight[0][maskFilter])[mask]
            sample_weight_u = np.array(self.sample_weight[0][maskFilter])[~mask]
        else:
            sample_weight_p = None
            sample_weight_u = None

        rmse_p = (
            mean_squared_error(
                y_true=np.array(y_true)[mask],
                y_pred=np.array(y_pred)[mask],
                sample_weight=sample_weight_p,
            )
            ** 0.5
        )
        rmse_u = (
            mean_squared_error(
                y_true=np.array(y_true)[~mask],
                y_pred=np.array(y_pred)[~mask],
                sample_weight=sample_weight_u,
            )
            ** 0.5
        )
        return (rmse_p - rmse_u, rmse_p)

    def _compute_rmse_ratio(self, **kwargs):
        """
        Computes the ratio of root mean squared error between the privileged and unprivileged groups

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_rmse_ratio : tuple of floats
                Fairness metric value and privileged group metric value
        """
        mask = self.feature_mask[self.curr_p_var]
        maskFilter = mask != -1
        mask = mask[maskFilter].astype(bool)
        y_true = self.y_true[0]
        y_pred = self.y_pred[0]
        if "y_pred_new" in kwargs:
            y_pred = kwargs["y_pred_new"][0]
        y_true = y_true[maskFilter]
        y_pred = y_pred[maskFilter]

        if self.sample_weight[0] is not None:
            sample_weight_p = np.array(self.sample_weight[0][maskFilter])[mask]
            sample_weight_u = np.array(self.sample_weight[0][maskFilter])[~mask]
        else:
            sample_weight_p = None
            sample_weight_u = None

        rmse_p = (
            mean_squared_error(
                y_true=np.array(y_true)[mask],
                y_pred=np.array(y_pred)[mask],
                sample_weight=sample_weight_p,
            )
            ** 0.5
        )
        rmse_u = (
            mean_squared_error(
                y_true=np.array(y_true)[~mask],
                y_pred=np.array(y_pred)[~mask],
                sample_weight=sample_weight_u,
            )
            ** 0.5
        )
        return (rmse_p / rmse_u, rmse_p)

    def _compute_mape_parity(self, **kwargs):
        """
        Computes the difference in mean average percentage error between the privileged and unprivileged groups

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_mape_parity : tuple of floats
                Fairness metric value and privileged group metric value
        """
        mask = self.feature_mask[self.curr_p_var]
        maskFilter = mask != -1
        mask = mask[maskFilter].astype(bool)
        y_true = self.y_true[0]
        y_pred = self.y_pred[0]
        if "y_pred_new" in kwargs:
            y_pred = kwargs["y_pred_new"][0]
        y_true = y_true[maskFilter]
        y_pred = y_pred[maskFilter]

        if self.sample_weight[0] is not None:
            sample_weight_p = np.array(self.sample_weight[0][maskFilter])[mask]
            sample_weight_u = np.array(self.sample_weight[0][maskFilter])[~mask]
        else:
            sample_weight_p = None
            sample_weight_u = None

        mape_p = mean_absolute_percentage_error(
            y_true=np.array(y_true)[mask],
            y_pred=np.array(y_pred)[mask],
            sample_weight=sample_weight_p,
        )
        mape_u = mean_absolute_percentage_error(
            y_true=np.array(y_true)[~mask],
            y_pred=np.array(y_pred)[~mask],
            sample_weight=sample_weight_u,
        )

        return (mape_p - mape_u, mape_p)

    def _compute_mape_ratio(self, **kwargs):
        """
        Computes the ratio of mean average percentage error between the privileged and unprivileged groups

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_mape_ratio : tuple of floats
                Fairness metric value and privileged group metric value
        """
        mask = self.feature_mask[self.curr_p_var]
        maskFilter = mask != -1
        mask = mask[maskFilter].astype(bool)
        y_true = self.y_true[0]
        y_pred = self.y_pred[0]
        if "y_pred_new" in kwargs:
            y_pred = kwargs["y_pred_new"][0]
        y_true = y_true[maskFilter]
        y_pred = y_pred[maskFilter]

        if self.sample_weight[0] is not None:
            sample_weight_p = np.array(self.sample_weight[0][maskFilter])[mask]
            sample_weight_u = np.array(self.sample_weight[0][maskFilter])[~mask]
        else:
            sample_weight_p = None
            sample_weight_u = None

        mape_p = mean_absolute_percentage_error(
            y_true=np.array(y_true)[mask],
            y_pred=np.array(y_pred)[mask],
            sample_weight=sample_weight_p,
        )
        mape_u = mean_absolute_percentage_error(
            y_true=np.array(y_true)[~mask],
            y_pred=np.array(y_pred)[~mask],
            sample_weight=sample_weight_u,
        )

        return (mape_p / mape_u, mape_p)

    def _compute_wape_parity(self, **kwargs):
        """
        Computes the difference in weighted average percentage error between the privileged and unprivileged groups

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_wape_parity : tuple of floats
                Fairness metric value and privileged group metric value
        """
        mask = self.feature_mask[self.curr_p_var]
        maskFilter = mask != -1
        mask = mask[maskFilter].astype(bool)
        y_true = self.y_true[0]
        y_pred = self.y_pred[0]
        if "y_pred_new" in kwargs:
            y_pred = kwargs["y_pred_new"][0]
        y_true = y_true[maskFilter]
        y_pred = y_pred[maskFilter]

        if self.sample_weight[0] is not None:
            sample_weight_p = np.array(self.sample_weight[0][maskFilter])[mask]
            sample_weight_u = np.array(self.sample_weight[0][maskFilter])[~mask]
        else:
            sample_weight_p = np.ones(y_true.shape)[mask]
            sample_weight_u = np.ones(y_true.shape)[~mask]

        wape_p = np.sum(np.absolute(np.subtract(y_true[mask], y_pred[mask])) * sample_weight_p) / np.sum(
            np.absolute(y_true[mask]) * sample_weight_p
        )
        wape_u = np.sum(np.absolute(np.subtract(y_true[~mask], y_pred[~mask])) * sample_weight_u) / np.sum(
            np.absolute(y_true[~mask]) * sample_weight_u
        )

        return (wape_p - wape_u, wape_p)

    def _compute_wape_ratio(self, **kwargs):
        """
        Computes the ratio of weighted average percentage error between the privileged and unprivileged groups

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_wape_ratio : tuple of floats
                Fairness metric value and privileged group metric value
        """
        mask = self.feature_mask[self.curr_p_var]
        maskFilter = mask != -1
        mask = mask[maskFilter].astype(bool)
        y_true = self.y_true[0]
        y_pred = self.y_pred[0]
        if "y_pred_new" in kwargs:
            y_pred = kwargs["y_pred_new"][0]
        y_true = y_true[maskFilter]
        y_pred = y_pred[maskFilter]

        if self.sample_weight[0] is not None:
            sample_weight_p = np.array(self.sample_weight[0][maskFilter])[mask]
            sample_weight_u = np.array(self.sample_weight[0][maskFilter])[~mask]
        else:
            sample_weight_p = np.ones(y_true.shape)[mask]
            sample_weight_u = np.ones(y_true.shape)[~mask]

        wape_p = np.sum(np.absolute(np.subtract(y_true[mask], y_pred[mask])) * sample_weight_p) / np.sum(
            np.absolute(y_true[mask]) * sample_weight_p
        )
        wape_u = np.sum(np.absolute(np.subtract(y_true[~mask], y_pred[~mask])) * sample_weight_u) / np.sum(
            np.absolute(y_true[~mask]) * sample_weight_u
        )

        return (wape_p / wape_u, wape_p)

    def _compute_log_loss_score(self, y_true, y_prob, mask, multiclass=False):
        """
        Computes log loss score for privileged and unprivileged groups based on multiclass flag.

        Parameters
        ----------
        y_true : list, numpy.ndarray or pandas.Series
                Ground truth target values.

        y_prob : list, numpy.ndarray, pandas.Series, pandas.DataFrame
                Predicted probabilities as returned by classifier.

        multiclass : boolean
                Indicates if classification model is multi-class.

        Returns
        ----------
        log_loss_p : numpy.ndarray
                Log-loss score for privileged group.

        log_loss_u : numpy.ndarray
                Log-loss score for unprivileged group.
        """
        maskFilterNeg = mask == -1

        if multiclass:
            maskFilterNeg_rp = np.repeat(maskFilterNeg, y_true.shape[3], axis=2)

            y_trues_ma = np.ma.array(y_true, mask=maskFilterNeg_rp)
            y_probs_ma = np.ma.array(y_prob, mask=maskFilterNeg_rp)
            mask = np.ma.array(mask, mask=maskFilterNeg)

            loss_p = -(y_trues_ma * ma.log(y_probs_ma)).sum(axis=3)
            log_loss_p = (loss_p * mask).sum(axis=2) / np.sum(mask, 2)  # , keepdims=True)

            loss_u = -(y_trues_ma * ma.log(y_probs_ma)).sum(axis=3)
            log_loss_u = (loss_u * (1 - mask)).sum(axis=2) / np.sum(1 - mask, 2)  # , keepdims=True)

        else:
            y_trues_ma = np.ma.array(y_true, mask=maskFilterNeg)
            y_probs_ma = np.ma.array(y_prob, mask=maskFilterNeg)
            mask_ma = np.ma.array(mask, mask=maskFilterNeg)

            log_loss_score = -(y_trues_ma * ma.log(y_probs_ma) + (1 - y_trues_ma) * ma.log(1 - y_probs_ma))
            log_loss_p = np.sum(log_loss_score * mask_ma, 2) / np.sum(mask_ma, 2)
            log_loss_u = np.sum(log_loss_score * (1 - mask_ma), 2) / np.sum((1 - mask_ma), 2)

        return log_loss_p, log_loss_u

    def _compute_log_loss_parity(self, **kwargs):
        """
        Computes the difference in logistic loss or cross entropy loss between the privileged and unprivileged groups

        Returns
        ----------
        _compute_log_loss_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_prob_new" in kwargs:
            mask = self.feature_mask[self.curr_p_var]

            mask = mask.reshape(1, 1, -1)
            y_true = self.use_case_object.model_params[0].y_true  # self.y_true[0]
            y_prob = kwargs["y_prob_new"][0]

            if self.use_case_object.multiclass_flag:
                ohe_classes_ = self.use_case_object.classes_
                y_prob = y_prob.reshape(1, 1, -1, len(ohe_classes_))
                enc_y_true = np.array(self.y_onehot_true).reshape(1, 1, -1, len(ohe_classes_))
                log_loss_p, log_loss_u = self._compute_log_loss_score(enc_y_true, y_prob, mask, True)

            else:
                y_prob = y_prob.reshape(1, 1, -1)
                y_true = y_true.reshape(1, 1, -1)
                log_loss_p, log_loss_u = self._compute_log_loss_score(y_true, y_prob, mask, False)

            return ((log_loss_p - log_loss_u)[0][0], log_loss_p[0][0])

        else:
            if all(v[0] is None for v in self.y_probs):
                return np.array([(None, None)] * self.y_trues.shape[0]).reshape(-1, 2).tolist()
            mask = self.feature_masks[self.curr_p_var]

            if self.use_case_object.multiclass_flag:
                log_loss_p, log_loss_u = self._compute_log_loss_score(self.y_onehot_trues, self.y_probs, mask, True)

            else:
                log_loss_p, log_loss_u = self._compute_log_loss_score(self.y_trues, self.y_probs, mask, False)

            return list(
                map(
                    tuple,
                    np.stack((log_loss_p - log_loss_u, log_loss_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_log_loss_ratio(self, **kwargs):
        """
        Computes the ratio of logistic loss or cross entropy loss between the privileged and unprivileged groups

        Returns
        ----------
        _compute_log_loss_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_prob_new" in kwargs:
            mask = self.feature_mask[self.curr_p_var]

            mask = mask.reshape(1, 1, -1)
            y_true = self.use_case_object.model_params[0].y_true  # self.y_true[0]
            y_prob = kwargs["y_prob_new"][0]

            if self.use_case_object.multiclass_flag:
                ohe_classes_ = self.use_case_object.classes_
                y_prob = y_prob.reshape(1, 1, -1, len(ohe_classes_))
                enc_y_true = np.array(self.y_onehot_true).reshape(1, 1, -1, len(ohe_classes_))
                log_loss_p, log_loss_u = self._compute_log_loss_score(enc_y_true, y_prob, mask, True)

            else:
                y_prob = y_prob.reshape(1, 1, -1)
                y_true = y_true.reshape(1, 1, -1)
                log_loss_p, log_loss_u = self._compute_log_loss_score(y_true, y_prob, mask, False)

            return ((log_loss_u / log_loss_p)[0][0], log_loss_p[0][0])

        else:
            if all(v[0] is None for v in self.y_probs):
                return np.array([(None, None)] * self.y_trues.shape[0]).reshape(-1, 2).tolist()

            mask = self.feature_masks[self.curr_p_var]

            if self.use_case_object.multiclass_flag:
                log_loss_p, log_loss_u = self._compute_log_loss_score(self.y_onehot_trues, self.y_probs, mask, True)

            else:
                log_loss_p, log_loss_u = self._compute_log_loss_score(self.y_trues, self.y_probs, mask, False)

            return list(
                map(
                    tuple,
                    np.stack((log_loss_u / log_loss_p, log_loss_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_TPR_FPR(self, y_true, y_prob, mask, multiclass=False):
        """
        Computes true positive rate and false positive rate for privileged and unprivileged groups based on multiclass flag.

        Parameters
        ----------
        y_true : list, numpy.ndarray or pandas.Series
                Ground truth target values.

        y_prob : list, numpy.ndarray, pandas.Series, pandas.DataFrame
                Predicted probabilities as returned by classifier.

        multiclass : boolean
                Indicates if classification model is multi-class.

        Returns
        ----------
        TPR_p : numpy.ndarray
                True positive rate for privileged group.

        FPR_p : numpy.ndarray
                False positive rate for privileged group.

        TPR_u : numpy.ndarray
                True positive rate for unprivileged group.

        FPR_u : numpy.ndarray
                False positive rate for unprivileged group.
        """
        if multiclass:
            y_trues = y_true.reshape(y_true.shape[0], y_true.shape[1], -1)
            y_probs = y_prob.reshape(y_prob.shape[0], y_prob.shape[1], -1)

            mask = np.repeat(mask, y_true.shape[3], axis=2)

            idx = y_probs.argsort(axis=2)[:, :, ::-1]  # sort by descending order

            y_trues = np.take_along_axis(y_trues, idx, axis=2)
            mask = np.take_along_axis(mask, idx, axis=2)

            TPR_p = np.cumsum(y_trues * mask, axis=2) / np.sum(y_trues * mask, axis=2, keepdims=True)
            FPR_p = np.cumsum((1 - y_trues) * mask, axis=2) / np.sum((1 - y_trues) * mask, axis=2, keepdims=True)

            TPR_u = np.cumsum(y_trues * (1 - mask), axis=2) / np.sum(y_trues * (1 - mask), axis=2, keepdims=True)
            FPR_u = np.cumsum((1 - y_trues) * (1 - mask), axis=2) / np.sum(
                (1 - y_trues) * (1 - mask), axis=2, keepdims=True
            )

            TPR_p = np.append(np.zeros((TPR_p.shape[0], TPR_p.shape[1], 1)), TPR_p, axis=2)  # append starting point (0)
            FPR_p = np.append(np.zeros((FPR_p.shape[0], FPR_p.shape[1], 1)), FPR_p, axis=2)
            TPR_u = np.append(np.zeros((TPR_u.shape[0], TPR_u.shape[1], 1)), TPR_u, axis=2)  # append starting point (0)
            FPR_u = np.append(np.zeros((FPR_u.shape[0], FPR_u.shape[1], 1)), FPR_u, axis=2)

        else:
            maskFilterNeg = mask == -1
            y_trues_ma = np.ma.array(y_true, mask=maskFilterNeg)
            y_probs_ma = np.ma.array(y_prob, mask=maskFilterNeg)
            mask_ma = np.ma.array(mask, mask=maskFilterNeg)

            idx = y_prob.argsort(kind="mergesort", axis=2)[:, :, ::-1]  # sort by descending order

            y_trues = np.take_along_axis(y_trues_ma, idx, axis=2)

            mask = np.take_along_axis(mask_ma, idx, axis=2)

            grp_mask = np.take_along_axis(mask, idx, axis=2)

            TPR_p = np.cumsum(y_trues * mask, axis=2).data[grp_mask == 1] / np.sum(
                y_trues * mask, axis=2, keepdims=True
            )
            FPR_p = np.cumsum((1 - y_trues) * mask, axis=2).data[grp_mask == 1] / np.sum(
                (1 - y_trues) * mask, axis=2, keepdims=True
            )
            TPR_p = ma.append(np.zeros((TPR_p.shape[0], TPR_p.shape[1], 1)), TPR_p, axis=2)  # append starting point (0)
            FPR_p = ma.append(np.zeros((FPR_p.shape[0], FPR_p.shape[1], 1)), FPR_p, axis=2)
            auc_p = np.trapz(TPR_p, FPR_p, axis=2)

            TPR_u = np.cumsum(y_trues * (1 - mask), axis=2).data[grp_mask == 0] / np.sum(
                y_trues * (1 - mask), axis=2, keepdims=True
            )
            FPR_u = np.cumsum((1 - y_trues) * (1 - mask), axis=2).data[grp_mask == 0] / np.sum(
                (1 - y_trues) * (1 - mask), axis=2, keepdims=True
            )
            TPR_u = ma.append(np.zeros((TPR_u.shape[0], TPR_u.shape[1], 1)), TPR_u, axis=2)  # append starting point (0)
            FPR_u = ma.append(np.zeros((FPR_u.shape[0], FPR_u.shape[1], 1)), FPR_u, axis=2)

        return TPR_p, FPR_p, TPR_u, FPR_u

    def _compute_auc_parity(self, **kwargs):
        """
        Computes the difference in area under roc curve between the privileged and unprivileged groups

        Returns
        ----------
        _compute_auc_parity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_prob_new" in kwargs:
            mask = self.feature_mask[self.curr_p_var]
            mask = mask.reshape(1, 1, -1)
            y_true = self.use_case_object.model_params[0].y_true  # self.y_true[0]
            y_prob = kwargs["y_prob_new"][0]

            if self.use_case_object.multiclass_flag:
                ohe_classes_ = self.use_case_object.classes_
                y_prob = y_prob.reshape(1, 1, -1, len(ohe_classes_))
                enc_y_true = np.array(self.y_onehot_true).reshape(1, 1, -1, len(ohe_classes_))

                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(enc_y_true, y_prob, mask, True)

                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            else:
                y_prob = y_prob.reshape(1, 1, -1)
                y_true = y_true.reshape(1, 1, -1)
                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(y_true, y_prob, mask, False)
                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            return (auc_p - auc_u)[0][0], auc_p[0][0]
        else:
            if all(v[0] is None for v in self.y_probs):
                return np.array([(None, None)] * self.y_trues.shape[0]).reshape(-1, 2).tolist()
            mask = self.feature_masks[self.curr_p_var]

            if self.use_case_object.multiclass_flag:
                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(self.y_onehot_trues, self.y_probs, mask, True)

                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            else:
                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(self.y_trues, self.y_probs, mask, False)
                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            return list(
                map(
                    tuple,
                    np.stack((auc_p - auc_u, auc_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_auc_ratio(self, **kwargs):
        """
        Computes the ratio of area under roc curve between the privileged and unprivileged groups

        Returns
        ----------
        _compute_auc_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_prob_new" in kwargs:
            mask = self.feature_mask[self.curr_p_var]
            mask = mask.reshape(1, 1, -1)
            y_true = self.use_case_object.model_params[0].y_true  # self.y_true[0]
            y_prob = kwargs["y_prob_new"][0]

            if self.use_case_object.multiclass_flag:
                ohe_classes_ = self.use_case_object.classes_
                y_prob = y_prob.reshape(1, 1, -1, len(ohe_classes_))
                enc_y_true = np.array(self.y_onehot_true).reshape(1, 1, -1, len(ohe_classes_))

                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(enc_y_true, y_prob, mask, True)

                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            else:
                y_prob = y_prob.reshape(1, 1, -1)
                y_true = y_true.reshape(1, 1, -1)
                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(y_true, y_prob, mask, False)
                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            return (auc_u / auc_p)[0][0], auc_p[0][0]

        else:
            if all(v[0] is None for v in self.y_probs):
                return np.array([(None, None)] * self.y_trues.shape[0]).reshape(-1, 2).tolist()

            mask = self.feature_masks[self.curr_p_var]

            if self.use_case_object.multiclass_flag:
                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(self.y_onehot_trues, self.y_probs, mask, True)

                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            else:
                TPR_p, FPR_p, TPR_u, FPR_u = self._compute_TPR_FPR(self.y_trues, self.y_probs, mask, False)
                auc_p = np.trapz(TPR_p, FPR_p, axis=2)
                auc_u = np.trapz(TPR_u, FPR_u, axis=2)

            return list(
                map(
                    tuple,
                    np.stack((auc_u / auc_p, auc_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_equal_opportunity(self, **kwargs):
        """
        Computes the equal opportunity

        Returns
        ----------
        _compute_equal_opportunity : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tpr_p = tp_p / (tp_p + fn_p)
            tpr_u = tp_u / (tp_u + fn_u)
            return ((tpr_p - tpr_u)[0][0], tpr_p[0][0])
        else:
            tpr_p = self.tp_ps / (self.tp_ps + self.fn_ps)
            tpr_u = self.tp_us / (self.tp_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((tpr_p - tpr_u, tpr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_equal_opportunity_ratio(self, **kwargs):
        """
        Computes the equal opportunity ratio

        Returns
        ----------
        _compute_equal_opportunity_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            tpr_p = tp_p / (tp_p + fn_p)
            tpr_u = tp_u / (tp_u + fn_u)
            return ((tpr_u / tpr_p)[0][0], tpr_p[0][0])
        else:
            tpr_p = self.tp_ps / (self.tp_ps + self.fn_ps)
            tpr_u = self.tp_us / (self.tp_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack((tpr_u / tpr_p, tpr_p), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_calibration_by_group(self, **kwargs):
        """
        Computes the calibration by group within protected variable

        Returns
        ----------
        _compute_calibration_by_group : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            ppv_p = tp_p / (tp_p + fp_p)
            ppv_u = tp_u / (tp_u + fp_u)
            for_p = fn_p / (tn_p + fn_p)
            for_u = fn_u / (tn_u + fn_u)
            return (
                (((ppv_p + for_p) - (ppv_u + for_u)) / 2)[0][0],
                ((ppv_p + for_p) / 2)[0][0],
            )
        else:
            ppv_p = self.tp_ps / (self.tp_ps + self.fp_ps)
            ppv_u = self.tp_us / (self.tp_us + self.fp_us)
            for_p = self.fn_ps / (self.tn_ps + self.fn_ps)
            for_u = self.fn_us / (self.tn_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack(
                        (((ppv_p + for_p) - (ppv_u + for_u)) / 2, (ppv_p + for_p) / 2),
                        axis=1,
                    )
                    .reshape(-1, 2)
                    .tolist(),
                )
            )

    def _compute_calibration_by_group_ratio(self, **kwargs):
        """
        Computes the calibration by group ratio within protected variable

        Returns
        ----------
        _compute_calibration_by_group_ratio : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            feature_mask = {k: np.array(v * 1).reshape(1, 1, -1) for k, v in self.feature_mask.items()}
            (
                tp_p,
                fp_p,
                tn_p,
                fn_p,
                tp_u,
                fp_u,
                tn_u,
                fn_u,
            ) = FairnessMetrics._translate_confusion_matrix(
                self.use_case_object.fair_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                curr_p_var=self.curr_p_var,
                feature_mask=feature_mask,
            )
            ppv_p = tp_p / (tp_p + fp_p)
            ppv_u = tp_u / (tp_u + fp_u)
            for_p = fn_p / (tn_p + fn_p)
            for_u = fn_u / (tn_u + fn_u)
            return (
                ((ppv_u + for_u) / (ppv_p + for_p))[0][0],
                ((ppv_p + for_p) / 2)[0][0],
            )
        else:
            ppv_p = self.tp_ps / (self.tp_ps + self.fp_ps)
            ppv_u = self.tp_us / (self.tp_us + self.fp_us)
            for_p = self.fn_ps / (self.tn_ps + self.fn_ps)
            for_u = self.fn_us / (self.tn_us + self.fn_us)
            return list(
                map(
                    tuple,
                    np.stack(((ppv_u + for_u) / (ppv_p + for_p), (ppv_p + for_p) / 2), axis=1).reshape(-1, 2).tolist(),
                )
            )

    def _compute_mi_independence(self, **kwargs):
        """
        Compute Mutual Information independence

        Returns
        ----------
        _compute_mi_independence : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            mask = self.feature_mask[self.curr_p_var]
            y_pred = kwargs["y_pred_new"][0]
            df = pd.DataFrame({"y_pred": y_pred, "curr_p_var": mask})
            e_y_pred = self._get_entropy(df, ["y_pred"])
            e_curr_p_var = self._get_entropy(df, ["curr_p_var"])
            e_joint = self._get_entropy(df, ["y_pred", "curr_p_var"])
            mi_independence = (e_y_pred + e_curr_p_var - e_joint) / e_curr_p_var
            return (mi_independence, None)

        else:
            if self.use_case_object.multiclass_flag:
                return np.array([(None, None)] * self.y_trues.shape[0]).reshape(-1, 2).tolist()
            mask = self.feature_masks[self.curr_p_var]
            maskFilter = mask != -1

            proportion_pred = [
                np.sum(self.y_preds, 2, where=maskFilter),
                np.sum(1 - self.y_preds, 2, where=maskFilter),
            ]

            proportion_pred_denom = maskFilter.sum(axis=2)
            proportion_pred[0] = proportion_pred[0] / proportion_pred_denom
            proportion_pred[1] = proportion_pred[1] / proportion_pred_denom
            proportion_pred = np.stack(proportion_pred, axis=2)

            e_y_pred = -np.sum(proportion_pred * ma.log(proportion_pred), axis=2)
            self.e_y_pred = e_y_pred

            proportion_p_var = [
                np.sum(mask, 2, where=maskFilter),
                np.sum(1 - mask, 2, where=maskFilter),
            ]

            proportion_p_var_denom = maskFilter.sum(axis=2)
            proportion_p_var[0] = proportion_p_var[0] / proportion_p_var_denom
            proportion_p_var[1] = proportion_p_var[1] / proportion_p_var_denom

            proportion_p_var = np.stack(proportion_p_var, axis=2)
            e_curr_p_var = -np.sum(proportion_p_var * ma.log(proportion_p_var), axis=2)
            self.e_curr_p_var = e_curr_p_var

            proportion_join = []
            cart_product = product([self.y_preds, 1 - self.y_preds], [mask, 1 - mask])
            proportion_join_denom = maskFilter.sum(axis=2)
            for i in cart_product:
                p = i[0] * i[1]
                proportion_join.append(np.sum(p, 2, where=maskFilter) / proportion_join_denom)
            proportion_join = np.stack(proportion_join, axis=2)
            e_joint = -np.sum(proportion_join * ma.log(proportion_join), axis=2)
            self.e_joint = e_joint

            mi_independence = (e_y_pred + e_curr_p_var - e_joint) / e_curr_p_var
            mi_independence = mi_independence.reshape(-1).tolist()

            return [(v, None) for v in mi_independence]

    def _compute_mi_separation(self, **kwargs):
        """
        Compute Mutual Information separation

        Returns
        ----------
        _compute_mi_separation : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            mask = self.feature_mask[self.curr_p_var]
            y_pred = kwargs["y_pred_new"][0]
            df = pd.DataFrame({"y_true": self.y_true, "y_pred": y_pred, "curr_p_var": mask})
            e_y_true_curr_p_var = self._get_entropy(df, ["y_true", "curr_p_var"])
            e_y_true_y_pred = self._get_entropy(df, ["y_true", "y_pred"])
            e_y_true_y_pred_curr_p_var = self._get_entropy(df, ["y_true", "y_pred", "curr_p_var"])
            e_y_true = self._get_entropy(df, ["y_true"])
            e_curr_p_var_y_true_conditional = e_y_true_curr_p_var - e_y_true
            mi_separation = (
                e_y_true_curr_p_var + e_y_true_y_pred - e_y_true_y_pred_curr_p_var - e_y_true
            ) / e_curr_p_var_y_true_conditional
            return (mi_separation, None)

        else:
            if self.use_case_object.multiclass_flag:
                return np.array([(None, None)] * self.y_trues.shape[0]).reshape(-1, 2).tolist()
            mask = self.feature_masks[self.curr_p_var]
            maskFilter = mask != -1
            maskFilterNeg = mask == -1

            proportion_true = [
                np.sum(self.y_trues, 2, where=maskFilter),
                np.sum(1 - self.y_trues, 2, where=maskFilter),
            ]

            proportion_true_denom = maskFilter.sum(axis=2)
            proportion_true[0] = proportion_true[0] / proportion_true_denom
            proportion_true[1] = proportion_true[1] / proportion_true_denom

            proportion_true = np.stack(proportion_true, axis=2)
            e_y_true = -np.sum(proportion_true * ma.log(proportion_true), axis=2)
            self.e_y_true = e_y_true

            proportion_join = []

            y_trues_ma = np.ma.array(self.y_trues, mask=maskFilterNeg)
            mask_ma = np.ma.array(mask, mask=maskFilterNeg)
            cart_product = product([y_trues_ma, 1 - y_trues_ma], [mask_ma, 1 - mask_ma])
            proportion_join_denom = maskFilter.sum(axis=2)
            for i in cart_product:
                p = i[0] * i[1]
                proportion_join.append(np.sum(p, 2) / proportion_join_denom)

            proportion_join = np.stack(proportion_join, axis=2)
            e_y_true_curr_p_var = -np.sum(proportion_join * ma.log(proportion_join), axis=2)
            self.e_y_true_curr_p_var = e_y_true_curr_p_var
            proportion_join = []

            y_preds_ma = np.ma.array(self.y_preds, mask=maskFilterNeg)
            y_trues_ma = np.ma.array(self.y_trues, mask=maskFilterNeg)
            cart_product = product([y_preds_ma, 1 - y_preds_ma], [y_trues_ma, 1 - y_trues_ma])

            proportion_join_denom = maskFilter.sum(axis=2)
            for i in cart_product:
                p = i[0] * i[1]
                proportion_join.append(np.sum(p, 2) / proportion_join_denom)
            proportion_join = np.stack(proportion_join, axis=2)
            e_y_true_y_pred = -np.sum(proportion_join * ma.log(proportion_join), axis=2)
            self.e_y_true_y_pred = e_y_true_y_pred
            proportion_join = []

            cart_product = product(
                [y_trues_ma, 1 - y_trues_ma],
                [y_preds_ma, 1 - y_preds_ma],
                [mask_ma, 1 - mask_ma],
            )

            proportion_join_denom = maskFilter.sum(axis=2)
            for i in cart_product:
                p = i[0] * i[1] * i[2]
                proportion_join.append(np.sum(p, 2) / proportion_join_denom)
            proportion_join = np.stack(proportion_join, axis=2)
            e_y_true_y_pred_curr_p_var = -np.sum(proportion_join * ma.log(proportion_join), axis=2)
            self.e_y_true_y_pred_curr_p_var = e_y_true_y_pred_curr_p_var

            e_curr_p_var_y_true_conditional = e_y_true_curr_p_var - e_y_true
            mi_separation = (
                e_y_true_curr_p_var + e_y_true_y_pred - e_y_true_y_pred_curr_p_var - e_y_true
            ) / e_curr_p_var_y_true_conditional
            mi_separation = mi_separation.reshape(-1).tolist()

            return [(v, None) for v in mi_separation]

    def _compute_mi_sufficiency(self, **kwargs):
        """
        Compute Mutual Information sufficiency

        Returns
        ----------
        _compute_mi_sufficiency : list of tuple of floats
                Fairness metric value and privileged group metric value
        """
        if "y_pred_new" in kwargs:
            mask = self.feature_mask[self.curr_p_var]
            y_pred = kwargs["y_pred_new"][0]
            df = pd.DataFrame({"y_true": self.y_true, "y_pred": y_pred, "curr_p_var": mask})
            e_y_pred_curr_p_var = self._get_entropy(df, ["y_pred", "curr_p_var"])
            e_y_true_y_pred = self._get_entropy(df, ["y_true", "y_pred"])
            e_y_true_y_pred_curr_p_var = self._get_entropy(df, ["y_true", "y_pred", "curr_p_var"])
            e_y_pred = self._get_entropy(df, ["y_pred"])
            e_curr_p_var_y_pred_conditional = e_y_pred_curr_p_var - e_y_pred
            mi_sufficiency = (
                e_y_pred_curr_p_var + e_y_true_y_pred - e_y_true_y_pred_curr_p_var - e_y_pred
            ) / e_curr_p_var_y_pred_conditional
            return (mi_sufficiency, None)

        else:
            if self.use_case_object.multiclass_flag:
                return np.array([(None, None)] * self.y_trues.shape[0]).reshape(-1, 2).tolist()
            mask = self.feature_masks[self.curr_p_var]
            maskFilter = mask != -1
            maskFilterNeg = mask == -1

            proportion_pred = [
                np.sum(self.y_preds, 2, where=maskFilter),
                np.sum(1 - self.y_preds, 2, where=maskFilter),
            ]

            proportion_pred_denom = maskFilter.sum(axis=2)

            proportion_pred[0] = proportion_pred[0] / proportion_pred_denom
            proportion_pred[1] = proportion_pred[1] / proportion_pred_denom

            proportion_pred = np.stack(proportion_pred, axis=2)
            e_y_pred = -np.sum(proportion_pred * ma.log(proportion_pred), axis=2)
            self.e_y_pred = e_y_pred

            proportion_join = []

            y_trues_ma = np.ma.array(self.y_trues, mask=maskFilterNeg)
            y_preds_ma = np.ma.array(self.y_preds, mask=maskFilterNeg)
            cart_product = product([y_trues_ma, 1 - y_trues_ma], [y_preds_ma, 1 - y_preds_ma])
            proportion_join_denom = maskFilter.sum(axis=2)

            for i in cart_product:
                p = i[0] * i[1]
                proportion_join.append(np.sum(p, 2) / proportion_join_denom)
            proportion_join = np.stack(proportion_join, axis=2)
            e_y_true_y_pred = -np.sum(proportion_join * ma.log(proportion_join), axis=2)
            self.e_y_true_y_pred = e_y_true_y_pred

            proportion_join = []

            mask_ma = np.ma.array(mask, mask=maskFilterNeg)
            cart_product = product([y_preds_ma, 1 - y_preds_ma], [mask_ma, 1 - mask_ma])

            proportion_join_denom = maskFilter.sum(axis=2)
            for i in cart_product:
                p = i[0] * i[1]
                proportion_join.append(np.sum(p, 2) / proportion_join_denom)
            proportion_join = np.stack(proportion_join, axis=2)
            e_y_pred_curr_p_var = -np.sum(proportion_join * ma.log(proportion_join), axis=2)
            self.e_y_pred_curr_p_var = e_y_pred_curr_p_var

            proportion_join = []

            cart_product = product(
                [y_trues_ma, 1 - y_trues_ma],
                [y_preds_ma, 1 - y_preds_ma],
                [mask_ma, 1 - mask_ma],
            )
            proportion_join_denom = maskFilter.sum(axis=2)
            for i in cart_product:
                p = i[0] * i[1] * i[2]
                proportion_join.append(np.sum(p, 2) / proportion_join_denom)
            proportion_join = np.stack(proportion_join, axis=2)
            e_y_true_y_pred_curr_p_var = -np.sum(proportion_join * ma.log(proportion_join), axis=2)
            self.e_y_true_y_pred_curr_p_var = e_y_true_y_pred_curr_p_var

            e_curr_p_var_y_pred_conditional = e_y_pred_curr_p_var - e_y_pred
            mi_sufficiency = (
                e_y_pred_curr_p_var + e_y_true_y_pred - e_y_true_y_pred_curr_p_var - e_y_pred
            ) / e_curr_p_var_y_pred_conditional
            mi_sufficiency = mi_sufficiency.reshape(-1).tolist()

            return [(v, None) for v in mi_sufficiency]

    def _get_entropy(self, df, columns):
        """
        Compute the entropy

        Parameters
        -----------
        df : pandas.DataFrame
                Data set

        columns : list of strings
                Column names

        Returns
        -----------
        entropy_calc : float
                Entropy value
        """
        probabilities = (
            df.groupby(columns).size().reset_index(name="probability")["probability"] / df.shape[0]
        ).values[0:]
        entropy_calc = entropy(probabilities)
        return entropy_calc

    def _compute_rejected_harm(self, selection_threshold=None, **kwargs):
        """
        The Rejection Empirical Lift is Empirical Lift of the Marketing Rejection Uplift Model
        Computes the difference in rejection rates between treatment and control groups

        Parameters
        -----------
        selection_threshold : float, default = None

        Other Parameters
        ----------
        y_prob_new : numpy.ndarray
            Copy of predicted probabilities as returned by classifier.

        Returns
        ----------
        _compute_rejected_harm : tuple of floats
                Fairness metric value and privileged group metric value
        """
        if selection_threshold is None:
            selection_threshold = self.use_case_object.selection_threshold

        mask_list = self.feature_mask[self.curr_p_var]
        mask_p = mask_list == 1
        mask_up = mask_list == 0
        e_lift = self.e_lift
        pred_outcome = self.pred_outcome

        if pred_outcome is None or e_lift is None:
            return (None, None)

        if "y_prob_new" in kwargs:
            y_prob = kwargs["y_prob_new"]
            e_lift = self.use_case_object._get_e_lift(y_pred_new=y_prob[1])
            pred_outcome = self.use_case_object._compute_pred_outcome(y_pred_new=y_prob)

        def _rej_harm(pred_outcome, selection_threshold, e_lift, mask_list):
            bools = np.array([i > selection_threshold for i in e_lift])[mask_list]
            pRcT = pred_outcome["rej_treatment"][(mask_list)][(bools)]
            pRcC = pred_outcome["rej_control"][(mask_list)][(bools)]
            reject_harm = sum(pRcT - pRcC) / len(bools)
            return reject_harm

        rej_harm_p = _rej_harm(pred_outcome, selection_threshold, e_lift, mask_p)
        rej_harm_u = _rej_harm(pred_outcome, selection_threshold, e_lift, mask_up)

        return ((rej_harm_p - rej_harm_u), rej_harm_p)

    def _compute_benefit_from_acquiring(self, selection_threshold=None, **kwargs):
        """
        Acquiring Empirical Lift is Empirical Lift of the Marketing Product Uplift Model.
        Computes the difference of ratios of acquired&applied count to applied in deployment to ratio of acquired count in control sample to be calculated for each class or the percentiles of continuous feature.

        Parameters
        -----------
        selection_threshold : float, default = None

        Other Parameters
        ----------
        y_prob_new : numpy.ndarray
                Copy of predicted probabilities as returned by classifier.

        Returns
        ----------
        _compute_rejected_harm : tuple of floats
                Fairness metric value and privileged group metric value
        """
        if selection_threshold is None:
            selection_threshold = self.use_case_object.selection_threshold

        mask_list = self.feature_mask[self.curr_p_var]
        mask_p = mask_list == 1
        mask_up = mask_list == 0
        e_lift = self.e_lift
        pred_outcome = self.pred_outcome

        if pred_outcome is None or e_lift is None:
            return (None, None)

        if "y_prob_new" in kwargs:
            y_prob = kwargs["y_prob_new"]
            e_lift = self.use_case_object._get_e_lift(y_pred_new=y_prob[1])
            pred_outcome = self.use_case_object._compute_pred_outcome(y_pred_new=y_prob)

        def _acq_benefit(pred_outcome, selection_threshold, e_lift, mask_list):
            bools = np.array([i > selection_threshold for i in e_lift])[mask_list]
            pRcT = pred_outcome["acq_treatment"][mask_list][bools]
            pRcC = pred_outcome["acq_control"][mask_list][bools]
            benefit_acq = sum(pRcT - pRcC) / len(bools)
            return benefit_acq

        benefit_acq_p = _acq_benefit(pred_outcome, selection_threshold, e_lift, mask_p)
        benefit_acq_u = _acq_benefit(pred_outcome, selection_threshold, e_lift, mask_up)

        return ((benefit_acq_p - benefit_acq_u), benefit_acq_p)

    def _consistency_score(self, **kwargs):
        """
        Individual fairness metric that measures how similar the labels are for similar instances.
        Computes the overall mean of the difference between an outcome of a sample and mean outcome of neigbours.

        Returns
        ----------
        _consistency_score : float
                Individual fairness metric value
        """

        if (self.use_case_object.model_params[0].x_test is None) or (
            self.use_case_object.model_params[0].y_pred is None
        ):
            return None

        x_test = self.prefit_processing(self.use_case_object.model_params[0].x_test)
        n_neighbors = 5
        # learn a KNN on the features
        nbrs = NearestNeighbors(n_neighbors=n_neighbors, algorithm="kd_tree", n_jobs=-1)
        nbrs.fit(x_test)
        indices = nbrs.kneighbors(x_test, return_distance=False)
        # compute consistency score
        consistency_score = (
            1
            - abs(
                self.use_case_object.model_params[0].y_pred
                - self.use_case_object.model_params[0].y_pred[indices].mean(axis=1)
            ).mean()
        )
        return consistency_score

    def prefit_processing(self, df):
        """
        Preprocessing dataframes before fitting to a model (e.g. sklearn.neighbors.NearestNeighbors) .
        It consists of imputing missing values with most frequent strategy and converting categorical values to numerical.

        Parameters
        -----------
        df : pd.DataFrame

        Returns
        ----------
        df : pd.DataFrame
                Processed DataFrame
        """
        # Find columns with missing values and impute them
        for col in df.columns[df.isna().any()].tolist():
            imp = SimpleImputer(missing_values=pd.NA, strategy="most_frequent")
            col_dtype = df[col].dtype
            if isinstance(col_dtype, pd.CategoricalDtype):
                col_dtype = "category"

            df[col] = imp.fit_transform(df[[col]])
            df[col] = df[col].astype(col_dtype)

        # Find columns containing categorical values and convert to numerical
        for col in df.select_dtypes(include=["object_", "category"]).columns:
            ord_enc = OrdinalEncoder()
            df[col] = ord_enc.fit_transform(df[[col]])

        return df
