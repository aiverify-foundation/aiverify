export const config = {
  principle: "Fairness",
  description: "Default fairness questionaire for Veritas",
  sections: [
    {
      section: "Fairness",
      testType: "process-checklist",
      checklist: [
        {
          testableCriteria:
            "Have you identified and documented who are the individuals and groups that are considered to be at risk of being systematically disadvantaged by the system?",
          processes: [
            {
              pid: "2.1.1",
              process:
                "Who are the individuals and groups that are considered to be at risk of being systematically disadvantaged by the system?",
            },
            {
              pid: "2.1.2",
              process:
                "When identifying, have you considered people who are excluded from the product or service offered through the AIDA system because of eligibility criteria, restrictions or design factors, who are already disadvantaged before using the AIDA system?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you identified and documented the potential harms and benefits created by the system’s operation that are relevant to the risk of systematically disadvantaging the individuals and groups in Fairness Question 1?",
          processes: [
            {
              pid: "2.2.1",
              excludeInput: true,
              process:
                "What are the correct and wrong decisions that the system can make?",
            },
            {
              pid: "2.2.2",
              process:
                "What are the most important harms and benefits to consider for the groups as at risk of disadvantages?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you identified and documented the fairness objectives of the system and associated fairness metrics, with respect to the individuals and groups in Fairness Question 1 and the harms and benefits in Fairness Question 2?",
          processes: [
            {
              pid: "2.3.1",
              process:
                "After a consistent and reasonable identification process, what are the fairness objectives that fit the commercial objectives and decision outcomes of the system?",
            },
            {
              pid: "2.3.2",
              process: "What are the associated fairness metrics?",
            },
            {
              pid: "2.3.3",
              process:
                "How, do you select fairness metrics, with respect to the overall commercial and fairness objectives? The fairness decision tree may help.",
            },
          ],
        },
        {
          testableCriteria:
            "Have you documented key errors, biases or properties present in the data used by the system that may impact the system’s fairness?",
          processes: [
            {
              pid: "2.4.1",
              excludeInput: true,
              process:
                "Are there representation bias, measurement bias on labelling and data pre-processing bias in the groups identified as at risk of disadvantage in Fairness Question 1?",
            },
            {
              pid: "2.4.2",
              process: "Is there measurable proxy bias?",
            },
            {
              pid: "2.4.3",
              process:
                "Are there potential sources of historic decision bias reflected in the data?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you documented how are these impacts being mitigated?",
          processes: [
            {
              pid: "2.5.1",
              process:
                "Have you documented how are these impacts being mitigated?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you determined and documented personal attributes that are used as part of the operation or fairness assessment of the system?",
          processes: [
            {
              pid: "2.6.1",
              process:
                "Have you determined and documented personal attributes that are used as part of the operation or fairness assessment of the system?",
            },
          ],
        },
        {
          testableCriteria:
            "Does the process of identifying personal attributes take into account ethical objectives of the system, and the people identified as being at risk of disadvantage?",
          processes: [
            {
              pid: "2.7.1",
              process:
                "Does the process of identifying personal attributes take into account ethical objectives of the system, and the people identified as being at risk of disadvantage?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you assessed and documented for every personal attribute and potential proxy for a personal attribute, why is its inclusion justified given the system objectives, the data, and the quantified performance and fairness measures?",
          processes: [
            {
              pid: "2.8.1",
              excludeInput: true,
              process:
                "How personal attributes correlate with non-personal attributes? Are they highly correlated so that non-personal attributes can act as material proxies for personal attributes?",
            },
            {
              pid: "2.8.2",
              excludeInput: true,
              process:
                "What method is used to measure the importance of personal attributes?",
            },
            {
              pid: "2.8.3",
              excludeInput: true,
              process:
                "What is the feature importance of the personal attributes?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you assessed and documented the quantitative estimates of the system’s performance against its fairness objectives and the uncertainties in those estimates, assessed over the individuals and groups in Fairness Question 1 and the potential harms and benefits in Fairness Question 2?",
          processes: [
            {
              pid: "2.9.1",
              excludeInput: true,
              process: "What is the primary fairness metric for this use case?",
            },
            {
              pid: "2.9.2",
              excludeInput: true,
              process:
                "What are the values of the fairness metrics and the uncertainties in those metrics?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you assessed and documented the achievable trade-offs between the system’s fairness objectives and its commercial objectives?",
          processes: [
            {
              pid: "2.10.1",
              excludeInput: true,
              process: "What bias mitigation techniques are applied?",
            },
            {
              pid: "2.10.2",
              excludeInput: true,
              process:
                "How is performance-fairness trade-off analysis carried out?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you justified (vs alternative tradeoffs) and documented the final fairness outcome for the AIDA System?",
          processes: [
            {
              pid: "2.11.1",
              process:
                "Have you justified (vs alternative tradeoffs) and documented the final fairness outcome for the AIDA System?",
            },
          ],
        },
        {
          testableCriteria:
            "Does the system’s monitoring and review regime ensure that the system’s impacts are aligned with its commercial and fairness objectives?",
          processes: [
            {
              pid: "2.12.1",
              process:
                "What model performance metrics and model metrics will be monitored?",
            },
            {
              pid: "2.12.2",
              process:
                "Does the system's commercial objectives, fairness objectives and choice of personal attributes change over time?",
            },
            {
              pid: "2.12.3",
              process: "What other review strategies are applied?",
            },
          ],
        },
      ],
    },
  ],
};
