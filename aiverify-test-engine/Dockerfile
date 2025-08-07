#
# Note: building own python-slim from debian trixie-slim, but this should be replaced with python:3.11-slim-trixie once available
#

#
# Stage 1: Build Python
#
FROM python:3.11-slim-bookworm AS build
ARG TARGETARCH

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    git \
    gcc \
    g++ \
    libhdf5-dev \
    pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# # update pip and setuptools
# RUN pip install -U pip && pip install -U setuptools>=78.1.1

# Install aiverify-test-engine
WORKDIR /app
COPY aiverify-test-engine/ ./aiverify-test-engine/
COPY common/ ./common/

WORKDIR /app/aiverify-test-engine
RUN if [ "$TARGETARCH" = "amd64" ] ; then pip install --no-cache-dir torch==2.4.1+cpu --index-url https://download.pytorch.org/whl/cpu ; fi && \
    pip install --no-cache-dir --no-binary h5py h5py && \
    pip install -e '.[all]' && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# # #
# # # Stage 2: Runtime image
# # #
FROM python:3.11-slim-bookworm

# update all the system packages to the latest versions
# install libhdf5 libraries for keras
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends libhdf5-103-1 libhdf5-hl-100 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# copy the aiverify-test-engine
WORKDIR /app
COPY --from=build /app/aiverify-test-engine ./aiverify-test-engine
COPY --from=build /app/common ./common
COPY --from=build /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# update pip and setuptools
RUN pip install -U pip && pip install -U setuptools>=78.1.1
