export const config = {
  principle: "Organisational Considerations",
  description:
    "Beyond assessment of individual AI systems, organisations need to consider issues such as the use of AI (versus non-AI options), norms and expectations as well as resources to manage the use of AI",
  sections: [
    {
      section: "Organisational Considerations",
      testType: "process-checklist",
      checklist: [
        {
          testableCriteria:
            "Mechanisms are in place to inventory AI systems and are resourced according to organizational risk priorities",
          processes: [
            {
              pid: "12.1.1",
              process:
                "Put in place guided flow for documenting (i) the inventory of AI systems and necessary resources and (ii) risk priorities",
              metric: "Internal documentation (e.g., procedure manual)",
              processChecks:
                "Documentary evidence of considerations of resources and risk priorities",
            },
          ],
        },
        {
          testableCriteria:
            "Intended purposes, potentially beneficial uses, contexts specific laws, norms and expectations, and prospective settings in which the AI system will be deployed are understood and documented",
          processes: [
            {
              pid: "12.2.1",
              process:
                "Refer to 4.1 and 4.2. In addition, document the norms and expectations in which the AI system will be deployed",
              metric: "Internal documentation",
              processChecks:
                "Documentary evidence of norms and expectations of the AI system",
            },
          ],
        },
        {
          testableCriteria:
            "Scientific integrity and Test, Evaluation, Verification, and Validation (TEVV) considerations are identified and documented, including those related to experimental design, data collection and selection (e.g., availability, representativeness, suitability), system trustworthiness, and construct validation",
          processes: [
            {
              pid: "12.3.1",
              process:
                "For systems that are in experimental stage, put in place a process to document the TEVV considerations",
              metric: "Internal documentation",
              processChecks: "Documentary evidence of TEVV considerations",
            },
          ],
        },
        {
          testableCriteria:
            "Practices and personnel for supporting regular engagement with relevant AI actors and integrating feedback about positive, negative, and unanticipated impacts are in place and documented <br/><br/>Note: “AI Actors” is defined as “those who play an active role in the AI system lifecycle, including organisations and individuals that deploy or operate AI”",
          processes: [
            {
              pid: "12.4.1",
              process:
                "Refer to 7.4.2, 9.1.1, 9.1.2, 9.1.3. In addition, put in place a process to engage external AI actors for feedback",
              metric: "Internal documentation",
              processChecks:
                "Documentary evidence of engagement and feedback from relevant AI actors",
            },
          ],
        },
        {
          testableCriteria:
            "Risk tracking approaches are considered for settings where AI risks are difficult to assess using currently available measurement techniques or where metrics are not yet available",
          processes: [
            {
              pid: "12.5.1",
              process:
                "For risks difficult to assess or where metrics are not available, put in place risk tracking approaches such as developing a risk reporting matrix, communicating potential risk to affected stakeholders, monitoring risk mitigation plans and reviewing status updates regularly",
              metric: "Internal documentation",
              processChecks:
                "Documentary evidence of implementation of risk tracking approaches",
            },
          ],
        },
        {
          testableCriteria:
            "Resources required to manage AI risks are taken into account – along with viable non-AI alternative systems, approaches, or methods – to reduce the magnitude or likelihood of potential impacts",
          processes: [
            {
              pid: "12.6.1",
              process:
                "Conduct impact assessment on the use of AI versus non-AI alternative systems, approaches, or methods, and the resources required to manage the risk of using AI",
              metric: "Internal documentation",
              processChecks: "Documentary evidence of impact assessment",
            },
          ],
        },
      ],
    },
  ],
  "summaryYes": "Company has considered the broader implications when deciding AI deployment such as whether to use AI system versus non-AI options, as well as having sufficient resources to manage the deployment of AI.",
  "summaryNotYes": "Company has not implemented all the broader considerations when deciding AI deployment such as whether to use AI system versus non-AI options, as well as having sufficient resources to manage the deployment of AI.",
  "recommendation": "Company should periodically review the reasons for not having fully implemented these broader considerations as this may have implications for all AI deployments by the Company."
};
