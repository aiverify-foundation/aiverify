#!/bin/bash

PROJECT_DIR="/app/aiverify"
ENTRYPOINT_DIR="/docker-entrypoint/"

##########################
# install all dependencies
##########################

# install api gateway
echo "Installing ai-verify-apigw"
cd $PROJECT_DIR/ai-verify-apigw
npm install

# add hot reloading dependency for api gateway
npm install -g nodemon

# install shared library
echo "Installing ai-verify-shared-library"
cd $PROJECT_DIR/ai-verify-shared-library
npm install && npm run build

# install portal
echo "Installing ai-verify-portal"
cd $PROJECT_DIR/ai-verify-portal
npm install
npm link ../ai-verify-shared-library
npm run build

# install test engine
cd $PROJECT_DIR/
pip install --no-cache-dir -r test-engine-app/requirements.txt -r test-engine-core/requirements.txt -r test-engine-core-modules/requirements.txt

# extract plugins
find $PROJECT_DIR/stock-plugins/ -mindepth 1 -maxdepth 1 -type d | xargs -I{} basename {} | xargs -I{} unzip $PROJECT_DIR/stock-plugins/{}/dist/*.zip -d $PROJECT_DIR/ai-verify-portal/plugins/{}

# install plugins dependencies
find $PROJECT_DIR/stock-plugins/ -type f -name 'requirements.txt' -exec pip install -r "{}" \;
