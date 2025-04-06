import React from "react";
import {
  G3,
  G4,
  G5_S1 as G5_S1_base,
  G5_S2 as G5_S2_base,
  G5_S3,
  G10,
  G11_S1,
  G11_S3,
} from "./general/G";
import { G5_S1 as G5_S1_cs, G5_S2 as G5_S2_cs } from "./credit_score/G";
import { G5_S1 as G5_S1_cm } from "./customer_marketing/G";
import {
  G5_S1 as G5_S1_puw,
  G5_S2 as G5_S2_puw,
} from "./predictive_underwriting/G";
import { EA1, EA2, EA3, EA5_S2, EA5_S3, EA7 } from "./general/EA";
import {
  F1_S1,
  F2_S1 as F2_S1_base,
  F2_S2 as F2_S2_base,
  F3_S1 as F3_S1_base,
  F3_S2,
  F4_S1,
  F4_S2,
  F4_S3,
  F5,
  F6,
  F7,
  F8_S1,
  F8_S2,
  F8_S3,
  F9_S1,
  F9_S2,
  F10_S1,
  F10_S2,
  F11,
  F12_S1,
} from "./general/F";
import { F2_S1 as F2_S1_reg } from "./base_regression/F";
import {
  F2_S1 as F2_S1_cs,
  F2_S2 as F2_S2_cs,
  F3_S1 as F3_S1_cs,
} from "./credit_score/F";
import {
  F2_S1 as F2_S1_cm,
  F2_S2 as F2_S2_cm,
  F3_S1 as F3_S1_cm,
} from "./customer_marketing/F";
import {
  F2_S1 as F2_S1_puw,
  F2_S2 as F2_S2_puw,
  F3_S1 as F3_S1_puw,
} from "./predictive_underwriting/F";
import {
  T1,
  T2_S2,
  T3_S1,
  T3_S2,
  T5,
  T6 as T6_base,
  T7_S1 as T7_S1_base,
  T9_S2,
  T10,
  T11,
  T13,
} from "./general/T";
import { T6 as T6_cs, T7_S1 as T7_S1_cs } from "./credit_score/T";
import { T6 as T6_cm, T7_S1 as T7_S1_cm } from "./customer_marketing/T";
import { T6 as T6_puw, T7_S1 as T7_S1_puw } from "./predictive_underwriting/T";

const G5_S1 = ({ props, data }) => {
  const useCase = props.properties.useCase;
  if (useCase === "Credit Scoring") {
    return <G5_S1_cs props={props} data={data} />;
  } else if (useCase === "Customer Marketing") {
    return <G5_S1_cm props={props} data={data} />;
  } else if (useCase === "Predictive Underwriting") {
    return <G5_S1_puw props={props} data={data} />;
  } else {
    return <G5_S1_base props={props} data={data} />;
  }
};

const G5_S2 = ({ props, data }) => {
  const useCase = props.properties.useCase;
  if (useCase === "Credit Scoring") {
    return <G5_S2_cs props={props} data={data} />;
  } else if (useCase === "Predictive Underwriting") {
    return <G5_S2_puw props={props} data={data} />;
  } else {
    return <G5_S2_base props={props} data={data} />;
  }
};

const F2_S1 = ({ props, data }) => {
  const useCase = props.properties.useCase;
  if (useCase === "Credit Scoring") {
    return <F2_S1_cs props={props} data={data} />;
  } else if (useCase === "Customer Marketing") {
    return <F2_S1_cm props={props} data={data} />;
  } else if (useCase === "Predictive Underwriting") {
    return <F2_S1_puw props={props} data={data} />;
  } else if (useCase === "Base Regression") {
    return <F2_S1_reg props={props} data={data} />;
  } else {
    return <F2_S1_base props={props} data={data} />;
  }
};

const F2_S2 = ({ props, data }) => {
  const useCase = props.properties.useCase;
  if (useCase === "Credit Scoring") {
    return <F2_S2_cs props={props} data={data} />;
  } else if (useCase === "Customer Marketing") {
    return <F2_S2_cm props={props} data={data} />;
  } else if (useCase === "Predictive Underwriting") {
    return <F2_S2_puw props={props} data={data} />;
  } else {
    return <F2_S2_base props={props} data={data} />;
  }
};

const F3_S1 = ({ props, data }) => {
  const useCase = props.properties.useCase;
  if (useCase === "Credit Scoring") {
    return <F3_S1_cs props={props} data={data} />;
  } else if (useCase === "Customer Marketing") {
    return <F3_S1_cm props={props} data={data} />;
  } else if (useCase === "Predictive Underwriting") {
    return <F3_S1_puw props={props} data={data} />;
  } else {
    return <F3_S1_base props={props} data={data} />;
  }
};

const T6 = ({ props, data }) => {
  const useCase = props.properties.useCase;
  if (useCase === "Credit Scoring") {
    return <T6_cs props={props} data={data} />;
  } else if (useCase === "Customer Marketing") {
    return <T6_cm props={props} data={data} />;
  } else if (useCase === "Predictive Underwriting") {
    return <T6_puw props={props} data={data} />;
  } else {
    return <T6_base props={props} data={data} />;
  }
};

const T7_S1 = ({ props, data }) => {
  const useCase = props.properties.useCase;
  if (useCase === "Credit Scoring") {
    return <T7_S1_cs props={props} data={data} />;
  } else if (useCase === "Customer Marketing") {
    return <T7_S1_cm props={props} data={data} />;
  } else if (useCase === "Predictive Underwriting") {
    return <T7_S1_puw props={props} data={data} />;
  } else {
    return <T7_S1_base props={props} data={data} />;
  }
};

export {
  G3,
  G4,
  G5_S1,
  G5_S2,
  G5_S3,
  G10,
  G11_S1,
  G11_S3,
  EA1,
  EA2,
  EA3,
  EA5_S2,
  EA5_S3,
  EA7,
  F1_S1,
  F2_S1,
  F2_S2,
  F3_S1,
  F3_S2,
  F4_S1,
  F4_S2,
  F4_S3,
  F5,
  F6,
  F7,
  F8_S1,
  F8_S2,
  F8_S3,
  F9_S1,
  F9_S2,
  F10_S1,
  F10_S2,
  F11,
  F12_S1,
  T1,
  T2_S2,
  T3_S1,
  T3_S2,
  T5,
  T6,
  T7_S1,
  T9_S2,
  T10,
  T11,
  T13,
};
