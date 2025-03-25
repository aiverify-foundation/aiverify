# for x86 builds
pip install --no-cache-dir torch==2.4.1+cpu --index-url https://download.pytorch.org/whl/cpu
# pip install --no-cache-dir .
pip install -e ../aiverify-test-engine[all]
pip install -e .
cd aiverify-apigw-node
npm install
npm link ../../aiverify-shared-library