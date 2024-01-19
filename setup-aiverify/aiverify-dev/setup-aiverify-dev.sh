#!/bin/bash

# Script to setup the aiverify developer environment

# Check if Node.js is installed
if ! which node >/dev/null 2>&1; then
  echo "Node.js is not installed. Please install nodejs, aiverify requires Node.js v18.x."
  exit 1
fi

# Check Nodejs version
node_req_ver="18"
node_cur_ver=$(node -v | cut -d'v' -f2)
node_cur_ver_maj=${node_cur_ver%.*.*}
if (( $(echo "$node_cur_ver_maj $node_req_ver" | awk '{print ($1 < $2)}'  )))
then
  echo "aiverify requires Node.js $node_req_ver.x, please install Node.js $node_req_ver.x"
  exit 1
elif (( $(echo "$node_cur_ver_maj $node_req_ver" | awk '{print ($1 != $2)}'  )))
then
  echo "aiverify is tested on Node.js $node_req_ver.x, you may encounter issues with other Node.js versions"
fi

# Check if Python3 is installed
required_py_ver="Python 3.11"
if ! which python3 &>/dev/null; then
  echo "Python3 is not installed. Please install Python3, aiverify requires $required_py_ver.x."
  exit 1
fi

# Check Python version - must be 3.11.x
py_ver=$(python3 --version 2>&1)
if [[ $py_ver != $required_py_ver* ]]; then
  echo "aiverify requires $required_py_ver.x, please install $required_py_ver.x."
  exit 1
fi

echo "This script requires sudo permission"
sudo -v

# Check machine architecture - amd64 or arm64 (M1/2)
# x86_64, i686, arm, or aarch64
machine_arch=$(uname -m)

sudo apt update

########### Chromium #############

if [[ "$machine_arch" == "aarch64" ]]; then
  echo "arm64 architecture detected"
  echo "====================== Installing Chromium ========================="
  # Install chromium for arm64 based machines, as Puppeteer installs
  # chrome/chromium which is for amd64
  sudo snap install chromium
  sudo ln -s /usr/bin/chromium /usr/bin/chromium-browser

else
  # amd64, install libs needed by puppeteer/chromium
  sudo apt install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
          libxi-dev libxtst-dev libnss3 libcups2 libxss1 libxrandr2 \
          libasound2 libatk1.0-0 libatk-bridge2.0-0 libpangocairo-1.0-0 \
          libgtk-3-0 libgbm1
fi

############ redis ############

echo "========================== Installing redis ============================="
if ! redis-server --version &>/dev/null; then
  echo "Installing redis-server"
  sudo apt install -y redis-server
else
  echo "redis already installed, skipping redis installation"
fi
pattern='notify-keyspace-events ""'
replacement='notify-keyspace-events Kh'
sudo sed -i 's/'"$pattern"'/'"$replacement"'/g' "/etc/redis/redis.conf"

sudo systemctl restart redis-server.service

############ mongodb ############

echo "========================= Installing mongodb ============================"

if mongod --version &>/dev/null; then
 while true; do
      echo
      read -p "Mongodb detected, have you created the db and user required by aiverify? [y/n] " yn
      case $yn in
          [Yy]* ) read -p "Enter DB AIVerify Username: " DB_USERNAME
                  read -p "Enter DB AIVerify Password: " DB_PASSWORD
                  echo
                  break;;
          [Nn]* ) echo "aiverify developer setup aborted, please create the required db and user as instructed in the developer guide";
                  exit;;
          * ) echo "Please answer yes or no.";;
      esac
  done
else
  echo "Installing mongodb..."
  wget -nc https://www.mongodb.org/static/pgp/server-6.0.asc
  cat server-6.0.asc | gpg --dearmor | sudo tee /etc/apt/keyrings/mongodb.gpg >/dev/null
  sudo sh -c 'echo "deb [ arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" >> /etc/apt/sources.list.d/mongo.list'
  sudo apt update
  sudo apt install -y mongodb-org
  source ./db-creds.sh

  sudo systemctl start mongod
  sleep 2
  read -p "Enter new DB Admin User: " DB_ADMIN_USER
  read -p "Enter new DB Admin Password: " DB_ADMIN_PASSWORD
  echo
  read -p "Enter new DB AIVerify Username: " DB_USERNAME
  read -p "Enter new DB AIVerify Password: " DB_PASSWORD
  echo
  mongosh << EOF
  admin = db.getSiblingDB('admin')
  admin.createUser({
    user: DB_ADMIN_USER,
    pwd: DB_ADMIN_PASSWORD,
    roles: [{ role: 'root', db: 'admin' }],
  });

  aiverify = db.getSiblingDB('aiverify')

  aiverify.createUser({
    user: DB_USERNAME,
    pwd: DB_PASSWORD,
    roles: [{ role: 'readWrite', db: 'aiverify' }],
  });

  aiverify.createCollection('test-collection');
EOF
fi

# For shap-toolbox plugin
sudo apt install -y gcc g++ python3.11-dev

echo "====================== Cloning aiverify repo ========================="

sudo apt install -y git
sudo apt install unzip

sudo apt install -y python3.11-venv

git clone https://github.com/imda-btg/aiverify.git --branch=v0.10.x
cd aiverify

############ Node ############

echo "===================== Installing node dependencies ====================="

# Install dependencies - shared-library
cd ai-verify-shared-library
npm install
npm run build
cd ..

# Install dependencies - apigw
cd ai-verify-apigw
cp .env.development .env
echo "" >> .env
echo "DB_USERNAME=${DB_USERNAME}" >> .env
echo "DB_PASSWORD=${DB_PASSWORD}" >> .env
if [[ "$machine_arch" == "aarch64" ]]; then
  # Skip chrome install, which is only available for amd64
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 npm install
else
  npm install
fi
cd ..

# Install dependencies - portal
cd ai-verify-portal
cp .env.development .env.local
npm install
sudo npm link ../ai-verify-shared-library
npm run build
cd ..

echo "===================== Installing stock plugins ====================="

# Unzip stock plugin bundles into the plugins folder
cd stock-plugins
for plugin_dir in *; do \
  echo "Unpacking stock plugin $plugin_dir"; \
  unzip -o $plugin_dir/dist/*.zip -d ../ai-verify-portal/plugins/$plugin_dir; \
done
cd ..

############ Python ############

echo "====================== Installing py dependencies ======================"
echo "Enabling virtualenv venv"
python3 -m venv venv
source venv/bin/activate

cd test-engine-app
pip install -r requirements.txt
cd ../test-engine-core
pip install -r requirements.txt
cd ../test-engine-core-modules
pip install -r requirements.txt
cd ../stock-plugins
find ./ -type f -name 'requirements.txt' -exec pip install -r "{}" \;
cd ..
pip install ./test-engine-core/dist/test_engine_core-*.tar.gz

wdir=$(pwd)
cd test-engine-app
echo "CORE_MODULES_FOLDER=\"$wdir/test-engine-core-modules\"
VALIDATION_SCHEMAS_FOLDER=\"$wdir/test-engine-app/test_engine_app/validation_schemas/\"
REDIS_CONSUMER_GROUP=\"MyGroup\"
REDIS_SERVER_HOSTNAME=\"localhost\"
REDIS_SERVER_PORT=6379
API_SERVER_PORT=8080" > .env
cd ..

echo "====================== Creating aiverify services ======================="

echo "[Unit]
Description=test-engine-app
After=network.target redis-server.service
Requires=redis-server.service

[Service]
User=$USER
WorkingDirectory=$(pwd)/test-engine-app
ExecStart=/usr/bin/bash -c 'source ../venv/bin/activate && python3 -m test_engine_app'

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/test-engine-app.service

echo "[Unit]
Description=ai-verify-apigw
After=network.target mongod.service test-engine-app.service
Requires=mongod.service test-engine-app.service

[Service]
User=$USER
WorkingDirectory=$(pwd)/ai-verify-apigw
ExecStart=/usr/bin/node app.mjs

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/ai-verify-apigw.service

echo "[Unit]
Description=ai-verify-portal
After=network.target ai-verify-apigw.service
Requires=ai-verify-apigw.service

[Service]
User=$USER
WorkingDirectory=$(pwd)/ai-verify-portal
ExecStart=/usr/bin/npm run start

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/ai-verify-portal.service

echo
echo "aiverify developer environment setup completed"
echo
