<#--F10.2 How is performance-fairness trade-off analysis carried out?-->

<div>
    To do trade-off analysis , a grid search for thresholds was conducted.
    The objective is to bring the selected fairness matric to within the accepted range while maximising the balanced accuracy.
    The fairness-performance trade-offs of operating the model at various thresholds is visualized(if applicable) below.
</div>

<ul>
    <li>The heatmap indicates the model’s expected performance (balanced accuracy) when operated at each pair of risk thresholds.</li>
    <li>The white contour lines indicate the primary fairness metric with respect to each selected attribute.
    The optimal position for fairness metric depends on whether it is a parity-based or ratio-based metric.
    If it is parity-based, it is optimal when equal to zero (0); otherwise it is optimal when equal to one(1).</li>
    <li>The x-axis and y-axis show a range of possible lending risk thresholds for two groups, respectively.</li>
</ul>

<#include "../../../common/fairness_feature_tradeoff_contour.ftl">

There are three points of interests on the heatmap:
<ul>
<li>The <b>blue diamond</b> maximizes the unconstrained model performance. </li>
<li>The <b>red X</b> maximizes model performance while keeping the same risk threshold for privileged and unprivileged group. </li>
<li>The <b>purple star</b> maximizes the model performance while ensuring optimal fairness as measured via the selected fairness metric. </li>
</ul>