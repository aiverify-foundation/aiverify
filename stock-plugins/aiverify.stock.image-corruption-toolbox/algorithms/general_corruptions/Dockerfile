FROM python:3.11-slim

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    git \
    gcc \
    libhdf5-dev \
    pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir --no-binary h5py h5py

WORKDIR /app/aiverify

# Copy test engine core folder to install requirements; in future we can install the test-engine-core pypi package
COPY aiverify-test-engine ./aiverify-test-engine

# Copy sample data to run pytest
COPY stock-plugins/user_defined_files ./stock-plugins/user_defined_files

# Copy algorithm folder
COPY stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/general_corruptions ./stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/general_corruptions

# Install algorithm requirements
RUN cd aiverify-test-engine && \
    pip install --no-cache-dir '.[dev]' && \
    cd ../stock-plugins/aiverify.stock.image-corruption-toolbox/algorithms/general_corruptions && \
    pip install --no-cache-dir .

ENTRYPOINT ["python3", "-m", "aiverify_general_corruptions"]
