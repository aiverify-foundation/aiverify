import math
import multiprocessing

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelBinarizer

from .errors import VeritasError


def check_datatype(obj_in):
    """
    Checks whether a particular input is of the correct datatype.

    Parameters
    ----------------
    obj_in : object
            Object that needs to be checked

    Returns:
    ---------------
    successMsg : str
            If there are no errors, a success message will be returned
    """
    err = VeritasError()
    successMsg = "data type check completed without issue"
    NoneType = type(None)
    err_ = []
    input_validation_lookup = obj_in._input_validation_lookup

    # loop through each variable specified inside _input_validation_lookup
    var_names = input_validation_lookup.keys()
    for var_name in var_names:
        exp_type = input_validation_lookup.get(var_name)[0]
        # convert exp_type into iterable list
        if type(exp_type) == tuple:
            exp_type = list(exp_type)
        if exp_type is None:
            continue
        # get the variable
        try:
            var = getattr(obj_in, var_name)
        except:
            if NoneType not in exp_type:
                err_.append(["type_error", str(var_name), "None", str(exp_type)])
                continue
        # get variable type
        cur_type = type(var)

        # check datatype
        if cur_type not in exp_type:
            err_.append(["type_error", str(var_name), str(cur_type), str(exp_type)])

        if var_name in ["p_grp", "up_grp"]:
            if cur_type in exp_type:
                if getattr(obj_in, var_name) is not None:
                    for i in getattr(obj_in, var_name).values():
                        if var_name == "p_grp":
                            if type(i) not in [list, str]:
                                err_.append(
                                    [
                                        "type_error",
                                        "p_grp values",
                                        str(type(i)),
                                        "list or str",
                                    ]
                                )
                        else:  # For up_grp allow None to be set as value
                            if type(i) not in [list, type(None)]:
                                err_.append(
                                    [
                                        "type_error",
                                        var_name + " values",
                                        str(type(i)),
                                        "list",
                                    ]
                                )

                        if (type(i) == list) and (len(i) > 0) and not (type(i[0]) == list):
                            err_.append(
                                [
                                    "type_error",
                                    var_name + " value item",
                                    str(type(i[0])),
                                    "list",
                                ]
                            )

        if var_name in ["pos_label", "neg_label"]:
            if cur_type in exp_type and var is not None:
                if any(isinstance(i, list) for i in var):
                    err_.append(["type_error", str(var_name), str(type(i)), "no nested list"])

    if err_ == []:
        return successMsg
    else:
        for i in range(len(err_)):
            err.push(
                err_[i][0],
                var_name=err_[i][1],
                given=err_[i][2],
                expected=err_[i][3],
                function_name="check_datatype",
            )
        err.pop()


def check_value(obj_in):
    """
    Checks if certain values are present in the obj_in. E.g. Check if the the performance and fairness metrics provided by user (if any) are supported

    Parameters
    ----------------
    obj_in : object
            Object that needs to be checked

    Returns:
    ---------------
    successMsg : str
            If there are no errors, a success message will be returned
    """
    err = VeritasError()
    err_ = []
    input_validation_lookup = obj_in._input_validation_lookup
    var_names = input_validation_lookup.keys()
    successMsg = "data value check completed without issue"
    numeric_types = [int, float]
    numeric_list_types = [list, np.array, np.ndarray]
    numeric_range_types = [
        tuple,
    ]
    range_types = [
        list,
    ]
    str_type = [
        str,
    ]
    collection_types = [list, set, np.ndarray]
    skip_check_upgrp = []

    for var_name in var_names:
        var_value = getattr(obj_in, var_name)
        var_value_type = type(var_value)
        var_range = None

        # only perform check_value for range provided variables
        if len(input_validation_lookup.get(var_name)) == 2:
            var_range = input_validation_lookup.get(var_name)[1]
            var_range_type = type(var_range)
        else:
            continue

        if var_value is None or var_range is None:
            continue

        elif var_value_type in str_type and var_range_type in collection_types:
            if var_value not in var_range:
                err_.append(["value_error", var_name, str(var_value), str(var_range)])

        # eg. y_pred, pos_label, neg_label
        elif var_value_type in collection_types and var_range_type in collection_types:
            var_value = set(np.array(var_value).ravel())
            var_range = set(var_range)
            if not var_value.issubset(var_range):
                err_.append(
                    [
                        "value_error",
                        var_name,
                        str(sorted(list(var_value))),
                        str(sorted(list(var_range))),
                    ]
                )

        # eg. check p_var
        elif var_value_type in collection_types and var_range_type == type:
            for i in var_value:
                if type(i) != var_range:
                    err_.append(["value_error", var_name, str(type(i)), str(str)])

        # eg. protected_features_cols
        elif var_value_type == pd.DataFrame and var_range_type in range_types:
            column_names = set(var_value.columns.values)
            if not column_names.issubset(set(var_range)):
                err_.append(
                    [
                        "column_value_error",
                        var_name,
                        str(sorted(list(var_range))),
                        str(sorted(list(column_names))),
                    ]
                )

        # eg check y_prob
        elif var_value_type in numeric_list_types and var_range_type in numeric_range_types:
            # need to perfrom check on whether the dimension array
            min_value = var_value.min()
            max_value = var_value.max()
            if min_value < var_range[0] or max_value > var_range[1]:
                err_.append(
                    [
                        "value_error",
                        var_name,
                        "range [" + str(min_value) + " : " + str(max_value) + "] ",
                        str(var_range),
                    ]
                )

        # eg check fair_neutral_tolerance
        elif var_value_type in numeric_types and var_range_type in numeric_range_types:
            if var_value < var_range[0] or var_value > var_range[1]:
                err_.append(["value_error", var_name, str(var_value), str(var_range)])

        # eg check feature_imp
        elif var_value_type == pd.DataFrame and var_range_type in numeric_range_types:
            var_value_types = var_value.dtypes
            if len(var_value_types) != len(var_range):
                err_.append(["length_error", var_name, len(var_value_types), len(var_range)])
            else:
                for i, tp in zip(range(len(var_value_types)), var_value_types):
                    if tp != var_range[i]:
                        err_.append(["column_value_error", var_name, str(tp), str(var_range[i])])

        # eg check p_grp, up_grp
        elif var_value_type == dict and var_range_type == dict:
            keyset1 = set(var_value.keys())
            keyset2 = set(var_range.keys())
            check_policy_pgrp = keyset1.copy()

            # check for policy in p_grp
            for key in check_policy_pgrp:
                if type(var_value[key]) == str:
                    skip_check_upgrp.append(key)

            # remove policy-based p_var in var_range
            if var_name == "up_grp" and skip_check_upgrp:
                for i in skip_check_upgrp:
                    if i in keyset1:
                        keyset1.remove(i)
                    keyset2.remove(i)

            if keyset1 != keyset2:
                err_.append(
                    [
                        "value_error",
                        var_name,
                        str(sorted(list(keyset1))),
                        str(sorted(list(keyset2))),
                    ]
                )
            else:
                for key in keyset1:
                    i_var = convert_to_set(var_value.get(key))
                    # If a policy is specified, the compare against supported policies
                    if (var_name in ["p_grp", "up_grp"]) and (isinstance(var_value.get(key), str)):
                        i_range = convert_to_set(obj_in.policies)
                    elif (var_name == "up_grp") and (var_value.get(key) is None):
                        # When up_grp value is set as None, skip checking value as it's later deduced
                        i_var = set()
                        i_range = set()
                    else:
                        i_range = convert_to_set(var_range.get(key))
                    if i_range is not None and not i_var.issubset(i_range):
                        err_.append(
                            [
                                "value_error",
                                var_name + " " + key,
                                str(sorted(list(i_var))),
                                str(sorted(list(i_range))),
                            ]
                        )

        else:
            err_.append(
                [
                    "value_error",
                    var_name,
                    "a range of " + str(var_range),
                    "a range for " + str(var_value_type),
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
                function_name="check_value",
            )
        err.pop()


def convert_to_set(var):
    """
    Converts certain types of variables into set

    Parameters
    ----------
    var :

    Returns
    ----------
    result :
    """
    result = set()
    if type(var) in [int, float, str]:
        result = {
            var,
        }
    elif type(var) == set:
        result = var
    elif (type(var) in [list, tuple]) and (len(var) == 1) and (type(var[0]) in [list, tuple]):
        result = set(var[0])
    elif type(var) in [list, tuple]:
        result = set(var)
    else:
        result = var
    return result


def check_data_unassigned(obj_in, y=None, y_pred_negation_flag=False):
    """
    Deletes y_true, y_pred, y_prob, x_test, protected_feature_cols rows if there are unassigned labels based on y_true index for multi-class classification models.
    If y_pred_negation_flag is True, checks if there remain unassigned labels in the predicted values and perform negation of labels based on y_true.

    Parameters
    -----------
    obj_in : object
            Object that needs to be checked

    y : numpy.ndarray, default=None
            Predicted targets as returned by classifier.

    y_pred_negation_flag : boolean, default=False
            Whether predicted targets in y_pred to be checked for unassigned labels and perform negation of labels based on y_true.

    Returns
    -----------------
    y_bin : numpy.ndarray
            Encoded y_pred labels.

    y_true : numpy.ndarray
            Encoded ground truth target values.

    y_pred : numpy.ndarray
            Predicted targets as returned by classifier.

    y_prob : numpy.ndarray
            Predicted probabilities as returned by classifier.

    x_test : pandas.DataFrame
            Testing dataset.

    protected_features_cols: pandas.DataFrame
            Encoded variable used for masking.
    """
    y_true = obj_in.y_true
    y_pred = obj_in.y_pred
    y_prob = obj_in.y_prob
    x_test = obj_in.x_test
    pos_label = obj_in.pos_label
    protected_features_cols = obj_in.protected_features_cols
    unassigned_y_label = obj_in.unassigned_y_label

    # if y_pred_flag is true, check for assigned labels in y_pred predicted values and negate labels based on y_true for multi-class classification models
    if y_pred_negation_flag:
        y_pred_index = []
        y_bin = y
        # append y_pred index with unassigned label
        for i in unassigned_y_label[0]:
            idx = np.where(y_bin == i)
            y_pred_index += idx[0].tolist()

        # perform binary encoding for y_pred
        row = np.isin(y_bin, pos_label)
        y_bin[row] = 1
        y_bin[~row] = 0

        # negate y_pred unassigned value based on y_true index
        for i in y_pred_index:
            if y_true[i] == 0:
                y_bin[i] = 1
            elif y_true[i] == 1:
                y_bin[i] = 0

        y_bin = y_bin.astype(np.int8)

        return y_bin

    # remove rows with unassigned label based on pos_label and neg_label
    else:
        if len(y_true.shape) == 1 and y_true.dtype.kind in ["i", "O", "U"]:
            y_true = np.delete(y_true, unassigned_y_label[1])
        if y_pred is not None and len(y_pred.shape) == 1 and y_pred.dtype.kind in ["i", "O", "U"]:
            y_pred = np.delete(y_pred, unassigned_y_label[1])
        if y_prob is not None and y_prob.dtype.kind == "f":
            y_prob = np.delete(y_prob, unassigned_y_label[1], axis=0)
        if x_test is not None and isinstance(x_test, pd.DataFrame):
            x_test = x_test.drop(unassigned_y_label[1]).reset_index(drop=True)
        if protected_features_cols is not None and isinstance(protected_features_cols, pd.DataFrame):
            protected_features_cols = protected_features_cols.drop(unassigned_y_label[1]).reset_index(drop=True)

        return y_true, y_pred, y_prob, x_test, protected_features_cols


def input_parameter_validation(_input_parameter_lookup):
    """
    Checks whether the values and data types of the input parameters are valid.

    Parameters
    ----------------
    _input_parameter_lookup : dict
            Dictionary that maps input parameter names to their expected data types and values

    Returns:
    ---------------
    successMsg : str
            If there are no errors, a success message will be returned
    """
    err = VeritasError()
    err_ = []
    success_msg = "input parameter validation completed without issue"
    NoneType = type(None)

    # loop through each input parameter specified in _input_parameter_lookup
    for param_name, param_info in _input_parameter_lookup.items():
        param_value, exp_type, param_range = param_info

        # Check mitigate methods for empty list
        if param_name == "method":
            if not param_value:
                err_.append(["value_error", param_name, str(param_value), str(param_range)])

        # Skip validation if param_name is an empty list or is None
        if (isinstance(param_value, list) and param_value == []) or param_value is None:
            continue

        # check data type
        if not isinstance(param_value, exp_type):
            err_.append(["type_error", param_name, str(type(param_value)), str(exp_type)])

        # check value
        if isinstance(param_range, (list, set, np.ndarray)):
            if isinstance(param_value, (list, set, np.ndarray)):
                if not set(param_value).issubset(set(param_range)):
                    err_.append(["value_error", param_name, str(param_value), str(param_range)])
            # transform_x for mitigate
            elif param_name == "transform_x":
                if param_value.columns.tolist() != param_range:
                    err_.append(
                        [
                            "value_error",
                            param_name,
                            str(param_value.columns.tolist()),
                            str(param_range),
                        ]
                    )
            else:
                if param_value not in param_range:
                    err_.append(["value_error", param_name, str(param_value), str(param_range)])

        # cr_beta for mitigate
        elif param_name == "cr_beta":
            if param_value.shape[0] != param_range[0] or param_value.shape[1] != param_range[1]:
                err_.append(
                    [
                        "value_error",
                        param_name,
                        str(param_value.shape),
                        str(param_range),
                    ]
                )

        elif isinstance(param_range, (tuple)):
            if param_value < param_range[0] or param_value > param_range[1]:
                err_.append(["value_error", param_name, str(param_value), str(param_range)])

    if err_ == []:
        return success_msg
    else:
        for i in range(len(err_)):
            err.push(
                err_[i][0],
                var_name=err_[i][1],
                given=err_[i][2],
                expected=err_[i][3],
                function_name="input_parameter_validation",
            )
        err.pop()


def input_parameter_filtering(_input_parameter_lookup, obj_in=None):
    """
    Filters the input parameters to only include valid values.

    Parameters
    ----------------
    _input_parameter_lookup : dict
            Dictionary that maps input parameter names to their expected values

    obj_in : object
            Object that needs to be checked

    Returns:
    ---------------
    filtered_params : dict
            Dictionary of filtered input parameters
    """
    filtered_params = {}

    # Loop through each input parameter specified in _input_parameter_lookup
    for param_name, param_info in _input_parameter_lookup.items():
        param_value, exp_type, param_range = param_info

        # Filter the value if it is not None and is of the expected data type
        if param_value is None or not isinstance(param_value, exp_type):
            filtered_params[param_name] = param_value
            continue
        # If param_value is iterable and param_range is a list, set, or numpy array, check if param_value is in the range
        if hasattr(param_value, "__iter__") and isinstance(param_range, (list, set, np.ndarray)):
            filtered_value = [val for val in param_value if val in param_range]
            filtered_params[param_name] = filtered_value
        # If param_range is None, include the value in the filtered_params dictionary
        elif param_range is None:
            filtered_params[param_name] = param_value

    # Check if mitigate method specified has sufficient data
    if "method" in filtered_params:
        new_methods = []
        for mtd in filtered_params["method"]:
            if mtd == "threshold" and (
                obj_in.y_true is None
                or obj_in.y_prob is None
                or obj_in.protected_features_cols is None
                or obj_in.p_grp is None
            ):
                print(
                    "Skipped: Mitigate {} is skipped due to insufficient data input during ModelContainer() initialization.".format(
                        mtd
                    )
                )
            elif mtd == "reweigh" and (
                obj_in.y_train is None
                or obj_in.x_train is None
                or obj_in.protected_features_cols is None
                or obj_in.p_grp is None
                or isinstance(obj_in.x_train, str)
            ):
                print(
                    "Skipped: Mitigate {} is skipped due to insufficient data input during ModelContainer() initialization.".format(
                        mtd
                    )
                )
            elif mtd == "correlate" and (
                obj_in.x_train is None
                or obj_in.x_test is None
                or obj_in.protected_features_cols is None
                or obj_in.p_grp is None
                or obj_in.model_object is None
                or isinstance(obj_in.x_train, str)
                or not obj_in.x_train.select_dtypes(include=[np.number]).equals(obj_in.x_train)
            ):
                print(
                    "Skipped: Mitigate {} is skipped due to insufficient data input during ModelContainer() initialization.".format(
                        mtd
                    )
                )
            else:
                new_methods.append(mtd)
        filtered_params["method"] = new_methods

    return filtered_params


def process_y_prob(classes, y_prob, pos_label, y_label):
    """
    Processes y_prob for multi_class classification cases

    Parameters
    -------------
    classes : list
            Target labels from model object

    y_prob : numpy.ndarray
            Predicted probabilities as returned by classifier.

    pos_label : list
            Label values which are considered favorable.

    y_label : list
            List containing target labels

    Returns
    -------------
    y_prob : numpy.ndarray
            Processed y_prob array
    """
    pos_idxs = np.argwhere(np.isin(classes, pos_label)).ravel()
    return y_prob[:, pos_idxs].sum(axis=1)


def get_cpu_count():
    """
    Get the number of CPUs of machine that toolkit is running on.

    Returns
    --------
    CPU count
    """
    return multiprocessing.cpu_count()


def check_multiprocessing(n_threads):
    """
    Determine the number of threads/processes for parallelization.
    0 means auto, else the number is capped by CPU count as well

    Parameters
    -------------
    n_threads : int
            Number of currently active threads of a job

    Returns
    -------------
    n_threads : int
            Number of currently active threads of a job
    """

    if n_threads == 1:
        n_threads = 1

    elif n_threads == 0:
        n_threads = math.floor(get_cpu_count() / 2)

    elif n_threads > 1:
        n_threads = min(math.floor(get_cpu_count() / 2), n_threads)

    else:
        n_threads = 1

    return n_threads


def _one_hot_encode_y_true_y_pred(y_true, y_pred):
    """
    Converts the ground truth and predicted labels to one-hot encoded format using LabelBinarizer.

    Parameters:
    -----------
    y_true : array-like of shape (n_samples,)
            Ground truth labels.

    y_pred : array-like of shape (n_samples,)
            The predicted labels.

    Returns:
    --------
    y_onehot_true : array-like of shape (n_samples, n_classes)
            The one-hot encoded true labels.

    y_onehot_pred : array-like of shape (n_samples, n_classes)
            The one-hot encoded predicted labels.
    """
    label_binarizer = LabelBinarizer().fit(y_true)
    y_onehot_true = label_binarizer.transform(y_true)
    y_onehot_pred = label_binarizer.transform(y_pred)
    return y_onehot_true, y_onehot_pred
