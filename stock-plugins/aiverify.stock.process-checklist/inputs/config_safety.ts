export const config = {
  "principle": "Safety",
  "description": "Safety is about ensuring AI systems do not cause any harm, especially physical harm. All systems will have some level of residual risk and must be developed with a preventative approach to risks that are not tolerable. Safety is achieved by reducing risks to a tolerable level. Usually, the higher the perceived risks of a system causing harm, the higher the demands on risk mitigation. The testable criteria section in this section adopt a risk-based approach to assess the appropriate level of tolerable risk, as well as identify and mitigate potential harm throughout the AI lifecycle. \t  ",
  "sections": [
    {
      "section": "Risk assessment",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Carry out an assessment of materiality on key stakeholders",
          "processes": [
            {
              "pid": "4.1.1",
              "process": "Complete and submit the Assessment of Materiality to the appropriate parties who are accountable for the AI system (e.g., AI governance committee, AI system owner, and reviewers) and highlight the risks of the proposed AI solution. Document the justifications for decisions on materiality and the application of relevant governance and controls to demonstrate to regulators and auditors that sufficient responsibility has been taken by humans to address potential risks",
              "metric": "1) Internal procedure manual 2) Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of details of the assessment of materiality on key stakeholders, justifications for decisions on materiality, and the application of relevant governance/controls.<br/><br/>The Assessment of Materiality includes the following impact dimensions (where applicable):<br/>- probability of harm;<br/>- severity of harm;<br/>- Likelihood of threat;<br/>- Extent of human involvement;<br/>- Complexity of AI model;<br/>- Extensiveness of impact on stakeholders;<br/>- Degree of Transparency; and <br/>- Impact on trust"
            }
          ]
        },
        {
          "testableCriteria": "Assess risks, risk metrics, and risk levels of the AI system in each specific use case, including the dependency of a critical AI system’s decisions on its stable and reliable behaviour",
          "processes": [
            {
              "pid": "4.2.1",
              "process": "Document the intended use cases, capabilities, and limitations of AI models e.g., via model cards. This documentation should be stored and retrieved together with the model artefact, as well as surfaced during a review process before the model is deployed into production",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of risk assessment done for specific use cases. <br/><br/>This risk assessment includes documenting* the: <br/>- intended use cases, capabilities, and limitations of the AI model (e.g., via model cards)<br/><br/>*Note: This documentation should be stored and retrieved together with the model artefact and surfaced during a review process before the model is deployed into production"
            }
          ]
        },
        {
          "testableCriteria": "Put in place a process to continuously assess, measure and monitor risks, including the identification of new risks after deployment",
          "processes": [
            {
              "pid": "4.3.1",
              "process": "Assign a reviewer who is familiar with the downstream use case of an AI model to review the model post-deployment. This process should include model cards/documentation to ensure alignment between intended use cases at modelling and post-deployment",
              "metric": "Internal documentation (e.g., log, register or database)",
              "processChecks": "Documentary evidence of process for continuous risk monitoring for AI model. <br/><br/>Process includes:<br/>- Assessing, measuring, and monitoring risks at modelling stage; and<br/>- identification of new risks after the post-deployment stage"
            }
          ]
        },
        {
          "testableCriteria": "Assess whether the AI system might fail by considering the input features and predicted outcomes to aid communication with stakeholders",
          "processes": [
            {
              "pid": "4.4.1",
              "process": "Where feasible, use AI models that can produce confidence score together with prediction. Low confidence scores may occur when the data contains values that are outside the range of the training data, or for data regions where there were insufficient training examples to make a robust estimate.<br/>Implement mechanisms to detect if model input represents an outlier in terms of training data, e.g., return some \"data outlier score\" with predictions",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of assessment of whether the AI system might fail by considering the input features and predicted outcomes to aid communication to stakeholders"
            }
          ]
        },
        {
          "testableCriteria": "Plan fault tolerance via, e.g., a duplicated system or another parallel system (AI-based or ‘conventional’)",
          "processes": [
            {
              "pid": "4.5.1",
              "process": "Implement deployment strategies such as blue-green and canary deployments.",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of:<br/>- implementation of deployment strategies such as blue-green and canary deployments<br/>- a plan for graceful failure or failover modes"
            },
            {
              "pid": "4.5.2",
              "process": "Maintain backup model server in blue-green deployment mode.",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of maintenance of the backup model server in blue-green deployment mode"
            },
            {
              "pid": "4.5.3",
              "process": "Where feasible, use AI models that can produce a confidence score together with the prediction. Design the systems that are using the results of the AI model to handle cases where the model fails or has low confidence, falling back to backup model servers or sensible default behaviour.",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of the use of AI models that can produce a confidence score together with the prediction, and that it can fall back to backup model servers or sensible default behaviour"
            },
            {
              "pid": "4.5.4",
              "process": "Close the feedback loop by retraining models with ground truth obtained once models are in production.",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of closing the feedback loop by retraining models with ground truth obtained once models are in production"
            }
          ]
        },
        {
          "testableCriteria": "Identify residual risk that cannot be mitigated and assess the organisation's tolerance for these risks",
          "processes": [
            {
              "pid": "4.6.1",
              "process": "Document the assessment of the residual risk and provide reasons for the tolerance level",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of assessment of residual risk and the reasons for the organisation's tolerance for these risks"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "Company has conducted assessments on the materiality and risk of harm on its stakeholders, identified and mitigated known risks. Company has also assessed that the residual risks of AI system is acceptable.",
  "summaryNotYes": "By not implementing all the testable criteria, the AI system may carry risk of harm to end users or individuals, which could have been mitigated. This could reduce the overall trust in the AI system.",
  "recommendation": "Company should consider putting in place processes and measures to continuously assess, measure and monitor risks of the AI systems that may potentially cause harm. It is also recommended that Company performs risk assessment to demonstrate that sufficient mitigations have been taken to address potential harm."
}