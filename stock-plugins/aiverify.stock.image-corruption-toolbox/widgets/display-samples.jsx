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

  // Extract unique parameter keys across all severity levels
  const allParamKeys = new Set();
  severityKeys.forEach((sevKey) => {
    if (parameters && parameters[sevKey]) {
      Object.keys(parameters[sevKey]).forEach((key) => allParamKeys.add(key));
    }
  });
  const parameterKeys = Array.from(allParamKeys);

  const severityHeaderRow = [
    <th align="left" bgcolor="F0F0F0" key={`${id}-sev-header`}>
      Severity
    </th>,
  ];

  severityLevels.forEach((sevLevel) => {
    severityHeaderRow.push(
      <th key={`${id}-sev-${sevLevel}`} bgcolor="F0F0F0" align="center">
        {sevLevel}
      </th>
    );
  });

  const imagesRow = [
    <th align="left" bgcolor="F0F0F0" key={`${id}-img-header`}>
      Images
    </th>,
  ];

  images.forEach((img, index) => {
    imagesRow.push(
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

  const actualRow = [
    <th align="left" bgcolor="F0F0F0" key={`${id}-actual-header`}>
      Actual Class
    </th>,
  ];

  severityKeys.forEach((sevKey, index) => {
    if (results_array[sevKey] && results_array[sevKey].length >= 3) {
      actualRow.push(
        <td key={`${id}-class-${severityLevels[index]}`}>
          {results_array[sevKey][1]}
        </td>
      );
    } else {
      actualRow.push(<td key={`${id}-class-${severityLevels[index]}`}>N/A</td>);
    }
  });

  const predsRow = [
    <th align="left" bgcolor="F0F0F0" key={`${id}-pred-header`}>
      Predictions
    </th>,
  ];

  severityKeys.forEach((sevKey, index) => {
    if (results_array[sevKey] && results_array[sevKey].length >= 3) {
      predsRow.push(
        <td key={`${id}-pred-${severityLevels[index]}`}>
          {results_array[sevKey][2]}
        </td>
      );
    } else {
      predsRow.push(<td key={`${id}-pred-${severityLevels[index]}`}>N/A</td>);
    }
  });

  // Create parameter rows - one row per parameter
  const parameterRows = parameterKeys.map((paramKey) => {
    const row = [
      <th align="left" bgcolor="F0F0F0" key={`${id}-param-${paramKey}-header`}>
        {paramKey}
      </th>,
    ];

    severityKeys.forEach((sevKey, index) => {
      const paramValue =
        parameters && parameters[sevKey] && parameters[sevKey][paramKey];
      row.push(
        <td key={`${id}-param-${paramKey}-${severityLevels[index]}`}>
          {paramValue !== undefined && paramValue !== null ? paramValue : "N/A"}
        </td>
      );
    });

    return (
      <tr key={`${id}-row-param-${paramKey}`} align="center">
        {row}
      </tr>
    );
  });

  return (
    <div>
      <h4>
        <b>Sample Data after Perturbation with ({corruption_name})</b>
      </h4>
      <table border="1">
        <tbody>
          <tr key={`${id}-row-sev`} align="center">
            {severityHeaderRow}
          </tr>
          <tr key={`${id}-row-img`} align="center">
            {imagesRow}
          </tr>
          {parameterRows}
          <tr key={`${id}-row-actual`} align="center">
            {actualRow}
          </tr>
          <tr key={`${id}-row-pred`} align="center">
            {predsRow}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
