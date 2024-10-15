FROM python:3.11-slim

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y git gcc

# Install HDF5 using apt
RUN apt-get update && apt-get install -y libhdf5-dev pkg-config

RUN pip install --upgrade pip
RUN pip install --no-binary h5py h5py

WORKDIR /app/aiverify

# Copy test engine core folder to install requirements; in future we can install the test-engine-core pypi package
COPY aiverify-test-engine ./aiverify-test-engine

# Copy sample data to run pytest
COPY stock-plugins/user_defined_files ./stock-plugins/user_defined_files

# Copy algorithm folder
COPY stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot ./stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot

# Install algorithm requirements
WORKDIR /app/aiverify/stock-plugins/aiverify.stock.partial-dependence-plot/algorithms/partial_dependence_plot
RUN pip install pytest
RUN pip install -e '.[dev]'

ENTRYPOINT ["python3", "-m", "aiverify_partial_dependence_plot"]

