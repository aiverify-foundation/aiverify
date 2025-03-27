import React, { useEffect, useState } from "react";
import { BarChart } from "aiverify-shared-library/charts";

export const SingleCorruptionBarChart = ({ corruptionData, width, height }) => {
  const [chartData, setChartData] = useState({
    data: [],
    bars: [],
  });

  useEffect(() => {
    if (!corruptionData) return;

    const formattedData = [];

    let paramName = "";
    if (corruptionData?.parameter?.severity1) {
      paramName = Object.keys(corruptionData.parameter.severity1)[0] || "";
    }

    Object.entries(corruptionData.accuracy || {})
      .filter(([key]) => key.startsWith("severity"))
      .forEach(([key, value]) => {
        const severityNumber = key.replace("severity", "");

        // Get parameter value for this severity
        let paramValue = "N/A";
        if (corruptionData.parameter && corruptionData.parameter[key]) {
          const paramObj = corruptionData.parameter[key];
          if (paramObj[paramName] !== null) {
            paramValue = paramObj[paramName];
          } else {
            paramValue = "None";
          }
        }

        // Just show parameter value as the name
        const displayName =
          paramValue === "None" || paramValue === "N/A"
            ? `None`
            : `${paramValue}`;

        formattedData.push({
          name: displayName,
          accuracy: value * 100, // Convert to percentage
          severity: severityNumber,
          displayAccuracy: `${(value * 100).toFixed(1)}%`, // For display label
        });
      });

    // Sort by severity level
    formattedData.sort((a, b) => {
      const severityA = parseInt(a.severity, 10);
      const severityB = parseInt(b.severity, 10);
      return severityA - severityB;
    });

    const barDefinitions = [
      {
        dataKey: "accuracy",
        name: "Accuracy (%)",
        label: {
          position: "top",
          content: (props) => {
            const { x, y, width, height, value } = props;
            return (
              <text
                x={x + width / 2}
                y={y - 10}
                fill="#666666"
                textAnchor="middle"
                fontSize={12}
              >
                {`${value.toFixed(1)}%`}
              </text>
            );
          },
        },
      },
    ];

    setChartData({
      data: formattedData,
      bars: barDefinitions,
    });
  }, [corruptionData]);

  const corruptionName =
    corruptionData?.corruption_function?.replace(/_/g, " ") || "Unknown";

  let paramName = "";
  if (corruptionData?.parameter?.severity1) {
    paramName = Object.keys(corruptionData.parameter.severity1)[0] || "";
    paramName = paramName.replace(/_/g, " ");
    paramName = paramName.charAt(0).toUpperCase() + paramName.slice(1);
  }

  return (
    <div
      style={{
        width,
        height,
        padding: 10,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h4 style={{ textAlign: "center" }}>{corruptionName}</h4>
      <div style={{ textAlign: "center" }}>(by {paramName})</div>
      {chartData.data.length > 0 ? (
        <div style={{ height: 300 }}>
          <BarChart
            data={chartData.data}
            xAxisDataKey="name"
            bars={chartData.bars}
            xAxisProps={{
              fontSize: 12,
              height: 50,
              interval: 0,
            }}
            yAxisProps={{
              label: {
                value: "Accuracy (%)",
                angle: -90,
                position: "insideLeft",
                style: {
                  fontSize: "12px",
                },
              },
              domain: [0, 100],
              fontSize: 12,
            }}
            chartProps={{
              margin: { top: 25, right: 30, left: 20, bottom: 5 },
            }}
            hideLegend={true}
          />
        </div>
      ) : (
        <div>No data available for display</div>
      )}
    </div>
  );
};

export const CorruptionBarChart = ({ data, width }) => {
  if (data.length === 0) {
    return <div>No corruption data found</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {data.map((corruption, index) => (
        <div key={index}>
          <SingleCorruptionBarChart
            corruptionData={corruption}
            width={width || "100%"}
            height={350}
          />
        </div>
      ))}
    </div>
  );
};
