export const config = {
  "principle": "Security",
  "description": "Security risks related to AI systems can be common across other types of software development and deployment, e.g., concerns related to the confidentiality, integrity, and availability of the system and its training and output data; and general security of the underlying software and hardware for AI systems. Security risk management considerations and approaches are applicable in the design, development, deployment, evaluation, and use of AI systems. Security also encompasses protocols to avoid, protect against, respond to, or recover from attacks. Organisations need to develop a risk-based approach to managing AI security. This involves identifying and assessing the risks associated with the use of AI systems and implementing appropriate security controls to mitigate those risks. Organisations should also define the roles and responsibilities of different stakeholders involved in securing AI systems, including developers, operators, and users of AI system. ",
  "sections": [
    {
      "section": "Security",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Ensure Team Competency",
          "processes": [
            {
              "pid": "5.1.1",
              "process": "Ensure that relevant team members are knowledgeable about threats, vulnerabilities, impact, and mitigation measures relevant to securing AI systems and that their knowledge is up to date<br/><br/>Relevant team members may include any employee that is involved in the model lifecycle",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence that team members have relevant security knowledge and training on threats, vulnerabilities, impact, and mitigation measures relevant to securing AI systems. This can include, where applicable: <br/>- Training records<br/>- Attendance records<br/>- Assessments<br/>- Certifications<br/>- Feedback forms"
            }
          ]
        },
        {
          "testableCriteria": "Conduct security risk assessment at the Inception of AI system development",
          "processes": [
            {
              "pid": "5.2.1",
              "process": "Ensure that proper risk assessment has been carried out, in accordance with the relevant industry standards. Risk mitigation steps have been taken",
              "metric": "Internal documentation (e.g., risk assessment)",
              "processChecks": "Documentary evidence that risk assessment has been done in accordance with the relevant industry standards/guidelines/best practices, with risk mitigation steps and factors taken. This can include:<br/>- US NIST AI Risk Management Framework<br/>- UK NCSC guidance on secure development and deployment of software applications <br/>- OWASP Secure Software Development Lifecycle (SSDLC)<br/>- CIA triad"
            }
          ]
        },
        {
          "testableCriteria": "Put in place security measures during the Verification and Validation of AI system development",
          "processes": [
            {
              "pid": "5.3.1",
              "process": "Ensure there is integrity in data and/or models and there is a chain of custody",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence that data and/or models have been obtained from a trusted source. If unable to obtain data from a trusted source, document the reason and process for using synthetic or limited data. This can include practices implemented according to:<br/>- UK NCSC supply chain security guidance<br/>- ETSI GR SAI 002 Securing AI Data Supply Chain Security<br/>- UK DSTL Machine Learning with Limited Data"
            },
            {
              "pid": "5.3.2",
              "process": "Assess the integrity of acquired datasets with a robust validation and verification process",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of assessment of the integrity of acquired datasets with a robust validation and verification process:<br/>- For internal labelled data: Have multiple labellers look at each data input and generate notification where labels differ<br/>- External procured/created data: Where possible, follow NCSC supply chain security guidance to find a trusted vendor<br/>- Randomized audits of data labels to assess error rates"
            }
          ]
        },
        {
          "testableCriteria": "Put in place security measures during the Design and Development of AI system development",
          "processes": [
            {
              "pid": "5.4.1",
              "process": "Ensure that the development environment has been secured, including trust access controls",
              "metric": "Internal documentation (e.g.,  access control management document)",
              "processChecks": "Documentary evidence that the development environment has been secured, including trust access controls. This can include:<br/>- Secure software development practices<br/>- Monitor Common Vulnerabilities and Exposures (CVEs) associated with the software used<br/>- Secure firmware and OS<br/>- Access controls following the principle of least privilege.<br/>- Access logging and monitoring"
            },
            {
              "pid": "5.4.2",
              "process": "Ensure that the digital assets have been secured, including data at rest and data in transit",
              "metric": "Internal documentation (e.g., asset management document)",
              "processChecks": "Documentary evidence that the digital assets have been secured, including data at rest and data in transit. This can include:<br/>- Implementation of recognised IT standards, such as ISO 27001"
            },
            {
              "pid": "5.4.3",
              "process": "Ensure that changes to the model or data are tracked and stored in a consistent, human- readable format",
              "metric": "Internal documentation (e.g., asset management document)",
              "processChecks": "Documentary evidence that changes to the model or data are tracked and stored in a consistent, human-readable format. This can include the use of relevant software that:<br/>- Tracks which users have made changes<br/>- Allows for review before changes to an asset are made<br/>- Allows ‘roll back’ to a backup in case of a security incident"
            },
            {
              "pid": "5.4.4",
              "process": "Implement measures to mitigate attacks on the dataset (e.g., poisoning attacks) <br/><br/>Where possible, conduct data sanitisation to remove suspicious or irrelevant data points. Augment the dataset with new data to diversify it and make it harder for attackers to inject poison data. Store the data set securely and ensure that sensitive data is protected and anonymised. Validate the performance of the machine learning model after training to ensure that it has not been poisoned",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of details of relevant mitigation measures taken. This can include the following measures:<br/>- Data sanitisation<br/>- Dataset augmentation<br/>- Secure storage of dataset<br/>- Validation of model performance"
            }
          ]
        },
        {
          "testableCriteria": "Put in place security measures during the Deployment and Monitoring of AI system development",
          "processes": [
            {
              "pid": "5.5.1",
              "process": "Implement measures to mitigate Inference Attacks, Extraction Attacks, or equivalent",
              "metric": "Internal documentation (e.g., log, register or database)",
              "processChecks": "Documentary evidence of relevant mitigation measures taken, including:<br/><br/>- Monitoring for API calls and/or input queries<br/>- Internal limits on the number of queries allowed from the same IP or with similar inputs<br/>- Implementation of secure authentication and access controls to mitigate inference attacks"
            },
            {
              "pid": "5.5.2",
              "process": "Implement an alert system for anomalous behaviour (e.g., unathorised access)",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of measures taken, including: <br/>- Following appropriate guidance when applying logging and auditing logs<br/>- Reporting to the relevant stakeholders and authority when an alert has been raised or an investigation has concluded that a cyber incident has occurred<br/>- Using human-in-the-loop to investigate what automated processes flag as unusual"
            },
            {
              "pid": "5.5.3",
              "process": "Develop a vulnerability disclosure process for AI system and organisation. This will allow users to report vulnerabilities in a responsible way",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence that a vulnerability disclosure process for AI system and organisation is developed, such as using UK NCSC Vulnerability Disclosure Toolkit"
            }
          ]
        },
        {
          "testableCriteria": "Put in place security measures for the Continual / Online Learning Model",
          "processes": [
            {
              "pid": "5.6.1",
              "process": "Ensure that risks associated with continuous learning have been considered (e.g., poisoning attack, model/concept drift)<br/><br/>Determine if continual learning is still justified with the proper risk mitigations implemented",
              "metric": "Internal documentation (e.g., risk management document)",
              "processChecks": "Documentary evidence of<br/>- Internal approval of pre-determined model performance targets <br/>- Continual learning model having achieved pre-determined performance targets before going into production"
            },
            {
              "pid": "5.6.2",
              "process": "Ensure that approved, pre-determined performance targets are achieved before a newly updated continual learning model goes into production",
              "metric": "Internal documentation (e.g., roadmap)",
              "processChecks": "Documentary evidence of<br/>- Internal approval of pre-determined model performance targets <br/>- Continual learning model having achieved pre-determined performance targets before going into production"
            }
          ]
        },
        {
          "testableCriteria": "Put in place security measures for End of Life of AI System",
          "processes": [
            {
              "pid": "5.7.1",
              "process": "Ensure proper and secure disposal/disclosure/destruction of data and model in accordance with data privacy standards and/or relevant rules and regulations",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of proper and secure disposal/disclosure/destruction of data and model. This can include adherence to relevant standards, guidelines, rules, and regulations"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "Having implemented all specified measures can provide certain level of assurance that the security of AI system is maintained. As security threats are fast evolving, it is recommended that company should periodically assess security risks and take appropriate actions to continually stay up-to-date.",
  "summaryNotYes": "By not implementing all the testable criteria, Company’s AI system may be vulnerable to exploitation by malicious actors, resulting in the compromise of its AI system’s confidentiality, integrity and availability. This, in turn, could cause damage and harm to both the end users and the owner of the AI system, including privacy violations, fraud, reputational damage, and potential regulatory challenges.",
  "recommendation": "Security is essential in building stakeholder trust in the AI system. Do review periodically the measures that company has chosen not to implement or has assessed to be not applicable to see if justifications for doing so remain valid. As security threats are fast evolving, it is recommended that company should periodically assess security risks and take appropriate actions to continually stay up-to-date."
}