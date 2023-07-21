export const config = {
  "principle": "Reproducibility",
  "description": "Reproducibility is a crucial requirement for achieving system resilience. With software systems, the ability to reproduce an outcome or error is key to identifying and isolating the root cause. The testable criteria in this section focus on logging capabilities to monitor the AI system, tracking the journey of a data input through the AI lifecycle, and reviewing the input and output of the AI system.",
  "sections": [
    {
      "section": "Traceability",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Put in place methods to record the provenance of the AI model, including the various versions, configurations, data transformations, and underlying source code",
          "processes": [
            {
              "pid": "3.1.1",
              "process": "Implement version control of source code and frameworks used to develop the model. For each version of the model, track the code version, as well as the parameters, hyperparameters, and source data used",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of version control of source code and frameworks used to develop the model, including considerations of how much version history is required<br/><br/>Each version of the model should track the following:<br/>- code version;<br/>- parameters; <br/>- hyperparameters; and <br/>- source data"
            }
          ]
        },
        {
          "testableCriteria": "Put in place measures to ensure data quality over time",
          "processes": [
            {
              "pid": "3.2.1",
              "process": "Verify the quality of data used in the AI system. This may include the following: <br/>- accuracy in terms of how well the values in the dataset match the true characteristics of the entity described by the dataset<br/>- completeness in terms of attributes and items e.g., checking for missing values, duplicate records<br/>- veracity in terms of how credible the data is, including whether the data originated from a reliable source<br/>- How recently the dataset was compiled or updated<br/>- Relevance for the intended purpose<br/>- Integrity in terms of how well extraction and transformation have been performed if multiple datasets are joined;<br/>- Usability in terms of how the data are tracked and stored in a consistent, human-readable format<br/>- Providing distribution analysis e.g., feature distributions of input data",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence that proves due diligence has been done to ensure the quality of data. This can include the use of relevant processes or software that:<br/>- Conducts validation schema checks<br/>- Identifies possible errors and inconsistencies at the exploratory data analysis stage, before training the dataset<br/>- Assigns roles to the entire data pipeline to trace who manipulated data and by which rule<br/>- Allows for review before a change is made<br/>- Unit tests to validate that each data operation is performed correctly prior to deployment<br/>- Allow for periodic reviewing and update of datasets <br/>- Allow for continuous assessment of the quality of the input data to the AI system, including drift parameters and thresholds, where applicable"
            }
          ]
        },
        {
          "testableCriteria": "Put in place measures to understand the lineage of data, including knowing where the data originally came from, how it was collected, curated, and moved within the organisation over time",
          "processes": [
            {
              "pid": "3.3.1",
              "process": "Maintain a data provenance record to ascertain the quality of the data based on its origin and subsequent transformation. This could include the following: <br/>- Take steps to understand the meaning of and how data was collected<br/>- Document data usage and related concerns. <br/>- Ensure any data labeling is done by a representative group of labelers <br/>- Document the procedure for assessing labels for bias<br/>- Trace potential sources of errors<br/>-Update data<br/>- Attribute data to their sources",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of a data provenance record that includes the following info, where applicable:<br/>- clear explanations of what data is used, how it is collected, and why<br/>- source of data and its labels<br/>- who the labelers were and whether bias tests were conducted to assess if the labelled data was biased (e.g., bias assessment)<br/>- how data is transformed over time <br/>- risk management if the origin of data is difficult to be established"
            }
          ]
        },
        {
          "testableCriteria": "Trace the data used by the AI system to make a certain decision(s) or recommendation(s)",
          "processes": [
            {
              "pid": "3.4.1",
              "process": "Log and capture clearly the data used to train a model version, as well as produce inference results using the model (batch scoring or API endpoint)",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of data used. <br/><br/>Data (raw and synthetic data) includes:   <br/>- data used to train the AI model; <br/>- data used to produce inference results using the AI model (batch scoring or API endpoint)"
            }
          ]
        },
        {
          "testableCriteria": "Trace the AI model or rules that led to the decision(s) or recommendation(s) of the AI system",
          "processes": [
            {
              "pid": "3.5.1",
              "process": "Link the inference results of the model (batch scoring or API endpoint) back to the underlying model and source code",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of linking the inference results of the model (batch scoring or API endpoint) back to the underlying model and source code"
            }
          ]
        },
        {
          "testableCriteria": "Put in place adequate logging practices to record the decision(s) or recommendation(s) of the AI system",
          "processes": [
            {
              "pid": "3.6.1",
              "process": "Log all inputs and inference outputs of the model, and store them for a reasonable duration so that they can be reviewed",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of log records covering all inputs and inference outputs of the model.<br/><br/>Log records would cover: <br/>- decisions(s) of AI system; and/or<br/>- recommendation(s) of the AI system<br/>- if a human accepted or rejected AI recommendations/decisions, especially when human-in-the-loop is required"
            }
          ]
        }
      ]
    },
    {
      "section": "Reproducibility",
      "testType": "process-checklist",
      "checklist": [
        {
          "testableCriteria": "Reproduce the training process for every evaluated model (except data)",
          "processes": [
            {
              "pid": "3.7.1",
              "process": "Version control model artefacts by associating each artefact with the version of code, dependencies, and parameters used in training",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of version control model artefacts. <br/><br/>Each artefact includes: <br/>- version of code<br/>- dependencies; and <br/>- parameters used in training"
            }
          ]
        },
        {
          "testableCriteria": "Assess for repeatability by reviewing if the model produces the same output based on the same input  (Note: this is not relevant when it's time to the retrain model)",
          "processes": [
            {
              "pid": "3.8.1",
              "process": "Calculate multiple inferences. If the data follows a normal distribution, the accepted limits of this difference (or 95% of it at least) are +/-1.96 times the standard deviation of the differences between the means of the two tests",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of assessment conducted to review if the model produces the same output based on the same input"
            }
          ]
        },
        {
          "testableCriteria": "Define the process for developing models and evaluate the process",
          "processes": [
            {
              "pid": "3.9.1",
              "process": "Identify a combination of technical metrics and business metrics that AI models are designed to be assessed against",
              "metric": "Internal documentation.",
              "processChecks": "Documentary evidence of metrics of AI models that are designed to be assessed against. <br/><br/>Metrics include: <br/>- technical metrics; and/or <br/>- business metrics"
            },
            {
              "pid": "3.9.2",
              "process": "Keep track of experiments (e.g., hyperparameters and model performance) used to develop challenger models, document the rationale for developing these models, and how the final deployed model was arrived at",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of the process in developing the AI model.<br/><br/>The process includes: <br/>- hyperparameters, model performance, and other relevant aspects used to develop challenger models;<br/>- the rationale for developing these models; and<br/>- how the final deployed model was derived"
            }
          ]
        },
        {
          "testableCriteria": "Establish a strategy for reproducing the input data used in the training process for every model",
          "processes": [
            {
              "pid": "3.10.1",
              "process": "Version control the input data used for training where possible. If not possible, avoid changing the raw data at the source, and keep track of the various stages or transformation steps that are part of the data pipeline for AI model development, preferably as a directed acyclic graph (DAG)",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of having implemented a strategy for reproducing the input data used in the training process for every model.<br/><br/>This strategy includes:<br/>- data cleaning, data processing, and feature engineering<br/>- maintaining version control of the input data used for training the AI model, where possible; or<br/>- separating data manipulation process into extraction (data versioning) and processing; or<br/>- avoiding changes to the raw data at the source and keeping track of the various stages or transformation steps that are part of the data pipeline for AI model development, preferably as a directed acyclic graph (DAG)."
            }
          ]
        },
        {
          "testableCriteria": "Establish a strategy for ensuring that assumptions still hold across subsequent model retraining process on new input data",
          "processes": [
            {
              "pid": "3.11.1",
              "process": "Record the statistical distribution of input features and output results so that divergence during retraining can be flagged. Monitor input parameters and evaluation metrics for anomalies across retraining runs",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of establishing a strategy for ensuring that assumptions still hold across subsequent model retraining process on new input data. For example:<br/>- K-L divergence and K-S test metrics can be used to compare the statistical distributions of inputs/outputs between two training runs<br/>- Moving average and standard deviations can be used to detect a significant change in model performance metrics"
            }
          ]
        },
        {
          "testableCriteria": "Reproduce outputs of the AI system",
          "processes": [
            {
              "pid": "3.12.1",
              "process": "Log audit trail of when and how each model was deployed, including the code used to serve the model, testing/validation data, and what version of the model artefact was used",
              "metric": "Internal documentation",
              "processChecks": "Documentary evidence of past outputs of deployed AI system, which can include: <br/>- when and how each model was deployed;<br/>- the code used to serve the model; and <br/>- the version of the model artefact used"
            }
          ]
        },
        {
          "testableCriteria": "If using a blackbox model or third party model, assess the vendor's claim on accuracy",
          "processes": [
            {
              "pid": "3.13.1",
              "process": "Curate the test set and apply the test set on the model to review performance",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of assessment conducted concerning vendor's claim on the accuracy, if using a blackbox or third party model"
            }
          ]
        },
        {
          "testableCriteria": "Establish a strategy to continuously assess the quality of the output(s) of the AI system and ensure that the operating conditions of a live AI system match the thesis under which it was originally developed",
          "processes": [
            {
              "pid": "3.14.1",
              "process": "Continuous monitoring and periodic validation should be conducted even after models have gone live. This includes:<br/>- Model performance, e.g., monitor feature drift, inference drift, accuracy against ground truth<br/>- Application performance, e.g,, latency, throughput, error rates",
              "metric": "Internal documentation of physical testing",
              "processChecks": "Documentary evidence of the conduct of continuous monitoring and periodic validation even after models have gone live.<br/><br/>This can include: <br/>-  Notifications to admins when a model/system exceeds some thresholds and the system is paused (if safe to do so) until the model can be improved. Any decisions that have been made/implemented while the AI was below a threshold should be flagged for reevaluation and potentially redress/remediation if harm occurred<br/>- Model performance (e.g.,monitor feature drift, inference drift, accuracy against ground truth)<br/>- Application performance (e.g., latency, throughput, error rates)"
            }
          ]
        }
      ]
    }
  ],
  "summaryYes": "Company has put in place measures and processes to enable it to reproduce an outcome or error. This will help Company identify and isolate causes of errors in model output and address the causes accordingly to achieve better system resilience.",
  "summaryNotYes": "Company may not be able to reproduce the same results and demonstrate consistency of the AI model’s behavior under stated conditions. Company should consider if such risk is acceptable, having considered regulatory requirements, company policies and the intended use of the AI model.",
  "recommendation": "Company should consider putting in place processes and measures such as logging capabilities to enable reproducibility of the training process of a model. It is also recommended that Company trace the consistency of the data used by the AI system through the AI lifecycle."
}