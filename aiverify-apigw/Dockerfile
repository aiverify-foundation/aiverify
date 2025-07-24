##
## Build the python base image first with the folliowing command:
## docker buildx build -t aiverify-python-base -f aiverify-test-engine/Dockerfile --no-cache .
##

# Stage 1: Build stage
FROM aiverify-python-base AS build

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

# Build the shared library
WORKDIR /app/aiverify-shared-library
RUN npm install && npm run build

# link to shared library
# WORKDIR /app/aiverify-apigw/aiverify-apigw-node
# RUN npm install ../../aiverify-shared-library

# build the application
WORKDIR /app/aiverify-apigw
RUN pip install -e . && \
    pip install "../aiverify-test-engine[all]" && \
    cd aiverify-apigw-node && \
    npm install && \
    npm install ../../aiverify-shared-library

# Stage 2: Runtime stage
FROM aiverify-python-base

# Create a non-root user
RUN useradd -m appuser

# update the installed packages to latest versions
# RUN apt-get update && \
#     apt-get upgrade -y && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from the build stage
WORKDIR /app
# COPY --from=build /app .
# COPY --from=build /app/aiverify-test-engine ./aiverify-test-engine
# COPY --from=build /app/common ./common
COPY --from=build /app/aiverify-apigw ./aiverify-apigw
COPY --from=build /app/stock-plugins ./stock-plugins
COPY --from=build /app/aiverify-shared-library/dist ./aiverify-shared-library/dist
COPY --from=build /app/aiverify-shared-library/package.json ./aiverify-shared-library/package.json

COPY --from=build /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/

# Get NodeJS and npm
COPY --from=node:24-slim /usr/local/bin /usr/local/bin
COPY --from=node:24-slim /usr/local/lib/node_modules /usr/local/lib/

# Change ownership of the application and directory
RUN mkdir /data && chown -R appuser:appuser /data && chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Run the application
WORKDIR /app/aiverify-apigw

ENV APIGW_LOG_LEVEL="debug"
ENV APIGW_DATA_DIR="/data"
ENV APIGW_HOST_ADDRESS="0.0.0.0"

ENTRYPOINT ["python", "-m", "aiverify_apigw"]
