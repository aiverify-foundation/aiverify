export const config = {
  "principle": "Data Governance",
  "description": "Data Governance ensures that data is properly managed over time throughout the enterprise, including establishing authority, management, and decision-making parameters related to the data used in AI systems.\n",
  "sections": [
    {
      "section": "Data Governance",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Put in place measures to ensure data quality over time",
          "processes": [
            {
              "pid": "8.1.1",
              "process": "Verify the quality of data used in the AI system. This may include the following: <br/>- accuracy in terms of how well the values in the dataset match the true characteristics of the entity described by the dataset<br/>- completeness in terms of attributes and items e.g., checking for missing values, duplicate records<br/>- veracity in terms of how credible the data is, including whether the data originated from a reliable source<br/>- How recently the dataset was compiled or updated<br/>- Relevance for the intended purpose<br/>- Integrity in terms of how well extraction and transformation have been performed if multiple datasets are joined;<br/>- Usability in terms of how the data are tracked and stored in a consistent, human-readable format<br/>- Providing distribution analysis e.g., feature distributions of input data",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence that proves due diligence has been done to ensure the quality of data. This can include the use of relevant processes or software that:<br/>- Conducts validation schema checks<br/>- Identifies possible errors and inconsistencies at the exploratory data analysis stage before training the dataset<br/>- Assigns roles to the entire data pipeline to trace who manipulated data and by which rule<br/>- Allows for review before a change is made<br/>- Unit tests to validate that each data operation is performed correctly prior to deployment<br/>- Allow for periodic reviewing and update of datasets <br/>- Allow for continuous assessment of the quality of the input data to the AI system, including drift parameters and thresholds, where applicable"
            }
          ]
        },
        {
          "testableCriteria": "Put in place measures to understand the lineage of data, including knowing where the data originally came from, how it was collected, curated, and moved within the organisation over time",
          "processes": [
            {
              "pid": "8.2.1",
              "process": "Maintain a data provenance record to ascertain the quality of the data based on its origin and subsequent transformation. This could include the following: <br/>- Take steps to understand the meaning of and how data was collected<br/>- Document data usage and related concerns. <br/>- Ensure any data labeling is done by a representative group of labelers <br/>- Document the procedure for assessing labels for bias<br/>- Trace potential sources of errors<br/>-Update data<br/>- Attribute data to their sources",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of a data provenance record that includes the following info, where applicable:<br/>- clear explanations of what data is used, how it is collected and why<br/>- source of data and its labels<br/>- who the labelers were and whether bias tests were conducted to assess if the labelled data was biased (e.g., bias assessment)<br/>- how data is transformed over time <br/>- risk management if the origin of data is difficult to be established"
            }
          ]
        },
        {
          "testableCriteria": "Ensure data practices comply with relevant regulatory requirements or industry standards",
          "processes": [
            {
              "pid": "8.3.1",
              "process": "Ensure that assessment has been carried out in accordance with the relevant regulatory requirements and/or industry standards.  Mitigation steps have been taken.",
              "metric": "1) Internal documentation; 2) Assessment documentation or certification(s)",
              "processChecks": "Documentary evidence that assessment has been done in accordance with the relevant data protection laws/ standards/guidelines/best practices. For example:<br/>- applicable data protection laws and regulations such as Singapore's Personal Data Protection Act, European Data Governance Act <br/>- Singapore's Data Protection Trustmark <br/>-  Asia Pacific Economic Cooperation Cross Border Privacy Rules and Privacy Recognition for Processors<br/>- OECD Privacy Principles<br/>- Recognised data governance standards from international standard bodies (e.g., ISO, US NIST, IEEE)"
            }
          ]
        },
        {
          "testableCriteria": "Ensure team competency in data governance",
          "processes": [
            {
              "pid": "8.4.1",
              "process": "Ensure that relevant team members are knowledgeable about their roles and responsibilities for data governance. Relevant team members  include any employee that is involved in managing and using the data for the AI system. For example, having a data policy team to manage the tracking of data lineage with proper controls",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence that team members have relevant knowledge and training on data governance. This can include, where applicable: <br/>- Training records<br/>- Attendance records<br/>- Assessments<br/>- Certifications<br/>- Feedback forms"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "Company has put in place measures and processes to govern the use of data in AI systems throughout the data lifecycle, including putting in place good governance practices for data quality, lineage, and to comply with relevant regulatory requirements or industry standards.",
  "summaryNotYes": "By not implementing all the testable criteria, Company runs the risk of potential data quality issues affecting accuracy of the AI model, bias issues relating to unintended discrimination, data security risks resulting in unauthorized access, use or disclosure and/or compliance issues with data protection regulations and laws.",
  "recommendation": "It is recommended that Company implements all the testable criteria. Company should review the reasons for not implementing certain testable criteria and assess if these reasons are still valid. Company should review its data governance policy and explore putting in place relevant standards, guidelines and best practices."
}