#!/bin/bash

PROJECT_DIR="/app/aiverify"

# start all processes
cd $PROJECT_DIR/ai-verify-apigw
#npm run dev &
nodemon app.js &

cd $PROJECT_DIR/test-engine-app
python -m test_engine_app &

cd $PROJECT_DIR/ai-verify-portal
npm run dev &

sleep infinity