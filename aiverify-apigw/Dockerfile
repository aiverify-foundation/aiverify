# Stage 1: Build stage
FROM python:3.11-slim AS build
ARG TARGETARCH

# Combine all apt-get installations into a single layer with cleanup
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    git \
    gcc \
    libhdf5-dev \
    pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# install node
RUN curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# copy application files
WORKDIR /app
COPY aiverify-apigw/ ./aiverify-apigw/
COPY aiverify-test-engine/ ./aiverify-test-engine/
COPY common/ ./common/
COPY stock-plugins/ ./stock-plugins/
COPY aiverify-shared-library/ ./aiverify-shared-library/

# Build the shared library
WORKDIR /app/aiverify-shared-library
RUN npm install && npm run build

# build the application
WORKDIR /app/aiverify-apigw
RUN sh install-${TARGETARCH}.sh

# Stage 2: Runtime stage
FROM python:3.11-slim
ARG TARGETARCH

# Create a non-root user
RUN useradd -m appuser

# RUN pip install -U setuptools>=78.1.1  

# update the installed packages to latest versions
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from the build stage
WORKDIR /app
COPY --from=build /app/aiverify-apigw ./aiverify-apigw
COPY --from=build /app/aiverify-test-engine ./aiverify-test-engine
COPY --from=build /app/common ./common
COPY --from=build /app/stock-plugins ./stock-plugins
COPY --from=build /app/aiverify-shared-library/dist ./aiverify-shared-library/dist
COPY --from=build /app/aiverify-shared-library/package.json ./aiverify-shared-library/package.json
COPY --from=build /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/

# Get NodeJS and npm
COPY --from=node:23-slim /usr/local/bin /usr/local/bin
COPY --from=node:23-slim /usr/local/lib/node_modules /usr/local/lib/node_modules

# update setuptools
RUN pip install -U pip && pip install --no-cache-dir -U setuptools>=78.1.1

# link to shared library
WORKDIR /app/aiverify-apigw/aiverify-apigw-node
RUN npm link ../../aiverify-shared-library

# Change ownership of the application and directory
RUN mkdir /data && chown -R appuser:appuser /data && chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Run the application
WORKDIR /app/aiverify-apigw

# Link to aiverify-test-engine
RUN pip install -e ../aiverify-test-engine[all]

ENV APIGW_LOG_LEVEL="debug"
ENV APIGW_DATA_DIR="/data"
ENV APIGW_HOST_ADDRESS="0.0.0.0"

ENTRYPOINT ["python", "-m", "aiverify_apigw"]
