import React from "react";

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

export const getImageUrl = (props, cid, pathArray) => {
  if (!pathArray || !Array.isArray(pathArray) || pathArray.length === 0)
    return null;
  return safeGetArtifactURL(props, cid, pathArray[0]);
};

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

// Get all blur types from results data
export const getBlurTypes = (resultsData) => {
  const blurTypes = [];
  if (resultsData && resultsData.length > 0) {
    resultsData.forEach((item) => {
      if (item.corruption_group === "Blur" && item.corruption_function) {
        blurTypes.push(item.corruption_function);
      }
    });
  }
  return blurTypes;
};

// Function to format corruption name for display
export const formatCorruptionName = (name) => {
  // Replace underscores with spaces
  const spacedName = name.replace(/_/g, " ");

  // Format as "Category: Specific Type"
  if (spacedName.includes("Blur")) {
    return `Blur: ${spacedName}`;
  }
  return spacedName;
};
