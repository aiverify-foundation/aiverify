# Supported Versions

## AI Framework and Model Types

In this table, we list the supported AI framework and algorithms. 

| Framework   | Version  | Algorithm    | Model Type |
| ----- |----|----|-----|
|    scikit-learn  | 1.5.2   | Binary Classification | Logistic Regression |
| || | Decision Tree |
| || | Random Forest |
| || | Gradient Boosting Classifier |
| || | Perceptron |
| || | Bagging Classifier |
| || | Linear Support Vector Classifier |
| || Multiclass Classification | Logistic Regression |
| || | Decision Tree |
| || | Random Forest |
| || | Gradient Boosting Classifier |
| || | Perceptron |
| || | Bagging Classifier |
| || | Linear Support Vector Classifier |
| || Regression| Linear Regression |
| || | Extra Tree Regressor |
| || | Gradient Boosting Regressor |
| || | Random Forest Regression |
|  Tensorflow     | 2.14.0 | Binary Classification | Keras Sequential |
| || Multiclass Classification | Keras Sequential  |
| || Regression| Keras Sequential  |
|  PyTorch     | >2.0 | Binary Classification | PyTorch Sequential |
| || Multiclass Classification | PyTorch Sequential  |
| || Regression| PyTorch Sequential  |
|  XGBoost     |2.1.1| Binary Classification | XGB Classifier|
| || | XGB Booster |
| || Multiclass Classifcation | XGB Classifier |
| || Regression | XGB Regressor |
|  LightGBM     |4.5.0| Binary Classification | LGBM Classifier|

## Data Serialisers

| Library   | Version  | 
| ----- |----|
|  pickle  | Version is based on the pickle installed in your environment   | 
|  joblib  | 1.20   | 

!!! Info
        If your datasets and models are serialised using other version, please modify your environment accordingly.