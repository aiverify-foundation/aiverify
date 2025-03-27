import React from "react";

export const ImageWithFallback = ({
  src,
  alt,
  width = "100%",
  height = "300px",
}) => {
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

export const getCorruptionTypes = (resultsData, corruptionType) => {
  const blurTypes = [];
  if (resultsData && resultsData.length > 0) {
    resultsData.forEach((item) => {
      if (
        item.corruption_group === corruptionType &&
        item.corruption_function
      ) {
        blurTypes.push(item.corruption_function);
      }
    });
  }
  return blurTypes;
};

export const formatCorruptionName = (name, corruptionType) => {
  const spacedName = name.replace(/_/g, " ");

  // Format as "Category: Specific Type"
  if (spacedName.includes(corruptionType)) {
    return `${corruptionType}: ${spacedName}`;
  }
  return spacedName;
};
