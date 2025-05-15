export const config = {
  principle: "Transparency",
  description: "Default transparency questionnaire for Veritas",
  sections: [
    {
      section: "Transparency",
      testType: "process-checklist",
      checklist: [
        {
          testableCriteria:
            "Has the FSI defined the factors it will use to determine whether external (customer facing) transparency is essential for a particular AIDA use case?",
          processes: [
            {
              pid: "4.1.1",
              process:
                "Has the FSI defined the factors it will use to determine whether external (customer facing) transparency is essential for a particular AIDA use case?",
            },
          ],
        },
        {
          testableCriteria:
            "(Where an FSI has chosen to provide external transparency) At each stage of the FSI’s customer lifecycle, has the FSI determined what proactive or reactive communication may be needed, and the standard templates/interfaces for the same?",
          processes: [
            {
              pid: "4.2.1",
              process:
                "What customer facing explanations are required at each stage of the customer lifecycle?",
            },
            {
              pid: "4.2.2",
              process: "What are the communication channels available?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the FSI defined the factors it will use to determine the extent of, and audience for internal transparency for individual AIDA use cases?",
          processes: [
            {
              pid: "4.3.1",
              process:
                "Who is the audience for internal transparency for individual AIDA use cases?",
            },
            {
              pid: "4.3.2",
              process:
                "What is the extent of internal transparency for individual AIDA use cases?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the FSI defined an acceptable set of AIDA ML explanation method(s) for use within the FSI?",
          processes: [
            {
              pid: "4.4.1",
              process:
                "Has the FSI defined an acceptable set of AIDA ML explanation method(s) for use within the FSI?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the FSI set minimum accuracy standards for such explanation methods?",
          processes: [
            {
              pid: "4.5.1",
              process:
                "Has the FSI set minimum accuracy standards for such explanation methods?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the AIDA use case team determined whether there is a need for external (customer facing) transparency? Apply standards from the first transparency question to help answer the question.",
          processes: [
            {
              pid: "4.6.1",
              process:
                "Has the AIDA use case team determined whether there is a need for external (customer facing) transparency? Apply standards from the first transparency question to help answer the question.",
            },
          ],
        },
        {
          testableCriteria:
            "If yes, has the team identified the proactive and reactive communication needed at each stage of the customer lifecycle, and the form of such customer facing communication? Apply standards from transparency question 2 to help answer the question.",
          processes: [
            {
              pid: "4.7.1",
              process:
                "Has the team identified the proactive and reactive communication needed at each stage of the customer lifecycle?",
            },
            {
              pid: "4.7.2",
              process: "What are the communication channels available?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the team determined the level of internal transparency needed, and the audiences for the same? Apply standards from transparency question 3 to help answer the question.",
          processes: [
            {
              pid: "4.8.1",
              process:
                "Who is the audience for internal transparency for individual AIDA use cases?",
            },
            {
              pid: "4.8.2",
              process:
                "What is the extent of internal transparency for individual AIDA use cases?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the team selected a suitable explanation method for this specific use case from the approved list in transparency question 4?",
          processes: [
            {
              pid: "4.9.1",
              process: "What are the selected explanation methods?",
            },
            {
              pid: "4.9.2",
              process:
                "What are the advantages for the selected explanation methods?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the team ascertained that the chosen explanation method/implementation meets the minimum accuracy requirement for this specific use case (based on transparency question 5)?",
          processes: [
            {
              pid: "4.10.1",
              process:
                "Has the team ascertained that the chosen explanation method/implementation meets the minimum accuracy requirement for this specific use case (based on transparency question 5)?",
            },
          ],
        },
        {
          testableCriteria:
            "Have internal transparency dashboards/reports been implemented in line with the requirements agreed in transparency question 8-10?",
          processes: [
            {
              pid: "4.11.1",
              excludeInput: true,
              process:
                "Have internal transparency dashboards/reports been implemented in line with the requirements agreed in transparency question 8-10?",
            },
          ],
        },
        {
          testableCriteria:
            "Have relevant first and second line control teams – including model validation where relevant – reviewed and approved these outputs (e.g., local and global explanations, conceptual soundness)?",
          processes: [
            {
              pid: "4.12.1",
              process:
                "Have relevant first and second line control teams – including model validation where relevant – reviewed and approved these outputs (e.g., local and global explanations, conceptual soundness)?",
            },
          ],
        },
        {
          testableCriteria:
            "Where the explanations have not met first/second line expectations, have appropriate mitigation actions been taken (e.g., switching to a simpler model despite a reduction in predictive accuracy, dropping difficult to explain features, introducing more human oversight)?",
          processes: [
            {
              pid: "4.13.1",
              process:
                "Where the explanations have not met first/second line expectations, have appropriate mitigation actions been taken (e.g., switching to a simpler model despite a reduction in predictive accuracy, dropping difficult to explain features, introducing more human oversight)?",
            },
          ],
        },
        {
          testableCriteria:
            "In line with the external transparency requirements agreed in T6-T7, has appropriate system functionality been developed and tested as part of the AIDA system’s implementation plan?",
          processes: [
            {
              pid: "4.14.1",
              process:
                "In line with the external transparency requirements agreed in T6-T7, has appropriate system functionality been developed and tested as part of the AIDA system’s implementation plan?",
            },
          ],
        },
        {
          testableCriteria:
            "Have operational processes such as customer service and complaint handling been modified appropriately to incorporate AIDA customer transparency? Have relevant staff been provided appropriate training to address customer queries?",
          processes: [
            {
              pid: "4.15.1",
              process:
                "Have operational processes such as customer service and complaint handling been modified appropriately to incorporate AIDA customer transparency? Have relevant staff been provided appropriate training to address customer queries?",
            },
          ],
        },
        {
          testableCriteria:
            "Have customer/website Terms and Conditions been appropriately updated?",
          processes: [
            {
              pid: "4.16.1",
              process:
                "Have customer/website Terms and Conditions been appropriately updated?",
            },
          ],
        },
        {
          testableCriteria:
            "Does the AIDA system implementation support the agreed internal and external explanations even after go-live (i.e., not just as a one-off before approval but throughout the lifetime of the AIDA system)?",
          processes: [
            {
              pid: "4.17.1",
              process:
                "Does the AIDA system implementation support the agreed internal and external explanations even after go-live (i.e., not just as a one-off before approval but throughout the lifetime of the AIDA system)?",
            },
          ],
        },
      ],
    },
  ],
};
