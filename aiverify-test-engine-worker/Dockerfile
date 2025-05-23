# target build base image
FROM python:3.11-slim AS build
ARG TARGETARCH

# Combine all apt-get installations into a single layer with cleanup
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    git \
    gcc \
    libhdf5-dev \
    pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
# add additional system libraries as necessary

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir --no-binary h5py h5py

WORKDIR /app

COPY aiverify-test-engine/ ./aiverify-test-engine/
COPY aiverify-test-engine-worker/install-arm64.sh ./aiverify-test-engine/install-arm64.sh
COPY aiverify-test-engine-worker/install-amd64.sh ./aiverify-test-engine/install-amd64.sh
 
WORKDIR /app/aiverify-test-engine

RUN echo "Building base image on target architecture $TARGETARCH"
RUN sh install-${TARGETARCH}.sh
# RUN pip install pydantic>=2.0.0

WORKDIR /app

# copy files
COPY aiverify-test-engine-worker/ ./aiverify-test-engine-worker/
COPY common/ ./common/

# install dependencies
WORKDIR /app/aiverify-test-engine-worker

RUN pip install -e .

FROM python:3.11-slim AS base
ARG TARGETARCH

# Create a non-root user
RUN useradd -m appuser

# update the installed packages to latest versions
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from the build stage
WORKDIR /app
COPY --from=build /app/aiverify-test-engine-worker ./aiverify-test-engine-worker
COPY --from=build /app/aiverify-test-engine ./aiverify-test-engine
COPY --from=build /app/common ./common
COPY --from=build /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/

# update setuptools
RUN pip install -U pip && pip install --no-cache-dir -U setuptools>=78.1.1

# Change ownership of the application and directory
RUN chown -R appuser:appuser /app

# venv build
FROM base AS venv-build

# Switch to the non-root user
USER appuser

ENV TEWORKER_LOG_LEVEL="debug"
ENV APIGW_URL=http://host.docker.internal:4000
ENV PYTHON=python
ENV VALKEY_HOST_ADDRESS=host.docker.internal
# add additional env as necessary

ENTRYPOINT ["python", "-m", "aiverify_test_engine_worker"]


# dind build
FROM base AS docker-build

# RUN apk update && apk add --no-cache docker-cli
COPY --from=docker:dind /usr/local/bin/docker /usr/local/bin/
COPY --from=docker/buildx-bin /buildx /usr/libexec/docker/cli-plugins/docker-buildx

# Switch to the non-root user
USER appuser

ENV PIPELINE_BUILD=docker_build
ENV PIPELINE_EXECUTE=docker_run

ENTRYPOINT ["python", "-m", "aiverify_test_engine_worker"]


# kube build
FROM base AS docker-kube

COPY --from=docker:dind /usr/local/bin/docker /usr/local/bin/
COPY --from=docker/buildx-bin /buildx /usr/libexec/docker/cli-plugins/docker-buildx

# Install curl and kubectl
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    ARCH=$(dpkg --print-architecture) && \
    curl -LO "https://dl.k8s.io/release/v1.23.5/bin/linux/${ARCH}/kubectl" && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/ && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Switch to the non-root user
USER appuser
# Set necessary environment variables for Docker and Kubernetes
ENV PIPELINE_BUILD=docker_build
ENV PIPELINE_EXECUTE=kubectl_run

ENTRYPOINT ["python", "-m", "aiverify_test_engine_worker"]
