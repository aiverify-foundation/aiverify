#
# Note: building own python-slim from debian trixie-slim, but this should be replaced with python:3.11-slim-trixie once available
#

#
# Stage 1: Build Python
#
FROM python:3.11-slim AS build
ARG TARGETARCH

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    git \
    gcc \
    g++ \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# # #
# # # Stage 2: Runtime image
# # #
FROM python:3.11-slim

# update all the system packages to the latest versions
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# # # Install runtime dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libssl3 \
#     zlib1g \
#     libsqlite3-0 \
#     libgdbm6 \
#     libbz2-1.0 \
#     liblzma5 \
#     libffi8 \
#     libncursesw6 \
#     libtinfo6 \
#     libreadline8 \
#     libhdf5-310-* \
#     && rm -rf /var/lib/apt/lists/*

# copy the aiverify-test-engine
WORKDIR /app
COPY --from=build /app/aiverify-test-engine ./aiverify-test-engine
COPY --from=build /app/common ./common


