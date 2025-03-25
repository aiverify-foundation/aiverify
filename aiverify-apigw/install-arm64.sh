# for macos builds
pip install -e ../aiverify-test-engine[all]
pip install -e .
cd aiverify-apigw-node
npm install
npm link ../../aiverify-shared-library