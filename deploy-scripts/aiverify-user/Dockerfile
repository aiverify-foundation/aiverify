# Build the ai-verify combined docker image

###########################################################
# Build stage for Node repos
###########################################################
FROM ubuntu:22.04 AS final

ARG USER=appuser
ARG UID
ARG GID

# Install node v19.x
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_19.x | bash -
RUN apt-get update && apt-get install -y nodejs

# Install python 3.10

RUN apt update
RUN apt install -y python3.10
RUN python3 --version

# Install virtualenv
RUN apt install -y python3.10-venv

# Install Chromium

RUN apt install debian-archive-keyring

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

RUN apt update

RUN apt install chromium -y

RUN ln -s /usr/bin/chromium /usr/bin/chromium-browser

# Install libs needed by puppeter/chromium
#RUN apt install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
#        libxi-dev libxtst-dev libnss3 libcups2 libxss1 libxrandr2 \
#        libasound2 libatk1.0-0 libatk-bridge2.0-0 libpangocairo-1.0-0 \
#        libgtk-3-0 libgbm1

# For shap-toolbox plugin
RUN apt install -y gcc g++ python3-dev

RUN groupadd -g $GID $USER || true

RUN useradd -u $UID -g $GID -ms /bin/bash $USER

# Install Git
RUN apt update && apt install -y git

RUN apt-get install unzip

ARG ACCESS_TOKEN

# Clone aiverify monorepo
WORKDIR /app
RUN git clone https://github.com/imda-btg/aiverify.git --branch=v0.9.x

WORKDIR /app/aiverify

RUN mkdir -p ai-verify-portal/plugins

## Widget files have to go into portal plugins folder before nextjs build
## Widget files are unzipped into subfolder whose name must match its plugin gid

RUN unzip stock-plugins/aiverify.stock.decorators/dist/*.zip -d ./ai-verify-portal/plugins/aiverify.stock.decorators
RUN unzip stock-plugins/aiverify.stock.process-checklist/dist/*.zip -d ./ai-verify-portal/plugins/aiverify.stock.process-checklist
RUN unzip stock-plugins/aiverify.stock.reports/dist/*.zip -d ./ai-verify-portal/plugins/aiverify.stock.reports

# Install dependencies for shared-library
WORKDIR /app/aiverify/ai-verify-shared-library
RUN npm install && npm run build

WORKDIR /app/aiverify/ai-verify-portal
RUN echo 'NEXT_PUBLIC_SERVER_URL=http://localhost:3000\n \
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:4000/graphql\n \
SERVER_URL=http://localhost:3000\n \
WEBSOCKET_URL=ws://localhost:4000/graphql\n \
APIGW_URL=http://localhost:4000\n \
MONGODB_URI=mongodb://aiverify:aiverify@db:27017/aiverify\n \
REDIS_URI=redis://redis:6379' | tee .env.local
RUN rm .env.development

# Install dependencies for portal
RUN npm install
RUN npm link ../ai-verify-shared-library

# run portal build in the final stage with all the stock plugins copied to plugins folder.
#RUN npm run build

# Install dependencies for apigw
WORKDIR /app/aiverify/ai-verify-apigw
RUN echo 'MONGODB_URI=mongodb://aiverify:aiverify@db:27017/aiverify\n \
DB_URI=mongodb://aiverify:aiverify@db:27017/aiverify\n \
REDIS_HOST=redis\n \
REDIS_PORT=6379\n \
WEB_REPORT_URL=http://localhost:3000/reportStatus/printview' | tee .env
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
RUN npm install
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

############### Python #################

# Install dependencies into virtualenv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app/aiverify
RUN find ./ -type f -name 'requirements.txt' -exec pip install -r "{}" \;

RUN pip install ./test-engine-core/dist/test_engine_core-*.tar.gz

# Create env file for test-engine-app
WORKDIR /app/aiverify/test-engine-app
RUN echo 'CORE_MODULES_FOLDER="../test-engine-core-modules"\n \
VALIDATION_SCHEMAS_FOLDER="./test_engine_app/validation_schemas/"\n \
REDIS_CONSUMER_GROUP="MyGroup"\n \
REDIS_SERVER_HOSTNAME="redis"\n \
REDIS_SERVER_PORT=6379\n \
API_SERVER_PORT=8080' | tee .env
WORKDIR /app/aiverify
RUN unzip ./stock-plugins/aiverify.stock.accumulated-local-effect/dist/*.zip -d ./ai-verify-portal/plugins/accumulated-local-effect
RUN unzip ./stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/dist/*.zip -d ./ai-verify-portal/plugins/fairness-metrics-toolbox-for-classification
RUN unzip ./stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-regression/dist/*.zip -d ./ai-verify-portal/plugins/fairness-metrics-toolbox-for-regression
RUN unzip ./stock-plugins/aiverify.stock.image-corruption-toolbox/dist/*.zip -d ./ai-verify-portal/plugins/image-corruption-toolbox
RUN unzip ./stock-plugins/aiverify.stock.partial-dependence-plot/dist/*.zip -d ./ai-verify-portal/plugins/partial-dependence-plot
RUN unzip ./stock-plugins/aiverify.stock.robustness-toolbox/dist/*.zip -d ./ai-verify-portal/plugins/robustness-toolbox
RUN unzip ./stock-plugins/aiverify.stock.shap-toolbox/dist/*.zip -d ./ai-verify-portal/plugins/shap-toolbox

# Build portal (nextjs build)
WORKDIR /app/aiverify/ai-verify-portal
RUN npm run build

RUN chown -R $UID:$GID /app/aiverify

USER $USER

# Install puppeteer again to ensure needed modules go into the user's cache dir
WORKDIR /app/aiverify/ai-verify-apigw

#RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 npm install puppeteer
#RUN npm install puppeteer

WORKDIR /app
