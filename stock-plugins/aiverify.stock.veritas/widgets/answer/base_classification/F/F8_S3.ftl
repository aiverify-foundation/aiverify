<#--F8.3 What is the feature importance of the personal attributes? -->

<div>

Impact on primary performance metric and primary performance metric are the differences between metrics before (baseline model)
and after (LOCO model) dropping each feature (LOCO model - baseline model).

</div>

<#list fairness.featureMap as feature_name, feature>
<#if feature.featureImportance??>
    <div>
        Feature: <b>${feature_name}</b>
        <div class="table_box">
        <table>
            <thead>
                <tr>
                    <th>Personal attribute</th>
                    <th>Impact on ${fairness.fairnessInit.perfMetricName}</th>
                    <th>Impact on ${fairness.fairnessInit.fairMetricName}</th>
                    <th>Fairness conclusion</th>
                    <th>Suggestion</th>
                </tr>
            </thead>
            <tbody>
            <#list feature.featureImportance as i_key, i_value>
                <tr>
                    <td>${i_key}</td>
                    <#list i_value as element>
                        <td>${element}</td>
                    </#list>
                </tr>
            </#list>
            </tbody>
        </table>
        </div>
    </div>
    <div>
        <#assign fair_metric_name=fairness.fairnessInit.fairMetricName>
        <#assign fair_threshold=feature.fairThreshold>
        <#assign fairness_conclusion=feature.fairnessConclusion>
        <#assign fair_metric_value_optional=feature.findFairMetricValue(fairness)>
        <#assign importance_info_optional=feature.findImportanceInfo(fairness)>
        <#if fair_metric_value_optional.isPresent() && importance_info_optional.isPresent()>
            <b>${feature_name}</b>: The fairness threshold is ${fair_threshold},
             and the <b>${fair_metric_name}</b> for ${feature_name} in the baseline model is ${fair_metric_value_optional.get()}
             <#if fairness_conclusion == 'fair'>
                 which is within the threshold, so the conclusion is ${fairness_conclusion}.
             <#else>
                 which is not within the threshold, so the conclusion is ${fairness_conclusion}.
             </#if>
             For the LOCO model, ${fair_metric_name} changes by ${importance_info_optional.get()[1]},
             <#if feature.isToFair(importance_info_optional.get()[2])>
             so ${fair_metric_name} for ${feature_name} is within the threshold, so the model is fair
             <#else>
              so ${fair_metric_name} for ${feature_name} is not within the threshold, so the model is unfair
             </#if>
             after removing ${feature_name}, and we suggest to ${importance_info_optional.get()[3]}.
         <#else>
            <b>${feature_name}</b>: The fairness threshold is ${fair_threshold}. Missing data, unable to describe.
         </#if>
    </div>
    <#-- todo 增加空隙 -->
</#if>
</#list>