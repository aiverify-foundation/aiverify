FROM python:3.11-slim

# Combine all apt-get installations into a single layer with cleanup
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

# Set environment variables for Python and pip
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Combine pip installations into a single layer
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --no-binary h5py h5py

WORKDIR /app/aiverify

# Copy test engine core folder to install requirements; in future we can install the test-engine-core pypi package
COPY aiverify-test-engine ./aiverify-test-engine

# Copy sample data to run pytest
COPY stock-plugins/user_defined_files ./stock-plugins/user_defined_files

# Copy algorithm folder
COPY stock-plugins/aiverify.stock.veritas/algorithms/veritastool ./stock-plugins/aiverify.stock.veritas/algorithms/veritastool

# Install algorithm requirements
RUN cd aiverify-test-engine && \
    pip install --no-cache-dir '.[dev]' && \
    cd ../stock-plugins/aiverify.stock.veritas/algorithms/veritastool && \
    pip install --no-cache-dir .

ENTRYPOINT ["python3", "-m", "aiverify_veritastool"]

