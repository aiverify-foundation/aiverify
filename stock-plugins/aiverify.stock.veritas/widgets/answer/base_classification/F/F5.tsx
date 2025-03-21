import React from "react";

const F5 = ({ props, data }) => {
  return (
    <div>
      Different sources of bias can be mitigated using different techniques.
      <ul>
        <li>
          <b>Representation bias</b>:Collect more data of underrepresented
          groups. Statistical techniques include data reweighing, up-sampling or
          down-sampling.
        </li>
        <li>
          <b>Measurement bias</b>: Obtain another, more reliable source of data
          and improve quality of instruments/sources of data collection in light
          of related best-practices.
        </li>
        <li>
          <b>Pre-processing bias</b>:Understand the reason behind anomalies and
          fixing the root causes. Another potential way to mitigate is
          augmentation or guidance from external data to make informed data
          treatments.
        </li>
        <li>
          <b>Proxy bias</b>:Change to a more relevant proxy, where the new proxy
          feature comes with an evidence based justification of causality,
          rather than a mere association with intended property to be measured.
        </li>
        <li>
          <b>Historic decision bias</b>:Gather more appropriate (potentially
          recent) data and adjust the selection criteria for the disadvantaged
          groups, building synthetic datasets that remove existing data bias,
          and testing AIDA model biases.
        </li>
        <li>
          Other quantitative ways include preprocessing,inprocessing and
          postprocessing bias mitigation algorithms.
        </li>
      </ul>
    </div>
  );
};

export default F5;
