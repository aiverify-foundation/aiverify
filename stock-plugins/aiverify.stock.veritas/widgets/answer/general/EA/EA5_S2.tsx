import React from "react";

const EA5_S2 = ({ props, data }) => {
  return (
    <div>
      <ul>
        <li>
          <b>Commitments: </b>A professed obligation that explains how a
          principle will be implemented in a specific context. Commitments are
          individual-, societal-, and system-level promises an organisation
          makes to its customers and other stakeholders that are informed by
          values, core concepts, and principles.
        </li>
        <li>
          <b>Specification: </b>A set of quantifiable assessments, or metrics,
          that can measure the extent to which commitments have been met. There
          may be more than one specification per commitment. This avoids
          unintentional overfitting to a metric that doesn’t represent the whole
          outcome. Additionally, it is most relevant to measure the effects of
          commitments over time, so binary specifications, such as yes/no
          measurements, should be avoided as they don’t allow for trendlines.
          Commitments, with meaningful specifications are the foundation of
          accountability.
        </li>
      </ul>
      Remember to add a priority – low(L), medium(M), or high(H) – to each
      commitment. Prioritisation scores serve to prioritise resources and
      optimise for higher priority commitments when outcomes might be in
      conflict.
    </div>
  );
};

export default EA5_S2;
