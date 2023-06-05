export const config = {
  "principle": "Fairness",
  "description": "Fairness is about designing AI systems that avoid creating or reinforcing unfair bias in the AI system, based on the intended definition of fairness for individuals or groups, that is aligned with the desired outcomes of the AI system. The testable criteria focus on testing the ability of the AI system to align with the intended fairness outcomes, throughout the AI lifecycle. ",
  "sections": [
    {
      "section": "Fairness",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Assess within-group fairness (also known as individual fairness)",
          "processes": [
            {
              "pid": "7.1.1",
              "process": "Apply counterfactual fairness assessment",
              "metric": "Internal Documentation",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of counterfactual fairness assessment"
            }
          ]
        },
        {
          "testableCriteria": "Put in place processes to test for potential biases during the entire lifecycle of the AI system, so that practitioners can act to mitigate biases based on feedback (e.g., biases due to possible limitations stemming from the composition of the used data sets such as a lack of diversity and non-representativeness)",
          "processes": [
            {
              "pid": "7.2.1",
              "process": "Monitor the changes in fairness metric values in the lifecycle of the AI system.",
              "metric": "Internal documentation of physical testing",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of implemented processes to test for potential biases during the entire lifecycle of the AI system"
            }
          ]
        },
        {
          "testableCriteria": "Establish a strategy for the selection of fairness metrics that are aligned with the desired outcomes of the AI system's intended application",
          "processes": [
            {
              "pid": "7.3.1",
              "process": "Consider using Fairness Decision Tree (e.g., AI Verify, Aequitas)  to select the appropriate metric(s) for your application",
              "metric": "Internal documentation (e.g., procedure manual)",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of strategy/process undertaken to select fairness metrics that align with the desired outcomes of the AI system's intended application. For example, Binary and Multiclass Classification<br/>- Equal Parity<br/>- Disparate Impact<br/>- False Negative Rate Parity<br/>- False Positive Rate Parity<br/>- False Omission Rate Parity<br/>- False Discovery Rate Parity<br/>- True Positive Rate Parity<br/>- True Negative Rate Parity<br/>- Negative Predictive Value Parity<br/>- Positive Predictive Value Parity<br/><br/>Regression<br/>- Mean Absolute Error Parity<br/>- Mean Square Error Parity"
            }
          ]
        },
        {
          "testableCriteria": "Define sensitive features for the organisation that are consistent with the legislation and corporate values",
          "processes": [
            {
              "pid": "7.4.1",
              "process": "Identify the sensitive features and their privileged and unprivileged groups where feasible.",
              "metric": "Internal documentation",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of identification of sensitive features and its privileged and unprivileged groups. Examples of sensitive features could include religion, nationality, birthplace, gender, and race. Also refer to country-specific guidelines e.g., Singapore's Tripartite Guidelines on Fair Employment Practices and UK Equality Act"
            },
            {
              "pid": "7.4.2",
              "process": "Where feasible, consult the impacted communities on the correct definition of fairness (e.g., representatives of elderly persons or persons with disabilities),  values and considerations of those impacted (e.g., individual's preference)",
              "metric": "External / internal correspondence",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of consultations conducted with impacted communities on the correct definition of fairness"
            }
          ]
        },
        {
          "testableCriteria": "Establish a process for identifying and selecting sub-populations between which the AI system should produce fair outcomes",
          "processes": [
            {
              "pid": "7.5.1",
              "process": "Define this partitioning in terms of sensitive features that models should be prohibited from being trained on, but are used in the evaluation of fairness outcomes.",
              "metric": "Internal documentation of physical testing",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of the establishment of a process for identifying and selecting sub-populations between which the AI system should produce fair outcomes"
            }
          ]
        },
        {
          "testableCriteria": "Establish a strategy or a set of procedures to check that the data used in the training of the AI model, is representative of the population who make up the end-users of the AI model",
          "processes": [
            {
              "pid": "7.6.1",
              "process": "Perform exploratory data analysis. For the sensitive feature, test the representation of each group in the data. Resample data or collect more data if a particular group is severely underrepresented.",
              "metric": "Internal documentation of physical testing",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of the establishment of a strategy or a set of procedures to check that the data used in the training of the AI model, is representative of the population who make up the end-users of the AI model"
            }
          ]
        },
        {
          "testableCriteria": "Put in place a mechanism that allows for the flagging of issues related to bias, discrimination, or poor performance of the AI system",
          "processes": [
            {
              "pid": "7.7.1",
              "process": "Monitor threshold violations of fairness metrics post-deployment and for actual harms",
              "metric": "Internal documentation of physical testing",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of <br/>- monitoring of threshold violations of fairness metrics<br/>- obtaining feedback from those impacted by the AI system, offering redress and remediation option if feasible"
            }
          ]
        },
        {
          "testableCriteria": "Put in place appropriate mechanisms to ensure fairness in your AI system",
          "processes": [
            {
              "pid": "7.8.1",
              "process": "Monitor metrics for the latest set of data for the model currently being deployed on an ongoing basis.",
              "metric": "Internal documentation of physical testing",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of monitoring metrics for the latest set of data for the model currently being deployed on an ongoing basis"
            }
          ]
        },
        {
          "testableCriteria": "Address the risk of biases due to possible limitations stemming from the composition of the used data sets (lack of diversity, non-representativeness), by applying appropriate adjustments on data samples of minorities",
          "processes": [
            {
              "pid": "7.9.1",
              "process": "Where possible, handle imbalanced training sets with minorities. Examples:<br/>- Oversample minority class<br/>- Undersample majority class<br/>- Generate synthetic samples (SMOTE)",
              "metric": "Internal documentation of physical testing",
              "threshold": "N.A.",
              "processChecks": "Documentary evidence of addressing the risk of biases due to possible limitations stemming from the composition of the used data sets (lack of diversity, non-representativeness), by applying appropriate adjustments on data samples of minorities"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "Company has put in place measures and processes to enable it to monitor, review and identify causes of model bias and address them accordingly.",
  "summaryNotYes": "By not implementing all the testable criteria, Company runs the risk of not being able to monitor and identify potential causes of bias and address them throughout the AI system’s lifecycle. This may result in discriminatory outcomes for individuals affected by the AI system. This could also reduce overall trust in the system.",
  "recommendation": "Company should consider putting in place processes to identify and test for potential biases during the entire lifecycle of the AI system. It is also recommended that Company put in place mechanisms to perform mitigation where necessary and document possible limitations that may stem from the composition of the datasets."
}