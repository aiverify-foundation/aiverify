export const config = {
  "principle": "Human Agency & Oversight",
  "description": "AI systems can be used to support or influence humans in decision-making processes. AI systems that 'act' like humans also have an effect on human perception, expectation, and functionality. Human agency and oversight ensure that the human has the ability to self-assess and intervene where necessary to ensure that the AI system is used to achieve the intended goals. The human should also have the ability to improve and override the operation of the system when the AI system results in a negative outcome.",
  "sections": [
    {
      "section": "Human Agency & Oversight",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Ensure that the various parties involved in using, reviewing, and sponsoring the AI system are adequately trained and equipped with the necessary tools and information for proper oversight to:<br/>- Obtain the needed information to conduct inquiries into past decisions made and actions taken throughout the AI lifecycle<br/>- Record information on training and deploying models as part of the workflow process",
          "processes": [
            {
              "pid": "10.1.1",
              "process": "Put in place guided flow for documenting (i) important info via model cards, forms, SDK library; and (ii) important processes that provide objective criteria for decision-making (e.g., fairness metrics selection)",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of guided flow for documenting:<br/><br/>- important info via model cards, forms, SDK library; and <br/>- important processes that provide objective criteria for decision-making (e.g., fairness metrics selection)"
            },
            {
              "pid": "10.1.2",
              "process": "Implement a data management system to gather and organise relevant information based on the needs of different user roles (e.g., reviewing models, and monitoring live systems)",
              "metric": "Internal documentation (e.g., procedure manual, log, register, or database)",
              "processChecks": "Documentary evidence of data management system to gather and organise relevant information based on the needs of different user roles"
            }
          ]
        },
        {
          "testableCriteria": "Ensure specific oversight and control measures to reflect the self-learning or autonomous nature of the AI system",
          "processes": [
            {
              "pid": "10.2.1",
              "process": "Define the role of the human in its oversight and control of the AI system (e.g., human-in-the-loop, human-out-the-loop, human-over-the-loop)",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of the definition of the role of human in oversight and control of the AI system"
            },
            {
              "pid": "10.2.2",
              "process": "When the AI model is making a decision for which it is significantly unsure of the answer/prediction, consider designing the system to be able to flag these cases and triage them for a human to review.",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of consideration made in the design of the AI system on its ability to flag instances when it is making a decision for which it is significantly unsure of the answer/prediction, in order that such cases be triaged for a human to review"
            },
            {
              "pid": "10.2.3",
              "process": "Implement mechanisms to detect if model input represents an outlier in terms of training data (e.g., return some \"data outlier score\" with predictions)",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of implementation of mechanisms to detect if model input represents an outlier in terms of training data"
            }
          ]
        },
        {
          "testableCriteria": "Put in place a review process before AI models are put into production, where key features and properties of the AI model are shared and visualised in a way that is accessible to decision-makers within the organisation",
          "processes": [
            {
              "pid": "10.3.1",
              "process": "Implement a systematic review process to present performance, explainability, and fairness metrics in a way that is understandable by data science, product, legal and risk, experience research, and ethics teams",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of the implementation of a systematic review process to present performance, explainability, and fairness metrics in a way that is understandable by relevant teams (e.g., data science, product, legal and risk, experience research, and ethics teams)"
            }
          ]
        },
        {
          "testableCriteria": "Establish a frequency and process for testing and re-evaluating AI systems",
          "processes": [
            {
              "pid": "10.4.1",
              "process": "After models are put into production, put in place mechanisms to review the performance of the models on an ongoing basis, either continuously or at regular intervals.<br/>Criteria could be time-based (e.g., every 2 years) or event-based (before the launch of a new AI product, after the introduction of new data, operating context has changed due to external circumstances), or when the AI system has undergone substantial modification.",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of the establishment of a frequency and process for testing and re-evaluating AI systems"
            }
          ]
        },
        {
          "testableCriteria": "Ensure the appropriate parties who are accountable for the AI system (e.g., AI governance committee, AI system owner, and reviewers) have considered how the AI system is used to benefit humans in decision-making processes",
          "processes": [
            {
              "pid": "10.5.1",
              "process": "Declaration of transparency on how and where in the decision-making process the AI system is used to complement or replace the human.",
              "metric": "1) Internal documentation (e.g., procedure manual) 2) External / internal correspondence",
              "processChecks": "Documentary evidence of the declaration of transparency on how and where in the decision-making process the AI system is used to complement or replace the human"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "Company has put in place appropriate oversight and control measures so that human can intervene should AI system fail to achieve its intended goal and result in a negative outcome. This enables human to retain the ability to improve and override the operation of AI system.",
  "summaryNotYes": "Company may not have put in place adequate oversight and control measures for human to intervene should AI system fail to achieve its intended goal and result in a negative outcome. This may result in increase in risk of harm to end users of or individuals affected by the AI system.",
  "recommendation": "Company should review the current oversight and control measures to ensure that human is able to improve the operation of AI system or override it in a timely manner when system fails."
}