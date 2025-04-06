export const config = {
  principle: "Generic",
  description: "Default questionnaire for Veritas",
  sections: [
    {
      section: "Generic",
      testType: "process-checklist",
      checklist: [
        {
          testableCriteria: "Is AIDA defined in the FSI?",
          processes: [
            {
              pid: "1.1.1",
              process: "Is AIDA defined in the FSI?",
            },
          ],
        },
        {
          testableCriteria:
            "Is there a framework in place to define roles and responsibilities for AIDA projects/use cases?",
          processes: [
            {
              pid: "1.2.1",
              process:
                "Is there a framework in place to define roles and responsibilities for AIDA projects/use cases?",
            },
          ],
        },
        {
          testableCriteria:
            "Is there a materiality framework in place? If so, do you have a clear definition to determine the different level of materiality?",
          processes: [
            {
              pid: "1.3.1",
              process:
                "Is there a materiality framework in place? If so, do you have a clear definition to determine the different level of materiality?",
            },
          ],
        },
        {
          testableCriteria:
            "Does the FSI have an up-to-date inventory that tracks all material AIDA use cases in use?",
          processes: [
            {
              pid: "1.4.1",
              process:
                "Does the FSI have an up-to-date inventory that tracks all material AIDA use cases in use?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you documented the commercial objectives of the system and the quantitative measures to meet those commercial objectives? Is it documented how is AIDA used to achieve them?",
          processes: [
            {
              pid: "1.5.1",
              process:
                "What are the primary (and secondary) commercial objectives of the system?",
            },
            {
              pid: "1.5.2",
              process: "How do you quantify those commercial objectives?",
            },
            {
              pid: "1.5.3",
              process:
                "Are there internal or external constraints that affect the ability of the system to achieve these objectives?",
            },
          ],
        },
        {
          testableCriteria:
            "Are there scope boundaries of the proposed system? For example, specific geographies/ segments?",
          processes: [
            {
              pid: "1.6.1",
              process:
                "Are there scope boundaries of the proposed system? For example, specific geographies/ segments?",
            },
          ],
        },
        {
          testableCriteria:
            "Is AIDA use justified for this particular objective/use case (based on limitations of alternatives, proof of AIDA being used successfully elsewhere, availability of adequate data to train the AIDA system, valid legal basis, etc.)?",
          processes: [
            {
              pid: "1.7.1",
              process:
                "Is AIDA use justified for this particular objective/use case (based on limitations of alternatives, proof of AIDA being used successfully elsewhere, availability of adequate data to train the AIDA system, valid legal basis, etc.)?",
            },
          ],
        },
        {
          testableCriteria:
            "Has the materiality of the use case been determined using the framework defined in the first 3 questions?",
          processes: [
            {
              pid: "1.8.1",
              process:
                "Has the materiality of the use case been determined using the framework defined in the first 3 questions?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you documented the data used by the system including types of data available, the provenance (source), attributes, dictionary (meaning), vintage (time period), data (quality) profile, representativeness and informed consent? For any personal data used by the system, has a DPIA been conducted?",
          processes: [
            {
              pid: "1.9.1",
              process:
                "Have you documented the data used by the system including types of data available, the provenance (source), attributes, dictionary (meaning), vintage (time period), data (quality) profile, representativeness and informed consent? For any personal data used by the system, has a DPIA been conducted?",
            },
          ],
        },
        {
          testableCriteria:
            "Have you documented the data pre-processing and engineering done by the system?",
          processes: [
            {
              pid: "1.10.1",
              process:
                "Have you documented the data pre-processing and engineering done by the system?",
            },
          ],
        },
        {
          testableCriteria:
            "Is the composition of the AIDA System defined? Is it clear how each component of the system AIDA models, as well as business rules and human judgement if relevant, are used to achieve its commercial objectives? Are the performance estimates and the uncertainties of those estimates documented?",
          processes: [
            {
              pid: "1.11.1",
              process: "What are the components of the AIDA system?",
            },
            {
              pid: "1.11.2",
              process:
                "How is each component of the system - including AIDA models, business rules and human judgement if relevant - used to achieve the FSI‘s commercial objectives?",
            },
            {
              pid: "1.11.3",
              excludeInput: true,
              process:
                "What the performance estimates and the uncertainties of those estimates?",
            },
          ],
        },
        {
          testableCriteria:
            "Is the system’s monitoring and review regime designed to detect abnormal operation (e.g., significant model and/or data drift)?",
          processes: [
            {
              pid: "1.12.1",
              process:
                "Is the system’s monitoring and review regime designed to detect abnormal operation (e.g., significant model and/or data drift)?",
            },
          ],
        },
        {
          testableCriteria:
            "Is there fallback and/or mitigation plans in place in case of triggers from the system’s monitoring and review regime?",
          processes: [
            {
              pid: "1.13.1",
              process:
                "Is there fallback and/or mitigation plans in place in case of triggers from the system’s monitoring and review regime?",
            },
          ],
        },
      ],
    },
  ],
};
