# Compatibility Table 

## AI Framework and Model Types

In this table, we list the supported AI framework and algorithms. 

| Framework   | Version  | Algorithm    | Model Type |
| ----- |----|----|-----|
|    scikit-learn  | 1.2.2   | Binary Classification | Logistic Regression |
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
|  Tensorflow     | 2.12.0 | Binary Classification | Keras Sequential |
| || Multiclass Classification | Keras Sequential  |
| || Regression| Keras Sequential  |
|  XGBoost     |1.7.5| Binary Classification | XGB Classifier|
| || | XGB Booster |
| || Multiclass Classifcation | XGB Classifier |
| || Regression | XGB Regressor |
|  LightGBM     |3.3.5| Binary Classification | LGBM Classifier|

## Data Serialisers

| Library   | Version  | 
| ----- |----|
|  pickle  | Version is based on the pickle installed in your environment   | 
|  joblib  | 1.20   | 

*If your datasets and models are serialised using other version, please modify your environment accordingly.