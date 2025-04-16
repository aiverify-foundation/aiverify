export const config = {
  principle: "Ethics and Accountability",
  description: "Default ethics and accountability questionnaire for Veritas",
  sections: [
    {
      section: "Ethics and Accountability",
      testType: "process-checklist",
      checklist: [
        {
          testableCriteria: "Are organizational values defined and described?",
          processes: [
            {
              pid: "3.1.1",
              process: "Are organizational values defined and described?",
            },
          ],
        },
        {
          testableCriteria:
            "Are organizational, or group-specific, principles for the ethical use of AI defined and described?",
          processes: [
            {
              pid: "3.2.1",
              process:
                "Are organizational, or group-specific, principles for the ethical use of AI defined and described?",
            },
          ],
        },
        {
          testableCriteria:
            "Are context-relevant core concepts identified and described?",
          processes: [
            {
              pid: "3.3.1",
              process:
                "Are context-relevant core concepts identified and described?",
            },
          ],
        },
        {
          testableCriteria:
            "Is the workforce trained on values-based decision making or is there a pilot planned?",
          processes: [
            {
              pid: "3.4.1",
              process:
                "Is the workforce trained on values-based decision making or is there a pilot planned?",
            },
          ],
        },
        {
          testableCriteria:
            "Is there a statement of relevant values, core concepts, principles, commitments, and specifications, along with a written description, for each use case? Part of this should include identifying commitment owners and the stakeholders with interest in holding the commitment owners accountable.",
          processes: [
            {
              pid: "3.5.1",
              process:
                "List the values and core concepts that are relevant to the use case.",
            },
            {
              pid: "3.5.2",
              process:
                "What are the principles，commitments and specifications for your use case? Refer to the following key concepts explanation and table.",
            },
            {
              pid: "3.5.3",
              process:
                "Who are the owners and stakeholders for the commitments? Refer to the following key concepts explanation and the table.",
            },
          ],
        },
        {
          testableCriteria:
            "Have relative priorities, which may or may not be tied to materiality, been recorded for each commitment?",
          processes: [
            {
              pid: "3.6.1",
              process:
                "Have relative priorities, which may or may not be tied to materiality, been recorded for each commitment?",
            },
          ],
        },
        {
          testableCriteria:
            "Are recourse mechanisms available to data subjects being used? Is there an explanation if the use of recourse is too high or too low?",
          processes: [
            {
              pid: "3.7.1",
              process:
                "Are recourse mechanisms available to data subjects being used? Is there an explanation if the use of recourse is too high or too low?",
            },
          ],
        },
        {
          testableCriteria:
            "Are controls in place to revisit and recalibrate the commitments and their specifications to ensure they’re properly incentivizing the right decisions and accurately measuring progress toward the commitments?",
          processes: [
            {
              pid: "3.8.1",
              process:
                "Are controls in place to revisit and recalibrate the commitments and their specifications to ensure they’re properly incentivizing the right decisions and accurately measuring progress toward the commitments?",
            },
          ],
        },
      ],
    },
  ],
};
