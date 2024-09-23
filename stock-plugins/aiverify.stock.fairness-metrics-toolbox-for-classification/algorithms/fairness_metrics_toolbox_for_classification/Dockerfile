FROM ubuntu:22.04

ENV TZ=Asia/Singapore
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y python3 python3-pip git 

# Copy test engine core folder to install requirements; in future we can install the test-engine-core pypi package
# Copy algorithm folder as well as sample data
WORKDIR /app
RUN git clone --filter=blob:none --sparse https://github.com/simin-ong/aiverify.git --branch=dockerfile-fairness-metrics-toolbox-for-classification aiverify
WORKDIR /app/aiverify
RUN git sparse-checkout set test-engine-core stock-plugins/user_defined_files stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms

# Install algorithm requirements
WORKDIR /app/aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification
RUN pip install pytest
RUN pip install -e '.[dev]'

CMD ["python3", "-m", "aiverify_fairness_metrics_toolbox_for_classification"]

