import pandas as pd

from ..metrics.fairness_metrics import FairnessMetrics
from ..metrics.performance_metrics import PerformanceMetrics
from ..principles import Fairness, Transparency
from ..util.utility import check_datatype, check_value


class BaseRegression(Fairness, Transparency):
    """
    Class to evaluate and analyse fairness and transparency in predictive underwriting insurance related applications.

    Class Attributes
    ------------------
    _model_type_to_metric_lookup: dictionary
                Used to associate the model type (key) with the metric type, expected size of positive and negative labels (value) & length of model_params respectively.

                e.g. {"regression": ("regression", 2, 1), “rejection”: (“classification”, 2, 1), “uplift”: (“uplift”, 4, 2), “a_new_type”: (“regression”, -1, 1)}
    """

    _model_type_to_metric_lookup = {"regression": ("regression", -1, 1)}

    def __init__(
        self,
        model_params,
        fair_threshold=80,
        perf_metric_name="rmse",
        fair_metric_name="auto",
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="difference",
        fairness_metric_value_input={},
        tran_row_num=[1],
        tran_max_sample=1,
        tran_pdp_feature=[],
        tran_pdp_target=None,
        tran_max_display=10,
        tran_features=[],
        tran_processed_data=None,
        tran_processed_label=None,
    ):
        """
        Parameters
        ----------
        model_params: list containing 1 ModelContainer object
                Data holder that contains all the attributes of the model to be assessed. Compulsory input for initialization. Single object corresponds to model_type of "default".

        Instance Attributes
        --------------------
        fair_threshold: int or float, default=80
                Value between 0 and 100. If a float between 0 and 1 (not inclusive) is provided, it is converted to a percentage and the p % rule is used to calculate the fairness threshold value.
                If an integer between 1 and 100 is provided, it is converted to a percentage and the p % rule is used to calculate the fairness threshold value.

        perf_metric_name: string, default='rmse'
                Name of the primary performance metric to be used for computations in the evaluate() and/or compile() functions.

        fair_metric_name : string, default="auto"
                Name of the primary fairness metric to be used for computations in the evaluate() and/or compile() functions.

        fair_concern: string, default="eligible"
                Used to specify a single fairness concern applied to all protected variables. Could be "eligible" or "inclusive" or "both".

        fair_priority: string, default="benefit"
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "benefit" or "harm"

        fair_impact: string, default="normal"
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "normal" or "significant" or "selective"

        fair_metric_type: str, default='difference'
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "difference" or "ratio"

        fairness_metric_value_input : dictionary
                Contains the p_var and respective fairness_metric and value
                e.g. {"gender": {"fnr_parity": 0.2}}

        _use_case_metrics: dictionary of lists, default=None
                Contains all the performance & fairness metrics for each use case.
                e.g. {"fair ": ["fnr_parity", ...], "perf": ["balanced_acc, ..."]}
                Dynamically assigned during initialisation by using the _metric_group_map in Fairness/Performance Metrics class and the _model_type_to_metric above.

        _input_validation_lookup: dict
                Contains the attribute and its correct data type for every argument passed by user. Used to perform the Utility checks.
                e.g. _input_validation_lookup = {
                "fair_threshold": [(float, int), (Constants().fair_threshold_low), Constants().fair_threshold_high],
                "fair_neutral_tolerance": [(float,),(Constants().fair_neutral_threshold_low), Constants().fair_neutral_threshold_high],
                "sample_weight": [(int,), (0, np.inf)],
                "perf_metric_name": [(str,), _use_case_metrics["perf"]],
                "fair_metric_name": [(str,), _use_case_metrics["fair"]],
                "concern": [(str,), ["eligible", "inclusion", "both"]]
                }

        k : int
                Integer from Constants class to calculate confidence interval

        array_size : int
                Integer from Constants class to fix array size

        decimals : int
                Integer from Constants class to fix number of decimals to round off

        err : object
                VeritasError object

        e_lift : float, default=None
                Empirical lift

        pred_outcome: dictionary, default=None
                Contains the probabilities of the treatment and control groups for both rejection and acquiring
        """
        self.perf_metric_name = perf_metric_name
        # Positive label is favourable for predictive underwriting use case
        fair_is_pos_label_fav = True
        Fairness.__init__(
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
        )
        Transparency.__init__(
            self,
            tran_row_num,
            tran_max_sample,
            tran_pdp_feature,
            tran_pdp_target,
            tran_max_display,
            tran_features,
            tran_processed_data,
            tran_processed_label,
        )

        self.e_lift = None
        self.pred_outcome = None

        self._check_input()
        self._tran_check_input()

        if not self.model_params[0]._model_data_processing_flag:
            self._model_data_processing()
            self.model_params[0]._model_data_processing_flag = True

        if self.model_params[0].p_grp is not None:
            self._auto_assign_p_up_groups()
            self.feature_mask = self._set_feature_mask()
            PerformanceMetrics._check_y_prob_pred(self)
            FairnessMetrics._check_y_prob_pred(self)
        else:
            self.feature_mask = None

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
        # if self.model_params[0].y_pred is None:
        #     self.err.push('type_error', var_name="y_pred", given= "type None", expected="type [list, np.ndarray, pd.Series]", function_name="_check_input")

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

        # print any exceptions occured
        self.err.pop()

    def _select_fairness_metric_name(self):
        """
        Retrieves the fairness metric name based on the values of model_type, fair_concern, fair_impact, fair_priority, fair_metric_type.
        """
        if self.fair_metric_name == "auto":
            if self.fair_metric_type == "difference":
                self.fair_metric_name = "rmse_parity"
            elif self.fair_metric_type == "ratio":
                self.fair_metric_name = "rmse_ratio"
        else:
            return self.fair_metric_name

    def _get_sub_group_data(self, grp, perf_metric="sample_count", is_max_bias=True):
        """
        Computes the subgroup data for each policy.

        Parameters
        ----------
        grp : pandas.DataFrame
                A pandas dataframe containing the relevant data for the given subgroup.

        perf_metric : str, default='sample_count'
                The performance metric to use in the subgroup calculation, by default 'sample_count'.

        is_max_bias : bool, default=True
                Whether policy is `max_bias`, by default True.

        Returns
        -------
        pandas.Series
                A pandas series containing the count of positive and negative class, as well as the metric value.
        """
        pos_class_count = None
        neg_class_count = None
        if is_max_bias:
            metric_val = self.perf_metric_obj.translate_metric(
                perf_metric,
                obj=self.perf_metric_obj,
                subgrp_y_true=grp["y_true"].values,
                subgrp_y_pred=grp["y_pred"].values,
            )
        else:
            metric_val = None

        return pd.Series([pos_class_count, neg_class_count, metric_val])

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
                p_grp, up_grp = self.map_policy_to_method[mdl.p_grp[p_var_key]](p_var_key, mdl)
                mdl.p_grp[p_var_key] = p_grp
                mdl.up_grp[p_var_key] = up_grp

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
            ],
            axis=1,
        )
        max_bias_df.columns = [p_var, "y_true", "y_pred"]

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
        best = [[max_bias_df[perf_metric].idxmax()]]
        worst = [[max_bias_df[perf_metric].idxmin()]]
        if direction == "lower":
            best, worst = worst, best

        return best, worst

    def rootcause(self, p_var=None, label=None):
        """
        Prints a message indicating that root cause analysis is not supported for regression use cases.

        Parameters
        ----------
        p_var : list of strings, default=None
                Optional parameter. Protected variables to be considered for rootcause analysis.

        label : int or str, default=None
                Optional parameter. Label to use for comparison between privileged and unprivileged groups in rootcause analysis. Only applicable for multi-class classification models. If not specified, the last label will be used.

        Returns
        ----------
        None

        Notes
        ----------
        This function is intended to overwrite the parent class `rootcause()` method in the Fairness class.
        """
        print("Root cause analysis is not supported for regression use cases.")
        return

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
        Prints a message indicating that bias mitigation is not supported for regression use cases.

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
        None

        Notes
        ----------
        This function is intended to overwrite the parent class `mitigate()` method in the Fairness class.
        """
        print("Bias mitigation is not supported for regression use cases.")
        return
