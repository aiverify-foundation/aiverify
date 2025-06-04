##
## Build the python base image first with the folliowing command:
## docker buildx build -t aiverify-python-base -f aiverify-test-engine/Dockerfile --no-cache .
##
## Base worker buid
#
FROM ghcr.io/aiverify-foundation/aiverify-python-base AS base
ARG TARGETARCH
ARG APT_WORKER_PACKAGES_TO_INSTALL="gcc g++ pkg-config"

ENV PATH=/usr/local/bin:$PATH
ENV CMAKE_PREFIX_PATH=/usr/local/

# Create a non-root user
RUN useradd -m appuser

# Copy only the necessary files from the build stage
WORKDIR /app
COPY aiverify-test-engine-worker ./aiverify-test-engine-worker
# COPY --from=build /app/aiverify-test-engine ./aiverify-test-engine
# COPY --from=build /app/common ./common
# COPY --from=build /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/

# need to install in both base and build stages as test-engine-worker needs to build the algorithms
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends ${APT_WORKER_PACKAGES_TO_INSTALL} && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# # install aiverify-test-engine-worker
WORKDIR /app/aiverify-test-engine-worker
RUN pip install cmake && pip install -e .

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
