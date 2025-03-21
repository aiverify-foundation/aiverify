
<h4>Permutation Importance</h4>
<div>
    The permutation feature importance measures the decrease in model score when a single feature is randomly shuffled
    while keeping other features constant. A large decrease in model score indicates a relative large contribution of the feature.
    The permutation importance plot below shows the top 10 highest contributing features and their relative percentage importance in descending order.
    The most important feature is assigned the highest importance (100%) and all other variables are measured relative to the most important feature.

</div>

<#include "../../../common/transparency_permutation_importance_plot.ftl">

<h4>Partial Dependence Plot</h4>
<div>
  Partial dependence plot shows how the predicted outcome changes with the selected feature.
</div>

<#include "../../../common/transparency_partial_dependence_plot.ftl">

<h4>Global Interpretability Based on SHAP</h4>

<div>
    At a global level, the collective SHAP values show how much each predictor contributes, either positively or negatively, to the target variable.
    In the summary plot below, variables are ranked in descending order. Each point represents an observation; the color indicates whether the value of
    a certain feature is high(in red) or low(in blue). A negative SHAP value indicates negative impact while a positive SHAP value indicates a positive impact
    on the predicted outcome.

</div>

<#--summary plot or table-->
<#include "../../../common/transparency_global_interpretability_plot_and_table.ftl">

<h4>Local Interpretability Based on SHAP</h4>

<div>
    At a local level, each observation gets its own set of SHAP values. Shown in red are the variables that pushing the predictions higher,
    while shown in blue are the variables pushing the predictions lower. E[f(x)] is the baseline ratio for selection while f(x)
    is the sum of all SHAP values added to baseline for a particular customer.
</div>


<#-- Local interpretability plot or table -->
<#include "../../../common/transparency_local_interpretability_plot_and_table.ftl">