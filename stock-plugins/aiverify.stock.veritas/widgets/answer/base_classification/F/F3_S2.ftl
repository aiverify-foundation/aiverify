<#-- F3.2 What are the associated fairness metrics? -->



<#assign fairnessInit=fairness.fairnessInit>
<#if fairnessInit.fairMetricNameInput == 'auto'>
<div>
    To assess the fairness of ${businessScenario.getName()} model,our priority is to measure ${fairnessInit.fairImpact} ${fairnessInit.fairPriority!""} to the ${fairnessInit.fairConcernDisplay()}group,
    therefore we choose ${fairnessInit.fairMetricName} as primary fairness metric for the assessment.
<#else>
    The selected primary metric is ${fairnessInit.fairMetricName}.
</div>
</#if>


