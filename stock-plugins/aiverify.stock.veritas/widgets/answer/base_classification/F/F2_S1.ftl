<#-- F2.1 What are the correct and wrong decisions that the system can make? Populating the confusion matrix may help. -->

For classification problem, populating the following confusion matrix may help. Confusion matrix is a way to measure the performance
of a classification model. Each row of the matrix represents a predicted class; and each column represents an actual class.
The following confusion matrix applies to binary classification.

<div class="table_box">
    <div>
        <big>
            Fairness metrics for <b>Confusion Matrix</b>
        </big>
    </div>
    <table>
        <thead>
        <tr>
            <th> </th>
            <th>Positive(Actual)</th>
            <th>Negative(Actual)</td>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>Positive(Predicted)</td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>Negative(Predicted)</td>
            <td></td>
            <td></td>
        </tr>
        </tbody>
    </table>
</div>

There are four decisions:
<ul>
<li>TRUE POSITIVE：the real value of the sample target variable is positive, and the predicted value of the classification is also positive</li>
<li>TRUE NEGATIVE：the real value of the sample target variable is negative, and the predicted value of the classification is also negative</li>
<li>FALSE POSITIVE：the real value of the sample target variable is negative, but the predicted target value of the classification is positive</li>
<li>FALSE NEGATIVE: the real value of the sample target variable is positive, but the predicted target value of the classification is negative</li>
</ul>

