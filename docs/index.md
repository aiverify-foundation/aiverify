# Introduction

## Overview

The AI Verify Toolkit is an open-source, extensible toolkit that validates the performance of AI systems. This aligns with best practices from NIST and OECD. The framework consists of 11 AI ethics principles and corresponding testable criteria and testing processes. It has more than 8 different technical tests to assess a model’s fairness, explainability and robustness. It is built for Data Science and Compliance Users to execute algorithms via the CLI and upload the results to the portal, where they can be integrated with process checklists and used for report generation.

## What is new in AIVT 2.0?

- Veritas integration - Fairness and transparency tests that helps assess tradeoff across thresholds with additional explainability plots.
- Improved Computer Vision support – AIVT 2.0 supports custom PyTorch pipelines, and a new improved image corruption toolbox built on the albumentations library.
- Improved Portal UI/UX – Intuitive and streamlined user interface.

## What can AIVT 2.0 do?

The toolkit can used flexibly to generate report including creating and filling process checklists, running technical tests via CLI or UI (Portal). The generated results can be used across reports, which can either use a standard reporting template or a customized report.

To help companies align their reports with the AI Verify Testing Framework, the toolkit also comes with a set of report templates, which pre-defines the report layout, technical tests and process checks needed.

To prepare the report using AIVT, you will need ML/AI model ([single file or a preprocessing pipeline or model API](./appendix/standalone-vs-pipeline.md)), dataset, user input (process checklists). You run the test through Portal or via command line and use the reporting modules to generate reports.  To extend the suite of existing testing functionalities, you can [install plugins]() built by the AI Verify Foundation or third parties.

For a more detailed breakdown of features, check out [AIVT2.0 Features](./introduction/AIVT 2.0 features.md).

To get started with the tool, refer to [Getting started](./getting-started.md).