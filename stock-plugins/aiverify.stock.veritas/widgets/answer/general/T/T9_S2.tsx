import React from "react";

const T9_S2 = ({ props, data }) => {
  return (
    <div>
      For example ,The benefits of using SHAP are both at an overall and at a
      local level, as follows:
      <ul>
        <li>
          At a global level, the collective SHAP values helps stakeholders to
          interpret and understand the model. They show how much each predictor
          contributes, either positively or negatively, to the target variable.
          It allows for very intuitive interpretation of the model structure and
          is generalisable across a number of different modelling methodologies.
        </li>
        <li>
          At a local level, each observation gets its own set of SHAP values
          (one for each predictor). This greatly increases transparency, by
          showing contributions to predictions on a case by case basis, which
          traditional variable importance algorithms are not able to do. In
          addition, local interpretability can aid in segmentation and outlier
          detection.
        </li>
      </ul>
    </div>
  );
};

export default T9_S2;
