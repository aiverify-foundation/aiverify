import React from "react";

const G5_S2 = ({ props, data }) => {
  return (
    <div>
      <ul>
        <li>
          Reduced underwriting costs = For eligible new life insurance
          applicants, the simplified underwriting process for new policies per
          year increases from 0 to 50%.
        </li>
        <ul>
          <li>
            This would require the system to provide approximately 50% of
            currently eligible life insurance policyholders (i.e., this 50%
            would need to be marked as eligible risk).
          </li>
          <li>
            Taking into account the categories excluded from the model
            development dataset, approximately 80% of the data in the model
            development dataset prior to exclusion would need to be marked as
            eligible risk. Insurer A assessed that this would require A balanced
            accuracy of more than 82%.
          </li>
        </ul>
        <li>
          Keep the portfolio profit level constraint = Insurer A evaluates that
          it can provide up to 1 false positive for 24 true positives, which is
          A minimum accuracy of 96% for new business underwritten by activity.
        </li>
      </ul>
    </div>
  );
};

export default G5_S2;
