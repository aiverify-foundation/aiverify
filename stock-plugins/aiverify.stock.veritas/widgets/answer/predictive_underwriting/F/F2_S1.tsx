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
          correct classification of eligible risk: insurer offers a good-risk
          customer auto approved life insurance;
        </li>
        <li>
          correct classification of non-eligible risk: insurer does not offer
          bad-risk customer auto approved life insurance;
        </li>
        <li>
          mis-classification of eligible risk: insurer does not offer good-risk
          customer auto approved life insurance;
        </li>
        <li>
          mis-classification of non-eligible risk: insurer offers a bad-risk
          customer auto approved life insurance.
        </li>
      </ul>
    </div>
  );
};

export default F2_S1;
