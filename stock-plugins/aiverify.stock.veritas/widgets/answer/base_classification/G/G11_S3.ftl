<#--模型表现指标表格-->
<h4>Model Performance Metrics</h4>
<div>
    The table below lists the values and respective uncertainties of model performance metrics.
    The uncertainties in the fairness metrics are measured using bootstrap methods with 50 replications
    and 5-95% confidence intervals used and the plus-minus intervals representing two standard deviations.
    The primary fairness metric is marked in red.
</div>

<div class="table_box">
<table class="feature_table">
    <thead>
        <tr>
            <th>Performance Metric</th>
            <th>Value</th>
        </tr>
    </thead>
    <tbody>
    <#list fairness.perfMetricValues as metricName, valueList>
        <tr <#if fairness.isPerfMetric(metricName) == true> class="perf_metric_row"</#if>>
            <td>${metricName}</td>
            <td>${valueList[0]} +/- ${valueList[1]}</td>
        </tr>
    </#list>
    </tbody>
</table>
</div>

<#--混淆矩阵-->
<h4>Confusion Matrix</h4>
<div>
    Confusion matrix is used to describe performance of a classification model or classifier.
    It is a table comparing true outcomes with the predicted outcomes.
    The number of correct and incorrect predictions are summarised with count values and broken down by each class.
</div>

<#if graphContainer.getWeightedConfusionHeatMapChart()??>
<div class="image_box">
    <div class="image_title">Weighted Confusion Matrix Heatmap</div>
    <img id="WeightedConfusionHeatMapChart" src="${graphContainer.getWeightedConfusionHeatMapChart()}" />
</div>
<#else>
   Weighted confusion matrix does not apply to this project.
</#if>

<#--模型校准-->
<h4>Calibration Curve</h4>
<div>
    In some situations we care about if the output represents real probabilities.
    In the reliability diagram, the x-axis represents the predicted probabilities,
    which are divided to a number of bins; the y-axis represents the fraction of positives in each bin.
    When the reliability diagram is close to the diagonal, then the model is well calibrated.
</div>

<#if graphContainer.getCalibrationCurveLineChart()??>
<div class="image_box">
    <div class="image_title">Calibration Curve</div>
    <img id="CalibrationCurveLineChart" src="${graphContainer.getCalibrationCurveLineChart()}" />
</div>
    <div>
        The brier loss score is ${fairness.calibrationCurve.score}.
    </div>
<#else>
   Calibration curve does not apply to this project.
</#if>


<#--选择率和模型表现的关系折线图-->
<h4>Dynamic Performance</h4>
<div>The following line chart illustrates the relationship between system’s performance and system objective as threshold changes.</div>

<#if graphContainer.getPerformanceLineChart()??>
<div class="image_box">
    <div class="image_title">Performance</div>
    <img id="PerformanceLineChart" src="${graphContainer.getPerformanceLineChart()}" />
</div>
<#else>
   Performance dynamics does not apply to this project.
</#if>