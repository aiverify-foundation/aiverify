import numpy as np
import pandas as pd

from ..model.modelwrapper import ModelWrapper
from ..principles.fairness import Fairness
from ..util.errors import VeritasError
from ..util.utility import _one_hot_encode_y_true_y_pred, check_datatype, check_value


class ModelContainer(object):
    """Helper class that holds the model parameters required for computations in all use cases."""

    def __init__(
        self,
        y_true=None,
        p_grp=None,
        model_type="classification",
        model_name="auto",
        y_pred=None,
        y_prob=None,
        y_train=None,
        protected_features_cols=None,
        train_op_name="fit",
        predict_op_name="predict",
        sample_weight=None,
        pos_label=[1],
        neg_label=None,
        x_train=None,
        x_test=None,
        model_object=None,
        up_grp=None,
        predict_proba_op_name="predict_proba",
    ):
        """
        Instance Attributes
        --------------------
        y_true : list, numpy.ndarray or pandas.Series, default=None
                Ground truth target values.

        p_grp : dict of lists, default=None
                List of privileged groups within the protected variables.

        model_type : string, default="classification"
                The type of model to be evaluated, model_type is unique.

                Customer Marketing: "uplift"
                Credit Scoring, Predictive Underwriting, Base Classification: "classification"
                Base Regression: "regression"

        model_name : string, default="auto"
                Used to name the model artifact json file in compile function.

        y_pred : list, numpy.ndarray, pandas.Series or None, default=None
                Predicted targets as returned by classifier.

        y_prob : list, numpy.ndarray, pandas.Series, pandas.DataFrame or None, default=None
                Predicted probabilities as returned by classifier.
                For uplift models, L = 4. Else, L = 1 where dimensions are (n_samples, L)
                y_prob column orders should be ["TR", "TN", "CR", "CN"] for uplift models.

        y_train : list, numpy.ndarray, pandas.Series or None, default=None
                Ground truth for training data.
                If it is not given in correct format, Feature Importance LOO Analysis is to be skipped.

        p_var : list
                List of protected variables used for fairness analysis.

        protected_features_cols: pandas.DataFrame or None, default=None
                This variable will be used for masking. If not provided, x_test will be used and x_test must be a pandas dataframe.

        train_op_name : str, default = "fit"
                The method used by the model_object to train the model.
                By default a sklearn model is assumed.

        predict_op_name : str, default = "predict"
                The method used by the model_object to predict the labels or probabilities.
                By default a sklearn model is assumed. For uplift models, this method should predict
                the probabilities and for non-uplift models it should predict the labels.

        predict_proba_op_name : str, default = "predict_proba"
                The method used by the model_object to predict the probabilities.
                By default a sklearn model is assumed.

        sample_weight : list, numpy.ndarray or None, default=None
                Used to normalize y_true & y_pred.

        pos_label : list of lists, default = [[1]]
                Label values which are considered favorable.
                For all model types except uplift, converts the favourable labels to 1 and others to 0.
                For uplift, user is to provide 2 label names e.g. [["a"], ["b"]] in fav label.
                The first will be mapped to treatment responded (TR) & second to control responded (CR).

        neg_label : list of lists or None, default = None
                Label values which are considered unfavorable.
                neg_label will only be used in uplift models.
                For uplift, user is to provide 2 label names e.g. [["c"], ["d"]] in unfav label.
                The first will be mapped to treatment rejected (TR) & second to control rejected (CR).

        x_train : pandas.DataFrame, str or None, default = None
                Training dataset. m_samples refers to number of rows in the training dataset.
                The string refers to the dataset path acceptable by the model (e.g. HDFS URI).

        x_test : pandas.DataFrame, str or None, default = None
                Testing dataset. The string refers to the dataset path acceptable by the model (e.g. HDFS URI).

        model_object : object
                A blank model object used in the feature importance section for training and prediction.

        _input_validation_lookup : dictionary
                Contains the attribute, its correct data type and values (if it is applicable) for every argument passed by user.

        self.multi_class_flag : bool
                Indicates whether the model is a multi-class classification model. If True, policy will subsequently be disabled.

        err : object
                VeritasError object to save errors

        pos_label2 : list, default=None
                Encoded pos_label value

        unassigned_y_label : tuple, default=None
                Contains the unassigned labels and the index of unassigned label values in y_true. This supports multi-class classification labels where user may provide incomplete labels in pos_label and neg_label.

        non_intersect_pvars : list, default=None
                Contains list of protected variables, excluding intersectional variables

        label_count : int
                Unique count of y_true target labels.

        _model_data_processing_flag : boolean, default=False
                Indicates if data in ModelContainer has been processed. Flag used in the respective use case classes.

        policies : list
                List of supported policies, i.e., 'maj_min', 'maj_rest', 'max_bias'.

        p_grp_input : dict
                Stores a copy of original p_grp passed by user, used in _print_evaluate.

        classes_ : numpy.ndarray
                A list of class labels known to the classifier.
        """
        self.x_train = x_train
        self.x_test = x_test
        self.y_true = y_true
        self.y_pred = y_pred
        self.y_prob = y_prob
        self.y_train = y_train
        if p_grp is not None:
            self.p_var = list(p_grp.keys())
            self.p_grp = self._nest_pgrp_upgrp_values(p_grp)  # Creates nested list for p_grp values
            self.up_grp = self._nest_pgrp_upgrp_values(up_grp)  # Creates nested list for up_grp values
            self.p_grp_input = p_grp.copy()
        else:
            self.p_var = None
            self.p_grp = None
            self.up_grp = None
            self.p_grp_input = None
        self.protected_features_cols = protected_features_cols
        self.model_object = model_object
        self.train_op_name = train_op_name
        self.predict_op_name = predict_op_name
        self.predict_proba_op_name = predict_proba_op_name
        self.sample_weight = sample_weight
        self.model_name = model_name
        self.model_type = model_type
        if self.model_name == "auto":
            self.model_name = model_type
        self.pos_label = pos_label
        if self.pos_label is None:
            self.neg_label = None
        else:
            self.neg_label = neg_label
        self.pos_label2 = None
        self.policies = ["maj_min", "maj_rest", "max_bias"]
        self._model_data_processing_flag = False
        self.unassigned_y_label = (None, None)
        self.label_count = None
        self.multi_class_flag = False
        self.non_intersect_pvars = None
        self.err = VeritasError()

        check_y_label = None

        check_p_grp = None

        metric_group = None
        check_model_type = []
        for usecase in Fairness.__subclasses__():
            model_type_to_metric_lookup = getattr(usecase, "_model_type_to_metric_lookup")
            check_model_type = check_model_type + list(model_type_to_metric_lookup.keys())
            check_model_type = sorted(list(set(check_model_type)))
            if model_type in model_type_to_metric_lookup.keys():
                metric_group = model_type_to_metric_lookup[model_type][0]

        if y_true is not None and metric_group in ["uplift", "classification"]:
            check_y_label = list(set(y_true))

        if self.p_grp is not None:
            if self.p_var is not None:
                check_p_grp = dict.fromkeys(self.p_var)

            self.check_protected_columns()

            # Find intersectional columns
            self._find_intersect_vars_in_p_grp_input()
            self._process_intersect_p_vars()

            # Dictionary for input data
            if protected_features_cols is None and x_test is not None:
                if type(self.x_test) == pd.DataFrame:
                    p_var_no_intersect = [col for col in self.p_var if "|" not in col]
                    self.protected_features_cols = self.x_test.loc[:, p_var_no_intersect]
                else:
                    self.err.push(
                        "type_error",
                        var_name="x_test",
                        given=str(type(self.x_test)),
                        expected=str(pd.DataFrame),
                        function_name="ModelContainer",
                    )
                    self.err.pop()

            if self.protected_features_cols is not None:
                self._intersectional_fairness()
                for var in check_p_grp.keys():
                    check_p_grp[var] = self.protected_features_cols[var].unique()
            self.check_p_grp = check_p_grp
        NoneType = type(None)

        # Dictionary for expected data type
        # if value range is a tuple, will be considered as a numerical range
        # if value range is a list/set of str, will be considered as a collection of available values
        # First item of value is for check_datatype
        # Second item of value is for check_value
        self._input_validation_lookup = {
            "y_true": [
                (NoneType, list, np.ndarray, pd.Series),
            ],
            "y_train": [
                (NoneType, list, np.ndarray, pd.Series),
            ],
            "y_pred": [(NoneType, list, np.ndarray, pd.Series), check_y_label],
            "y_prob": [
                (NoneType, list, np.ndarray, pd.Series, pd.DataFrame),
                (-0.01, 1.01),
            ],
            "protected_features_cols": [(NoneType, pd.DataFrame), self.p_var],
            "x_train": [(NoneType, pd.DataFrame, str), None],
            "x_test": [(NoneType, pd.DataFrame, str), None],
            "train_op_name": [(str,), None],
            "predict_op_name": [(str,), None],
            "sample_weight": [(NoneType, list, np.ndarray), (0, np.inf)],
            "model_name": [(str,), None],
            "model_type": [(str,), check_model_type],
            "pos_label": [
                (
                    NoneType,
                    list,
                ),
                check_y_label,
            ],
            "neg_label": [(NoneType, list), check_y_label],
            "predict_proba_op_name": [(str,), None],
        }

        if self.p_grp is not None:
            self._input_validation_lookup.update(
                {
                    "p_grp": [(dict,), check_p_grp],
                    "up_grp": [
                        (
                            dict,
                            NoneType,
                        ),
                        check_p_grp,
                    ],
                    "p_var": [(list,), str],
                }
            )

        check_datatype(self)

        if self.model_type != "regression":
            self.check_y_prob()
            self.check_classes()

        # If model object is None then get classes_ from y_prob (if dataframe) or y_train or y_true
        if self.model_object is None:
            if isinstance(self.y_prob, pd.DataFrame) and self.y_prob.shape[1] > 2:
                self.classes_ = np.array(self.y_prob.columns.tolist())
            else:
                if self.y_train is not None:
                    self.classes_ = np.unique(self.y_train)
                else:
                    self.classes_ = np.unique(self.y_true)
        elif self.model_type != "regression":
            self.classes_ = self.model_object.classes_

        if (
            self.model_type != "regression"
            and len(self.classes_) > 2
            and self.pos_label is None
            and self.y_true is not None
            and self.y_pred is not None
        ):
            self.multi_class_flag = True
            self.neg_label = None
            self.enc_y_true, self.enc_y_pred = _one_hot_encode_y_true_y_pred(self.y_true, self.y_pred)

        # if model name is longer than 20 characters, will keep the first 20 only
        self.model_name = self.model_name[0:20]

        # convert to numpy array for easier processing
        if self.y_true is not None:
            self.y_true = np.array(self.y_true)
        if self.y_pred is not None:
            self.y_pred = np.array(self.y_pred)
        if self.y_prob is not None:
            self.y_prob = np.array(self.y_prob)
        if self.y_train is not None:
            self.y_train = np.array(self.y_train)
        if self.sample_weight is not None:
            self.sample_weight = np.array(self.sample_weight)

        check_value(self)

        if y_true is not None:
            self.label_count = len(set(self.y_true))
        self.check_data_consistency()

        if y_pred is not None:
            self.y_pred_labels = set(y_pred)
        else:
            self.y_pred_labels = None

        if y_true is not None:
            self.y_true_labels = set(y_true)
        else:
            self.y_true_labels = None

        if y_train is not None:
            self.y_train_labels = set(y_train)
        else:
            self.y_train_labels = None

        if metric_group in ["uplift", "classification"]:
            self.check_label_consistency()

            if metric_group == "classification":
                self.check_unassigned_y_label()

        if self.p_grp is not None:
            self.check_multi_class_policy()
            self._process_up_grp_input()  # Deduce up_grp values if up_grp is None and p_grp not a policy

    def _intersectional_fairness(self):
        """
        Implements intersectional fairness by modifying protected variable values.
        """
        if len(self.intersect_p_grp.keys()) > 0:
            for ix, cols in enumerate(self.intersect_p_var_sep):
                intersect_col = self.x_test[list(cols)].copy()
                self.protected_features_cols.loc[:, self.intersect_p_var_names[ix]] = intersect_col.apply(
                    lambda row: "|".join([str(col) for col in row]), axis=1
                )

    def _process_intersect_p_vars(self):
        """
        Processes intersectional protected variables.
        Removes intersectional variable groups whose column names are not in either the p_var or the x_test DataFrame columns.

        If any columns are removed, a warning message is printed indicating which columns were omitted.
        """
        if len(self.intersect_p_grp.keys()) > 0:
            removed_cols = []
            for ix, cols in enumerate(self.intersect_p_var_sep.copy()):
                for col in cols:
                    if (col not in self.p_var) and (col not in self.x_test.columns):
                        removed_cols.append(col)
                        self.intersect_p_grp.pop(self.intersect_p_var_names[ix])
                        self.intersect_p_var_names.pop(ix)
                        break
            if len(removed_cols) > 0:
                print(
                    "Warning: All intersectional columns containing",
                    ",".join(removed_cols),
                    "will be omitted as the column cannot be found.",
                )

    def _find_intersect_vars_in_p_grp_input(self):
        """
        Identifies intersectional fairness variables based on p_grp input.
        """
        intersect_p_var_sep = []
        intersect_p_var_names = []
        intersect_p_grp = {}
        for key in self.p_var:
            if not "|" in key:
                pass
            else:
                intersect_cols = key.split("|")
                intersect_p_var_names.append(key)
                intersect_p_var_sep.append(tuple(intersect_cols))
                intersect_p_grp[key] = self.p_grp[key]

        self.intersect_p_grp = intersect_p_grp
        self.intersect_p_var_names = intersect_p_var_names
        self.intersect_p_var_sep = intersect_p_var_sep
        self.non_intersect_pvars = list(set(self.p_grp.keys()) - set(self.intersect_p_grp.keys()))

    def _process_up_grp_input(self):
        """
        Check if up_grp is not provided and initiaize the up_grp.
        If corresponding p_grp contains labels then assign the rest of labels using set difference.
        If corresponding p_grp contains policy assign an empty list.
        """

        # If None then initialise
        if self.up_grp is None:
            self.up_grp = dict.fromkeys(self.p_grp)

        # Value assignment
        for key in self.p_grp.keys():
            # If key not in up_grp and policy, create a new key and assign empty list
            if (key not in self.up_grp) and (isinstance(self.p_grp[key][0], str)):
                self.up_grp[key] = []
            # None and not policy
            elif (self.up_grp[key] is None) and (not isinstance(self.p_grp[key][0], str)):
                self.up_grp[key] = [list(set(self.check_p_grp[key]) - set(self.p_grp[key][0]))]
            # Not None and not policy
            elif (self.up_grp[key] is not None) and (not isinstance(self.p_grp[key][0], str)):
                pass
            # Overwrite if p_grp contains policy
            else:
                self.up_grp[key] = []

    def check_protected_columns(self):
        """
        Check p_var, x_test and protected_feature_columns consistency

        Returns:
        ---------------
        successMsg : string
            If there are no errors, a success message will be returned
        """
        err_ = []
        successMsg = "protected column check completed without issue"

        if type(self.p_var) != list:
            err_.append(["type_error", "p_var", type(self.p_var), list])

        elif self.p_grp is not None and self.protected_features_cols is None and self.x_test is None:
            err_.append(
                [
                    "length_error",
                    "protected_features_cols and x_test",
                    "None for both",
                    "not both are None when p_grp is provided",
                ]
            )

        elif self.protected_features_cols is not None:
            if sum([x in self.p_var for x in self.protected_features_cols.columns]) != len(self.p_var):
                err_.append(
                    [
                        "value_error",
                        "p_var",
                        str(self.p_var),
                        str(list(self.protected_features_cols.columns)),
                    ]
                )
        # Commented to include intersectional columns
        # elif self.protected_features_cols is None and self.x_test is not None :
        #     if sum([x in self.p_var for x in self.x_test.columns]) != len(self.p_var) :
        #         err_.append(['value_error', "p_var", str(self.p_var), str(list(self.x_test.columns))])

        if err_ == []:
            return successMsg
        else:
            for i in range(len(err_)):
                self.err.push(
                    err_[i][0],
                    var_name=err_[i][1],
                    given=err_[i][2],
                    expected=err_[i][3],
                    function_name="check_protected_columns",
                )
            self.err.pop()

    def check_data_consistency(self):
        """
        Check rows and columns are of consistent size across the various datasets
        and the number & match of the unique values.

        Returns:
        ---------------
        successMsg : string
            If there are no errors, a success message will be returned
        """
        err_ = []
        successMsg = "data consistency check completed without issue"

        if self.y_true is not None and self.p_grp is not None:
            test_row_count = self.y_true.shape[0]
            # check protected_features_cols
            # check cols of protected_features_cols is same as p_var
            pro_f_cols_rows = len(self.protected_features_cols.index)
            pro_f_cols_cols = len(self.protected_features_cols.columns)
            if pro_f_cols_rows != test_row_count:
                err_.append(
                    [
                        "length_error",
                        "protected_features_cols row",
                        str(pro_f_cols_rows),
                        str(test_row_count),
                    ]
                )
            if pro_f_cols_cols != len(self.p_var):
                err_.append(
                    [
                        "length_error",
                        "p_var array",
                        str(len(self.p_var)),
                        str(pro_f_cols_cols),
                    ]
                )

        # check train datasets if y_train is not None
        if self.y_train is not None:
            train_row_count = self.y_train.shape[0]
            # check x_train
            if type(self.x_train) == pd.DataFrame:
                x_train_rows = len(self.x_train.index)
                if x_train_rows != train_row_count:
                    err_.append(
                        [
                            "length_error",
                            "x_train, y_train rows",
                            "x_train rows " + str(x_train_rows),
                            "y_train rows " + str(train_row_count),
                        ]
                    )

        # y_prob should be float
        if self.y_prob is not None and self.y_prob.dtype.kind != "f":
            self.err.push(
                "type_error",
                var_name="y_prob",
                given="not type float64",
                expected="float64",
                function_name="check_data_consistency",
            )

        # if both x_test and x_train are df, check they have same no. of columns
        if self.x_train is not None and self.x_test is not None:
            if type(self.x_train) == pd.DataFrame and type(self.x_test) == pd.DataFrame:
                x_train_cols = len(self.x_train.columns)
                x_test_cols = len(self.x_test.columns)
                if x_train_cols != x_test_cols:
                    err_.append(
                        [
                            "length_error",
                            "x_train column",
                            str(x_train_cols),
                            str(x_test_cols),
                        ]
                    )

        # pos_label cannot be None for uplift model type
        if self.model_type == "uplift" and self.pos_label is None:
            err_.append(["value_error", "pos_label", "None", "not None for uplift"])

        # neg_label cannot be None for uplift model type
        if self.neg_label is None and self.pos_label is not None and self.model_type == "uplift":
            err_.append(["value_error", "neg_label", "None", "not None"])

        # check pos_label and neg_label for overlap labels
        if self.neg_label is not None and not set(self.pos_label).isdisjoint(set(self.neg_label)):
            err_.append(
                [
                    "value_error",
                    "pos_label and neg_label",
                    "pos_label {} and neg_label {}".format(self.pos_label, self.neg_label),
                    "no label overlap",
                ]
            )

        # check p_grp and up_grp for overlap values
        if self.p_grp is not None and self.up_grp is not None:
            for key in self.p_grp.keys():
                if not isinstance(self.p_grp[key], str) and key in self.up_grp.keys():
                    if not set(self.p_grp[key][0]).isdisjoint(set(self.up_grp[key][0])):
                        err_.append(
                            [
                                "value_error",
                                "p_grp and up_grp",
                                "p_grp {} and up_grp {}".format(self.p_grp[key], self.up_grp[key]),
                                "no value overlap",
                            ]
                        )

        # #y_pred and y_prob should not be both none
        # if self.y_pred is None and self.y_prob is None: # Commented to allow user to pass y_pred only for evaluate metrics
        #     err_.append(['length_error', "y_pred and y_prob", "None for both", "not both are None"])

        # y_true should 1 columns
        # y_true, y_pred, sample weight, are in same shape
        # Based on the length of pos_label, if 1, the y_prob will be nx1
        # Based on the length of pos_label, if 2, the y_prob will be nx4
        if self.y_true is not None:
            y_true_shape = self.y_true.shape
            if len(y_true_shape) == 1:
                y_true_shape = (y_true_shape[0], 1)

            check_list = ["y_pred", "y_prob", "sample_weight"]
            check_order = ["row", "column"]
            check_dict = {}
            for var_name in check_list:
                var_value = getattr(self, var_name)
                if var_value is not None:
                    if type(var_value) == list:
                        var_value = np.array(var_value)
                    var_shape = var_value.shape
                    for i in range(len(check_order)):
                        try:
                            given_size = var_shape[i]
                        except IndexError:
                            given_size = 1
                        expected_size = y_true_shape[i]
                        # Based on the length of pos_label, if 1, the y_prob will be nx1
                        # Based on the length of pos_label, if 2, the y_prob will be nx4
                        if var_name == "y_prob" and check_order[i] == "column":
                            if self.model_type == "uplift":
                                expected_size = 4
                            else:
                                # if var_name =="y_prob" and check_order[i] == "column" :#and label_count == 0 :
                                expected_size = self.label_count

                        # When labels are binary, y_prob shape can be n,1 or n,2
                        if var_name == "y_prob" and check_order[i] == "column" and self.label_count == 2:
                            if given_size > expected_size:
                                err_.append(
                                    [
                                        "length_error",
                                        var_name + " " + check_order[i] + " length",
                                        str(given_size) + ">",
                                        str(expected_size),
                                    ]
                                )
                        else:
                            if given_size != expected_size:
                                err_.append(
                                    [
                                        "length_error",
                                        var_name + " " + check_order[i] + " length",
                                        str(given_size),
                                        str(expected_size),
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
                    function_name="check_data_consistency",
                )
            self.err.pop()

    def check_label_consistency(self):
        """
        Checks if the labels and values in y_pred, y_train and y_true are consistent

        Returns:
        ---------------
        successMsg : string
            If there are no errors, a success message will be returned
        """
        err_ = []
        successMsg = "data consistency check completed without issue"

        if self.y_pred is not None and self.y_true is not None:
            if set(self.y_true) != set(self.y_pred):
                err_.append(
                    [
                        "value_error",
                        "y_pred labels",
                        str(set(self.y_pred)),
                        str(set(self.y_true)),
                    ]
                )

        if self.y_train is not None and self.y_true is not None:
            if set(self.y_true) != set(self.y_train):
                self.y_train = None
        if err_ == []:
            return successMsg
        else:
            for i in range(len(err_)):
                self.err.push(
                    err_[i][0],
                    var_name=err_[i][1],
                    given=err_[i][2],
                    expected=err_[i][3],
                    function_name="check_label_consistency",
                )
            self.err.pop()

    def check_unassigned_y_label(self):
        """
        Checks for unassigned label when both pos_label and neg_label are provided by user for multi-class classification models with more than 2 target labels.
        Stores all unassigned label and index based on y_true in tuple as unassigned_y_label.

        Returns:
        ---------------
        successMsg : string
            If there are no errors, a success message will be returned
        """
        successMsg = "unassigned label check completed without issue"
        label = []
        index = []
        if self.neg_label is not None and self.y_true is not None:
            check_y_label = set(self.y_true)
            pos_label_input = self.pos_label
            neg_label_input = self.neg_label if self.neg_label is not None else []
            input_label = pos_label_input + neg_label_input
            label = list(check_y_label.difference(set(input_label)))

            # append index of y_true unassigned label
            for i in label:
                idx = np.where(self.y_true == i)
                index += idx[0].tolist()

        self.unassigned_y_label = (label, index)
        return successMsg

    def check_y_prob(self):
        """
        Check y_prob and process y_prob in the correct format.
        """
        err_ = []
        successMsg = "y_prob check completed without issue"

        if isinstance(self.y_prob, list):
            self.y_prob = np.array(self.y_prob)

        if (
            self.y_prob is not None
            and self.y_prob.ndim == 2
            and self.y_prob.shape[1] > 2
            and not isinstance(self.y_prob, pd.DataFrame)
        ):
            err_.append(
                [
                    "type_error",
                    "y_prob",
                    str(type(self.y_prob)),
                    str(pd.DataFrame) + " with labels as column names",
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
                    function_name="check_y_prob",
                )
            self.err.pop()

    def check_classes(self):
        """
        Checks the classes_ attribute of the model and assign attribute if it does not exist.
        """
        err_ = []
        successMsg = "classes check completed without issue"
        if (
            not issubclass(self.model_object.__class__, ModelWrapper)
            and not hasattr(self.model_object, "classes_")
            and self.model_object is not None
        ):
            if isinstance(self.y_prob, pd.DataFrame) and self.y_prob.shape[1] > 2:
                self.model_object.classes_ = np.array(self.y_prob.columns.tolist())
            else:
                if self.y_train is not None:
                    self.model_object.classes_ = np.unique(self.y_train)
                else:
                    self.model_object.classes_ = np.unique(self.y_true)

        # Check consistency for classes
        if (
            self.model_object is not None
            and self.y_prob is not None
            and self.y_prob.ndim == 2
            and self.y_prob.shape[1] > 2
        ):
            if not np.array_equal(self.model_object.classes_, self.y_prob.columns):
                err_.append(
                    [
                        "value_error",
                        "classes_",
                        str(self.model_object.classes_),
                        "labels in classes_ to be consistent with y_prob dataframe column names",
                    ]
                )

        if (
            self.model_object is not None
            and self.y_true is not None
            and set(self.model_object.classes_) != set(self.y_true)
        ):
            err_.append(
                [
                    "value_error",
                    "classes_",
                    str(self.model_object.classes_),
                    "labels in classes_ to be consistent with y_true",
                ]
            )

        if (
            self.model_object is not None
            and self.y_pred is not None
            and set(self.model_object.classes_) != set(self.y_pred)
        ):
            err_.append(
                [
                    "value_error",
                    "classes_",
                    str(self.model_object.classes_),
                    "labels in classes_ to be consistent with y_pred",
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
                    function_name="check_classes",
                )
            self.err.pop()

    def check_multi_class_policy(self):
        """
        Checks the policy specified in privileged and unprivileged groups for all protected and intersectional variables.
        Policies are disabled for multi-class use cases.
        """
        err_ = []
        successMsg = "policy check completed without issue"

        for grp in [self.p_grp, self.up_grp]:
            if grp is None:
                continue
            for p_var, val in grp.items():
                if self.multi_class_flag and isinstance(val, str):
                    if p_var in self.protected_features_cols:
                        unique_values = self.protected_features_cols[p_var].unique()
                        err_.append(["value_error", p_var, val, unique_values])

        if err_ == []:
            return successMsg
        else:
            for i in range(len(err_)):
                self.err.push(
                    err_[i][0],
                    var_name=err_[i][1],
                    given=err_[i][2],
                    expected=err_[i][3],
                    function_name="check_multi_class_policy",
                )
            self.err.pop()

    def _nest_pgrp_upgrp_values(self, grp):
        """
        Takes a dictionary as input and returns a new dictionary with the values nested in a list. Excludes policies.

        Parameters
        ----------
        grp : dict
            The input dictionary.

        Returns
        -------
        dict
            The processed dictionary with nested list values.
        """
        result = {}
        if grp is None:
            return

        for key, value in grp.items():
            if isinstance(value, list):
                if not any(isinstance(i, list) for i in value):
                    value = [value]
            result[key] = value
        return result

    def clone(
        self,
        y_true,
        model_object,
        y_pred=None,
        y_prob=None,
        y_train=None,
        train_op_name="fit",
        predict_op_name="predict",
        sample_weight=None,
        pos_label=[1],
        neg_label=None,
        predict_proba_op_name="predict_proba",
    ):
        """
        Clone ModelContainer object

        Parameters
        ---------------
        y_true : numpy.ndarray
                Ground truth target values.

        model_object : object
                A blank model object used in the feature importance section for training and prediction.

        y_pred : numpy.ndarray, default=None
                Predicted targets as returned by classifier.

        y_prob : list, numpy.ndarray, pandas.Series, pandas.DataFrame or None, default=None
                Predicted probabilities as returned by classifier.
                For uplift models, L = 4. Else, L = 1 where dimensions are (n_samples, L)
                y_prob column orders should be ["TR", "TN", "CR", "CN"] for uplift models.

        y_train : list, numpy.ndarray, pandas.Series or None, default=None
                Ground truth for training data.
                If it is not given in correct format, Feature Importance LOO Analysis is to be skipped.

        train_op_name : str, default = "fit"
                The method used by the model_object to train the model. By default a sklearn model is assumed.

        predict_op_name : str, default = "predict"
                The method used by the model_object to predict the labels or probabilities. By default a sklearn model is assumed.
                For uplift models, this method should predict the probabilities and for non-uplift models it should predict the labels.

        predict_proba_op_name : str, default = "predict_proba"
                The method used by the model_object to predict the probabilities. By default a sklearn model is assumed.

        sample_weight : list, numpy.ndarray or None, default=None
                Used to normalize y_true & y_pred.

        pos_label : list of lists, default = [1]
                Label values which are considered favorable.
                For all model types except uplift, converts the favourable labels to 1 and others to 0.
                For uplift, user is to provide 2 label names e.g. ["a", "b"] in fav label. The first will be mapped to treatment responded (TR) & second to control responded (CR).

        neg_label : list of lists or None, default = None
                Label values which are considered unfavorable.
                neg_label will only be used in uplift models.
                For uplift, user is to provide 2 label names e.g. ["c", "d"] in unfavourable label. The first will be mapped to treatment rejected (TR) & second to control rejected (CR).

        Returns
        ----------------
        clone_obj : object
        """
        clone_obj = ModelContainer(
            y_true=y_true,
            p_grp=self.p_grp,
            up_grp=self.up_grp,
            x_train=self.x_train,
            x_test=self.x_test,
            model_object=model_object,
            model_type=self.model_type,
            model_name="clone",
            y_pred=y_pred,
            y_prob=y_prob,
            y_train=y_train,
            protected_features_cols=self.protected_features_cols,
            train_op_name=train_op_name,
            predict_op_name=predict_op_name,
            sample_weight=self.sample_weight,
            pos_label=pos_label,
            neg_label=neg_label,
            predict_proba_op_name=predict_proba_op_name,
        )

        return clone_obj
