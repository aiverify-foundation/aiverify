# target base image
FROM python:3.11 as aiverify-test-engine-worker-base
ARG TARGETARCH

# Combine all apt-get installations into a single layer with cleanup
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    git \
    gcc \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libmagickwand-dev \
    libhdf5-dev \
    pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir --no-binary h5py h5py

WORKDIR /app

COPY aiverify-test-engine/ ./aiverify-test-engine/
COPY aiverify-test-engine-worker/install-arm64.sh ./aiverify-test-engine/install-arm64.sh
COPY aiverify-test-engine-worker/install-amd64.sh ./aiverify-test-engine/install-amd64.sh
 

WORKDIR /app/aiverify-test-engine

RUN echo "Building base image on target archiecture $TARGETARCH"
RUN sh install-${TARGETARCH}.sh
# RUN pip install pydantic>=2.0.0

# target venv-build
FROM aiverify-test-engine-worker-base as venv-build

WORKDIR /app

# copy files
COPY aiverify-test-engine-worker/ ./aiverify-test-engine-worker/
COPY common/ ./common/

# install dependencies
WORKDIR /app/aiverify-test-engine-worker

RUN pip install -e .

ENV TEWORKER_LOG_LEVEL="debug"
ENV APIGW_URL=http://host.docker.internal:4000
ENV PYTHON=python
ENV VALKEY_HOST_ADDRESS=host.docker.internal

ENTRYPOINT ["python", "-m", "aiverify_test_engine_worker"]
