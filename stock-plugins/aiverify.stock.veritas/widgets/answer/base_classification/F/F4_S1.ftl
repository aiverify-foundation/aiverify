<#-- F4.1 Are there representation bias, measurement bias on labelling and data pre-processing bias in the groups identified as at risk of disadvantage in F1? -->



<ul>
<li><b>Representation bias</b> occurs when certain groups are underrepresented in a data set which causes the effectiveness of model training to be hampered.</li>
<li><b>Measurement bias</b> arises when there is systematic or non-random error in the collection of data, and can occur on input variables and target labels on which the AIDA system operates.</li>
<li><b>Pre-processing bias</b> arises during data pre-processing in model development, when an operation (e.g., missing value treatment, data cleansing, outlier treatment, encoding, scaling or data transformations for unstructured data, etc.) causes or contributes to systematic disadvantage.</li>
</ul>

<h3>Target Label Distribution</h3>

The pie chart for target label distribution is shown.

<#if graphContainer.classDistributionPieChart??>
<div class="image_box">
    <div class="image_title">Class Distribution</div>
    <img id="classDistributionPieChart" class="pie" src="${graphContainer.classDistributionPieChart}" />
</div>
</#if>

<div>
<#if fairness.minClassDistributionName()??>
    <#assign minDistribution = fairness.minClassDistributionName()>
    <#if fairness.classDistributionIsAverage()>
        The proportion of <b>${minDistribution.getKey()}</b> is approximately ${minDistribution.getValue()}, so the imbalance in distribution of labels is small.
    <#else>
        The proportion of <b>${minDistribution.getKey()}</b> is approximately ${minDistribution.getValue()}, which indicates an large imbalance in distribution of labels.
    </#if>
<#else>
    Unable describe this class distribution data.
</#if>
</div>


<h3>Group Distribution</h3>

<div>
    For each of the protected attribute, the group distribution pie chart is shown.
    The risk of representation bias depends on both absolute and relative amounts of training data.
    On a relative basis, less than 50 percent imbalance between classes is generally considered a relatively low level of imbalance.
</div>

<#list fairness.featureMap as feature_name, feature>
    <#if graphContainer.getFeatureDistributionPieChart(feature_name)??>
    <div class="image_box">
        <div class="image_title">Feature Distribution for ${feature_name}</div>
        <img id="FeatureDistributionPieChart_${feature_name}" class="pie" src="${graphContainer.getFeatureDistributionPieChart(feature_name)}" />
    </div>
    </#if>

    <div>
    <#if feature.isLow() == true >
        The ratio of the sample size of the two groups is ${feature.distributionRatio()}, which is lower than 2, so the risk of underrepresentation for <b>${feature_name}</b> is low.
    <#else>
        The ratio of the sample size of the two groups is ${feature.distributionRatio()}, which is larger than 2, so there exists underrepresentation for <b>${feature_name}.</b>
    </#if>
    </div>
</#list>








