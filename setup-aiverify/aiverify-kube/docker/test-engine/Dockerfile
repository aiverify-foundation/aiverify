# Build the aiverify-test-engine docker image

FROM ubuntu:22.04

###################  Install libraries ######################

ENV TZ=Asia/Singapore
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update

# Install git
RUN apt-get install -y git

# Install unzip
RUN apt-get install unzip

# Install python 3.11, virtualenv
RUN apt install software-properties-common -y
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update
RUN apt-get install -y python3.11 python3.11-venv

# For shap-toolbox stock plugin
RUN apt-get install -y gcc g++ python3.11-dev

# Install libmagicwand for Environment Corruption
RUN apt-get install libmagickwand-dev -y

# Set python3.11 as default python3
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 2
RUN update-alternatives --set python3 /usr/bin/python3.11

################### Create aiverify user ######################

ARG USER=aiverify
RUN groupadd -g 1000 $USER
RUN useradd -u 1000 -g 1000 -ms /bin/bash $USER

###################  Clone aiverify repo ######################

ARG BRANCH_TAG=main
ARG REPO=imda-btg/aiverify
RUN echo "BRANCH_TAG=$BRANCH_TAG"
WORKDIR /app
RUN git clone https://github.com/$REPO --branch=$BRANCH_TAG aiverify

############### Python #################

# Create file upload and logs folders
WORKDIR /app/aiverify
RUN mkdir -p ./uploads/data
RUN mkdir -p ./uploads/model
RUN mkdir -p ./test-engine-app/logs

RUN chown -R 1000:1000 /app/aiverify

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

############## Stock plugins #################
# Unzip stock plugin bundles into the plugins folder
WORKDIR /app/aiverify/stock-plugins
RUN mkdir ../stock-plugins-unzip
RUN for plugin_dir in *; do \
      echo "Unzipping plugin $plugin_dir"; \
      unzip $plugin_dir/dist/*.zip -d ../stock-plugins-unzip/$plugin_dir; \
    done
RUN chown -R 1000:1000 ../stock-plugins-unzip

WORKDIR /app/aiverify/stock-plugins-unzip
RUN find ./ -type f -name 'requirements.txt' -exec pip install -r "{}" \;

WORKDIR /app/aiverify
RUN rm -rf stock-plugins
RUN mv stock-plugins-unzip stock-plugins

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

# Clean up
WORKDIR /app/aiverify
RUN rm -rf ai-verify-portal && rm -rf ai-verify-apigw && rm -rf ai-verify-shared-library
RUN rm -rf third-party && rm -rf setup-aiverify && rm -rf examples && rm -rf scripts && rm -rf deploy-scripts
RUN apt-get remove git unzip -y

# Create plugins folder
RUN mkdir -p ./ai-verify-portal/plugins
RUN chown -R 1000:1000 ./ai-verify-portal

# Run containers with non-root user
USER $USER

WORKDIR /app
