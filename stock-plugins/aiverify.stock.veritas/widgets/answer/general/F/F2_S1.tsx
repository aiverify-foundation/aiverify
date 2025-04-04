import React from "react";

const F2_S1 = ({ props, data }) => {
  return (
    <div>
      <p>
        For classification problems, a confusion matrix helps measure the
        performance of a classification model. Each row of the matrix represents
        a predicted class, and each column represents an actual class. The
        following confusion matrix applies to binary classification. See the
        Fairness Analysis section for more information.
      </p>

      <p>There are four decisions:</p>
      <ul style={{ paddingLeft: "20px" }}>
        <li>
          <b>TRUE POSITIVE:</b> the real value of the sample target variable is
          positive, and the predicted value of the classification is also
          positive
        </li>
        <li>
          <b>TRUE NEGATIVE:</b> the real value of the sample target variable is
          negative, and the predicted value of the classification is also
          negative
        </li>
        <li>
          <b>FALSE POSITIVE:</b> the real value of the sample target variable is
          negative, but the predicted target value of the classification is
          positive
        </li>
        <li>
          <b>FALSE NEGATIVE:</b> the real value of the sample target variable is
          positive, but the predicted target value of the classification is
          negative
        </li>
      </ul>
    </div>
  );
};

export default F2_S1;
