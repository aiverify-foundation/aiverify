#!/bin/bash

#multiclass pipeline
docker run \
-e DATA_PATH="../../../user_defined_files/data/sample_mc_pipeline_toxic_data.sav" \
-e MODEL_PATH="../../../user_defined_files/pipeline/mc_tabular_toxic" \
-e GROUND_TRUTH_PATH="../../../user_defined_files/data/sample_mc_pipeline_toxic_ytest_data.sav" \
-e GROUND_TRUTH="toxic" \
-e RUN_PIPELINE="TRUE" \
-e MODEL_TYPE="CLASSIFICATION" \
-e SENSITIVE_FEATURES_LIST="gender+race" \
-v ./output/:/app/aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/output \
aiverify-fairness-metrics-toolbox-for-classification:v1

#binary non-pipeline
# docker run \
# -e DATA_PATH="../../../user_defined_files/data/sample_bc_credit_data.sav" \
# -e MODEL_PATH="../../../user_defined_files/model/sample_bc_credit_sklearn_linear.LogisticRegression.sav" \
# -e GROUND_TRUTH_PATH="../../../user_defined_files/data/sample_bc_credit_data.sav" \
# -e GROUND_TRUTH="default" \
# -e RUN_PIPELINE="False" \
# -e MODEL_TYPE="CLASSIFICATION" \
# -e SENSITIVE_FEATURES_LIST="gender" \
# -v ./output/:/app/aiverify/stock-plugins/aiverify.stock.fairness-metrics-toolbox-for-classification/algorithms/fairness_metrics_toolbox_for_classification/output \
# aiverify-fairness-metrics-toolbox-for-classification:v1