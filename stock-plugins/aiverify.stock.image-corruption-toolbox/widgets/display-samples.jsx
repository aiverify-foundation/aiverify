import React from "react";
import { ImageWithFallback } from "./corruption-utils";

export const DisplayImages = ({
  id,
  images,
  data,
  corruption_index,
  corruption_name,
  parameters,
}) => {
  if (!data || !data[corruption_index] || !images) {
    return <div>Missing data for display</div>;
  }

  const results_array = data[corruption_index]["display_info"];

  if (!results_array) {
    return <div>No display information available</div>;
  }

  const severityKeys = Object.keys(results_array)
    .filter((key) => key.startsWith("severity"))
    .sort();
  const severityLevels = severityKeys.map((key) => key.replace("severity", ""));

  let image_content = [];
  let actual_content = [];
  let preds_content = [];
  let severity_labels = [];
  let parameter_content = [];
  
  image_content.push(
    <th align="left" bgcolor="F0F0F0" key={`${id}-img-header`}>
      Images
    </th>
  );

  parameter_content.push(
    <th align="left" bgcolor="F0F0F0" key={`${id}-param-header`}>
      Parameters
    </th>
  );

  images.forEach((img, index) => {
    image_content.push(
      <td key={`${id}-img-${index}`}>
        <ImageWithFallback
          src={img}
          alt={`Severity ${severityLevels[index]} image`}
          width="100px"
          height="100px"
        />
      </td>
    );
  });

  severity_labels.push(
    <th align="left" bgcolor="F0F0F0" key={`${id}-sev-header`}>
      Severity
    </th>
  );
  actual_content.push(
    <th align="left" bgcolor="F0F0F0" key={`${id}-actual-header`}>
      Actual Class
    </th>
  );
  preds_content.push(
    <th align="left" bgcolor="F0F0F0" key={`${id}-pred-header`}>
      Predictions
    </th>
  );

  severityKeys.forEach((sevKey, index) => {
    const sevLevel = severityLevels[index];
    severity_labels.push(
      <th key={`${id}-sev-${sevLevel}`} bgcolor="F0F0F0" align="center">
        {sevLevel}
      </th>
    );

    // Add parameter data if available
    if (parameters && parameters[sevKey]) {
      const paramValues = Object.entries(parameters[sevKey])
        .map(([paramName, paramValue]) =>
          paramValue !== null ? `${paramName}: ${paramValue}` : null
        )
        .filter(Boolean)
        .join(", ");

      parameter_content.push(
        <td key={`${id}-param-${sevLevel}`}>{paramValues || "N/A"}</td>
      );
    } else {
      parameter_content.push(<td key={`${id}-param-${sevLevel}`}>N/A</td>);
    }

    if (results_array[sevKey] && results_array[sevKey].length >= 3) {
      actual_content.push(
        <td key={`${id}-class-${sevLevel}`}>{results_array[sevKey][1]}</td>
      );
      preds_content.push(
        <td key={`${id}-pred-${sevLevel}`}>{results_array[sevKey][2]}</td>
      );
    } else {
      actual_content.push(<td key={`${id}-class-${sevLevel}`}>N/A</td>);
      preds_content.push(<td key={`${id}-pred-${sevLevel}`}>N/A</td>);
    }
  });

  return (
    <div>
      <h4>
        <b>Sample Data after Perturbation with ({corruption_name})</b>
      </h4>
      <table border="1">
        <tbody>
          <tr key={`${id}-row-sev`} align="center">
            {severity_labels}
          </tr>
          <tr key={`${id}-row-img`} align="center">
            {image_content}
          </tr>
          <tr key={`${id}-row-param`} align="center">
            {parameter_content}
          </tr>
          <tr key={`${id}-row-actual`} align="center">
            {actual_content}
          </tr>
          <tr key={`${id}-row-pred`} align="center">
            {preds_content}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
