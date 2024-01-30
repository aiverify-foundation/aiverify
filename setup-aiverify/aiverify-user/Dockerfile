# Build the aiverify docker image

FROM ubuntu:22.04

###################  Install libraries ######################

ENV TZ=Asia/Singapore
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install node v18.x
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get update && apt-get install -y nodejs

# Install python 3.11, virtualenv
RUN apt-get update
RUN apt install software-properties-common -y
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get install -y python3.11 python3.11-venv

###################  Install chromium ######################

# Install Chromium (for puppeteer) separately to cater for arm64 and amd64,
# as puppeteer installs Chrome/Chromium for amd64 only
RUN apt-get install debian-archive-keyring

RUN umask 22

RUN echo 'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian stable main\n \
deb-src [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian stable main\n \
\n \
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian-security/ stable-security main\n \
deb-src [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian-security/ stable-security main\n \
\n \
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian stable-updates main\n \
deb-src [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian stable-updates main' | tee /etc/apt/sources.list.d/debian-stable.list

RUN echo 'Package: chromium*\n \
Pin: origin *.debian.org\n \
Pin-Priority: 100\n \
\n \
Package: *\n \
Pin: origin *.debian.org\n \
Pin-Priority: 1' | tee /etc/apt/preferences.d/debian-chromium

RUN apt-get update

RUN apt-get install chromium -y

RUN ln -s /usr/bin/chromium /usr/bin/chromium-browser

# For shap-toolbox stock plugin
RUN apt-get install -y gcc g++ python3.11-dev

# Install Git
RUN apt-get install -y git

RUN apt-get install unzip

################### Create aiverify user ######################

ARG USER=aiverify
RUN groupadd -g 10000 $USER
RUN useradd -u 10000 -g 10000 -ms /bin/bash $USER

###################  Clone aiverify repo ######################

ARG BRANCH_TAG=v0.10.x
RUN echo "BRANCH_TAG=$BRANCH_TAG"
WORKDIR /app
RUN git clone https://github.com/imda-btg/aiverify.git --branch=$BRANCH_TAG aiverify

WORKDIR /app/aiverify

# Create plugins, file upload and logs folders
RUN mkdir -p ./ai-verify-portal/plugins
RUN mkdir -p ./uploads/data
RUN mkdir -p ./uploads/model
RUN mkdir -p ./test-engine-app/logs

RUN chown -R 10000:10000 /app/aiverify

###################  Node ######################

# Install dependencies for shared-library
WORKDIR /app/aiverify/ai-verify-shared-library
RUN npm install && npm run build

WORKDIR /app/aiverify/ai-verify-portal

# Create env file for portal
# Change localhost of the following urls (via --build-arg) to hostname of
# the machine running aiverify if you want to access from a remote browser
ARG PORTAL_URL=http://localhost
ARG WS_URL=ws://localhost
RUN echo "PORTAL_URL=$PORTAL_URL WS_URL=$WS_URL"
RUN echo "APIGW_URL=http://localhost:4000\n\
REDIS_URI=redis://redis:6379\n\
TEST_ENGINE_URL=http://test-engine:8080" | tee .env.local
RUN rm .env.development

# Install dependencies for portal, and build portal (nextjs build)
RUN npm install
RUN npm link ../ai-verify-shared-library
RUN npm run build

# Create env file for apigw
WORKDIR /app/aiverify/ai-verify-apigw

# User entered username and password (in docker-start.sh) override these env values.
ENV DB_USERNAME="aiverify"
ENV DB_PASSWORD="aiverify"

ARG ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
RUN echo "ALLOWED_ORIGINS=${ALLOWED_ORIGINS}"
RUN echo "REDIS_HOST=redis\n\
REDIS_PORT=6379\n\
DB_HOST=db\n\
DB_PORT=27017\n\
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}\n\
WEB_REPORT_URL=http://localhost:3000/reportStatus/printview" | tee .env

# Install dependencies for apigw
# Skip Chrome/chromium install during puppeteer install, since chromium
# already installed above
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
RUN npm install
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

############## Stock plugins #################

# Unzip stock plugin bundles into the plugins folder
WORKDIR /app/aiverify/stock-plugins
RUN for plugin_dir in *; do \
      echo "Unzipping plugin $plugin_dir"; \
      unzip $plugin_dir/dist/*.zip -d ../ai-verify-portal/plugins/$plugin_dir; \
    done

RUN chown -R 10000:10000 /app/aiverify/ai-verify-portal/plugins

############### Python #################

# Install dependencies into virtualenv
WORKDIR /app/aiverify
RUN python3 -m venv venv
ENV PATH="/app/aiverify/venv/bin:$PATH"

# Install dependencies
WORKDIR /app/aiverify/test-engine-app
RUN pip install -r requirements.txt
WORKDIR /app/aiverify/test-engine-core
RUN pip install -r requirements.txt
WORKDIR /app/aiverify/test-engine-core-modules
RUN pip install -r requirements.txt
WORKDIR /app/aiverify/stock-plugins
RUN find ./ -type f -name 'requirements.txt' -exec pip install -r "{}" \;
WORKDIR /app/aiverify
RUN pip install ./test-engine-core/dist/test_engine_core-*.tar.gz

# Create env file for test-engine-app
WORKDIR /app/aiverify/test-engine-app
RUN echo 'CORE_MODULES_FOLDER="../test-engine-core-modules"\n\
VALIDATION_SCHEMAS_FOLDER="./test_engine_app/validation_schemas/"\n\
REDIS_CONSUMER_GROUP="MyGroup"\n\
REDIS_SERVER_HOSTNAME="redis"\n\
REDIS_SERVER_PORT=6379\n\
API_SERVER_PORT=8080' | tee .env

# Run containers with non-root user
USER $USER

WORKDIR /app