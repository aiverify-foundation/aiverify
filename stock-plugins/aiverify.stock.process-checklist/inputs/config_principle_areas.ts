export const areaConfigs = [
  {
    id: "transparency",
    area: "Transparency on the Use of AI and AI Systems",
    short_description: "Ensuring that individuals are aware and can make informed decisions",
    principles: [
      {
        principle: "Transparency",
        name: "Transparency",
        short_description: "Appropriate info is provided to individuals impacted by AI system",
        short_description2: "Ability to provide responsible disclosure to those affected by AI systems to understand the outcome",
        description: "<b>Transparency</b> provides visibility to the intended use and impact of the AI system. It complements existing privacy and data governance measures. Integrating transparency into the AI lifecycle helps ameliorate the problems caused by opaqueness. The testable criteria focuses on ensuring communication mechanisms are in place to enable those affected by AI systems to understand how their data is collected and used, as well as the intended use and limitations of the AI system. This should be done in a manner appropriate to the use case at hand and accessible to the audience.",
        cid: "transparency_process_checklist",
      },
    ] 
  },
  {
    id: "understanding",
    area: "Understanding How AI Models Reach Decision",
    short_description: "Ensuring AI operation/results are explainable, accurate and consistent",
    principles: [
      {
        principle: "Explainability",
        name: "Explainability",
        short_description: "Understand and interpret what the AI system is doing",
        short_description2: "Ability to assess the factors that led to the AI system’s decision, its overall behaviour, outcomes, and implications",
        description: "<b>Explainability</b> is about ensuring AI-driven decisions can be explained and understood by those directly using the system to enable or carry out a decision to the extent possible. The degree to which explainability is needed also depends on the aims of the explanation, including the context, the needs of stakeholders, types of understanding sought, mode of explanation, as well as the severity of the consequences of erroneous or inaccurate output on human beings. Explainability is an important component of a transparent AI system. The testable criteria in this section focus on system-enabled explainability. However, it may not be possible to provide an explanation for how a black box model generated a particular output or decision (and what combination of input factors contributed to that). In these circumstances, other explainability measures may be required (e.g., accountability and transparent communication). As state-of-the-art approaches to explainability become available, users should refine the process, metrics, and/or thresholds accordingly.",
        hasTechnicalTests: true,
        cid: "explainability_process_checklist",
      },
      {
        principle: "Reproducibility",
        name: "Repeatability / Reproducibility",
        short_description: "AI results are consistent: Be able to replicate an AI system’s results by owner / 3rd-party.",
        short_description2: "The ability of a system to consistently perform its required functions under stated conditions for a specific period of time, and for an independent party to produce the same results given similar inputs",
        description: "<b>Reproducibility</b> is a crucial requirement for achieving system resilience. With software systems, the ability to reproduce an outcome or error is key to identifying and isolating the root cause. The testable criteria in this section focus on logging capabilities to monitor the AI system, tracking the journey of a data input through the AI lifecycle, and reviewing the input and output of the AI system.",
        cid: "reproducibility_process_checklist",
      },
    ] 
  },
  {
    id: "safety_resilence",
    area: "Safety & Resilience of AI system",
    short_description: "Ensuring AI system is reliable and will not cause harm",
    principles: [
      {
        principle: "Safety",
        name: "Safety",
        short_description: "AI system safe: Conduct impact / risk assessment; Known risks have been identified/mitigated",
        short_description2: "AI should not result in harm to humans (particularly physical harm), and measures should be put in place to mitigate harm",
        description: "<b>Safety</b> is about ensuring AI systems do not cause any harm, especially physical harm. All systems will have some level of residual risk and must be developed with a preventative approach to risks that are not tolerable. Safety is achieved by reducing risks to a tolerable level. Usually, the higher the perceived risks of a system causing harm, the higher the demands on risk mitigation. The testable criteria section in this section adopt a risk-based approach to assess the appropriate level of tolerable risk, as well as identify and mitigate potential harm throughout the AI lifecycle.",
        cid: "safety_process_checklist",
      },
      {
        principle: "Security",
        name: "Security",
        short_description: "AI system is protected from unauthorised access, disclosure, modification, destruction, or disruption",
        short_description2: "AI security is the protection of AI systems, their data, and the associated infrastructure from unauthorised access, disclosure, modification, destruction, or disruption. AI systems that can maintain confidentiality, integrity, and availability through protection mechanisms that prevent unauthorized access and use may be said to be secure.",
        description: "<b>Security</b> risks related to AI systems can be common across other types of software development and deployment, e.g., concerns related to the confidentiality, integrity, and availability of the system and its training and output data; and general security of the underlying software and hardware for AI systems. Security risk management considerations and approaches are applicable in the design, development, deployment, evaluation, and use of AI systems. Security also encompasses protocols to avoid, protect against, respond to, or recover from attacks. Organisations need to develop a risk-based approach to managing AI security. This involves identifying and assessing the risks associated with the use of AI systems and implementing appropriate security controls to mitigate those risks. Organisations should also define the roles and responsibilities of different stakeholders involved in securing AI systems, including developers, operators, and users of AI system.",
        cid: "security_process_checklist",
      },
      {
        principle: "Robustness",
        name: "Robustness",
        short_description: "AI system can still function despite unexpected inputs",
        short_description2: "AI system should be resilient against attacks and attempts at manipulation by third party malicious actors, and can still function despite unexpected input",
        description: "<b>Robustness</b> requires that AI systems maintain its level of performance under any circumstances, including potential changes in their operating environment or the presence of other agents (human or artificial) that may interact with the AI system in an adversarial manner.  The testable criteria in this section focus on the technical robustness of the AI system throughout its AI life cycle, to assess the proper operation of a system as intended by the system owner. These testable criteria should be carried out alongside established cybersecurity testing regimes for AI systems, to ensure overall system robustness.",
        hasTechnicalTests: true,
        cid: "robustness_process_checklist",
      },
    ] 
  },
  {
    id: "fairness",
    area: "Fairness / No Unintended Discrimination",
    short_description: "Ensuring that use of AI does not unintentionally discriminate",
    principles: [
      {
        principle: "Fairness",
        name: "Fairness",
        short_description: "No unintended bias: AI system makes same decision even if an attribute is changed; Data used to train model is representative",
        short_description2: "AI should not result in unintended and inappropriate discrimination against individuals or groups",
        description: "<b>Fairness</b> is about designing AI systems that avoid creating or reinforcing unfair bias in the AI system, based on the intended definition of fairness for individuals or groups, that is aligned with the desired outcomes of the AI system. The testable criteria focus on testing the ability of the AI system to align with the intended fairness outcomes, throughout the AI lifecycle.",
        hasTechnicalTests: true,
        cid: "fairness_process_checklist",
      },
      {
        principle: "Data Governance",
        name: "Data Governance",
        short_description: "Good governance practices throughout data lifecycle",
        short_description2: "Governing data used in AI systems, including putting in place good governance practices for data quality, lineage, and compliance",
        description: "<b>Data Governance</b> ensures that data is properly managed over time throughout the enterprise, including establishing authority, management, and decision-making parameters related to the data used in AI systems.",
        cid: "data_governance_process_checklist",
      },
    ] 
  },
  {
    id: "management",
    area: "Management and Oversight of AI system",
    short_description: "Ensuring human accountability and control",
    principles: [
      {
        principle: "Accountability",
        name: "Accountability",
        short_description: "Proper management oversight of AI system development",
        short_description2: "AI systems should have organisational structures and actors accountable for the proper functioning of AI systems",
        description: "<b>Accountability</b> is about having clear internal governance mechanisms for proper management oversight of the AI system’s development and deployment.",
        cid: "accountability_process_checklist",
      },
      {
        principle: "Human Agency & Oversight",
        name: "Human Agency & Oversight",
        short_description: "AI system designed in a way that will not decrease human ability to make decisions",
        short_description2: "Ability to implement appropriate oversight and control measures with humans-in-the-loop at the appropriate juncture",
        description: "AI systems can be used to support or influence humans in decision-making processes. AI systems that 'act' like humans also have an effect on human perception, expectation, and functionality. <b>Human agency and oversight</b> ensure that the human has the ability to self-assess and intervene where necessary to ensure that the AI system is used to achieve the intended goals. The human should also have the ability to improve and override the operation of the system when the AI system results in a negative outcome.",
        cid: "human_agency_oversight_process_checklist",
      },
      {
        principle: "Inclusive Growth, Societal & Environmental Well-being",
        name: "Inclusive Growth, Societal & Environmental Well-being",
        short_description: "Beneficial outcomes for people and planet",
        short_description2: "This Principle highlights the potential for trustworthy AI to contribute to overall growth and prosperity for all – individuals, society, and the planet – and advance global development objectives",
        description: "Stakeholders should proactively engage in responsible stewardship of trustworthy AI in pursuit of beneficial outcomes for people and the planet, such as augmenting human capabilities and enhancing creativity, advancing inclusion of underrepresented populations, reducing economic, social, gender, and other inequalities, and protecting natural environments, thus invigorating <b>inclusive growth, sustainable development, and well-being</b>.",
        cid: "inclusive_growth_process_checklist",
      },
    ] 
  },
  {
    id: "others",
    area: "others",
    principles: [
      {
        principle: "Organisational Considerations",
        name: "Organisational Considerations",
        cid: "organisational_considerations_process_checklist",
        short_description: "Beyond assessment of individual AI systems, there are broader organisational considerations when deciding AI deployment. These include issues such as the use of AI (verses non-AI options), norms and expectations as well as resources to manage the use of AI",
      },
    ]
  }
].map((config: any, index) => {
  config.index = index;
  return config;
})

export const areaByID = areaConfigs.reduce((acc, config) => {
  acc[config.id] = config;
  return acc;
}, {})

export const areaByName = areaConfigs.reduce((acc, config) => {
  acc[config.area] = config;
  return acc;
}, {})

export const principleConfigMap = areaConfigs.reduce((acc, config) => {
  for (let principle of config.principles) {
    acc[principle.principle] = {
      principle,
      areaId: config.id,
    };
  }
  return acc;
}, {})


export const getPrincipleConfig = (principle) => {
  return principleConfigMap[principle];
}
