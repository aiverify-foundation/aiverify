export const config = {
  "principle": "Robustness",
  "description": "Robustness requires that AI systems maintain its level of performance under any circumstances, including potential changes in their operating environment or the presence of other agents (human or artificial) that may interact with the AI system in an adversarial manner.  The testable criteria in this section focus on the technical robustness of the AI system throughout its AI life cycle, to assess the proper operation of a system as intended by the system owner. These testable criteria should be carried out alongside established cybersecurity testing regimes for AI systems, to ensure overall system robustness. ",
  "sections": [
    {
      "section": "Robustness",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Put in place measures to ensure the quality of data used to develop the AI system",
          "processes": [
            {
              "pid": "6.1.1",
              "process": "- Implement measures to ensure data is up-to-date, complete, and representative of the environment the system will be deployed in<br/>- Log training run metadata to do comparison in production, e.g., parameters, and version model to monitor model staleness<br/>- Monitor production versus training data characteristics at production stage e.g., statistical distribution, data types, and validation constraints, to detect data and concept drift",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Evidence of measures implemented that documents:<br/>- Performance metrics (e.g., accuracy, AUROC, AUPR)<br/>- Prediction confidence score, variation ratio for the original prediction, predictive entropy<br/>- That data is of high quality, up-to-date, complete, and representative of the environment the system will be deployed in"
            }
          ]
        },
        {
          "testableCriteria": "Review factors that may lead to a low level of accuracy of the AI system and assess if it can result in critical, adversarial, or damaging consequences",
          "processes": [
            {
              "pid": "6.2.1",
              "process": "Document intended use cases, risks, and limitations (e.g., in model cards)",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of intended use cases, risks, and limitations in model cards"
            }
          ]
        },
        {
          "testableCriteria": "Consider whether the AI system's operation can invalidate the data or assumptions it was trained on e.g., feedback loops, user adaptation, and adversarial attacks",
          "processes": [
            {
              "pid": "6.3.1",
              "process": "Document intended use cases, risks, limitations (e.g., in model cards)",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of intended use cases, risks, and limitations in model cards (e.g., in model cards)"
            }
          ]
        },
        {
          "testableCriteria": "Put in place a mechanism to evaluate when the AI system has been changed to merit a new review of its technical robustness",
          "processes": [
            {
              "pid": "6.4.1",
              "process": "Implement a review process that highlights changes in code (e.g., training, serving), input data (e.g., raw data, features), and output data (e.g., inference results, performance metrics)",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of mechanism to evaluate when an AI system has been changed to merit a new review of its technical robustness<br/><br/>Mechanism should include a review process that highlights changes in: <br/>- code (training, serving);<br/>- input data (e.g., raw data, features); and<br/>- output data ( e.g.,inference results, performance metrics)"
            }
          ]
        },
        {
          "testableCriteria": "Establish a strategy to monitor and mitigate the risk of black box attacks on live AI systems",
          "processes": [
            {
              "pid": "6.5.1",
              "process": "Implement methods to mitigate known adversarial attacks at training time, including decisions whether to adopt / not adopt the methods.<br/><br/>Note: It may not be possible for all models (e.g.,  if the model is deterministic or with a model with high level of interactivty with users)",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of implementing methods to mitigate adversarial attacks at training time, including decisions on whether to adopt / not adopt the methods"
            },
            {
              "pid": "6.5.2",
              "process": "Monitor requests made to live AI system, e.g., frequency and feature distribution of queries, in order to detect whether it is being used suspiciously",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of monitoring requests made to live AI system, e.g, frequency and feature distribution of queries, in order to detect whether it is being used suspiciously"
            },
            {
              "pid": "6.5.3",
              "process": "Take action on users who exhibit suspicious activity, e.g., flag for review, rate-limit or block further requests, suspend user accounts",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of action taken on users who exhibit suspicious activity. <br/><br/>Possible actions include to: <br/>- flag for review;<br/>- rate-limit or block further requests; and<br/>- suspend user accounts"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "Company has put in place measures and processes to maintain AI model’s level of performance under any circumstances, including potential changes in their operating environment or the presence of other agents (human or artificial) that may interact with the AI system.",
  "summaryNotYes": "Company may not be able to maintain AI model’s level of performance under any circumstances, such as changes in their operating environment or the presence of other agents (human or artificial) that may interact with the AI system. This may result in damaging consequences to Company’s stakeholders.",
  "recommendation": "Company should consider putting in measures and processes to monitor and assess the level of resilience against unexpected input that may happen under any circumstances."
}