# Statistical Tests Plugin

## Description
The Statistical Tests Plugin allows users to assess the relationship and differences between variables in a dataset. This is done by performing statistical tests such as the Chi-square test, Kruskal-Wallis H-test, and Spearman rank-order correlation coefficient. The results help users to understand potential biases and the nature of associations among variables.

## Plugin Content
This plugin includes the following components:

### Algorithms
- **Statistical Tests Plugin**

| Name                | Description                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Chi-square Test     | Tests the null hypothesis of independence of variables in a contingency table.                                  |
| Kruskal-Wallis H-test | Tests the null hypothesis that the population medians of all groups are equal. A non-parametric method for testing whether samples originate from the same distribution. |
| Spearman's Rank-Order Correlation | A nonparametric measure of the monotonicity of the relationship between two datasets. |

### Widgets
- **Bias Report**:
    - **Description (Summary)**: Provides an introduction, interpretation, and recommendations for bias detection.
    - **Statistical Results Table**: Displays the results of statistical tests in a tabular format with relevant metrics.

### Using the Plugin in AI Verify
#### Data Preparation
To use the Statistical Tests Plugin, prepare your dataset as follows:
- **Categorical Variables**: Columns in the dataset representing categorical variables you want to test.
- **Continuous Variables**: Columns in the dataset representing continuous variables you want to test.

#### Algorithm User Input(s)
| Input Field      | Description                                                 |   Type   |
| ---------------- | ----------------------------------------------------------- | :------: |
| P-value Threshold | Set the threshold to determine statistical significance (commonly 0.05). | `float` |

## Sample Widget Display
Below is an example of how the statistical tests' results might be displayed:

![Bias Report Sample](images/bias_report_sample.png)

### Detailed Explanation of Metrics
- **Statistic**: A value used to summarize the data concerning the null hypothesis.
- **P-value**: A value that indicates the probability of obtaining test results at least as extreme as the results observed, under the assumption that the null hypothesis is true.

### Interpretation and Recommendations
- **Chi-square Test**:
    - Tests the null hypothesis of independence between two categorical variables.
    - **Interpretation**: A low P-value (< 0.05) indicates a significant association between variables.
    - **Recommendation**: If a significant association is found, further investigate the potential causal or correlative relationship between features.

- **Kruskal-Wallis H-test**:
    - Tests the null hypothesis that population medians of all groups are equal.
    - **Interpretation**: A low P-value (< 0.05) suggests significant differences between group medians.
    - **Recommendation**: Examine differences between groups and consider the implications for your model or analysis.

- **Spearman's Rank-Order Correlation**:
    - Measures the monotonicity of relationships between datasets.
    - **Interpretation**: A low P-value (< 0.05) indicates a significant monotonic relationship.
    - **Recommendation**: If a significant relationship is detected, take steps to understand and potentially address any detected biases.

### Recommendations Section
- Ensure the dataset is balanced where necessary. Detecting biases in underrepresented groups can skew results.
- For significant findings, consider adjusting model training or performing feature engineering to mitigate possible biases.
- Regularly reevaluate dataset and model fairness as new data comes in.

This guidance aims to help users comprehend the implications of statistical test results and take appropriate actions to ensure robust and fair models.
