import concurrent.futures

import numpy as np
import sklearn.metrics as skm
from scipy import interpolate


class ModelRateClassify:
    """
    Class to compute the interpolated base rates for classification models.
    """

    def __init__(self, y_true, y_prob, sample_weight=None):
        """
        Parameters
        -------------
        y_true : numpy.ndarray, default=None
                Ground truth target values.

        y_prob : numpy.ndarray, default=None
                Predicted probabilities as returned by classifier.
                For uplift models, L = 4. Else, L = 1 where shape is (n_samples, L)

        sample_weight : numpy.ndarray, default=None
                Used to normalize y_true & y_pred.

        Instance Attributes
        -----------------------
        tpr: object
                Scipy interp1d object containing the function for true positive rate.

        fpr: object
                Scipy interp1d object containing the function for false positive rate.

        ppv: object
                Scipy interp1d object containing the function for precision score.

        forr: object
                Scipy interp1d object containing the function for false omission rate parity.

        selection_rate: object
                Scipy interp1d object containing the function for selection rate.

        base_selection_rate: object
                Scipy interp1d object containing the function for base selection rate.
        """
        (
            ths,
            tpr,
            fpr,
            ppv,
            forr,
            base_selection_rate,
            selection_rate,
        ) = ModelRateClassify.compute_rates(y_true, y_prob, sample_weight)
        self.tpr = interpolate.interp1d(ths, tpr)
        self.fpr = interpolate.interp1d(ths, fpr)
        self.ppv = interpolate.interp1d(ths, ppv)
        self.forr = interpolate.interp1d(ths, forr)
        self.selection_rate = interpolate.interp1d(ths, selection_rate)
        self.base_selection_rate = base_selection_rate

    def compute_rates(y_true, y_prob, sample_weight=None):
        """
        Computes the base rates for classification models.
        Parameters
        -------------
        y_true: numpy.ndarray
                Ground truth target values.

        y_prob : numpy.ndarray, default=None
                Predicted probabilities as returned by classifier.
                For uplift models, L = 4. Else, L = 1 where shape is (n_samples, L)

        sample_weight : numpy.ndarray, default=None
                Used to normalize y_true & y_pred.

        Returns
        ---------
        ths: numpy.ndarray
                Threshold values equally binned between 0 and 1 where array size is len(y_true)

        tpr: numpy.ndarray
                True positive rate values where array size is len(y_true)

        fpr: numpy.ndarray
                False positive rate values where array size is len(y_true)

        ppv: numpy.ndarray
                Precision scores where array size is len(y_true)

        forr: numpy.ndarray
                False omission rate parity values where array size is len(y_true)

        selection_rate: numpy.ndarray
                Selection rate values where array size is len(y_true)

        base_selection_rate: array
                Base selection rate values where array size is len(y_true)
        """
        fpr, tpr, ths = skm.roc_curve(
            y_true, y_prob, pos_label=1, sample_weight=sample_weight
        )
        # roc_curve sets max threshold arbitrarily above 1
        ths[0] = 1.0
        # Add endpoints for ease of interpolation
        ths = np.append(ths, [0.0])
        fpr = np.append(fpr, [1.0])
        tpr = np.append(tpr, [1.0])

        if sample_weight is None:
            base_selection_rate = np.mean(y_true)
        else:
            base_selection_rate = sum(sample_weight[y_true == 1]) / sum(sample_weight)

        base_reject_rate = 1 - base_selection_rate

        selection_rate = base_selection_rate * tpr + base_reject_rate * fpr
        reject_rate = 1 - selection_rate

        prob_tp = base_selection_rate * tpr
        ppv = np.divide(
            prob_tp,
            selection_rate,
            out=np.zeros_like(prob_tp),
            where=(selection_rate != 0),
        )

        prob_fn0 = prob_tp * np.divide(
            1, tpr, out=np.zeros_like(prob_tp), where=(tpr != 0)
        )
        prob_fn = np.where(tpr == 0, selection_rate, prob_fn0)
        forr = np.divide(
            prob_fn, reject_rate, out=np.zeros_like(prob_fn), where=(reject_rate != 0)
        )

        return ths, tpr, fpr, ppv, forr, base_selection_rate, selection_rate


class ModelRateUplift:
    """
    Class to compute the interpolated base rates for uplift models.
    """

    def __init__(
        self,
        y_true,
        pred_outcome,
        e_lift,
        feature_mask,
        cost,
        revenue,
        proportion_of_interpolation_fitting,
        n_threads,
    ):
        """
        Parameters
        -------------
        y_true: numpy.ndarray
                Ground truth target values.

        pred_outcome : dict

        e_lift : float
                Empirical lift

        feature_mask : dict of lists
                Stores the mask array for every protected variable applied on the x_test dataset.

        cost: float
                Cost of the marketing treatment per customer

        revenue: float
                Revenue gained per customer

        proportion_of_interpolation_fitting : float
                Proportion of interpolation fitting

        n_threads : int
                Number of currently active threads of a job

        Instance Attributes
        ---------------------
        harm: object
                Scipy interp1d object containing the function for rejected harm.

        profit: object
                Scipy interp1d object containing the function for profit.

        emp_lift_tr: object

        emp_lift_cn: object

        """
        self.n_threads = n_threads
        if revenue is None:
            revenue = 0
        if cost is None:
            cost = 0
        (
            ths,
            harm_array,
            profit_array,
            emp_lift_treatment_array,
            emp_lift_control_array,
        ) = self.compute_rates_uplift(
            y_true,
            pred_outcome,
            e_lift,
            feature_mask,
            cost,
            revenue,
            proportion_of_interpolation_fitting,
        )

        self.harm = interpolate.interp1d(ths, harm_array)
        self.profit = interpolate.interp1d(ths, profit_array)
        self.emp_lift_tr = interpolate.interp1d(ths, emp_lift_treatment_array)
        self.emp_lift_cn = interpolate.interp1d(ths, emp_lift_control_array)

    def compute_rates_uplift(
        self,
        y_true,
        pred_outcome,
        e_lift,
        feature_mask,
        cost,
        revenue,
        proportion_of_interpolation_fitting,
    ):
        """
        Computes the base rates for uplift models.

        Parameters
        ------------------
        y_true : numpy.ndarray
                Ground truth target values.

        pred_outcome : dict

        e_lift : float
                Empirical lift

        feature_mask : dict of lists
                Stores the mask array for every protected variable applied on the x_test dataset.

        cost: float
                Cost of the marketing treatment per customer

        revenue: float
                Revenue gained per customer

        proportion_of_interpolation_fitting : float
                Proportion of interpolation fitting

        Returns
        -----------------
        ths: numpy.ndarray
                Threshold values equally binned between -0.5 and 0.5 where array size is len(y_true)

        harm_array: numpy.ndarray
                Rejected harm values where array size is len(y_true)

        profit_array: numpy.ndarray
                Profit values where array size is len(y_true)

        emp_lift_treatment_array: numpy.ndarray
                Empirical lift for treatment group

        emp_lift_control_array: numpy.ndarray
                Empirical lift for control group
        """
        harm_array = []
        profit_array = []
        emp_lift_treatment_array = []
        emp_lift_control_array = []

        # define threshold bins
        sum_feature_mask = sum(feature_mask)
        max_length = int(sum_feature_mask * proportion_of_interpolation_fitting)
        ths = np.linspace(e_lift.min(), e_lift.max(), max_length)
        ths[-1] = e_lift.max()
        e_lift = e_lift[feature_mask]
        y_true_new = y_true[1][feature_mask]
        pred_outcome_new = {}
        for i in pred_outcome.keys():
            pred_outcome_new[i] = pred_outcome[i][feature_mask]

        # sub funtioni to comput emp_lift for each thread
        def compute_lift_per_thread(start, n_threads):
            harm_values_lst = []
            profit_values_lst = []
            emp_lift_treatment = []
            emp_lift_control = []

            for j in range(start, len(ths), n_threads):
                selection = e_lift > ths[j]

                pRejcT = pred_outcome_new["rej_treatment"][selection]
                pRejcC = pred_outcome_new["rej_control"][selection]
                pRcT = pred_outcome_new["acq_treatment"][selection]
                pRcC = pred_outcome_new["acq_control"][selection]

                harm_values = sum(pRejcT - pRejcC) / len(selection)
                profit_values = sum(pRcT * revenue - cost - pRcC * revenue)
                y_true_idx = y_true_new[selection]
                Ntr = np.count_nonzero(y_true_idx == "TR")
                Ntn = np.count_nonzero(y_true_idx == "TN")
                Ncr = np.count_nonzero(y_true_idx == "CR")
                Ncn = np.count_nonzero(y_true_idx == "CN")
                Nt = Ntr + Ntn
                Nc = Ncr + Ncn
                if Nt == 0:
                    sRcT = 0
                else:
                    sRcT = Ntr / Nt

                if Nc == 0:
                    sRcC = 0
                else:
                    sRcC = Ncr / Nc

                harm_values_lst.append(harm_values)
                profit_values_lst.append(profit_values)
                emp_lift_treatment.append(sRcT)
                emp_lift_control.append(sRcC)

            return (
                harm_values_lst,
                profit_values_lst,
                emp_lift_treatment,
                emp_lift_control,
            )

        threads = []
        n = len(ths)
        harm_array = np.zeros(n)
        profit_array = np.zeros(n)
        emp_lift_treatment_array = np.zeros(n)
        emp_lift_control_array = np.zeros(n)

        # perform computation through multithreading
        with concurrent.futures.ThreadPoolExecutor(self.n_threads) as executor:
            for i in range(self.n_threads):
                threads.append(
                    executor.submit(compute_lift_per_thread, i, self.n_threads)
                )

            for i, thread in enumerate(threads):
                res = thread.result()

                harm_array[i : n : self.n_threads] = res[0]
                profit_array[i : n : self.n_threads] = res[1]
                emp_lift_treatment_array[i : n : self.n_threads] = res[2]
                emp_lift_control_array[i : n : self.n_threads] = res[3]

        return (
            ths,
            harm_array,
            profit_array,
            emp_lift_treatment_array,
            emp_lift_control_array,
        )
