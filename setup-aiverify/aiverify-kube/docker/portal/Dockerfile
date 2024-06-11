# Build the aiverify-portal docker image

FROM ubuntu:22.04

###################  Install libraries ######################

ENV TZ=Asia/Singapore
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install node v18.x
RUN apt-get update
RUN apt-get install -y curl ca-certificates gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
ENV NODE_MAJOR=18
RUN "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update && apt-get install -y nodejs

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

# Install npm
RUN apt-get install npm -y

# Install git
RUN apt-get install -y git

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

# Create plugins, file upload and logs folders
WORKDIR /app/aiverify
RUN mkdir -p ./ai-verify-portal/plugins
RUN mkdir -p ./uploads/data
RUN mkdir -p ./uploads/model

RUN chown -R 1000:1000 /app/aiverify

###################  Node ######################

# Install dependencies for shared-library
WORKDIR /app/aiverify/ai-verify-shared-library
RUN npm install && npm run build

WORKDIR /app/aiverify/ai-verify-portal

# Create env file for portal
RUN echo "APIGW_URL=http://localhost:4000\n\
REDIS_URI=redis://redis:6379\n\
TEST_ENGINE_URL=http://test-engine:8080" | tee .env.local
RUN rm .env.development

# Install dependencies for portal, and build portal (nextjs build)
RUN npm install --omit=dev
RUN npm link ../ai-verify-shared-library
RUN npm run build

# Create env file for apigw
WORKDIR /app/aiverify/ai-verify-apigw

# User entered username and password (in docker-start.sh) override these env values.
ENV DB_USERNAME="aiverify"
ENV DB_PASSWORD="t1oj5L_xQI8dTrVuZ"

ENV ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
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
ENV PUPPETEER_SKIP_DOWNLOAD 1
RUN npm install --omit=dev
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

WORKDIR /app/aiverify
RUN rm -rf test-engine-app && rm -rf test-engine-core && rm -rf test-engine-core-modules
RUN rm -rf stock-plugins && rm -rf third-party && rm -rf setup-aiverify && rm -rf examples && rm -rf scripts && rm -rf deploy-scripts
RUN apt-get remove git -y

# Create test-engine log folder
RUN mkdir -p ./test-engine-app/logs
RUN chown -R 1000:1000 ./test-engine-app

# Nextjs cache.
RUN chown 1000:1000 ./ai-verify-portal/.next/cache

# Run containers with non-root user
USER $USER

WORKDIR /app
