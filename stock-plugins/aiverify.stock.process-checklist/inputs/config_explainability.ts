export const config = {
  "principle": "Explainability",
  "description": "Explainability is about ensuring AI-driven decisions can be explained and understood by those directly using the system to enable or carry out a decision to the extent possible. The degree to which explainability is needed also depends on the aims of the explanation, including the context, the needs of stakeholders, types of understanding sought, mode of explanation, as well as the severity of the consequences of erroneous or inaccurate output on human beings. Explainability is an important component of a transparent AI system. The testable criteria in this section focus on system-enabled explainability. However, it may not be possible to provide an explanation for how a black box model generated a particular output or decision (and what combination of input factors contributed to that). In these circumstances, other explainability measures may be required (e.g., accountability and transparent communication). As state-of-the-art approaches to explainability become available, users should refine the process, metrics, and/or thresholds accordingly. ",
  "sections": [
    {
      "section": "Explainability",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Demonstrate a preference for developing AI models that can explain their decisions or that are interpretable by default",
          "processes": [
            {
              "pid": "2.1.1",
              "process": "If choosing a less explainable modelling approach, document the rationale, risk assessments, and trade-offs of the AI model",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of considerations for the choice of AI model<br/><br/>Considerations include:<br/>- rationale; <br/>- risk assessment; and<br/>- trade-offs"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "In selecting the final model for deployment, Company has compared multiple models under consideration, and has demonstrated a preference for choosing a model that can explain its decisions or that is interpretable by default. This will enable Company to help its stakeholders understand key factors contributing to AI model’s recommendation.",
  "summaryNotYes": "When the performance of different models under consideration are similar, by not demonstrating a preference for the model that is more explainable or interpretable by default for deployment, Company runs the risk of not being able to communicate to its stakeholders how the AI model makes its recommendation and may lead to a lack of trust. Company should consider if such risk is acceptable, having considered regulatory requirements, company policies and the intended use of the AI model",
  "recommendation": "If Company chooses a less explainable modelling approach, Company should document its rationale for taking such a risk, having considered the prevailing regulatory requirements, its own internal policies, and the intended use of the AI model."
}