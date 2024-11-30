import numpy as np
import pandas as pd

from ..config.constants import Constants
from ..metrics.fairness_metrics import FairnessMetrics
from ..metrics.performance_metrics import PerformanceMetrics
from ..principles import Fairness, Transparency
from ..util.errors import VeritasError
from ..util.utility import check_datatype, check_value


class CustomerMarketing(Fairness, Transparency):
    """
    A class to evaluate and analyse fairness and transparency in customer marketing related applications.

    Class Attributes
    ------------------
    _model_type_to_metric_lookup: dict
                Used to associate the model type (key) with the metric type, expected size of positive and negative labels (value) & length of model_params respectively.
                e.g. {“rejection”: (“classification”, 2, 1), “uplift”: (“uplift”, 4, 2), “a_new_type”: (“regression”, -1, 1)}

    """

    _model_type_to_metric_lookup = {
        "uplift": ("uplift", 4, 2),
        "classification": ("classification", 0, 1),
    }

    def __init__(
        self,
        model_params,
        fair_threshold=80,
        fair_is_pos_label_fav=None,
        perf_metric_name="emp_lift",
        fair_metric_name="auto",
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="difference",
        treatment_cost=None,
        revenue=None,
        fairness_metric_value_input={},
        proportion_of_interpolation_fitting=1.0,
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
        model_params: list
                Data holder that contains all the attributes of the model to be assessed. Compulsory input for initialization.
                It holds one ModelContainer object(s).
                If a single object is provided, it will be taken as either a "rejection" or "propensity" model according to the model_type flag.
                If 2 objects are provided, while the model_type flag is "uplift", the first one corresponds to rejection model while the second one corresponds to propensity model.
                **x_train[0] = x_train[1] and x_test[0]=x_test[1] must be the same when len(model_param) > 1

        Instance Attributes
        ------------------
        fair_threshold: int or float, default=80
                Value between 0 and 100. If a float between 0 and 1 (inclusive) is provided, it is used to benchmark against the primary fairness metric value to determine the fairness_conclusion.
                If an integer between 1 and 100 is provided, it is converted to a percentage and the p % rule is used to calculate the fairness threshold value.

        fair_is_pos_label_fav: boolean, default=None
                Used to indicate if positive label specified is favourable for the classification use case. If True, 1 is specified to be favourable and 0 as unfavourable.

        perf_metric_name: string, default = "emp_lift"
                Name of the primary performance metric to be used for computations in the evaluate() and/or compile() functions.

        fair_metric_name : string, default = "auto"
                Name of the primary fairness metric to be used for computations in the evaluate() and/or compile() functions

        fair_concern: string, default = "eligible"
               Used to specify a single fairness concern applied to all protected variables. Could be "eligible" or "inclusive" or "both".

        fair_priority: string, default = "benefit"
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "benefit" or "harm"

        fair_impact: string, default = "normal"
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "normal" or "significant" or "selective"

        fair_metric_type: str, default='difference'
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "difference" or "ratio"

        treatment_cost: int or float, default=None
                Cost of the marketing treatment per customer

        revenue: int or float, default=None
                Revenue gained per customer

        fairness_metric_value_input : dict
                Contains the p_var and respective fairness_metric and value
                e.g. {"gender": {"fnr_parity": 0.2}}

        proportion_of_interpolation_fitting : float, default=1.0
                Proportion of interpolation fitting

        _use_case_metrics: dict of list, default=None
                Contains all the performance & fairness metrics for each use case.
                e.g. {"fair ": ["fnr_parity", ...], "perf": ["balanced_acc, ..."]}
                Dynamically assigned during initialisation by using the _metric_group_map in Fairness/Performance Metrics class and the _model_type_to_metric above.

        _input_validation_lookup: dict
                Contains the attribute and its correct data type for every argument passed by user. Used to perform the Utility checks.
                e.g. _input_validation_lookup = {
                "fair_threshold": [(float,), (int(config.get('threshold','fair_threshold_low')), int(config.get('threshold','fair_threshold_high')))],
                "fair_neutral_tolerance": [(float,) ,(int(config.get('threshold','fair_neutral_tolerance_low')), float(config.get('threshold','fair_neutral_tolerance_high')))],
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

        selection_threshold : float
                Selection threshold from Constants class

        e_lift : float
                Empirical lift

        pred_outcome: dict
                Contains the probabilities of the treatment and control groups for both rejection and acquiring
        """
        self.perf_metric_name = perf_metric_name
        # Positive label is favourable for customer marketing use case
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

        # This captures the fair_metric input by the user
        self.fair_metric_input = fair_metric_name

        self.proportion_of_interpolation_fitting = proportion_of_interpolation_fitting

        self._input_validation_lookup["proportion_of_interpolation_fitting"] = [
            (float,),
            (Constants().proportion_of_interpolation_fitting_low),
            Constants().proportion_of_interpolation_fitting_high,
        ]

        self.spl_params = {"revenue": revenue, "treatment_cost": treatment_cost}
        self.selection_threshold = Constants().selection_threshold

        self._check_input()
        self._tran_check_input()

        for model in self.model_params:
            if not model._model_data_processing_flag:
                self._model_data_processing()
            model._model_data_processing_flag = True

        self.e_lift = self._get_e_lift()
        if self.model_params[0].p_grp is not None:
            self._check_non_policy_p_var_min_samples()
            self._auto_assign_p_up_groups()
            self.feature_mask = self._set_feature_mask()
            PerformanceMetrics._check_y_prob_pred(self)
            FairnessMetrics._check_y_prob_pred(self)
        else:
            self.feature_mask = None

        self.pred_outcome = self._compute_pred_outcome()

    def _check_input(self):
        """
        Wrapper function to perform all checks using dictionaries of datatypes & dictionary of values.
        This function does not return any value. Instead, it raises an error when any of the checks from the Utility class fail.
        """
        # import error class
        err = VeritasError()

        # check fair_is_pos_label_fav specified correctly
        if len(self.model_params) == 1 and self.fair_is_pos_label_fav is None:
            err.push(
                "value_error",
                var_name="fair_is_pos_label_fav",
                given=self.fair_is_pos_label_fav,
                expected="True/False",
                function_name="_check_input",
            )

        # check label values in model_params against the usecase's specified model_type info.
        self.check_label_data_for_model_type()

        # check datatype of input variables to ensure they are of the correct datatype
        check_datatype(self)

        # check datatype of input variables to ensure they are reasonable
        check_value(self)

        # check for length of model_params
        mp_g = len(self.model_params)
        mp_e = self._model_type_to_metric_lookup[self.model_params[0].model_type][2]
        if mp_g != mp_e:
            err.push(
                "length_error",
                var_name="model_params",
                given=str(mp_g),
                expected=str(mp_e),
                function_name="_check_input",
            )

        # check binary restriction for this use case
        if mp_g > 1:
            for i in range(len(self.model_params)):
                self._check_binary_restriction(model_num=i)

        # check for conflicting input values
        self._base_input_check()

        # check if input variables will the correct fair_metric_name based on fairness tree
        self._fairness_metric_value_input_check()

        # check for y_prob not None if model is uplift, else check for y_pred not None
        # if self.model_params[0].model_type  == "uplift":
        #     for i in range(len(self.model_params)):
        #         if self.model_params[i].y_prob is None:
        #             err.push('type_error', var_name="y_prob", given= "type None", expected="type [list, np.ndarray, pd.Series]", function_name="_check_input")
        # else:
        #     for i in range(len(self.model_params)):
        #         if self.model_params[i].y_pred is None:
        #             err.push('type_error', var_name="y_pred", given= "type None", expected="type [list, np.ndarray, pd.Series]", function_name="_check_input")

        # check for y_pred not None if model is uplift, if yes set to None as it is not required
        if self.model_params[0].model_type == "uplift" and self.model_params[0].y_pred is not None:
            for i in range(len(self.model_params)):
                self.model_params[i].y_pred = None

        # check for y_prob is not None, if not None it cannot be an integer
        if self.model_params[0].y_prob is not None:
            if self.model_params[0].y_prob.dtype.kind == "i":
                err.push(
                    "type_error",
                    var_name="y_prob",
                    given="type int",
                    expected="type float",
                    function_name="_check_input",
                )

        # check for revenue and treatment_cost
        # only for uplift models based on expected profit perf metric
        if self.model_params[0].model_type == "uplift" and self.perf_metric_name == "expected_profit":
            exp_type = list((int, float))
            spl_range = (0, np.inf)
            # check if spl params are in expected type, otherwise throw exception
            for i in self.spl_params.keys():
                if type(self.spl_params[i]) not in exp_type:
                    err.push(
                        "type_error",
                        var_name=str(i),
                        given=type(self.spl_params[i]),
                        expected=exp_type,
                        function_name="_check_input",
                    )
                # check if spl params are within expected range, otherwise throw exception
                if type(self.spl_params[i]) != type(None) and type(self.spl_params[i]) in exp_type:
                    if self.spl_params[i] < spl_range[0] or self.spl_params[i] > spl_range[1]:
                        err.push(
                            "value_error",
                            var_name=str(i),
                            given=self.spl_params[i],
                            expected="range " + str(spl_range),
                            function_name="_check_input",
                        )
                err.pop()
            # check if in spl params, revenue value provided is not less than treatment_cost
            if self.spl_params["revenue"] < self.spl_params["treatment_cost"]:
                err.push(
                    "value_error_compare",
                    var_name_a="revenue",
                    var_name_b="treatment_cost",
                    function_name="_check_input",
                )

        # print any exceptions occured
        err.pop()

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
        pos_class_count = np.isin(grp["y_true"], ["CR", "TR"]).sum()
        neg_class_count = np.isin(grp["y_true"], ["CN", "TN"]).sum()
        if is_max_bias:
            metric_val = self.perf_metric_obj.translate_metric(
                perf_metric,
                obj=self.perf_metric_obj,
                subgrp_y_true=grp["y_true"].values,
                subgrp_e_lift=grp["e_lift"].values,
            )
        else:
            metric_val = pos_class_count + neg_class_count

        return pd.Series([pos_class_count, neg_class_count, metric_val])

    def _auto_assign_p_up_groups(self):
        """
        Automatically assigns privileged and unprivileged groups based on the policy specified by the user for the protected variable.

        It then maps the policy to the corresponding function that will assign the privileged and unprivileged groups.

        The resulting groups are stored in the respective model container object.
        """
        self.perf_metric_obj = PerformanceMetrics(self)
        mdl = self.model_params
        for p_var_key in mdl[1].p_grp.keys():
            if isinstance(mdl[1].p_grp[p_var_key], str):
                if mdl[1].p_grp[p_var_key] == "max_bias":
                    p_grp, up_grp = self.map_policy_to_method[mdl[1].p_grp[p_var_key]](p_var_key, self.model_params)
                else:
                    p_grp, up_grp = self.map_policy_to_method[mdl[1].p_grp[p_var_key]](p_var_key, self.model_params[1])
                mdl[0].p_grp[p_var_key] = p_grp
                mdl[0].up_grp[p_var_key] = up_grp
                mdl[1].p_grp[p_var_key] = p_grp
                mdl[1].up_grp[p_var_key] = up_grp

    def _max_bias(self, p_var, mdls):
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

        if self.fair_metric_name == "rejected_harm":
            mdl = mdls[0]
        elif self.fair_metric_name == "acquire_benefit":
            mdl = mdls[1]

        max_bias_df = pd.concat(
            [
                mdl.protected_features_cols[p_var],
                pd.Series(self.e_lift),
                pd.Series(mdl.y_true),
            ],
            axis=1,
        )
        max_bias_df.columns = [p_var, "e_lift", "y_true"]

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

    def _select_fairness_metric_name(self):
        """
        Retrieves the fairness metric name based on the values of model_type, fair_concern, fair_impact, fair_priority and fair_metric_type.
        Name of the primary fairness metric to be used for computations in the evaluate() and/or compile() functions
        """
        # if model type is uplift, will not use fairness_tree
        if self.fair_metric_name == "auto":
            if self.model_params[0].model_type == "uplift":
                self.fair_metric_name = "rejected_harm"
            elif self.model_params[0].model_type == "classification":
                self.fair_metric_name = self._fairness_tree(self.fair_is_pos_label_fav)
        else:
            self.fair_metric_name

    def _get_e_lift(self, **kwargs):
        """
        Computes the empirical lift

        Other Parameters
        ----------
        y_pred_new : numpy.ndarray or None
                Predicted targets as returned by classifier.

        Returns
        -----------
        e_lift : float or None
            Empirical lift value
        """
        # e_lift will only run for uplift models
        if self.model_params[0].model_type == "uplift":
            if "y_pred_new" in kwargs:
                y_prob = kwargs["y_pred_new"]

            else:
                y_prob = self.model_params[1].y_prob

            y_train = self.model_params[1].y_train

            if y_train is None:
                y_train = self.model_params[1].y_true

            classes = np.array(["TR", "TN", "CR", "CN"])
            p_base = np.array([np.mean(y_train == lab) for lab in classes])
            pC = p_base[2] + p_base[3]
            pT = p_base[0] + p_base[1]
            e_lift = (y_prob[:, 0] - y_prob[:, 1]) / pT + (y_prob[:, 3] - y_prob[:, 2]) / pC
            return e_lift
        else:
            return None

    def _compute_pred_outcome(self, **kwargs):
        """
        Computes predicted outcome

        Other parameters
        ---------------
        y_pred_new : numpy.ndarray
                Predicted targets as returned by classifier.

        Returns
        -----------
        pred_outcome : dict
                Contains the probabilities of the treatment and control groups for both rejection and acquiring
        """
        # pred_outcome will only run for uplift models
        if self.model_params[0].model_type == "uplift":
            y_prob = [model.y_prob for model in self.model_params]
            y_train = [model.y_train if model.y_train is not None else model.y_true for model in self.model_params]

            if "y_pred_new" in kwargs:
                y_prob = kwargs["y_pred_new"]

            if y_prob[0] is None or y_prob[1] is None:
                return None

            classes = np.array(["TR", "TN", "CR", "CN"])
            model_alias = ["rej_", "acq_"]
            pred_outcome = {}

            for i in range(len(self.model_params)):
                y_prob_temp = y_prob[i]
                y_train_temp = y_train[i]
                p_base = np.array([np.mean(y_train_temp == lab) for lab in classes])
                pC = p_base[2] + p_base[3]
                pT = p_base[0] + p_base[1]
                pOcT = y_prob_temp[:, 0] / pT
                pOcC = y_prob_temp[:, 2] / pC
                pred_outcome[model_alias[i] + "treatment"] = pOcT
                pred_outcome[model_alias[i] + "control"] = pOcC
            return pred_outcome

        else:
            return None

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
                Flag to indicate if the function is to process y_pred.

        Returns
        -----------------
        y_bin : list
                Encoded labels.

        pos_label2 : list
                Label values which are considered favorable.
        """
        # uplift model
        # 0, 1 => control (others, rejected/responded)
        # 2, 3 => treatment (others, rejected/responded)
        err = VeritasError()
        err_ = []
        model_type = obj_in.model_type

        if model_type != "uplift":
            return super()._check_label(y, pos_label, neg_label, obj_in, y_pred_flag)

        elif neg_label is not None and model_type == "uplift":
            y_bin = y
            n = 0

            row = y_bin == pos_label[0]
            indices_pos_0 = [i for i, x in enumerate(y_bin) if x == pos_label[0]]
            n += np.sum(row)

            row = y_bin == pos_label[1]
            indices_pos_1 = [i for i, x in enumerate(y_bin) if x == pos_label[1]]
            n += np.sum(row)

            row = y_bin == neg_label[0]
            indices_neg_0 = [i for i, x in enumerate(y_bin) if x == neg_label[0]]
            n += np.sum(row)

            row = y_bin == neg_label[1]
            indices_neg_1 = [i for i, x in enumerate(y_bin) if x == neg_label[1]]
            n += np.sum(row)

            for i in indices_pos_0:
                y_bin[i] = "TR"
            for i in indices_pos_1:
                y_bin[i] = "CR"
            for i in indices_neg_0:
                y_bin[i] = "TN"
            for i in indices_neg_1:
                y_bin[i] = "CN"

            if n != len(y_bin):
                err_.append(
                    [
                        "conflict_error",
                        "pos_label, neg_label",
                        "inconsistent values",
                        pos_label + neg_label,
                    ]
                )
                for i in range(len(err_)):
                    err.push(
                        err_[i][0],
                        var_name_a=err_[i][1],
                        some_string=err_[i][2],
                        value=err_[i][3],
                        function_name="_check_label",
                    )
            pos_label2 = [["TR"], ["CR"]]

        if y_bin.dtype.kind in ["i"]:
            y_bin = y_bin.astype(np.int8)

        err.pop()

        return y_bin, pos_label2
