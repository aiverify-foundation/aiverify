from ..metrics.fairness_metrics import FairnessMetrics
from ..metrics.performance_metrics import PerformanceMetrics
from ..principles import Fairness, Transparency
from ..util.utility import check_datatype, check_value


class PredictiveUnderwriting(Fairness, Transparency):
    """
    Class to evaluate and analyse fairness and transparency in predictive underwriting insurance related applications.

    Class Attributes
    ------------------
    _model_type_to_metric_lookup: dictionary
                Used to associate the model type (key) with the metric type, expected size of positive and negative labels (value) & length of model_params respectively.

                e.g. {"underwriting": ("classification", 2, 1), “rejection”: (“classification”, 2, 1), “uplift”: (“uplift”, 4, 2), “a_new_type”: (“regression”, -1, 1)}
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

        perf_metric_name: string, default='balanced_acc'
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

        if self.model_params[0].protected_features_cols is not None:
            self._check_non_policy_p_var_min_samples()
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

    def _select_fairness_metric_name(self):
        """
        Retrieves the fairness metric name based on the values of model_type, fair_concern, fair_impact, fair_priority, fair_metric_type.
        """
        if self.fair_metric_name == "auto":
            self.fair_metric_name = self._fairness_tree()
        else:
            self.fair_metric_name
