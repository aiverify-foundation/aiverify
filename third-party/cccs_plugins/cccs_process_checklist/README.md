# Project for my_plugin plugin

For more information on AI Verify plugin developer, please refer to the [Developer Documentation](https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-developers-documentation/-/tree/master/docs).

## Push project to GIT repo
1. Create a new blank GIT project.
2. Run the following commands to push the project to the GIT repo.

```
cd existing_folder
git init
git checkout -b "main"
git remote add origin <repo-url>
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Create zip file for Plugin installation
Install the [ai-verify-plugin](https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-portal/ai-verify-plugin) tool.

```
ai-verify-plugin zip --pluginPath=<path to plugin directory>
```
