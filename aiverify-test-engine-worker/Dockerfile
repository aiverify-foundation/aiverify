FROM python:3.11
ARG TARGETARCH

# to install all stock plugins apt installs

WORKDIR /app

# copy files
COPY aiverify-test-engine-worker/ ./aiverify-test-engine-worker/
COPY aiverify-test-engine/ ./aiverify-test-engine/
COPY common/ ./common/

# install dependencies
WORKDIR /app/aiverify-test-engine-worker

RUN echo "Building on target archiecture $TARGETARCH"
RUN sh install-${TARGETARCH}.sh

ENV TEWORKER_LOG_LEVEL="debug"
ENV APIGW_URL=http://host.docker.internal:4000
ENV PYTHON=python
ENV VALKEY_HOST_ADDRESS=host.docker.internal

ENTRYPOINT ["python", "-m", "aiverify_test_engine_worker"]
