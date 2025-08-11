#
# Note: building own python-slim from debian trixie-slim, but this should be replaced with python:3.11-slim-trixie once available
#

# define base python version
ARG PYTHON_VERSION=3.12

#
# Stage 1: Build Python
#

FROM python:${PYTHON_VERSION}-slim-bookworm AS build
ARG TARGETARCH

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    git \
    gcc \
    g++ \
    pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pip install -U pip && pip install -U setuptools>=78.1.1

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# # update pip and setuptools
# RUN pip install -U pip && pip install -U setuptools>=78.1.1

# Install aiverify-test-engine
WORKDIR /app
COPY aiverify-test-engine/ ./aiverify-test-engine/
COPY common/ ./common/

# Create a virtual environment
# ENV VIRTUAL_ENV=/app/.venv
# RUN python3 -m venv $VIRTUAL_ENV
# ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /app/aiverify-test-engine
RUN if [ "$TARGETARCH" = "amd64" ] ; then pip install --no-cache-dir torch==2.4.1+cpu --index-url https://download.pytorch.org/whl/cpu ; fi && \
    pip install h5py && \
    pip install -e '.[all]' && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# # #
# # # Stage 2: Runtime image
# # #
FROM python:${PYTHON_VERSION}-slim-bookworm
ARG PYTHON_VERSION

# update all the system packages to the latest versions
# install libhdf5 libraries for keras
# apt-get install -y --no-install-recommends libhdf5-103-1 libhdf5-hl-100 && \
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pip install -U pip && pip install -U setuptools>=78.1.1

# copy the aiverify-test-engine
WORKDIR /app
COPY --from=build /app/ .
COPY --from=build /usr/local/lib/python${PYTHON_VERSION}/site-packages/ /usr/local/lib/python${PYTHON_VERSION}/site-packages/

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
# ENV PATH="/app/.venv/bin:$PATH"

# update pip and setuptools
# RUN pip install -U pip && pip install -U setuptools>=78.1.1
