import React from "react";

export const mockData = {
  fairness: {
    fairness_init: {
      fair_metric_name_input: "log_loss_parity",
      fair_metric_name: "Log-loss Parity",
      perf_metric_name: "True Negative Rate",
      protected_features: ["isforeign", "isfemale"],
      fair_threshold_input: 80.0,
      fair_neutral_tolerance: 0.001,
      fair_priority: "benefit",
      fair_concern: "eligible",
      fair_impact: "normal",
    },
    perf_metric_values: {
      "Selection Rate": [0.25, 0.0],
      Accuracy: [0.4109, 0.00944003050842528],
      "Balanced Accuracy": [0.3328624278157524, 0.006896979000013697],
      Recall: [0.4109, 0.00944003050842528],
      Precision: [0.4109, 0.00944003050842528],
      "F1 Score": [0.41089999999999993, 0.009440030508425281],
      "True Negative Rate": [0.8036333333333333, 0.0031466768361417576],
      "False Negative Rate": [0.5891, 0.00944003050842527],
      "Negative Predictive Value": [0.8036333333333333, 0.0031466768361417576],
      "ROC AUC Score": [0.69387221, 0.005995418738646434],
      "Log-loss": [1.2479378604825395, 0.008961754713421295],
    },
    class_distribution: {
      CN: 0.3734,
      TN: 0.2476,
      CR: 0.2277,
      TR: 0.1513,
    },
    weighted_confusion_matrix: {
      tp: 4109.0,
      fp: 5891.0,
      tn: 24109.0,
      fn: 5891.0,
    },
    features: {
      isforeign: {
        fair_threshold: 0.2524945906154434,
        privileged: [[0]],
        unprivileged: [[1]],
        feature_distribution: {
          privileged_group: 0.7088,
          unprivileged_group: 0.2912,
        },
        fair_metric_values: {
          "Demographic Parity": [0.0, 0.0],
          "Equal Opportunity": [-0.018148612110237383, 0.02114658142234319],
          "False Positive Rate Parity": [
            0.006049537370079128, 0.007048860474114399,
          ],
          "True Negative Rate Parity": [
            -0.006049537370079183, 0.007048860474114384,
          ],
          "False Negative Rate Parity": [
            0.01814861211023744, 0.021146581422343186,
          ],
          "Positive Predictive Parity": [
            -0.018148612110237383, 0.02114658142234319,
          ],
          "Negative Predictive Parity": [
            -0.006049537370079183, 0.007048860474114384,
          ],
          "False Discovery Rate Parity": [
            0.01814861211023744, 0.021146581422343186,
          ],
          "False Omission Rate Parity": [
            0.006049537370079128, 0.007048860474114399,
          ],
          "Equalized Odds": [-0.006049537370079128, 0.0070488604741143915],
          "Negative Equalized Odds": [
            0.006049537370079072, 0.007048860474114408,
          ],
          "Calibration by Group": [
            -0.006049537370079128, 0.0070488604741143915,
          ],
          "AUC Parity": [-0.02985263081490952, 0.015406452863969916],
          "Log-loss Parity": [0.04991446632787633, 0.023001070319140025],
          "Mutual Information Independence": ["NA", "NA"],
          "Mutual Information Separation": ["NA", "NA"],
          "Mutual Information Sufficiency": ["NA", "NA"],
        },
        fairness_conclusion: "fair",
        feature_importance: null,
      },
      isfemale: {
        fair_threshold: 0.2578566029681289,
        privileged: [[0]],
        unprivileged: [[1]],
        feature_distribution: {
          privileged_group: 0.5979,
          unprivileged_group: 0.4021,
        },
        fair_metric_values: {
          "Demographic Parity": [0.0, 0.0],
          "Equal Opportunity": [-0.06271269679308233, 0.021511837752332237],
          "False Positive Rate Parity": [
            0.020904232264360778, 0.00717061258411075,
          ],
          "True Negative Rate Parity": [
            -0.020904232264360778, 0.007170612584110752,
          ],
          "False Negative Rate Parity": [
            0.06271269679308233, 0.02151183775233225,
          ],
          "Positive Predictive Parity": [
            -0.06271269679308233, 0.021511837752332237,
          ],
          "Negative Predictive Parity": [
            -0.020904232264360778, 0.007170612584110752,
          ],
          "False Discovery Rate Parity": [
            0.06271269679308233, 0.02151183775233225,
          ],
          "False Omission Rate Parity": [
            0.020904232264360778, 0.00717061258411075,
          ],
          "Equalized Odds": [-0.020904232264360778, 0.007170612584110729],
          "Negative Equalized Odds": [
            0.020904232264360667, 0.007170612584110748,
          ],
          "Calibration by Group": [-0.020904232264360778, 0.007170612584110729],
          "AUC Parity": [-0.06833795669898446, 0.013437913796693105],
          "Log-loss Parity": [0.102823064805037, 0.020070261856636344],
          "Mutual Information Independence": ["NA", "NA"],
          "Mutual Information Separation": ["NA", "NA"],
          "Mutual Information Sufficiency": ["NA", "NA"],
        },
        fairness_conclusion: "fair",
        feature_importance: null,
      },
    },
    report_plots: {
      calibration: [],
      correlation: [],
      distribution: ["images/veritas_classDistributionPieChart.png"],
      confusion_matrix: ["images/veritas_weightedConfusionHeatMapChart.png"],
      performance: [],
      features: {
        isforeign: {
          distribution: [
            "images/veritas_featureDistributionPieChartMap_isforeign.png",
          ],
          tradeoff: [],
        },
        isfemale: {
          distribution: [
            "images/veritas_featureDistributionPieChartMap_isfemale.png",
          ],
          tradeoff: [],
        },
      },
    },
  },
};

// Section Container - wraps entire section
export const SectionContainer = ({ children, style = {} }) => (
  <section style={{ marginBottom: "20px", ...style }}>{children}</section>
);

// Section Title - heading for a section
export const SectionTitle = ({ children, style = {} }) => (
  <h3 style={{ marginBottom: "10px", ...style }}>{children}</h3>
);

// Section Content - content container for a section
export const SectionContent = ({ children, style = {} }) => (
  <div style={{ marginBottom: "10px", ...style }}>{children}</div>
);

// Question Container - for individual process check questions
export const QuestionContainer = ({ children, style = {} }) => (
  <div
    style={{
      marginBottom: "20px",
      fontSize: "14px",
      lineHeight: "1.4",
      paddingLeft: "16px",
      ...style,
    }}
  >
    {children}
  </div>
);

// Question Header - for question titles
export const QuestionHeader = ({ children, style = {} }) => (
  <div
    style={{
      fontWeight: "bold",
      marginBottom: "8px",
      ...style,
    }}
  >
    {children}
  </div>
);

// Elaboration - for responses or explanations
export const Elaboration = ({ children, style = {} }) => (
  <div
    style={{
      padding: "12px",
      backgroundColor: "#f5f5f5",
      borderRadius: "4px",
      marginTop: "8px",
      ...style,
    }}
  >
    {children}
  </div>
);

// Criteria Container - for testable criteria
export const CriteriaContainer = ({ children, style = {} }) => (
  <div
    style={{
      marginTop: "16px",
      marginBottom: "16px",
      ...style,
    }}
  >
    {children}
  </div>
);

// Criteria Header - for criteria titles
export const CriteriaHeader = ({ children, style = {} }) => (
  <div
    style={{
      fontWeight: "bold",
      fontSize: "16px",
      padding: "8px 0",
      borderBottom: "1px solid #ddd",
      ...style,
    }}
  >
    {children}
  </div>
);

export const formatNumber = (number) => {
  if (typeof number === "number") {
    return number.toFixed(4);
  }
  return number;
};

export const getFairnessColor = (conclusion) => {
  return conclusion === "fair" ? "#4CAF50" : "#F44336";
};

export const safeGetArtifactURL = (props, cid, pathname) => {
  try {
    if (props && props.getArtifactURL) {
      return props.getArtifactURL(cid, pathname);
    }
    return null; // Fallback if the function doesn't exist
  } catch (error) {
    console.error("Error getting artifact URL:", error);
    return null;
  }
};

export const ImageWithFallback = ({ src, alt, width = "100%", height = "300px" }) => {
  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      {src ? (
        <img src={src} alt={alt} style={{ maxWidth: "100%" }} />
      ) : (
        <div
          style={{
            width,
            height,
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px dashed #ccc",
            borderRadius: "4px",
            color: "#666",
          }}
        >
          {alt || "Image placeholder"}
        </div>
      )}
    </div>
  );
};