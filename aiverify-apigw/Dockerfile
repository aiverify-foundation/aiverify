##
## Build the python base image first with the folliowing command:
## docker buildx build -t aiverify-python-base -f aiverify-test-engine/Dockerfile --no-cache .
##
# define base python version
ARG PYTHON_VERSION=3.12

# Stage 1: Build stage
FROM aiverify-python-base AS build
ARG TARGETARCH

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# install node
RUN curl -fsSL https://deb.nodesource.com/setup_24.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# copy application files
WORKDIR /app
COPY aiverify-apigw/ ./aiverify-apigw/
COPY stock-plugins/ ./stock-plugins/
COPY aiverify-shared-library/ ./aiverify-shared-library/
RUN mkdir /data

# Build the shared library
WORKDIR /app/aiverify-shared-library
RUN npm install && npm run build

# build the application
WORKDIR /app/aiverify-apigw
RUN pip install -e . && \
    pip install "../aiverify-test-engine[all]" && \
    cd aiverify-apigw-node && \
    npm install && \
    npm install ../../aiverify-shared-library

# add library links
RUN if [ "$TARGETARCH" = "amd64" ] ; then ln -s /lib/x86_64-linux-gnu /lib/custom-linux-gnu; else ln -s /lib/aarch64-linux-gnu /lib/custom-linux-gnu; fi

# Stage 2: Runtime stage
FROM gcr.io/distroless/cc-debian12:nonroot
ARG PYTHON_VERSION

# Copy Python dependencies from deps stage
COPY --from=build /usr/local/lib/python${PYTHON_VERSION}/site-packages /usr/local/lib/python${PYTHON_VERSION}/site-packages
# Copy the Python interpreter with a specific name
COPY --from=build /usr/local/bin/python${PYTHON_VERSION} /usr/local/bin/pythonapp
# Copy Python library files including shared libraries
COPY --from=build /usr/local/lib/python${PYTHON_VERSION} /usr/local/lib/python${PYTHON_VERSION}
COPY --from=build /usr/local/lib/libpython${PYTHON_VERSION}.so* /usr/local/lib/
# Copy system libraries
COPY --from=build /lib/custom-linux-gnu/lib* /lib/custom-linux-gnu/

# Copy only the necessary files from the build stage
# WORKDIR /app
COPY --from=build --chown=nonroot:nonroot /app/ /app
COPY --from=build --chown=nonroot:nonroot /data/ /data

# COPY --from=build /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=build /usr/local/bin/python* /usr/local/bin/
COPY --from=build /usr/local/lib/python${PYTHON_VERSION}/site-packages /usr/local/lib/python${PYTHON_VERSION}/site-packages
# RUN rm -rf /usr/local/lib/python3.11

# Get NodeJS and npm
COPY --from=node:24-slim /usr/local/bin /usr/local/bin
COPY --from=node:24-slim /usr/local/lib/node_modules /usr/local/lib/

# Run the application
WORKDIR /app/aiverify-apigw

ENV APIGW_LOG_LEVEL="debug"
ENV APIGW_DATA_DIR="/data"
ENV APIGW_HOST_ADDRESS="0.0.0.0"

ENV PATH="$PATH:/usr/local/bin"
ENV PYTHONPATH=/usr/local/lib/python${PYTHON_VERSION}/site-packages
ENV LD_LIBRARY_PATH=/usr/local/lib:/lib/custom-linux-gnu:${LD_LIBRARY_PATH:-}

USER nonroot

ENTRYPOINT ["python", "-m", "aiverify_apigw"]
