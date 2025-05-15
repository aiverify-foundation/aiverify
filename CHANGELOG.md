# Changelog
The purpose of this changelog is to document all notable changes made to the AI Verify project. This includes new features, bug fixes, and any other modifications that impact the functionality, performance, or usability of the toolkit. By maintaining a detailed changelog, we aim to provide transparency and keep users and contributors informed about the evolution of the project.

# 2.0.0 - 2025-04-17

### Added
- Test Engine Worker for automated test runs from Portal
- Deployment scripts for docker compose and kubernetes
- Add pytorch support in aiverify-test-engine
- Complete portal and apigw development

## 2.0.0a2 - 2025-02-03

### Added
- Add Veritas Plugin
- Add new model type "uplift"
- Increase name and description lengths in the json schemas.
- API-GW new modules: plugin, test model, test dataset, input block, project, project template
- add new input block meta attribute groupNumber.

## 2.0.0a1 - 2024-09-30

### Added
- Introduced a new architecture for improved performance and scalability.
- Refactored and merged `test-engine-core` and `test-engine-code-modules` into a base library called `aiverify-test-engine`.
- Refactored all stock algorithms as standalone Python modules.
- Added command-line script to call the algorithms.
- Added Dockerfile for all stock algorithm projects.
- Introduced `aiverify-apigw` with new APIs.
- Implemented SQLite as the database engine for `aiverify-apigw`.
