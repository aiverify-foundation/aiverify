FROM python:3.11
ARG TARGETARCH

WORKDIR /app

# copy files
COPY aiverify-apigw/ ./aiverify-apigw/
COPY aiverify-test-engine/ ./aiverify-test-engine/
COPY common/ ./common/
COPY stock-plugins/ ./stock-plugins/

# install node
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs
RUN echo "Installed Node"
RUN node -v

# install dependencies
WORKDIR /app/aiverify-apigw

#RUN pip install --no-cache-dir torch==2.4.1+cpu --index-url https://download.pytorch.org/whl/cpu
#RUN pip install .
RUN echo "Building on target archiecture $TARGETARCH"
RUN sh install-${TARGETARCH}.sh

ENV APIGW_LOG_LEVEL="debug"
ENV APIGW_DATA_DIR="/data"
ENV APIGW_HOST_ADDRESS="0.0.0.0"

ENTRYPOINT ["python", "-m", "aiverify_apigw"]
