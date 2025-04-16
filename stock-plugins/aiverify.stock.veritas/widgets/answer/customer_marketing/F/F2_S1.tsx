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
          correct classification of customers who will respond to a call and
          acquire the product that they otherwise would have not acquired: the
          FSI calls them for marketing unsecured loans;
        </li>
        <li>
          correct classification of customers who are not influenced by a call
          whether they make a decision to buy or not, and who negatively respond
          to a call and do not acquire the product that they would have
          otherwise: the FSI does not call them for marketing unsecured loans;
        </li>
        <li>
          mis-classification of customers who will respond to a call and acquire
          the product that they otherwise would have not acquired: the FSI does
          not call them for marketing unsecured loans;
        </li>
        <li>
          mis-classification of customers who are not influenced by a call
          whether they make a decision to buy or not, and who negatively respond
          to a call and do not acquire the product that they would have
          otherwise: the FSI calls them for marketing unsecured loans.
        </li>
      </ul>
    </div>
  );
};

export default F2_S1;
