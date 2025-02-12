import concurrent.futures
from copy import deepcopy

import numpy as np
import pandas as pd
from numpy import ma
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    brier_score_loss,
    confusion_matrix,
    log_loss,
    mean_absolute_percentage_error,
    mean_squared_error,
    roc_auc_score,
)
from sklearn.preprocessing import LabelBinarizer

from ..config.constants import Constants
from ..util.utility import check_multiprocessing
from .newmetric import NewMetric


class PerformanceMetrics:
    """
    A class that computes all the performance metrics

    Class Attributes
    ------------------------
    map_perf_metric_to_group : dict
            Maps the performance metric names to their corresponding full names, metric group eg classification or regression metric types, whether it can be a primary metric, and its dependency on y_pred/y_prob.
    """

    map_perf_metric_to_group = {
        "selection_rate": ("Selection Rate", "classification", True, "y_pred"),
        "accuracy": ("Accuracy", "classification", True, "y_pred"),
        "balanced_acc": ("Balanced Accuracy", "classification", True, "y_pred"),
        "recall": ("Recall", "classification", True, "y_pred"),
        "precision": ("Precision", "classification", True, "y_pred"),
        "f1_score": ("F1 Score", "classification", True, "y_pred"),
        "tnr": ("True Negative Rate", "classification", True, "y_pred"),
        "fnr": ("False Negative Rate", "classification", True, "y_pred"),
        "npv": ("Negative Predictive Value", "classification", True, "y_pred"),
        "roc_auc": ("ROC AUC Score", "classification", True, "y_prob"),
        "log_loss": ("Log-loss", "classification", True, "y_prob"),
        "rmse": ("Root Mean Squared Error", "regression", True, "y_pred"),
        "mape": ("Mean Absolute Percentage Error", "regression", True, "y_pred"),
        "wape": ("Weighted Absolute Percentage Error", "regression", True, "y_pred"),
        "emp_lift": ("Empirical Lift", "uplift", True, "y_prob"),
        "expected_profit": ("Expected Profit Lift", "uplift", True, "y_prob"),
        "expected_selection_rate": (
            "Expected Selection Rate",
            "uplift",
            True,
            "y_prob",
        ),
    }

    @staticmethod
    def add_user_defined_metrics():
        # to get cutomized metrics inherited from NewMetric class
        for metric in NewMetric.__subclasses__():
            if metric.enable_flag is True and metric.metric_type == "perf":
                PerformanceMetrics.map_perf_metric_to_group[metric.metric_name] = (
                    metric.metric_definition,
                    metric.metric_group,
                    True,
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
        map_perf_metric_to_method : dict
                Maps the performance metric names to their corresponding functions.

        result : dict of dict, default=None
                Stores the following:
                - percentage distribution of classes (dictionary)
                - every performance metric named inside the include_metrics list together with its associated confidence interval (dictionary)
                - calibration curve (dictionary)
                - performance dynamic values (dictionary)

        y_true : numpy.ndarray, default=None
                Ground truth target values.

        y_pred : numpy.ndarray, default=None
                Predicted targets as returned by classifier.

        y_train :numpy.ndarray, default=None
                Ground truth for training data.

        y_prob : numpy.ndarray, default=None
                Predicted probabilities as returned by classifier.
                For uplift models, L = 4. Else, L = 1 where shape is (n_samples, L)

        sample_weight : numpy.ndarray, default=None
                Used to normalize y_true & y_pred.

        perf_metric_name : str, default=None
                Performance metric name

        _use_case_metrics : dict of lists, default=None
                Contains all the performance & fairness metrics for a use case.
                Dynamically assigned during initialisation by using the _metric_group_map in Fairness/Performance Metrics class and the _model_type_to_metric.

        revenue : float, default=None
                Revenue gained per customer

        treatment_cost : float, default=None
                Cost of the marketing treatment per customer

        label_size : int, default=None
                Number of labels allowed
        """
        self.result = None

        self.map_perf_metric_to_method = {
            "rmse": self._compute_rmse,
            "mape": self._compute_mape,
            "wape": self._compute_wape,
            "emp_lift": self._compute_emp_lift,
            "expected_profit": self._compute_expected_profit,
            "expected_selection_rate": self._compute_expected_selection_rate,
        }
        self.map_perf_metric_to_method_optimized = {
            "selection_rate": self._compute_selection_rate,
            "accuracy": self._compute_accuracy,
            "balanced_acc": self._compute_balanced_accuracy,
            "recall": self._compute_recall,
            "precision": self._compute_precision,
            "f1_score": self._compute_f1_score,
            "tnr": self._compute_tnr,
            "fnr": self._compute_fnr,
            "npv": self._compute_negative_predictive_value,
            "roc_auc": self._compute_roc_auc_score,
            "log_loss": self._compute_log_loss,
        }

        for metric in NewMetric.__subclasses__():
            if metric.enable_flag is True and metric.metric_type == "perf":
                self.map_perf_metric_to_method[metric.metric_name] = metric.compute
                self.map_perf_metric_to_group[metric.metric_name] = (
                    metric.metric_definition,
                    metric.metric_group,
                    True,
                    metric.metric_reqt,
                )
                if metric.metric_name not in use_case_object._use_case_metrics["perf"]:
                    use_case_object._use_case_metrics["perf"].append(metric.metric_name)

        self.y_true = None
        self.y_prob = None
        self.y_pred = None
        self.y_train = None
        self.sample_weight = None
        self.perf_metric_name = None
        self._use_case_metrics = None
        self.treatment_cost = None
        self.revenue = None
        self.label_size = None
        self.use_case_object = use_case_object

    def _check_y_prob_pred(self):
        """
        Checks performance metric depedency on y_pred or y_prob, and raises error if mismatched.
        """
        if (
            self.perf_metric_name is not None
            and PerformanceMetrics.map_perf_metric_to_group[self.perf_metric_name][3] == "y_prob"
            and self.model_params[0].y_prob is None
        ):
            self.err.push(
                "value_error",
                var_name="perf_metric_name",
                given=self.perf_metric_name,
                expected="y_prob",
                function_name="_check_y_prob_pred",
            )
            self.err.pop()
        if (
            self.perf_metric_name is not None
            and PerformanceMetrics.map_perf_metric_to_group[self.perf_metric_name][3] == "y_pred"
            and self.model_params[0].y_pred is None
        ):
            self.err.push(
                "value_error",
                var_name="perf_metric_name",
                given=self.perf_metric_name,
                expected="y_pred",
                function_name="_check_y_prob_pred",
            )
            self.err.pop()

    def execute_all_perf(self, n_threads, seed, eval_pbar, disable=[]):
        """
        Computes the following:
                - every performance metric named inside the include_metrics list together with its associated confidence interval (dictionary)
                - calibration brier loss score (float)
                - percentage distribution of classes (dictionary)
                - performance dynamic values (dictionary)
                - weighted confusion matrix (dictionary)

        Parameters
        ----------
        n_threads : int
                Number of currently active threads of a job

        seed : int
                Used to initialize the random number generator.

        eval_pbar : tqdm object
                Progress bar

        Returns
        ----------
        self.result : dict of lists
                Stores the class distribution, weighted confusion matrix, performance metric values and performance dynamics results
        """

        self.perf_metric_name = self.use_case_object.perf_metric_name
        self._use_case_metrics = self.use_case_object._use_case_metrics
        self.y_train = [model.y_train for model in self.use_case_object.model_params]
        # initialize result structure
        self.result = {}
        self.result["perf_metric_values"] = {}
        for j in self._use_case_metrics["perf"]:
            if j in list(self.map_perf_metric_to_method.keys()) + list(self.map_perf_metric_to_method_optimized.keys()):
                self.result["perf_metric_values"][j] = []
        # update progress bar by 10
        eval_pbar.update(10)

        n_threads = check_multiprocessing(n_threads)
        n = len(self.use_case_object.model_params[0].y_true)
        # split k into k-1 times of random indexing compute and 1 time of original array compute
        if n_threads >= 1 and self.use_case_object.k > 1:
            indices = []
            np.random.seed(seed)
            for ind in range(self.use_case_object.k - 1):
                indices.append(np.random.choice(n, n, replace=True))

            threads = []
            indexes = []
            for i in range(n_threads):
                indexes.append([])
                for x in indices[i::n_threads]:
                    indexes[i].append(x)

            worker_progress = 24 / n_threads
            with concurrent.futures.ThreadPoolExecutor(max_workers=n_threads) as executor:
                # iterate through protected variables to drop one by one as part of leave-on-out
                for k in range(n_threads):
                    if n_threads == 1:
                        metric_obj = self
                    else:
                        metric_obj = deepcopy(self)
                    # submit each thread's work to thread pool
                    if len(indexes[k]) > 0:
                        threads.append(
                            executor.submit(
                                PerformanceMetrics._execute_all_perf_map,
                                metric_obj=metric_obj,
                                index=indexes[k],
                                eval_pbar=eval_pbar,
                                worker_progress=worker_progress,
                            )
                        )

                if n_threads != 1:
                    # retrive results from each thread
                    for thread in threads:
                        for key, v in thread.result().items():
                            self.result["perf_metric_values"][key] = self.result["perf_metric_values"][key] + v
        else:
            # if multithreading is not triggered, directly update the progress bar by 24
            eval_pbar.update(24)

        # run 1 time of original array to compute performance metrics
        PerformanceMetrics._execute_all_perf_map(self, [np.arange(n)], eval_pbar, 1)
        # generate the final performace metrics values and their CI based on k times of computation
        for j in self.result["perf_metric_values"].keys():
            if self.result["perf_metric_values"][j][-1] is None:
                self.result["perf_metric_values"][j] = (None, None)
            else:
                self.result["perf_metric_values"][j] = (
                    self.result["perf_metric_values"][j][-1],
                    2 * np.nanstd(np.array(self.result["perf_metric_values"][j], dtype=float)),
                )
        self.label_size = self.use_case_object._model_type_to_metric_lookup[
            self.use_case_object.model_params[0].model_type
        ][1]
        self.result["class_distribution"] = self._get_class_distribution(
            self.y_true[-1], self.use_case_object.model_params[-1].pos_label2
        )
        self.result["weighted_confusion_matrix"] = {
            "tp": self.tp_s[0][0],
            "fp": self.fp_s[0][0],
            "tn": self.tn_s[0][0],
            "fn": self.fn_s[0][0],
        }
        self.result["calibration_curve"] = (
            self._calibration_func(self.y_true[0], self.y_prob[0], n_bins=10)
            if "calibration_curve" not in disable
            else None
        )
        self.result["perf_dynamic"] = self._performance_dynamics() if "perf_dynamic" not in disable else None
        eval_pbar.update(6)

    def _execute_all_perf_map(metric_obj, index, eval_pbar, worker_progress):
        """
        Maps each thread's work for execute_all_perf()
        Parameters
        ----------
        metric_obj : PerformanceMetrics object
        index : list
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
        metric_obj.y_onehot_trues = []
        metric_obj.y_onehot_preds = []

        for idx in index:
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

            metric_obj.y_trues.append(metric_obj.y_true)
            metric_obj.y_probs.append(metric_obj.y_prob)
            metric_obj.y_preds.append(metric_obj.y_pred)
            metric_obj.sample_weights.append(metric_obj.sample_weight)

            if metric_obj.use_case_object.multiclass_flag:
                metric_obj.y_onehot_true = [model.enc_y_true[idx] for model in metric_obj.use_case_object.model_params]
                metric_obj.y_onehot_pred = [model.enc_y_pred[idx] for model in metric_obj.use_case_object.model_params]
                metric_obj.y_onehot_trues.append(metric_obj.y_onehot_true)
                metric_obj.y_onehot_preds.append(metric_obj.y_onehot_pred)

            for j in metric_obj._use_case_metrics["perf"]:
                if j in metric_obj.map_perf_metric_to_method.keys():
                    metric_obj.result["perf_metric_values"][j].append(
                        metric_obj.map_perf_metric_to_method[j](obj=metric_obj)
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

        if not metric_obj.use_case_object.multiclass_flag:
            (
                metric_obj.tp_s,
                metric_obj.fp_s,
                metric_obj.tn_s,
                metric_obj.fn_s,
            ) = PerformanceMetrics._translate_confusion_matrix(
                metric_obj,
                metric_obj.y_trues,
                metric_obj.y_preds,
                metric_obj.sample_weights,
            )

        else:
            (
                metric_obj.tp_s,
                metric_obj.fp_s,
                metric_obj.tn_s,
                metric_obj.fn_s,
            ) = PerformanceMetrics._translate_confusion_matrix(
                metric_obj,
                metric_obj.y_onehot_trues,
                metric_obj.y_onehot_preds,
                metric_obj.sample_weights,
            )

        with np.errstate(divide="ignore", invalid="ignore"):
            for j in metric_obj._use_case_metrics["perf"]:
                if j in metric_obj.map_perf_metric_to_method_optimized.keys():
                    metric_obj.result["perf_metric_values"][j] += metric_obj.map_perf_metric_to_method_optimized[j](
                        obj=metric_obj
                    )

        return metric_obj.result["perf_metric_values"]

    def _one_hot_encode(y_true, y_pred):
        """
        Performs one-hot encoding on y_true and y_pred.

        Parameters
        ----------
        y_true : list, numpy.ndarray or pandas.Series
                Ground truth target values.

        y_pred : list, numpy.ndarray, pandas.Series
                Predicted targets as returned by classifier.

        Returns
        ----------
        y_onehot_true : numpy.ndarray
                One-hot encoded ground truth target values.

        y_onehot_pred : numpy.ndarray
                One-hot encoded predicted targets as returned by classifier.
        """
        y_onehot_true = []
        y_onehot_pred = []
        for y_true_sample, y_pred_sample in zip(y_true, y_pred):
            label_binarizer = LabelBinarizer().fit(y_true_sample[0])
            y_onehot_true.append(label_binarizer.transform(y_true_sample[0]))
            y_onehot_pred.append(label_binarizer.transform(y_pred_sample[0]))

        y_onehot_true = np.array(y_onehot_true)
        y_onehot_true = y_onehot_true.reshape(len(y_onehot_true), 1, -1, len(label_binarizer.classes_))
        y_onehot_pred = np.array(y_onehot_pred)
        y_onehot_pred = y_onehot_pred.reshape(len(y_onehot_pred), 1, -1, len(label_binarizer.classes_))

        return y_onehot_true, y_onehot_pred

    def _translate_confusion_matrix(metric_obj, y_true, y_pred, sample_weight):
        """
        Translates confusion matrix based on entire dataset

        Parameters
        ----------
        metric_obj : object
                PerformanceMetrics object

        y_true : list, numpy.ndarray or pandas.Series
                Ground truth target values.

        y_pred : list, numpy.ndarray, pandas.Series
                Predicted targets as returned by classifier.

        sample_weight : numpy.ndarray, default=None
                Used to normalize y_true & y_pred.

        Returns
        ----------
        Confusion matrix metrics for the entire dataset
        """
        if metric_obj.use_case_object.multiclass_flag:
            if len(y_true.shape) == 3:
                y_onehot_true, y_onehot_pred = PerformanceMetrics._one_hot_encode(y_true, y_pred)
            else:
                y_onehot_true = y_true
                y_onehot_pred = y_pred

            tp_s_total = 0
            fp_s_total = 0
            tn_s_total = 0
            fn_s_total = 0

            ohe_classes_ = metric_obj.use_case_object.classes_

            for idx, _ in enumerate(ohe_classes_):
                y_trues = y_onehot_true[:, :, :, idx]
                y_preds = y_onehot_pred[:, :, :, idx]

                (
                    tp_s,
                    fp_s,
                    tn_s,
                    fn_s,
                ) = metric_obj.use_case_object._get_confusion_matrix_optimized(y_trues, y_preds, sample_weight)

                tp_s_total += tp_s
                fp_s_total += fp_s
                tn_s_total += tn_s
                fn_s_total += fn_s
        else:
            (
                tp_s_total,
                fp_s_total,
                tn_s_total,
                fn_s_total,
            ) = metric_obj.use_case_object._get_confusion_matrix_optimized(y_true, y_pred, sample_weight)

        return tp_s_total, fp_s_total, tn_s_total, fn_s_total

    def translate_metric(self, metric_name, **kwargs):
        """
        Computes the primary performance metric value with its confidence interval for the feature importance section.
        This function does not support rejection inference.

        Parameters
        ----------
        metric_name : str
            Name of fairness metric

        Other parameters
        -----------
        kwargs : list

        Returns
        ----------
        perf_metric_values : dict of tuples
            Stores both the performance metric value and the corresponding confidence interval for every metric in include_metrics
        """
        if metric_name in self.map_perf_metric_to_method.keys():
            return self.map_perf_metric_to_method[metric_name](**kwargs)
        if metric_name in self.map_perf_metric_to_method_optimized.keys():
            return self.map_perf_metric_to_method_optimized[metric_name](**kwargs)

    def _compute_selection_rate(self, **kwargs):
        """
        Computes the selection_rate value

        Returns
        ----------
        _compute_accuracy : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                self.use_case_object.perf_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
            )
            selection_rate = (tp + fp) / (tp + tn + fp + fn)
            return selection_rate[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            selection_rate = (tp + fp) / (tp + tn + fp + fn)
            return selection_rate[0][0]
        else:
            selection_rate = (self.tp_s + self.fp_s) / (self.tp_s + self.tn_s + self.fp_s + self.fn_s)
            return selection_rate.reshape(-1).tolist()

    def _compute_accuracy(self, **kwargs):
        """
        Computes the accuracy value

        Returns
        ----------
        _compute_accuracy : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            if self.use_case_object.multiclass_flag:
                accuracy = PerformanceMetrics.get_multiclass_accuracy(
                    np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                    np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                )
            else:
                tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                    self.use_case_object.perf_metric_obj,
                    y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                    y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                    sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                )
                accuracy = (tp + tn) / (tp + tn + fp + fn)
            return accuracy[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            accuracy = (tp + tn) / (tp + tn + fp + fn)
            return accuracy[0][0]
        else:
            if self.use_case_object.multiclass_flag:
                accuracy = PerformanceMetrics.get_multiclass_accuracy(self.y_trues, self.y_preds)
            else:
                accuracy = (self.tp_s + self.tn_s) / (self.tp_s + self.tn_s + self.fp_s + self.fn_s)
            return accuracy.reshape(-1).tolist()

    def get_multiclass_accuracy(y_true, y_pred):
        accuracy_mul = y_true == y_pred
        accuracy_mul = accuracy_mul.sum(axis=2) / accuracy_mul.shape[2]
        return accuracy_mul

    def get_confusion_matrix_multiclass(y_true, y_pred):
        cms = []
        for idx in range(y_true.shape[0]):
            C = confusion_matrix(y_true[idx][0], y_pred[idx][0])
            cms.append(C)
        cms = np.array(cms)
        return cms

    def get_multiclass_bal_accuracy(cms):
        scores = []

        for cm in cms:
            per_class = np.diag(cm) / cm.sum(axis=1)
            score = np.mean(per_class)
            scores.append(score)

        scores = np.array(scores).reshape(len(cms), 1, -1)

        return scores

    def _compute_balanced_accuracy(self, **kwargs):
        """
        Computes balanced accuracy score

        Returns
        ----------
        _compute_balanced_accuracy : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            if self.use_case_object.multiclass_flag:
                cm = PerformanceMetrics.get_confusion_matrix_multiclass(
                    np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                    np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                )
                balanced_accuracy = PerformanceMetrics.get_multiclass_bal_accuracy(cm)[0]
            else:
                tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                    self.use_case_object.perf_metric_obj,
                    y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                    y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                    sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
                )
                balanced_accuracy = ((tp / (tp + fn)) + (tn / (tn + fp))) / 2
            return balanced_accuracy[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            balanced_accuracy = ((tp / (tp + fn)) + (tn / (tn + fp))) / 2
            return balanced_accuracy[0][0]
        else:
            if self.use_case_object.multiclass_flag:
                cms = PerformanceMetrics.get_confusion_matrix_multiclass(self.y_trues, self.y_preds)
                balanced_accuracy = PerformanceMetrics.get_multiclass_bal_accuracy(cms)
            else:
                balanced_accuracy = ((self.tp_s / (self.tp_s + self.fn_s)) + (self.tn_s / (self.tn_s + self.fp_s))) / 2
            return balanced_accuracy.reshape(-1).tolist()

    def _compute_f1_score(self, **kwargs):
        """
        Computes F1 score

        Returns
        ----------
        _compute_f1_score : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                self.use_case_object.perf_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
            )
            f1_scr = 2 * ((tp / (tp + fp)) * (tp / (tp + fn))) / ((tp / (tp + fp)) + tp / (tp + fn))
            return f1_scr[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            f1_scr = 2 * ((tp / (tp + fp)) * (tp / (tp + fn))) / ((tp / (tp + fp)) + tp / (tp + fn))
            return f1_scr[0][0]
        else:
            f1_scr = (
                2
                * ((self.tp_s / (self.tp_s + self.fp_s)) * (self.tp_s / (self.tp_s + self.fn_s)))
                / ((self.tp_s / (self.tp_s + self.fp_s)) + self.tp_s / (self.tp_s + self.fn_s))
            )
            return f1_scr.reshape(-1).tolist()

    def _compute_precision(self, **kwargs):
        """
        Computes the precision

        Returns
        ----------
        _compute_precision : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                self.use_case_object.perf_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
            )
            precision = tp / (tp + fp)
            return precision[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            precision = tp / (tp + fp)
            return precision[0][0]
        else:
            precision = self.tp_s / (self.tp_s + self.fp_s)
            return precision.reshape(-1).tolist()

    def _compute_recall(self, **kwargs):
        """
        Computes the recall

        Returns
        ----------
        _compute_recall : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                self.use_case_object.perf_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
            )
            recall = tp / (tp + fn)
            return recall[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            recall = tp / (tp + fn)
            return recall[0][0]
        else:
            recall = self.tp_s / (self.tp_s + self.fn_s)
            return recall.reshape(-1).tolist()

    def _compute_tnr(self, **kwargs):
        """
        Computes the true negative rate or specificity

        Returns
        ----------
        _compute_tnr : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                self.use_case_object.perf_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
            )
            tnr = tn / (tn + fp)
            return tnr[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            tnr = tn / (tn + fp)
            return tnr[0][0]
        else:
            tnr = self.tn_s / (self.tn_s + self.fp_s)
            return tnr.reshape(-1).tolist()

    def _compute_fnr(self, **kwargs):
        """
        Computes the false negative rate or miss-rate

        Returns
        ----------
        _compute_fnr : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                self.use_case_object.perf_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
            )
            fnr = fn / (tp + fn)
            return fnr[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            fnr = fn / (tp + fn)
            return fnr[0][0]
        else:
            fnr = self.fn_s / (self.tp_s + self.fn_s)
            return fnr.reshape(-1).tolist()

    def _compute_emp_lift(self, selection_threshold=None, **kwargs):
        """
        Computes empirical lift between treatment and control group

        Parameters
        ----------
        selection_threshold : float, default = None

        Other Parameters
        ----------
        y_prob_new : numpy.ndarray
            Copy of predicted probabilities as returned by classifier.

        Returns
        ----------
        _compute_emp_lift : float
                The performance metric value
        """
        if "y_prob_new" in kwargs:
            y_prob = kwargs["y_prob_new"]
            e_lift = self.use_case_object._get_e_lift(y_pred_new=y_prob[1])
            y_true = self.use_case_object.model_params[1].y_true

        elif ("subgrp_e_lift" in kwargs) and ("subgrp_y_true" in kwargs):
            e_lift = kwargs["subgrp_e_lift"]
            y_true = kwargs["subgrp_y_true"]

        else:
            e_lift = self.e_lift
            y_true = self.y_true[1]

        if e_lift is None:
            return (None, None)

        if selection_threshold is None:
            selection_threshold = self.use_case_object.selection_threshold

        bools = [i > selection_threshold for i in e_lift]
        Ntr = sum(y_true[bools] == "TR")
        Ntn = sum(y_true[bools] == "TN")
        pRcT = Ntr / (Ntr + Ntn)
        Ncr = sum(y_true[bools] == "CR")
        Ncn = sum(y_true[bools] == "CN")
        pRcC = Ncr / (Ncr + Ncn)
        emp_lift = pRcT - pRcC

        return emp_lift

    def _compute_expected_profit(self, selection_threshold=None, **kwargs):
        """
        Computes expected profit from the revenue and cost values

        Parameters
        ----------
        selection_threshold : float, default=None

        Other Parameters
        ----------
        y_prob_new : numpy.ndarray
            Copy of predicted probabilities as returned by classifier.

        Returns
        ----------
        _compute_expected_profit : float
                The performance metric value
        """
        if (
            self.use_case_object.spl_params["revenue"] is None
            or self.use_case_object.spl_params["treatment_cost"] is None
        ):
            return None

        if "y_prob_new" in kwargs:
            y_prob = kwargs["y_prob_new"]
            e_lift = self.use_case_object._get_e_lift(y_pred_new=y_prob[1])
            pred_outcome = self.use_case_object._compute_pred_outcome(y_pred_new=y_prob)
        elif ("subgrp_e_lift" in kwargs) and ("subgrp_y_prob" in kwargs):
            e_lift = kwargs["subgrp_e_lift"]
            y_prob = kwargs["subgrp_y_prob"]
            pred_outcome = self.use_case_object._compute_pred_outcome(y_pred_new=y_prob)
        else:
            e_lift = self.e_lift
            pred_outcome = self.pred_outcome

        if pred_outcome is None or e_lift is None:
            return None

        if selection_threshold is None:
            selection_threshold = self.use_case_object.selection_threshold

        bools = [i > selection_threshold for i in e_lift]
        pRcT = pred_outcome["acq_treatment"][bools]
        pRcC = pred_outcome["acq_control"][bools]
        profit_RcT = (
            pRcT * self.use_case_object.spl_params["revenue"] - self.use_case_object.spl_params["treatment_cost"]
        )
        profit_RcC = pRcC * self.use_case_object.spl_params["revenue"]
        profit = sum(profit_RcT - profit_RcC)

        return profit

    def _compute_expected_selection_rate(self, selection_threshold=None, **kwargs):
        """
        Computes expected selection rate

        Parameters
        ----------
        selection_threshold : float, default=None

        Other Parameters
        ----------
        y_prob_new : numpy.ndarray
            Copy of predicted probabilities as returned by classifier.

        Returns
        ----------
        _compute_expected_selection_rate : float
            The performance metric value
        """
        if "y_prob_new" in kwargs:
            y_prob = kwargs["y_prob_new"]
            e_lift = self.use_case_object._get_e_lift(y_pred_new=y_prob[1])
        elif "subgrp_e_lift" in kwargs:
            e_lift = kwargs["subgrp_e_lift"]
        else:
            e_lift = self.e_lift

        if e_lift is None:
            return None

        if selection_threshold is None:
            selection_threshold = self.use_case_object.selection_threshold

        bools = [i > selection_threshold for i in e_lift]
        bools_avg = sum(bools) / len(bools)
        return bools_avg

    def _compute_negative_predictive_value(self, **kwargs):
        """
        Computes the negative predictive value

        Returns
        ----------
        _compute_negative_predictive_value : list of float
                The performance metric value
        """
        if "y_pred_new" in kwargs:
            tp, fp, tn, fn = PerformanceMetrics._translate_confusion_matrix(
                self.use_case_object.perf_metric_obj,
                y_true=np.array(self.use_case_object.model_params[0].y_true).reshape(1, 1, -1),
                y_pred=np.array(kwargs["y_pred_new"][0]).reshape(1, 1, -1),
                sample_weight=np.array(self.use_case_object.model_params[0].sample_weight).reshape(1, 1, -1),
            )
            npv = tn / (tn + fn)
            return npv[0][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            tp, fp, tn, fn = self.use_case_object._get_confusion_matrix_optimized(
                y_true=y_true.reshape(1, 1, -1),
                y_pred=y_pred.reshape(1, 1, -1),
                sample_weight=None,
            )
            npv = tn / (tn + fn)
            return npv[0][0]
        else:
            npv = self.tn_s / (self.tn_s + self.fn_s)
            return npv.reshape(-1).tolist()

    def _compute_rmse(self, **kwargs):
        """
        Computes root mean squared error

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_rmse : float
                The performance metric value
        """

        if "y_pred_new" in kwargs:
            y_true = self.use_case_object.model_params[0].y_true
            y_pred = kwargs["y_pred_new"][0]
            rmse = (
                mean_squared_error(
                    y_true=y_true,
                    y_pred=y_pred,
                    sample_weight=self.use_case_object.model_params[0].sample_weight,
                )
                ** 0.5
            )
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            rmse = mean_squared_error(y_true=y_true, y_pred=y_pred) ** 0.5
        else:
            y_true = self.y_true[0]
            y_pred = self.y_pred[0]
            rmse = mean_squared_error(y_true=y_true, y_pred=y_pred, sample_weight=self.sample_weight[0]) ** 0.5

        return rmse

    def _compute_mape(self, **kwargs):
        """
        Computes the mean absolute percentage error

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_mape : float
                The performance metric value
        """

        if "y_pred_new" in kwargs:
            y_true = self.use_case_object.model_params[0].y_true
            y_pred = kwargs["y_pred_new"][0]
            mape = mean_absolute_percentage_error(
                y_true=y_true,
                y_pred=y_pred,
                sample_weight=self.use_case_object.model_params[0].sample_weight,
            )
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
            mape = mean_absolute_percentage_error(y_true=y_true, y_pred=y_pred)
        else:
            y_true = self.y_true[0]
            y_pred = self.y_pred[0]
            mape = mean_absolute_percentage_error(y_true=y_true, y_pred=y_pred, sample_weight=self.sample_weight[0])
        return mape

    def _compute_wape(self, **kwargs):
        """
        Computes the weighted average percentage error

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray
            Copy of predicted targets as returned by classifier.

        Returns
        ----------
        _compute_wape : float
                The performance metric value
        """

        if "y_pred_new" in kwargs:
            y_true = self.use_case_object.model_params[0].y_true
            y_pred = kwargs["y_pred_new"][0]
        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_pred" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_pred = kwargs["subgrp_y_pred"]
        else:
            y_true = self.y_true[0]
            y_pred = self.y_pred[0]

        wape = np.sum(np.absolute(np.subtract(y_true, y_pred))) / np.sum(y_true)

        return wape

    def _compute_roc_auc_score(self, **kwargs):
        """
        Computes the ROC score

        Returns
        ----------
        _compute_roc_auc_score : list of float
                The performance metric value
        """
        if "y_prob_new" in kwargs:
            y_true = self.use_case_object.model_params[0].y_true
            y_prob = kwargs["y_prob_new"][0]
            if len(np.unique(y_true)) == 1 or np.all(np.isnan(y_prob)):
                return None
            y_true = y_true.reshape(1, 1, -1)
            if self.use_case_object.multiclass_flag:
                ohe_classes_ = self.use_case_object.classes_
                y_prob = y_prob.reshape(1, 1, -1, len(ohe_classes_))
                enc_y_true = self.use_case_object.model_params[0].enc_y_true.reshape(1, 1, -1, len(ohe_classes_))
                TPR, FPR = PerformanceMetrics._compute_TPR_FPR(self, enc_y_true, y_prob, True)
            else:
                y_prob = y_prob.reshape(1, 1, -1)
                TPR, FPR = PerformanceMetrics._compute_TPR_FPR(self, y_true, y_prob, False)

            roc_auc = np.trapz(TPR, FPR, axis=2)

            return roc_auc[0][0]

        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_prob" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_prob = kwargs["subgrp_y_prob"]
            if len(np.unique(y_true)) == 1 or np.all(np.isnan(y_prob)):
                return None
            roc_auc = roc_auc_score(y_true=y_true, y_score=y_prob)
            return roc_auc

        else:
            if all(v[0] is None for v in self.y_probs):
                return np.array([None] * self.y_trues.shape[0]).reshape(-1).tolist()

            if self.use_case_object.multiclass_flag:
                TPR, FPR = PerformanceMetrics._compute_TPR_FPR(self, self.y_onehot_trues, self.y_probs, True)
            else:
                TPR, FPR = PerformanceMetrics._compute_TPR_FPR(self, self.y_trues, self.y_probs, False)

            roc_auc = np.trapz(TPR, FPR, axis=2)

            return roc_auc.reshape(-1).tolist()

    def _compute_TPR_FPR(self, y_true, y_prob, multiclass=False):
        """
        Computes true positive rate and false positive rate based on multiclass flag.

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
        TPR : numpy.ndarray
                True positive rate.

        FPR : numpy.ndarray
                False positive rate.
        """
        if multiclass:
            y_trues = y_true.reshape(y_true.shape[0], y_true.shape[1], -1)
            y_probs = y_prob.reshape(y_prob.shape[0], y_prob.shape[1], -1)

            idx = y_probs.argsort(axis=2)[:, :, ::-1]  # sort by descending order

            y_trues = np.take_along_axis(y_trues, idx, axis=2)

            TPR = np.cumsum(y_trues, axis=2) / np.sum(y_trues, axis=2, keepdims=True)
            FPR = np.cumsum((1 - y_trues), axis=2) / np.sum((1 - y_trues), axis=2, keepdims=True)

            TPR = np.append(np.zeros((TPR.shape[0], TPR.shape[1], 1)), TPR, axis=2)  # append starting point (0)
            FPR = np.append(np.zeros((FPR.shape[0], FPR.shape[1], 1)), FPR, axis=2)

        else:
            idx = y_prob.argsort(axis=2)[:, :, ::-1]  # sort by descending order
            y_probs = np.take_along_axis(y_prob, idx, axis=2)

            y_trues = np.take_along_axis(y_true, idx, axis=2)
            TPR = np.cumsum(y_trues, axis=2) / np.sum(y_trues, axis=2, keepdims=True)
            FPR = np.cumsum(1 - y_trues, axis=2) / np.sum(1 - y_trues, axis=2, keepdims=True)
            TPR = np.append(np.zeros((TPR.shape[0], TPR.shape[1], 1)), TPR, axis=2)  # append starting point (0)
            FPR = np.append(np.zeros((FPR.shape[0], FPR.shape[1], 1)), FPR, axis=2)

        return TPR, FPR

    def _compute_log_loss(self, **kwargs):
        """
        Computes the log loss score

        Returns
        ----------
        _compute_log_loss : list of float
                The performance metric value
        """
        if "y_prob_new" in kwargs:
            y_true = self.use_case_object.model_params[0].y_true
            y_prob = kwargs["y_prob_new"][0]
            if len(np.unique(y_true)) == 1 or np.all(np.isnan(y_prob)):
                return None

            y_true = y_true.reshape(1, 1, -1)
            if self.use_case_object.multiclass_flag:
                ohe_classes_ = self.use_case_object.classes_
                y_prob = y_prob.reshape(1, 1, -1, len(ohe_classes_))
                enc_y_true = self.use_case_object.model_params[0].enc_y_true.reshape(1, 1, -1, len(ohe_classes_))
                log_loss_score = PerformanceMetrics._compute_log_loss_score(self, enc_y_true, y_prob, True)
            else:
                y_prob = y_prob.reshape(1, 1, -1)
                log_loss_score = PerformanceMetrics._compute_log_loss_score(self, y_true, y_prob, False)

            return log_loss_score[0][0]

        elif ("subgrp_y_true" in kwargs) and ("subgrp_y_prob" in kwargs):
            y_true = kwargs["subgrp_y_true"]
            y_prob = kwargs["subgrp_y_prob"]
            if len(np.unique(y_true)) == 1 or np.all(np.isnan(y_prob)):
                return None
            log_loss_score = log_loss(y_true=y_true, y_pred=y_prob)
            return log_loss_score

        else:
            if all(v[0] is None for v in self.y_probs):
                return np.array([None] * self.y_trues.shape[0]).reshape(-1).tolist()

            if self.use_case_object.multiclass_flag:
                log_loss_score = PerformanceMetrics._compute_log_loss_score(
                    self, self.y_onehot_trues, self.y_probs, True
                )
            else:
                log_loss_score = PerformanceMetrics._compute_log_loss_score(self, self.y_trues, self.y_probs, False)

            return log_loss_score.reshape(-1).tolist()

    def _compute_log_loss_score(self, y_true, y_prob, multiclass=False):
        """
        Computes log loss score based on multiclass flag.

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
        log_loss_score : numpy.ndarray
                Log-loss score.
        """
        if multiclass:
            loss = -(y_true * np.log(y_prob)).sum(axis=3)
            log_loss_score = loss.sum(axis=2) / loss.shape[2]

        else:
            log_loss_score = -(y_true * ma.log(y_prob) + (1 - y_true) * ma.log(1 - y_prob))
            log_loss_score = np.sum(log_loss_score, 2) / log_loss_score.shape[2]

        return log_loss_score

    def _performance_dynamics(self):
        """
        Computes the dynamic performance metrics based on different threshold values

        Returns
        ----------
        d : dict
                100 values of selection rate, balanced accuracy, F1 score, expected_profit and threshold
        """
        metric_group = self.map_perf_metric_to_group.get(self.perf_metric_name)[1]
        if self.y_prob[0] is None or metric_group == "regression":
            return None
        else:
            if self.use_case_object.multiclass_flag:
                return None
            d = {}
            d["perf_metric_name"] = []
            d["threshold"] = []
            d["perf"] = []
            d["selection_rate"] = []
            if metric_group == "classification":
                threshold = np.linspace(
                    Constants().classify_min_threshold,
                    Constants().classify_max_threshold,
                    Constants().perf_dynamics_array_size,
                )
                d["threshold"] = threshold

                # TODO: Optimize, keep fewer objects in memory
                asc_score_indices = np.argsort(self.y_prob[0])
                desc_score_indices = asc_score_indices[::-1]
                desc_sorted_score = self.y_prob[0][desc_score_indices]
                desc_sorted_true = self.y_true[0][desc_score_indices]
                asc_sorted_score = self.y_prob[0][asc_score_indices]
                asc_sorted_true = self.y_true[0][asc_score_indices]

                desc_search_idx = np.searchsorted(-desc_sorted_score, -threshold).astype(int)
                asc_search_idx = np.searchsorted(asc_sorted_score, threshold)

                true_positives = np.cumsum(desc_sorted_true)[desc_search_idx - 1]
                false_positives = desc_search_idx - true_positives
                true_negatives = asc_search_idx - np.cumsum(asc_sorted_true)[asc_search_idx - 1]
                false_negatives = asc_search_idx - true_negatives

                d["perf_metric_name"] = "balanced_acc"
                d["selection_rate"] = (
                    (true_positives + false_positives)
                    / (true_positives + false_positives + true_negatives + false_negatives)
                ).tolist()
                d["perf"] = np.mean(
                    [
                        true_positives / (true_positives + false_negatives),
                        true_negatives / (true_negatives + false_positives),
                    ],
                    axis=0,
                ).tolist()
            elif metric_group == "uplift":
                if self.y_prob[1] is None:
                    return None
                else:
                    threshold = np.linspace(
                        Constants().uplift_min_threshold,
                        Constants().uplift_max_threshold,
                        Constants().perf_dynamics_array_size,
                    )
                    if self.perf_metric_name == "emp_lift":
                        d["perf_metric_name"] = "emp_lift"
                        d["threshold"] = threshold
                        for i in range(len(threshold)):
                            d["selection_rate"] += [self._compute_expected_selection_rate(threshold[i])]
                            d["perf"] += [self._compute_emp_lift(threshold[i])]
                    else:
                        d["perf_metric_name"] = "expected_profit"
                        d["threshold"] = threshold
                        for i in range(len(threshold)):
                            d["selection_rate"] += [self._compute_expected_selection_rate(threshold[i])]
                            d["perf"] += [self._compute_expected_profit(threshold[i])]
            else:
                return None

        return d

    def _calibration_func(self, y_true, y_prob, n_bins=10):
        """
        Calculates the points for calibration curve over a bin of values
        and the calibration score based on brier loss score.
        Returns results in the calibration_curve_bin dictionary.

        Parameters
        ----------
        y_true: numpy.ndarray
            Ground truth target values.

        y_prob : numpy.ndarray, default=None
                Predicted probabilities as returned by classifier.
                For uplift models, L = 4. Else, L = 1 where shape is (n_samples, L)

        n_bins : int, default=10
            Number of equal-width bins in the range

        Returns
        ----------
        calibration_curve_bin : dict
            Contains prob_true, prob_pred and score as floats
        """
        metric_group = self.map_perf_metric_to_group.get(self.perf_metric_name)[1]
        if y_prob is None or self.label_size > 2 or metric_group == "regression":
            calibration_curve_bin = None
        else:
            if self.use_case_object.multiclass_flag:
                calibration_curve_bin = None
                return calibration_curve_bin

            prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=n_bins)
            score = brier_score_loss(y_true=y_true, y_prob=y_prob)

            calibration_curve_bin = {
                "prob_true": prob_true,
                "prob_pred": prob_pred,
                "score": score,
            }

        return calibration_curve_bin

    def _get_class_distribution(self, y_true, pos_label=1):
        """
        Calculates the proportion of favourable and unfavourable labels in y_true.
        Parameters
        ----------
        y_true: numpy.ndarray
            Ground truth target values.

        pos_label : list, default=1
            Label values which are considered favorable.
            For all model types except uplift, converts the favourable labels to 1 and others to 0.
            For uplift, user is to provide 2 label names e.g. [["a"], ["b"]] in fav label. The first will be mapped to treatment responded (TR) & second to control responded (CR).

        Returns
        ----------
        y_true_counts : dict
            Dictionary of proportion of classes
        """
        if self.label_size == -1:
            return None
        else:
            y_true_counts = pd.Series(y_true).value_counts(normalize=True)
            if not self.use_case_object.multiclass_flag:
                y_true_counts = y_true_counts.reset_index().replace({1: "pos_label", 0: "neg_label"}).set_index("index")
            else:
                y_true_counts = y_true_counts.reset_index().set_index("index")
            print("y_true_counts columns:", y_true_counts.columns)
            print("y_true_counts:\n", y_true_counts)
            return y_true_counts.iloc[:, 0].to_dict()
