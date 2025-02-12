class NewMetric:
    """
    Base class to add new metrics to the Veritas library.

    Class Attributes
    ------------------
    metric_type: str
        "fair" or "perf"

    metric_group: str
        "classification", "regression" or "uplift"

    metric_name: str
        Name of metric

    metric_definition: str
        Full name of metric

    metric_short_name: str
        Short-form name of metric

    metric_difference_ratio: str
        "difference" or "ratio". For fairness metric_type only.

    metric_equiv_perf_metric: str
        Equivalent performance metric. For fairness metric_type only.

    metric_direction: str
        Direction of performance metric, i.e., whether a `higher` metric value indicates better model performance. For fairness metric_type only.
        "higher" or "lower"

    metric_reqt: str
        Metric requirement/dependency, i.e., "y_pred" or "y_prob"

    enable_flag: boolean
        Whether the new metric can be a primary metric
    """

    metric_type = "fair"
    metric_group = "classification"
    metric_name = "custom_base"
    metric_definition = "custom new metric base"
    metric_short_name = "custom"
    metric_difference_ratio = "difference"
    metric_equiv_perf_metric = "balanced_acc"
    metric_direction = "higher"
    metric_reqt = "y_prob"
    enable_flag = True

    def compute(self, **kwargs):
        """
        Returns tuple of metric value and privileged group value

        Returns
        -----------
        compute : tuple of floats
            Returns tuple of metric value and privileged group value (applicable if the custom metric is fairness metric)

        """
        # compute function name should be defined add notation for use_case_obj and parameters
        metric_value = 0
        pr_p = 0  # check names later
        return (metric_value, pr_p)
