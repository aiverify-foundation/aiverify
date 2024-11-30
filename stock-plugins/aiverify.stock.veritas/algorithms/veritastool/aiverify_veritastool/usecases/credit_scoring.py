import numpy as np

from ..metrics.fairness_metrics import FairnessMetrics
from ..metrics.newmetric import *
from ..metrics.performance_metrics import PerformanceMetrics
from ..principles import Fairness, Transparency
from ..util.errors import VeritasError
from ..util.utility import check_datatype, check_value


class CreditScoring(Fairness, Transparency):
    """A class to evaluate and analyse fairness and transparency in credit scoring related applications.

    Class Attributes
    ------------------
    _model_type_to_metric_lookup: dict
                Used to associate the model type (key) with the metric type, expected size of positive and negative labels (value) & length of model_params respectively.
                e.g. {“rejection”: (“classification”, 2, 1), “uplift”: (“uplift”, 4, 2), “a_new_type”: (“regression”, -1, 1)}
    """

    _model_type_to_metric_lookup = {"classification": ("classification", 2, 1)}

    def __init__(
        self,
        model_params,
        fair_threshold=80,
        perf_metric_name="balanced_acc",
        fair_metric_name="auto",
        fair_concern="eligible",
        fair_priority="benefit",
        fair_impact="normal",
        fair_metric_type="difference",
        num_applicants=None,
        base_default_rate=None,
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
        model_params: list
                Data holder that contains all the attributes of the model to be assessed. Compulsory input for initialization.
                It holds one ModelContainer object. Single object corresponds to model_type of "credit".

        Instance Attributes
        --------------------
        fair_threshold: int or float, default=80
                Value between 0 and 100. If a float between 0 and 1 (inclusive) is provided, it is converted to a percentage and the p % rule is used to calculate the fairness threshold value.
                If an integer between 1 and 100 is provided, it is converted to a percentage and the p % rule is used to calculate the fairness threshold value.

        perf_metric_name: str, default="balanced_acc"
                Name of the primary performance metric to be used for computations in the evaluate() and/or compile() functions.

        fair_metric_name : str, default="auto"
                Name of the primary fairness metric to be used for computations in the evaluate() and/or compile() functions.

        fair_concern: str, default="eligible"
                Used to specify a single fairness concern applied to all protected variables. Could be "eligible" or "inclusive" or "both".

        fair_priority: str, default="benefit"
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "benefit" or "harm"

        fair_impact: str, default="normal"
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "normal" or "significant" or "selective"

        fair_metric_type: str, default='difference'
                Used to pick the fairness metric according to the Fairness Tree methodology. Could be "difference" or "ratio"

        num_applicants: dict of list, default=None
                Contains the number of rejected applicants for the privileged and unprivileged groups for each protected feature.
                e.g. {"gender": [10, 20], "race": [12, 18]}

        base_default_rate: dict of list, default=None
                Contains the base default rates for the privileged and unprivileged groups for each protected feature.
                e.g. {"gender": [10, 20], "race": [12, 18]}

        fairness_metric_value_input : dict
                Contains the p_var and respective fairness_metric and value
                e.g. {"gender": {"fnr_parity": 0.2}}

        _rejection_inference_flag: dict
                Flag to ascertain whether rejection inference technique should be used for each protected feature to impute the target value for rejected cases, allowing reject cohort to be used in model building.
                If both the base_default_rate & num_applicants are not None, the flag will be set to True.
                e.g. {"gender": True, "race": False, "age": True}

        _use_case_metrics: dict of list
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

        spl_params : dict
                     of parameters that only belong to a use case

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

        pred_outcome: dict, default=None
                Contains the probabilities of the treatment and control groups for both rejection and acquiring
        """
        self.perf_metric_name = perf_metric_name
        # Positive label is favourable for credit scoring use case
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

        self.spl_params = {
            "num_applicants": num_applicants,
            "base_default_rate": base_default_rate,
        }

        self.e_lift = None
        self.pred_outcome = None

        if self.model_params[0].p_grp is not None:
            self._rejection_inference_flag = {}
            for var in self.model_params[0].p_var:
                self._rejection_inference_flag[var] = False

            if self.spl_params["base_default_rate"] is not None and self.spl_params["num_applicants"] is not None:
                for var in self.model_params[0].p_var:
                    self._rejection_inference_flag[var] = True

        self._check_input()
        self._tran_check_input()

        if not self.model_params[0]._model_data_processing_flag:
            self._model_data_processing()
            self.model_params[0]._model_data_processing_flag = True

        if self.model_params[0].p_grp is not None:
            self._check_non_policy_p_var_min_samples()
            self._auto_assign_p_up_groups()
            self.feature_mask = self._set_feature_mask()
            self._check_special_params()
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

        # check binary restriction for this use case
        self._check_binary_restriction()

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

    def _check_special_params(self):
        """
        Perform data type and value checks for special params.
        """
        if self.spl_params is not None:
            # check that spl_params if provided contains dictionaries, otherwise throw exception
            for i in self.spl_params.keys():
                if type(self.spl_params[i]) != dict and type(self.spl_params[i]) != type(None):
                    self._rejection_inference_flag = self._rejection_inference_flag.fromkeys(
                        self._rejection_inference_flag, False
                    )
                    self.err.push(
                        "value_error",
                        var_name=str(i),
                        given=type(self.spl_params[i]),
                        expected="dict",
                        function_name="_check_special_params",
                    )

            # print any exceptions occured
            self.err.pop()

            # check that base_default_rate (under spl params) contains the protected variable under p_var, otherwise throw exception
            if self.spl_params["base_default_rate"] is not None:
                for var in self.model_params[0].p_var:
                    if self._rejection_inference_flag[var] is True:
                        if var not in self.spl_params["base_default_rate"].keys():
                            self._rejection_inference_flag[var] = False
                            self.err.push(
                                "value_error",
                                var_name="base_default_rate",
                                given="values for " + str(list(self.spl_params["base_default_rate"].keys())),
                                expected="values for " + str(self.model_params[0].p_var),
                                function_name="_check_special_params",
                            )

            # check that num_applicants (under spl params) contains the protected variable under p_var, otherwise throw exception
            if self.spl_params["num_applicants"] is not None:
                for var in self.model_params[0].p_var:
                    if self._rejection_inference_flag[var] is True:
                        if var not in self.spl_params["num_applicants"].keys():
                            self._rejection_inference_flag[var] = False
                            self.err.push(
                                "value_error",
                                var_name="num_applicants",
                                given="values for " + str(list(self.spl_params["num_applicants"].keys())),
                                expected="values for " + str(self.model_params[0].p_var),
                                function_name="_check_special_params",
                            )
            # print any exceptions occured
            self.err.pop()

            # specify datatypes that are accepted for base_default_rate and num_applicants
            num_applicants_type = (
                int,
                float,
            )
            base_default_rate_type = (float,)
            # check that num_applicants contains correct datatype, otherwise throw exception
            if self.spl_params["num_applicants"] is not None:
                for i in self.spl_params["num_applicants"]:
                    if self._rejection_inference_flag[i] is True:
                        for j in range(len(self.spl_params["num_applicants"].get(i))):
                            if type(self.spl_params["num_applicants"].get(i)[j]) in num_applicants_type:
                                if type(self.spl_params["num_applicants"].get(i)[j]) == float:
                                    self.spl_params["num_applicants"].get(i)[j] = int(
                                        self.spl_params["num_applicants"].get(i)[j]
                                    )
                            else:
                                self._rejection_inference_flag[i] = False
                                self.err.push(
                                    "type_error",
                                    var_name="num_applicants",
                                    given=str(type(self.spl_params["num_applicants"].get(i)[j])),
                                    expected=str(num_applicants_type),
                                    function_name="_check_special_params",
                                )

            # check that base_default_rate contains correct datatype, otherwise throw exception
            if self.spl_params["base_default_rate"] is not None:
                for i in self.spl_params["base_default_rate"]:
                    if self._rejection_inference_flag[i] is True:
                        for j in range(len(self.spl_params["base_default_rate"].get(i))):
                            if type(self.spl_params["base_default_rate"].get(i)[j]) not in base_default_rate_type:
                                self._rejection_inference_flag[i] = False
                                self.err.push(
                                    "type_error",
                                    var_name="base_default_rate",
                                    given=str(type(self.spl_params["base_default_rate"].get(i)[j])),
                                    expected=str(base_default_rate_type),
                                    function_name="_check_special_params",
                                )

            # specify range of values that are accepted for base_default_rate and num_applicants
            num_applicants_range = (0, np.inf)
            base_default_rate_range = (0, 1)
            # check that num_applicants values are within range, otherwise throw exception
            if self.spl_params["num_applicants"] is not None:
                for k, l in self.spl_params["num_applicants"].items():
                    if self._rejection_inference_flag[k] is True:
                        for m in l:
                            if m <= 0:
                                self._rejection_inference_flag[k] = False
                                self.err.push(
                                    "value_error",
                                    var_name="num_applicants for " + str(k),
                                    given=str(m),
                                    expected=str(num_applicants_range),
                                    function_name="_check_special_params",
                                )

            # check that base_default_rate values are within range, otherwise throw exception
            if self.spl_params["base_default_rate"] is not None:
                for k, l in self.spl_params["base_default_rate"].items():
                    if self._rejection_inference_flag[k] is True:
                        for m in l:
                            if m < base_default_rate_range[0] or m > base_default_rate_range[1]:
                                self._rejection_inference_flag[k] = False
                                self.err.push(
                                    "value_error",
                                    var_name="base_default_rate for " + str(k),
                                    given=str(m),
                                    expected=str(base_default_rate_range),
                                    function_name="_check_special_params",
                                )

            # check for length of base_default_rate
            if self.spl_params["base_default_rate"] is not None:
                for var in self.spl_params["base_default_rate"]:
                    if self._rejection_inference_flag[var] is True:
                        if len(self.spl_params["base_default_rate"][var]) != 2:
                            self._rejection_inference_flag[var] = False
                            self.err.push(
                                "length_error",
                                var_name="base_default_rate",
                                given=len(self.spl_params["base_default_rate"][var]),
                                expected="2",
                                function_name="_check_special_params",
                            )
            # check for length of num_applicants
            if self.spl_params["num_applicants"] is not None:
                for var in self.spl_params["num_applicants"]:
                    if self._rejection_inference_flag[var] is True:
                        if len(self.spl_params["num_applicants"][var]) != 2:
                            self._rejection_inference_flag[var] = False
                            self.err.push(
                                "length_error",
                                var_name="num_applicants",
                                given=len(self.spl_params["num_applicants"][var]),
                                expected="2",
                                function_name="_check_special_params",
                            )

            # check for num of applicants if values in each index are consistent
            val_lst = []
            if self.spl_params["num_applicants"] is not None:
                for key, val in self.spl_params["num_applicants"].items():
                    try:
                        val_lst += [sum(val)]
                    except TypeError:
                        pass
                in_value = next(iter(self.spl_params["num_applicants"].items()))
                try:
                    if sum(in_value[1]) != sum(val):
                        self._rejection_inference_flag = self._rejection_inference_flag.fromkeys(
                            self._rejection_inference_flag, False
                        )
                        self.err.push(
                            "conflict_error",
                            var_name_a="num_applicants",
                            some_string="inconsistent values",
                            value=val_lst,
                            function_name="_check_special_params",
                        )

                except TypeError:
                    pass

            # check for common base default rate based in spl params input values. If inconsistent, throw exception
            rejection_inference_filter = {k: v for k, v in self._rejection_inference_flag.items() if v is True}
            if len(rejection_inference_filter) > 0:
                # Check for common base default rate
                check_cbdr = {}
                br_var = self.spl_params["base_default_rate"]
                na_var = self.spl_params["num_applicants"]
                if br_var is not None and na_var is not None:
                    for i in self.model_params[0].p_var:
                        if self._rejection_inference_flag[i] is True:
                            for j in br_var:
                                for k in na_var:
                                    if i == j and i == k:
                                        self.common_base_default_rate = (
                                            br_var.get(i)[0] * na_var.get(i)[0] + br_var.get(i)[1] * na_var.get(i)[1]
                                        ) / (na_var.get(i)[0] + na_var.get(i)[1])
                                        check_cbdr[i] = self.common_base_default_rate
                    br_value = next(iter(check_cbdr.items()))
                    for val in check_cbdr:
                        if round(br_value[1], 5) != round(check_cbdr[val], 5):
                            self._rejection_inference_flag = self._rejection_inference_flag.fromkeys(
                                self._rejection_inference_flag, False
                            )
                            self.err.push(
                                "conflict_error",
                                var_name_a="Common base default rates",
                                some_string="inconsistent values",
                                value=[
                                    round(br_value[1], 5),
                                    round(check_cbdr[val], 5),
                                ],
                                function_name="_check_special_params",
                            )

            # check if num_applicants is more than length of y_true, otherwise throw exception
            na_var = self.spl_params["num_applicants"]
            exp_out = np.array(self.model_params[0].y_true)
            if na_var is not None:
                for i in self.model_params[0].p_var:
                    if self._rejection_inference_flag[i] is True:
                        filtered_indices = np.where(self.feature_mask[i] != -1)
                        idx = self.feature_mask[i][filtered_indices].astype(bool)
                        filtered_exp_out = exp_out[filtered_indices]
                        pri_grp = self.model_params[0].p_grp.get(i)[0]
                        features = self.model_params[0].protected_features_cols[i].unique().tolist()
                        for j in features:
                            if j != pri_grp:
                                unpri_grp = j

                        if na_var.get(i)[0] < len(filtered_exp_out[idx]):
                            self._rejection_inference_flag[i] = False
                            self.err.push(
                                "value_error_compare",
                                var_name_a="Total number of applicants",
                                var_name_b="total number of approvals",
                                function_name="_check_special_params",
                            )
                        elif na_var.get(i)[1] < len(filtered_exp_out[~idx]):
                            self._rejection_inference_flag[i] = False
                            self.err.push(
                                "value_error_compare",
                                var_name_a="Total number of applicants",
                                var_name_b="total number of approvals",
                                function_name="_check_special_params",
                            )

            # check if spl params provided are realistic, otherwise throw exception
            if self.model_params[0].y_true is not None and self.model_params[0].y_pred is not None:
                y_true_reshape = np.array(self.model_params[0].y_true).reshape(1, 1, -1)
                y_pred_reshape = np.array(self.model_params[0].y_pred).reshape(1, 1, -1)
                tp, fp, tn, fn = self._get_confusion_matrix_optimized(
                    y_true_reshape, y_pred_reshape, self.model_params[0].sample_weight
                )
                # check for acceptance cohort rate
                if fn < 0 or tn < 0:
                    self._rejection_inference_flag = self._rejection_inference_flag.fromkeys(
                        self._rejection_inference_flag, False
                    )
                    self.err.push(
                        "conflict_error",
                        var_name_a="base_default_rate and/or num_applicants",
                        some_string="unrealistic_input",
                        value="",
                        function_name="_check_special_params",
                    )

                for curr_p_var in self.model_params[0].p_var:
                    if self._rejection_inference_flag[curr_p_var] is True:
                        mask = self.feature_mask[curr_p_var].astype(bool)
                        (
                            tp_p,
                            fp_p,
                            tn_p,
                            fn_p,
                            tp_u,
                            fp_u,
                            tn_u,
                            fn_u,
                        ) = self._get_confusion_matrix_optimized(
                            y_true=y_true_reshape,
                            y_pred=y_pred_reshape,
                            sample_weight=self.model_params[0].sample_weight,
                            curr_p_var=curr_p_var,
                            feature_mask=self.feature_mask,
                        )
                        pri_grp = self.model_params[0].p_grp.get(curr_p_var)[0]
                        if self.spl_params["num_applicants"] is not None:
                            group_default_rate_p = fp_p / self.spl_params["num_applicants"].get(curr_p_var)[0]
                            group_default_rate_u = fp_u / self.spl_params["num_applicants"].get(curr_p_var)[1]
                            if group_default_rate_p > self.spl_params["base_default_rate"].get(curr_p_var)[0]:
                                self.err.push(
                                    "conflict_error",
                                    var_name_a="base_default_rate",
                                    some_string="unrealistic_input",
                                    value="",
                                    function_name="_check_special_params",
                                )
                            if group_default_rate_u > self.spl_params["base_default_rate"].get(curr_p_var)[1]:
                                self.err.push(
                                    "conflict_error",
                                    var_name_a="base_default_rate",
                                    some_string="unrealistic_input",
                                    value="",
                                    function_name="_check_special_params",
                                )
            # print any exceptions occured
            self.err.pop()

    def _select_fairness_metric_name(self):
        """
        Retrieves the fairness metric name based on the values of model_type, fair_concern, fair_impact, fair_priority, fair_metric_type.
        """
        err = VeritasError()
        if self.fair_metric_name == "auto":
            self.fair_metric_name = self._fairness_tree()
        else:
            self.fair_metric_name
