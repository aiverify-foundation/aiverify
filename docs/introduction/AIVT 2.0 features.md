
## Process Checklist

The AI Verify Toolkit offers multiple starting points based on your needs:

- Report-focused approach: Begin with your reporting goals in mind, make use of existing templates or customizable report canvas and design pages using widgets.
- Process-oriented approach: Complete the necessary process checklists
- Technical assessment: Run tests via Command Line Interface (CLI) or User Interface (Portal). The generated test results can be used across reports.

To help companies align their reports with the AI Verify framework, the toolkit also comes with a set of reporting templates, which pre-defines the report layout, technical tests and process checks needed.

The AI Verify Toolkit supports the AI Verify Testing Framework by providing an integrated interface that helps you to track the completion progress of the 85 testable criteria over the 11 Process Checklists, and generating a summary of how the AI system aligns with the AI Verify Testing Framework. Refer to detailed guide on [AI Verify process checklists](../detailed-guide/aiverify-process-checklist.md) or [Veritas Process checklists for additional information](../detailed-guide/veritas-process-checklist.md).

## Technical Test

The AI Verify Toolkit conducts black-box testing on AI models (tabular and image models) by ingesting the AI model to be tested in the form of a serialized model file/folder. Depending on the test to run, various dataset files and test arguments will be needed. The AI Verify report templates contains technical tests that covers 3 principles:

| | Fairness | Explainability | Robustness |
|-------------|-------------|----------------|-------------|
| **Algorithms** | - Fairness for Regression<br>- Fairness for Classification<br>- Veritas fairness and transparency assessment | - Accumulated Local Effect<br>- Partial Dependence Plot<br>- SHAP Toolbox | - Robustness Toolbox<br>- Image Corruption Toolbox |
| **Metrics & Methods used for testing** | *Metrics:*<br>False Negative Rate Parity, False Positive Rate Parity, False Discovery Rate Parity, False Omission Rate Parity, True Positive Rate Parity, True Negative Rate Parity, Positive Predictive Value Parity, Negative Predictive Value Parity<br><br>*Method:*<br>- [Tabular] Performance vs Fairness trade-off by category<br>- [Tabular] Measure prediction among sensitive features. *[[1]](https://github.com/aiverify-foundation/aiverify/tree/v2.x/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression)* | *Metrics:*<br>- Accumulated differences in predictions (ALE)<br>- Average predicted values (PDP)<br>- Cooperative game theory (Shapley values)<br><br>*Method:*<br>- [Tabular] Accumulates local changes in predictions with small intervals (ALE)<br>- [Tabular] Averages predictions over marginal distribution of other features (PDP)<br>- [Tabular] How features affect overall predictions using Shapley Values. | *Metrics:*<br>- Model accuracy on original dataset<br>- Model accuracy on perturbed dataset<br><br>*Method:*<br>- [Tabular] Generate perturbed dataset using boundary attack algorithm on the test dataset.<br>- [Image] Apply corruption functions (example blur) and compare robustness of model |


Refer to detailed guides for [running fairness tests](../detailed-guide/fairness-test.md),  [running explainability tests](../detailed-guide/explainability-test.md), [running robustness tests](../detailed-guide/robustness-test.md) if you are looking to implement them for your use cases.