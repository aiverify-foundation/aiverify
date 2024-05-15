export const config = {
  "principle": "Accountability",
  "description": "Accountability is about having clear internal governance mechanisms for proper management oversight of the AI system’s development and deployment.",
  "sections": [
    {
      "section": "Accountability",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Establish clear internal governance mechanisms to ensure clear roles and responsibilities for the use of AI by the organisation",
          "processes": [
            {
              "pid": "9.1.1",
              "process": "Adapt existing structures, communication lines, procedures, and rules (e.g., three lines of defense risk management model) or implement new ones",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of adaptation or new implementation of structures, communication lines, procedures, and rules (e.g., three lines of defense risk management model)"
            },
            {
              "pid": "9.1.2",
              "process": "For organisations who are using AI across departments, establish an AI governance committee that comprises representatives from data science, technology, risk, and product to facilitate cross-departmental oversight for the lifecycle governance of AI systems",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of the establishment of an AI governance committee. <br/><br/>This committee should be sufficiently representative. One way to achieve this is by having representatives from:<br/>- data science;<br/>- technology;<br/>- legal and compliance;<br/>- risk and product; and<br/>- user experience research, ethics, and psychology"
            },
            {
              "pid": "9.1.3",
              "process": "Enable a process to report on actions or decisions that affect the AI system's outcome, and a corresponding process for the accountable party to respond to the consequences of such an outcome",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence that outlines roles, responsibilities, and key processes for <br/><br/>- the reporting on actions or decisions that affect the AI system's outcome; <br/>- the corresponding process for the accountable party to respond to the consequences of such an outcome"
            }
          ]
        },
        {
          "testableCriteria": "Establish the appropriate process or governance-by-design technology to automate or facilitate the AI system’s auditability throughout its lifecycle",
          "processes": [
            {
              "pid": "9.2.1",
              "process": "Process or technology should handle:<br/>- Version control of code and model<br/>- Version data or maintain immutable data<br/>- Audit trail of deployment history, log inputs/outputs, associate server predictions with the originating model",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of the establishment of the appropriate process or governance-by-design technology to automate or facilitate the AI system’s auditability throughout its lifecycle.<br/><br/>The process or technology should handle:<br/>- Version control of code and model;<br/>- Version data or maintain immutable data; and<br/>- Audit trail of deployment history, log inputs/outputs, associate server predictions with the originating model"
            }
          ]
        },
        {
          "testableCriteria": "Define the policy mechanism for enforcing access rights and permissions for the various roles of users",
          "processes": [
            {
              "pid": "9.3.1",
              "process": "Implement fine-grained access control that aligns with various roles for users:<br/>- Access to code and data for training AI models<br/>- Access to code and data for deploying AI models<br/>- Access to different execution environments<br/>- Permission to perform various actions (e.g., launch training job, review model, deploy model server)<br/>- Permission to define access control rules and perform other administrative functions",
              "metric": "Internal documentation (e.g., procedure manual)",
              "processChecks": "Documentary evidence of the implementation of fine-grained access control that aligns with various roles for users, which include: <br/><br/>- Access to code and data for training AI models<br/>- Access to code and data for deploying AI models<br/>- Access to different execution environments<br/>- Permission to perform various actions (e.g., launch training job, review model, deploy model server)<br/>- Permission to define access control rules and perform other administrative functions"
            }
          ]
        },
        {
          "testableCriteria": "Establish a strategy for maintaining independent oversight over the development and deployment of AI systems",
          "processes": [
            {
              "pid": "9.4.1",
              "process": "Reviewers should be distinct from those who are training and deploying models. However, it is acceptable to have the same individuals training and deploying models",
              "metric": "Internal documentation (e.g., log, register or database)",
              "processChecks": "Documentary evidence of strategy for maintaining independent oversight over the development and deployment of AI systems"
            }
          ]
        },
        {
          "testableCriteria": "If you are using third-party ‘black box’ models, assess the suitability and limits of the model for your use case",
          "processes": [
            {
              "pid": "9.5.1",
              "process": "Evaluate the necessity of third-party models e.g., they are trained on data otherwise not accessible to your organisation ,or you do not have the requisite capability to build AI systems in-house",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of evaluation completed regarding the necessity of third-party models"
            },
            {
              "pid": "9.5.2",
              "process": "Demonstrate effort to understand how the third-party models were built, including 1) what data was used to train the models, 2) how the models are assessed for effectiveness and explainability 3) under what circumstances does the AI system perform poorly",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of effort undertaken to understand how the third-party models were built, which includes:<br/><br/>- what data was used to train the models;<br/>- how the models are assessed for effectiveness and explainability; and<br/>- under what circumstances does the AI system perform poorly"
            }
          ]
        },
        {
          "testableCriteria": "Establish clear responsibilities between different parties within the broader supply chain – partners, suppliers, customers, third parties",
          "processes": [
            {
              "pid": "9.6.1",
              "process": "Responsibilities and obligations are clearly communicated to all parties related to the AI system",
              "metric": "External / internal correspondence",
              "processChecks": "Documentary evidence of communication with relevant parties on responsibilities and obligations relating to the AI system"
            }
          ]
        },
        {
          "testableCriteria": "Establish a process to ensure that suppliers provide their services, products or materials in support of the responsible development and use of the AI system",
          "processes": [
            {
              "pid": "9.7.1",
              "process": "Select AI system suppliers which align with organisation’s approach.<br/><br/>When AI system suppliers do not perform as intended, there are processes for suppliers to take remedial actions.",
              "metric": "Internal documentation<br/>External correspondence",
              "processChecks": "Documentary evidence of processes to select suppliers which align with the organisation’s approach.<br/><br/>Documentary evidence of correspondence with suppliers to take corrective action."
            }
          ]
        },
        {
          "testableCriteria": "Incorporate end users’ expectations/needs in the responsible development and use of the AI system",
          "processes": [
            {
              "pid": "9.8.1",
              "process": "Process to engage end users on their expectations and needs (e.g. providing general usage agreements that scope its use)",
              "metric": "External / internal correspondence",
              "processChecks": "Documentary evidence of attempts to understand end users needs and mitigate risks related to its misuse"
            }
          ]
        },
     ]
    }
  ],
  "summaryYes": "Company has put in place an organisational structure and internal governance mechanism to ensure clear roles and responsibilities for the use of AI. This allows the Company to quickly establish accountability when something goes wrong, identify the problem, and address it in a timely manner.",
  "summaryNotYes": "The current organisational structure, internal governance mechanism or relationship with wider supply chain may not provide sufficient accountability and oversight of the AI system. This may have negative impact on the identification and mitigation of risks associated with this AI system.",
  "recommendation": "Company should review the current organizational structure, internal governance mechanism or relationship with wider supply chain to ensure clear accountability for those involved in Company’s AI development and deployment."
}