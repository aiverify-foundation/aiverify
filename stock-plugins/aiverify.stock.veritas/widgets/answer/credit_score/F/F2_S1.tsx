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
          <b>TRUE POSITIVE:</b> an applicant is approved, the customer
          subsequently paid back the loan
        </li>
        <li>
          <b>TRUE NEGATIVE:</b> an applicant that the customer would not have
          paid back the loan is denied
        </li>
        <li>
          <b>FALSE POSITIVE:</b> an applicant is approved, and the customer
          subsequently defaulted on the loan
        </li>
        <li>
          <b>FALSE NEGATIVE:</b> an applicant that the customer would have paid
          back the loan is denied
        </li>
      </ul>
    </div>
  );
};

export default F2_S1;
